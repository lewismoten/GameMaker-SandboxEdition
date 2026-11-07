// Game-Maker Pocket Player for the ESP32-3248S035: a list of games (the Starters packed into LittleFS by
// web/scripts/pocketData.ts), the play loop (gmcore.h, also built and tested on the Mac), touch
// controls for fingers and a stylus (controls.h, also tested on the Mac), a settings screen, and a
// status strip. This file is the board: files, the panel, drawing 320x200 at 1.5x, the screens; sound is in speaker.h.
#include <Arduino.h>
#include <LittleFS.h>
#include "gmsmall.h"
#include <SD.h>
#include <SPI.h>
#include <Preferences.h>
#include <esp_heap_caps.h>
#include <rom/miniz.h>
#include "board.h"
#include "controls.h"
#include "paddraw.h"
#include "overlaydraw.h"
#include "banner.h"
#include "btnicon.h"
#include "gmcards.h"
#include "carddraw.h"
#include "fwid.h"
#include "gmcfg.h"
#include "screen.h"
#include "picker_draw.h"
#include "splash.h"
#include "cardmsg.h"
#include "library.h"
#include "idle.h"
#include "statusled.h"
#include "pressrect.h"
#include "settingsdraw.h"
#include <mbedtls/sha256.h>
#ifdef POCKET_CYD28
#include "xpt2046.h"
using Touch = XPT2046;
#else
#include "gt911.h"
using Touch = GT911;
#endif
#include "speaker.h"

#ifdef POCKET_CYD28
#include "softgfx.h"
static LGFX tftHw;                         // the panel itself
static sg::SoftGfx<LGFX> tft(tftHw);       // what everything draws on: the picture turned in software when the setup chose that
#else
static LGFX tft;
static LGFX& tftHw = tft;
#endif
static Touch gt;
// ---- which firmware, which board (fwid.h) ----
static char boardName[6] = "";
static void fwBoardLoad() {
  Preferences p;
  if (p.begin("pocket", true)) { p.getString("bid", boardName, sizeof boardName); p.end(); }
  if (!fw::validBoard(boardName)) fw::defaultBoard(ESP.getEfuseMac(), boardName);
}
// "FW" prints the build; "ID set X" names the board. Also called by the setup's serial poll. True when the line was one of them.
static bool fwSerial(const char* buf) {
  if (!strncmp(buf, "FW", 2)) {
    Serial.printf("FW board=%s git=%s date=%s env=%s\n", boardName, FW_GIT, FW_DATE, FW_ENV);
    return true;
  }
  if (strncmp(buf, "ID set ", 7)) return false;
  char nb[8] = "";
  strncpy(nb, buf + 7, 4);
  for (char* q = nb; *q; q++) if (*q >= 'a' && *q <= 'z') *q -= 32;
  if (fw::validBoard(nb)) {
    Preferences p;
    if (p.begin("pocket", false)) { p.putString("bid", nb); p.end(); }
    strcpy(boardName, nb);
    Serial.printf("FW board set to %s\n", boardName);
  } else Serial.println("FW board name: 1 to 4 letters or digits");
  return true;
}
static void fwLabel(char* out, int n, bool shortForm) { fw::label(boardName, FW_GIT, FW_DATE, out, n, shortForm); }
static bool haveGT = false;
static gm::World world;
static gm::Cfg cfg;
static gm::Assets assets;
static ctl::Controls controls;
static ctl::Settings settings;
static uint16_t pal[256];  // panel byte order (high byte first)

constexpr int VIEW_W = scr::W, VIEW_H = scr::VIEW_H, BAND = 30;
static uint16_t band[VIEW_W * BAND];
#ifdef POCKET_CYD28
static uint16_t tband[VIEW_W * BAND];  // a band turned a quarter, for SoftGfx::pushImage
#endif
static uint8_t rowIdx[gm::SIZEX];

// Pushing RGB565 with pushImage sends each value low byte first; the ST7796 wants the high byte
// first, so every color is stored byte-swapped (see the colors fix in README.md).
static uint16_t panel565(uint8_t r, uint8_t g, uint8_t b) {
  uint16_t v = (uint16_t)(((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3));
  return (uint16_t)((v << 8) | (v >> 8));
}
// Colors for text and shapes drawn with LovyanGFX's own calls (it swaps the bytes itself).
constexpr uint16_t C_WHITE = 0xFFFF, C_BLACK = 0, C_YELLOW = 0xFF2A, C_GRAY = 0x7BEF, C_DARK = 0x2104, C_BLUE = 0x3A9C;

// ---- files -------------------------------------------------------------------------------------

// Where the game being played keeps its files: the Starters are in LittleFS (the root), the games on a microSD
// card are in /pocket (their files, <file>.cfg and <file>.pak; see "The microSD card" in README.md), or a game is one file there,
// /pocket/NAME.GMP: a bundle like small.pak of its game.txt, <id>.cfg, cards.pak and files (web/src/export/pocketFile.ts).
static fs::FS* curFs = &LittleFS;
static char curBase[10] = "";
static char curPak[32] = "/cards.pak";
static char curOne[32] = "";     // a one-file game's path (its files are the bundle's entries), else empty
static uint32_t curPakBase = 0;  // where the cards start in curPak (a one-file game's cards.pak entry)
static bool sdUp = false;
static bool mountSD();
static void unmountSD();
// The card is mounted only while a file is read from it (a mounted card holds about 33 KB of heap and splits the free blocks,
// which a level that fills the heap cannot spare), so a read of a card file is mount, read, unmount.
// The Starters' small files are one LittleFS file, small.pak (gmsmall.h); a name it doesn't hold is read as a file of its own.
static bool smallReadAt(void* user, uint32_t off, void* buf, uint32_t n) {
  File* f = (File*)user;
  return f->seek(off) && f->read((uint8_t*)buf, n) == n;
}
static bool packOpen(fs::FS& fsys, const char* path, File& f, gm::SmallPak& pak) {
  f = fsys.open(path, "r");
  if (!f) return false;
  pak.user = &f;
  pak.size = f.size();
  pak.readAt = smallReadAt;
  if (pak.begin()) return true;
  f.close();
  return false;
}
static bool smallOpen(File& f, gm::SmallPak& pak) { return packOpen(LittleFS, "/small.pak", f, pak); }
// The entry `name` of an open bundle (malloc'd, with a spare byte), or nullptr.
static uint8_t* packRead(File& pf, gm::SmallPak& pak, const char* name, size_t* n) {
  uint32_t off, len;
  if (!pak.find(name, &off, &len) || len > 1024 * 1024) return nullptr;
  uint8_t* p = (uint8_t*)malloc(len + 1);
  if (p && !smallReadAt(&pf, off, p, len)) { free(p); p = nullptr; }
  if (p) *n = len;
  return p;
}
static uint8_t* readFileIn(fs::FS& fsys, const char* base, const char* name, size_t* n) {
  if (&fsys == &LittleFS && !base[0]) {
    File pf;
    gm::SmallPak pak;
    uint32_t off, len;
    if (smallOpen(pf, pak)) {
      uint8_t* p = nullptr;
      bool found = pak.find(name, &off, &len);
      if (found) {
        p = (uint8_t*)malloc(len + 1);
        if (p && !smallReadAt(&pf, off, p, len)) { free(p); p = nullptr; }
        if (p) *n = len;
      }
      pf.close();
      if (found) return p;
    }
  }
  char path[48];
  snprintf(path, sizeof path, "%s/%s", base, name);
  bool card = &fsys == &SD, wasUp = sdUp;
  if (card && !mountSD()) return nullptr;
  uint8_t* p = nullptr;
  File f = fsys.open(path, "r");
  if (f) {
    size_t len = f.size();
    p = (uint8_t*)malloc(len + 1);
    if (p && f.read(p, len) != len) { free(p); p = nullptr; }
    if (p) *n = len;
    f.close();
  }
  if (card && !wasUp) unmountSD();
  return p;
}
// A file of the game being played: an entry of its .GMP for a one-file game, else a file of its folder.
static uint8_t* readGameFile(const char* name, size_t* n) {
  if (!curOne[0]) return readFileIn(*curFs, curBase, name, n);
  bool wasUp = sdUp;
  if (!mountSD()) return nullptr;
  File pf;
  gm::SmallPak pak;
  uint8_t* p = nullptr;
  if (packOpen(SD, curOne, pf, pak)) {
    p = packRead(pf, pak, name, n);
    pf.close();
  }
  if (!wasUp) unmountSD();
  return p;
}
// A game's .cfg is read line by line (a big game's is tens of KB: nothing holds it, and a level's record is found by reading it again).
static File cfgFile;
static bool cfgMounted = false;  // this reader mounted the card (and unmounts it at the end)
static uint8_t cfgBuf[256];
static int cfgPos = 0, cfgLen = 0;
static File smallCfg;  // small.pak, open while a Starter's .cfg is read from it
static gm::SmallPak smallCfgPak;
static gm::SmallLines smallCfgLines;
static bool cfgInPak = false;
static void* cfgOpen(void*, const char* name) {
  char path[48];
  cfgInPak = false;
  if (curFs == &LittleFS && smallOpen(smallCfg, smallCfgPak)) {
    if (smallCfgLines.open(&smallCfgPak, name)) { cfgInPak = true; return &smallCfg; }
    smallCfg.close();
  }
  snprintf(path, sizeof path, "%s/%s", curBase, name);
  cfgMounted = false;
  if (curFs == &SD && !sdUp) {
    if (!mountSD()) return nullptr;
    cfgMounted = true;
  }
  if (curOne[0]) {  // a one-file game: its .cfg is an entry of the .GMP
    if (packOpen(SD, curOne, smallCfg, smallCfgPak)) {
      if (smallCfgLines.open(&smallCfgPak, name)) { cfgInPak = true; return &smallCfg; }
      smallCfg.close();
    }
    if (cfgMounted) unmountSD();
    cfgMounted = false;
    return nullptr;
  }
  cfgFile = curFs->open(path, "r");
  if (!cfgFile) {
    if (cfgMounted) unmountSD();
    cfgMounted = false;
    return nullptr;
  }
  cfgPos = cfgLen = 0;
  return &cfgFile;
}
static bool cfgNext(void*, char* line, int cap) {
  if (cfgInPak) return smallCfgLines.next(line, cap);
  int n = 0;
  for (;;) {
    if (cfgPos >= cfgLen) {
      cfgLen = cfgFile.read(cfgBuf, sizeof cfgBuf);
      cfgPos = 0;
      if (cfgLen <= 0) { cfgLen = 0; if (!n) return false; break; }
    }
    char c = (char)cfgBuf[cfgPos++];
    if (c == '\n') break;
    if (n < cap - 1) line[n++] = c;
  }
  line[n] = 0;
  return true;
}
static void cfgClose(void*) {
  if (cfgInPak) {
    smallCfg.close();
    cfgInPak = false;
  } else cfgFile.close();
  if (cfgMounted) unmountSD();
  cfgMounted = false;
}
static const gm::Lines cfgLines = {cfgOpen, cfgNext, cfgClose, nullptr};
// A card level's compressed files are read together while nothing big is on the heap (see prefetchLevel); readFile hands them out once.
struct Prefetched { char name[16]; uint8_t* p; size_t n; };
static Prefetched pre[8];
static void clearPrefetched() {
  for (auto& x : pre) { free(x.p); x.p = nullptr; }
}
static uint8_t* readFile(const char* name, size_t* n) {
  for (auto& x : pre)
    if (x.p && !strcmp(x.name, name)) {
      uint8_t* p = x.p;
      x.p = nullptr;
      *n = x.n;
      return p;
    }
  return readGameFile(name, n);
}
// The decompressor's state is about 11 KB: taken from the heap once, since the loop task's whole
// stack is 8 KB (tinfl_decompress_mem_to_mem puts it on the stack, which overflowed the first time a
// game loaded) and static memory is full.
static tinfl_decompressor* inflater = nullptr;
static bool inflateRaw(const uint8_t* src, size_t n, uint8_t* dst, size_t cap) {
  if (!inflater) inflater = (tinfl_decompressor*)malloc(sizeof(tinfl_decompressor));
  if (!inflater) return false;
  tinfl_init(inflater);
  size_t in = n, out = cap;  // raw deflate: no zlib header
  tinfl_status st = tinfl_decompress(inflater, src, &in, dst, dst, &out, TINFL_FLAG_USING_NON_WRAPPING_OUTPUT_BUF);
  return st == TINFL_STATUS_DONE && out == cap;
}

// Menu records live in one bounded allocation, released before loading game buffers.
using GameEntry = pk::Entry;
constexpr int MAXGAMES = pk::MAX_GAMES;
static pk::Catalog* catalog = nullptr;
static GameEntry* games = nullptr;
static GameEntry activeGame;
static int ngames = 0, ncollections = 0;
static bool restoreSelection = false;
static bool catalogOverflow = false, uidConflict = false;
static bool haveSD = false, cardProbePending = true;
static pk::CardState cardState = pk::CARD_UNKNOWN;  // what the card said at boot or the last Rescan (cardmsg.h)
static pk::LoadFail failWhy = pk::FAIL_FILE;
static bool loadBarOn = false;
static SPIClass sdSpi(VSPI);
static bool mountSD() {
  if (sdUp) return true;
  sdSpi.begin(PIN_SD_SCLK, PIN_SD_MISO, PIN_SD_MOSI, PIN_SD_CS);
  sdUp = SD.begin(PIN_SD_CS, sdSpi, 20000000);
  if (!sdUp) sdSpi.end();
  return sdUp;
}
static void unmountSD() { if (sdUp) { SD.end(); sdSpi.end(); sdUp = false; } }
static File scanDir, cacheIn, cacheOut;
static bool cacheValid = false, cardScanKnown = false;
static uint32_t cardDirectoryStamp = 0;
static bool cachedGame(File& f,const char* name,GameEntry&g) {
  if(!cacheValid||!cacheIn.seek(4))return false;
  pk::Cached row;
  while(cacheIn.read((uint8_t*)&row,sizeof row)==sizeof row) {
    if(pk::cached(row,f.size(),f.getLastWrite(),name)) {
      // Collection numbers depend on this boot's user labels, so reclassify those from JSON.
      if(row.game.category==5&&row.game.sub)return false;
      if(row.game.pos>f.size()||row.game.len>f.size()-row.game.pos)return false;
      g=row.game;return true;
    }
  }return false;
}
static void cacheGame(const GameEntry&g,File& f) {
  if(!cacheOut||cacheOut.size()>=4+MAXGAMES*sizeof(pk::Cached))return;pk::Cached row={};row.game=g;row.size=f.size();row.modified=f.getLastWrite();row.checksum=pk::crc32(&row,offsetof(pk::Cached,checksum));
  if(cacheOut.write((const uint8_t*)&row,sizeof row)!=sizeof row){cacheOut.close();SD.remove("/pocket/LIBRARY.NEW");}
}
static bool scanDone = false;
static uint32_t scanStart = 0, scanFiles = 0;
static void stopCardScan() { scanDir.close(); cacheIn.close(); cacheOut.close(); unmountSD(); }
static void releaseCatalog() { stopCardScan(); free(catalog); catalog = nullptr; games = nullptr; }
// ---- Recently played and Favorites (favorites.h): NVS pocket/recent and pocket/pins ----------------------------------
// Written only when a game launches (recent) and on a star tap (pins), never mid-play. The lists live in the catalog while
// the library is open; a pause reads and writes NVS directly, through a short-lived heap buffer.
template <int N> static bool listRead(const char* key, uint32_t magic, pk::UidList<N>& l) {
  l.n = 0;
  uint8_t* b = (uint8_t*)malloc(pk::blobSize(N));
  if (!b) return false;
  Preferences p;
  bool ok = false;
  if (p.begin("pocket", true)) {
    size_t n = p.isKey(key) ? p.getBytesLength(key) : 0;
    ok = n && n <= pk::blobSize(N) && p.getBytes(key, b, n) == n && pk::unpackUids(b, n, magic, l);
    p.end();
  }
  free(b);
  return ok;
}
template <int N> static bool listWrite(const char* key, uint32_t magic, const pk::UidList<N>& l) {
  uint8_t* b = (uint8_t*)malloc(pk::blobSize(N));
  if (!b) return false;
  size_t n = pk::packUids(l, magic, b);
  Preferences p;
  bool ok = p.begin("pocket", false);
  if (ok) { ok = p.putBytes(key, b, n) == n; p.end(); }
  free(b);
  return ok;
}
// A launch from the library (not the serial self-test): the game goes first in Recently played.
static void noteRecent(const uint8_t* uid) {
  pk::RecentList l;
  listRead("recent", pk::RECENT_MAGIC, l);
  if (pk::recentPlayed(l, uid)) listWrite("recent", pk::RECENT_MAGIC, l);
}
constexpr int PIN_NOT_SAVED = 3;  // after pk::PIN_ADDED, PIN_REMOVED, PIN_FULL: NVS refused the write, so nothing changed
// Star or unstar a game: the catalog's list while the library is open, else (paused) the stored one.
static int toggleFavorite(const uint8_t* uid) {
  pk::PinList* l = catalog ? &catalog->pins : (pk::PinList*)malloc(sizeof(pk::PinList));
  if (!l) return PIN_NOT_SAVED;
  if (!catalog) listRead("pins", pk::PINS_MAGIC, *l);
  int r = pk::togglePin(*l, uid);
  if (r != pk::PIN_FULL && !listWrite("pins", pk::PINS_MAGIC, *l)) { pk::togglePin(*l, uid); r = PIN_NOT_SAVED; }
  if (!catalog) free(l);
  return r;
}
static bool storedFavorite(const uint8_t* uid) {
  pk::PinList* l = (pk::PinList*)malloc(sizeof(pk::PinList));
  if (!l) return false;
  listRead("pins", pk::PINS_MAGIC, *l);
  bool has = l->has(uid);
  free(l);
  return has;
}
static const char* pinMessage(int r) {
  return r == pk::PIN_ADDED ? "Added to Favorites" : r == pk::PIN_REMOVED ? "Removed from Favorites" : r == pk::PIN_FULL ? "Favorites are full (32): unstar one first" : "Changes not saved";
}
static bool lineAt(File& f, uint32_t pos, char* out, size_t cap) {
  if (!f.seek(pos)) return false;
  size_t n=0; bool overflow=false;
  while(f.available()) { int c=f.read();if(c=='\n')break;if(n+1<cap)out[n++]=(char)c;else overflow=true; }
  out[n]=0;return n&&!overflow;
}
static bool field(const char* s, const char* name, char* out, size_t cap) {
  pk::Json j(s,strlen(s)); if(!j.take('{'))return false;
  do {char key[64];if(!j.str(key,sizeof key)||!j.take(':'))return false;if(!strcmp(key,name))return j.str(out,cap);if(!j.skip())return false;}while(j.take(','));return false;
}
static void identify(GameEntry& g,const char* uid) { uint8_t hash[32];mbedtls_sha256_ret((const unsigned char*)uid,strlen(uid),hash,0);memcpy(g.uid,hash,16); }
static bool gameMeta(const GameEntry&g,pk::Meta&m);
static bool duplicate(const GameEntry& g) {
  for(int i=0;i<ngames;i++)if(!memcmp(games[i].uid,g.uid,16)) {
    if(g.metadata&&games[i].metadata){pk::Meta a,b;if(gameMeta(g,a)&&gameMeta(games[i],b)&&(strcmp(a.uid,b.uid)||strcmp(a.crc,b.crc))){uidConflict=true;Serial.println("LIB conflicting UID: first installed copy retained");}}
    return true;
  }
  return false;
}
static void classify(GameEntry& g,const pk::Meta& m) {
  pk::categorize(g,m);
  if(g.category==5 && m.sub[0] && strcmp(m.sub,"unsorted")) {
    int at=0;while(at<ncollections&&strcmp(catalog->collections[at].slug,m.sub))at++;
    if(at==ncollections) {
      if(ncollections==pk::MAX_COLLECTIONS){catalogOverflow=true;return;}
      strcpy(catalog->collections[at].slug,m.sub);strcpy(catalog->collections[at].label,m.label[0]?m.label:m.sub);ncollections++;
    }
    g.sub=at+1;
  }
}
// Retrieve only bounded metadata/title; a search never opens cfg, cards or thumbnails.
static bool gameMeta(const GameEntry& g,pk::Meta& m) {
  bool was=sdUp;if(g.sd&&!mountSD())return false;
  File f;char path[48];char b[1025];bool ok=false;
  if(g.one)snprintf(path,sizeof path,"/pocket/%s",g.file);
  else snprintf(path,sizeof path,"%s/%s",g.sd?"/pocket":"",g.metadata?"library.jsonl":"games.txt");
  f=(g.sd?(fs::FS&)SD:(fs::FS&)LittleFS).open(path,"r");
  if(f) {
    if(g.metadata){if(g.len<=1024&&f.seek(g.pos)&&f.read((uint8_t*)b,g.len)==g.len){b[g.len]=0;ok=pk::metadata(b,g.len,m,true);}}
    else {
      bool got=g.one&&g.len?g.len<sizeof b&&f.seek(g.pos)&&f.read((uint8_t*)b,g.len)==g.len:lineAt(f,g.pos,b,sizeof b);
      if(g.one&&g.len&&g.len<sizeof b)b[g.len]=0;
      char*a=got?strchr(b,'|'):nullptr,*e=a?strchr(a+1,'|'):nullptr;
      if(a&&e){*e=0;strncpy(m.title,a+1,128);m.title[128]=0;ok=true;}
    }
    f.close();
  }
  if(!ok)strcpy(m.title,g.id);
  if(g.sd&&!was)unmountSD();return ok;
}
static bool parseGameLine(char* p,bool sd,GameEntry& g) {
  char*a=strchr(p,'|'),*b=a?strchr(a+1,'|'):nullptr,*c=b?strchr(b+1,'|'):nullptr;
  if(!a||!b||(sd&&!c)||a-p>27||a==p)return false;
  *a=0;*b=0;if(c)*c=0;
  for(char*q=p;*q;q++)if(!(*q>='a'&&*q<='z')&&!pk::digit(*q)&&*q!='-')return false;
  strcpy(g.id,p);g.sd=sd;g.category=5;g.metadata=false;
  if(sd){if(strlen(c+1)>8)return false;for(char*q=c+1;*q;q++)if(!pk::alnum(*q))return false;strcpy(g.file,c+1);}
  char uid[128];snprintf(uid,sizeof uid,"legacy:%s:%s:%s",sd?"sd":"flash",g.file,g.id);identify(g,uid);return true;
}
// Indexes are acceleration caches: invalid/missing headers fall back to games.txt/GMP discovery.
static bool addIndex(fs::FS& fsys,bool sd) {
  File f=fsys.open(sd?"/pocket/library.jsonl":"/library.jsonl","r");if(!f)return false;
  char b[1025];bool valid=lineAt(f,0,b,sizeof b)&&pk::indexHeader(b,strlen(b));
  if(!valid){f.close();return false;}
  while(f.available()) {
    uint32_t pos=f.position();if(!lineAt(f,pos,b,sizeof b))continue;
    pk::Meta m;if(!pk::metadata(b,strlen(b),m,true))continue;
    GameEntry g={};char storage[12],locator[32];
    if(!field(b,"id",g.id,sizeof g.id)||!pk::segment(g.id)||!field(b,"storage",storage,sizeof storage)||!field(b,"locator",locator,sizeof locator))continue;
    if(strcmp(storage,sd?"loose":"flash")||!pk::segment(locator)||(sd&&strlen(locator)>8))continue;
    g.sd=sd;g.metadata=true;g.pos=pos;g.len=strlen(b);strcpy(g.file,sd?locator:"");identify(g,m.uid);classify(g,m);
    if(duplicate(g))continue;
    if(ngames==MAXGAMES){catalogOverflow=true;break;}games[ngames++]=g;
  }
  f.close();return ngames>0;
}
static void addGames(fs::FS& fsys,const char* base,bool sd) {
  addIndex(fsys,sd);
  char path[48];snprintf(path,sizeof path,"%s/games.txt",base);File f=fsys.open(path,"r");if(!f)return;
  char b[256];while(f.available()) {
    uint32_t pos=f.position();if(!lineAt(f,pos,b,sizeof b))continue;
    GameEntry g={};if(!parseGameLine(b,sd,g))continue;g.pos=pos;
    bool indexed=false;for(int i=0;i<ngames;i++)if(games[i].metadata&&games[i].sd==sd&&!games[i].one&&!strcmp(games[i].id,g.id)&&!strcmp(games[i].file,g.file))indexed=true;
    if(indexed)continue;
    if(duplicate(g))continue;if(ngames==MAXGAMES){catalogOverflow=true;break;}games[ngames++]=g;
  }f.close();
}
static bool scanCardBatch() {
  if(scanDone||!haveSD||!catalog)return false;
  if(!scanDir){if(!mountSD()){scanDone=true;cardState=pk::CARD_NONE;return true;}scanDir=SD.open("/pocket");if(!scanDir){scanDone=true;cardState=pk::CARD_NOFOLDER;stopCardScan();return true;}scanStart=millis();scanFiles=0;
    cacheIn=SD.open("/pocket/LIBRARY.CCH","r");char magic[4];cacheValid=cacheIn&&cacheIn.size()>=4&&(cacheIn.size()-4)%sizeof(pk::Cached)==0&&cacheIn.size()<=4+MAXGAMES*sizeof(pk::Cached)&&cacheIn.read((uint8_t*)magic,4)==4&&!memcmp(magic,"PLC1",4);
    cacheOut=SD.open("/pocket/LIBRARY.NEW","w");if(cacheOut)cacheOut.write((const uint8_t*)"PLC1",4);
  }
  int before=ngames;
  for(int batch=0;batch<8;batch++) {
    bool dir=false;String path=scanDir.getNextFileName(&dir);if(!path.length()){scanDone=true;break;}scanFiles++;
    const char*nm=strrchr(path.c_str(),'/');nm=nm?nm+1:path.c_str();size_t len=strlen(nm);
    if(dir||len<=4||len>=16||strcasecmp(nm+len-4,".gmp"))continue;
    bool safe=true;for(size_t i=0;i<len-4;i++)if(!pk::alnum(nm[i])&&nm[i]!='_'&&nm[i]!='-')safe=false;if(!safe)continue;
    File f=SD.open(path.c_str(),"r");if(!f)continue;
    GameEntry hit={};if(cachedGame(f,nm,hit)){cacheGame(hit,f);if(!duplicate(hit)){if(ngames==MAXGAMES){catalogOverflow=true;scanDone=true;}else games[ngames++]=hit;}f.close();if(scanDone)break;continue;}
    gm::SmallPak pak;pak.user=&f;pak.readAt=smallReadAt;pak.size=f.size();if(!pak.begin()){f.close();continue;}
    uint32_t off,n;if(!pak.find("game.txt",&off,&n)||n>256){f.close();continue;}
    char b[1025];if(!smallReadAt(&f,off,b,n)||!pk::gmp1(b,n)){f.close();continue;}b[n]=0;
    char*line=b+6;char*end=strchr(line,'\n');if(end)*end=0;
    GameEntry g={};strcpy(g.file,nm);
    if(parseGameLine(line,false,g)) {
      g.sd=g.one=true;g.pos=off+6;g.len=end?end-line:n-6;g.category=5;
      char uid[128];snprintf(uid,sizeof uid,"legacy:gmp:%s:%s",nm,g.id);identify(g,uid);
      if(pak.find("library.json",&off,&n)&&n<=1024&&smallReadAt(&f,off,b,n)) {
        b[n]=0;pk::Meta m;if(pk::metadata(b,n,m)){g.metadata=true;g.pos=off;g.len=n;identify(g,m.uid);classify(g,m);}
      }
      cacheGame(g,f);
      if(!duplicate(g)){if(ngames==MAXGAMES){catalogOverflow=true;scanDone=true;}else games[ngames++]=g;}
    }f.close();if(scanDone)break;
  }
  if(scanDone){cacheIn.close();if(cacheOut){cacheOut.close();SD.remove("/pocket/LIBRARY.CCH");SD.rename("/pocket/LIBRARY.NEW","/pocket/LIBRARY.CCH");}File dir=SD.open("/pocket");cardDirectoryStamp=dir?dir.getLastWrite():0;dir.close();cardScanKnown=true;if(cardState==pk::CARD_READING)cardState=pk::CARD_READY;Serial.printf("BOOT card-discovery ms=%lu entries=%lu games=%d\n",(unsigned long)(millis()-scanStart),(unsigned long)scanFiles,ngames);stopCardScan();}
  return before!=ngames||scanDone;
}
// Rebuild released RAM from the disposable cache after play. A directory scan is only
// needed on boot, explicit Rescan, changed directory stamp or an invalid/missing target.
static bool restoreCardCatalog() {
  if(!cardScanKnown)return false;
  File dir=SD.open("/pocket");if(!dir)return false;uint32_t stamp=dir.getLastWrite();dir.close();
  if(stamp!=cardDirectoryStamp)return false;
  File cache=SD.open("/pocket/LIBRARY.CCH","r");char magic[4];
  if(!cache||cache.size()<4||(cache.size()-4)%sizeof(pk::Cached)||cache.size()>4+MAXGAMES*sizeof(pk::Cached)||cache.read((uint8_t*)magic,4)!=4||memcmp(magic,"PLC1",4)){cache.close();return false;}
  uint32_t t=millis();
  while(cache.available()) {
    pk::Cached row;if(cache.read((uint8_t*)&row,sizeof row)!=sizeof row){cache.close();return false;}
    if(row.game.file[15]||!row.game.file[0]){cache.close();return false;}
    const char* name=row.game.file;size_t n=strlen(name);bool safe=n>4&&!strcasecmp(name+n-4,".gmp");
    for(size_t i=0;i+4<n;i++)if(!pk::alnum(name[i])&&name[i]!='_'&&name[i]!='-')safe=false;
    if(!safe){cache.close();return false;}
    char path[40];snprintf(path,sizeof path,"/pocket/%s",name);File f=SD.open(path,"r");
    bool valid=f&&pk::cached(row,f.size(),f.getLastWrite(),name)&&row.game.pos<=f.size()&&row.game.len<=f.size()-row.game.pos;f.close();
    if(!valid){cache.close();return false;}
    GameEntry g=row.game;
    if(g.category==5&&g.sub){pk::Meta m;if(!gameMeta(g,m)){cache.close();return false;}classify(g,m);}
    if(!duplicate(g)){if(ngames==MAXGAMES){catalogOverflow=true;break;}games[ngames++]=g;}
  }
  cache.close();Serial.printf("LIB card-cache ms=%lu games=%d\n",(unsigned long)(millis()-t),ngames);return true;
}
// Mounts the card and says what it found: no card, unreadable, no /pocket folder, or ready to read. Leaves the card mounted.
static void probeCard() {
  bool mounted = mountSD(), root = false, pocket = false;
  if (mounted) {
    File r = SD.open("/");
    root = r && r.isDirectory();
    r.close();
    File d = SD.open("/pocket");
    pocket = d && d.isDirectory();
    d.close();
  }
  haveSD = mounted;
  cardState = pk::cardStateAfterMount(mounted, root, pocket);
}
static int cardGames() { int n = 0; for (int i = 0; i < ngames; i++) if (games[i].sd) n++; return n; }
static void loadGameList() {
  releaseCatalog();catalog=(pk::Catalog*)calloc(1,sizeof(pk::Catalog));games=catalog?catalog->games:nullptr;
  ngames=ncollections=0;catalogOverflow=uidConflict=false;scanDone=false;
  if(!catalog){catalogOverflow=true;scanDone=true;return;}
  listRead("recent",pk::RECENT_MAGIC,catalog->recent);listRead("pins",pk::PINS_MAGIC,catalog->pins);
  addGames(LittleFS,"",false);
  if(haveSD&&mountSD()){addGames(SD,"/pocket",true);scanDone=restoreCardCatalog();if(scanDone)cardState=pk::CARD_READY;unmountSD();}
}
static const char* fileOf(const GameEntry& g) { return g.sd && !g.one ? g.file : g.id; }  // the name of its .cfg (and .pak)
// Points the file readers at game g.
static bool selectGame(const GameEntry& game) {
  stopCardScan();
  curOne[0] = 0;
  curPakBase = 0;
  if (game.one) {  // one file: the cards are its cards.pak entry
    curFs = &SD;
    strcpy(curBase, "/pocket");
    snprintf(curOne, sizeof curOne, "/pocket/%s", game.file);
    strcpy(curPak, curOne);
    bool wasUp = sdUp, ok = false;
    if (!mountSD()) return false;
    File pf;
    gm::SmallPak pak;
    uint32_t len = 0;
    if (packOpen(SD, curOne, pf, pak)) {
      uint32_t at, n;
      char header[6];
      ok = pak.find("game.txt", &at, &n) && n >= 6 && n <= 256 && smallReadAt(&pf, at, header, sizeof header) && pk::gmp1(header, sizeof header) && pak.find("cards.pak", &curPakBase, &len);
      pf.close();
    }
    if (!wasUp) unmountSD();
    return ok;
  }
  if (game.sd) {
    curFs = &SD;
    strcpy(curBase, "/pocket");
    snprintf(curPak, sizeof curPak, "/pocket/%s.pak", fileOf(game));
  } else {
    curFs = &LittleFS;
    curBase[0] = 0;
    strcpy(curPak, "/cards.pak");
  }
  return true;
}
// The core is about to load level `level`. For a game on the card: free the buffers that level replaces, mount the card with the
// heap at its emptiest, read the level's compressed files into small buffers, unmount; the loads then inflate from those. (A card
// mounted over a full heap, or mounted while the big blocks are placed, leaves no long free stretch for them.)
static void prefetchLevel(int level) {
  clearPrefetched();
  if (curFs != &SD) return;
  // A level entered again (after a death) keeps its files; any other level: nothing of the last one stays, its record is read from the
  // card first, and the card is mounted for that with the heap at its emptiest. (Files the next level shares are read again; that
  // costs less than a mount over the buffers.)
  bool same = assets.filesLevel == level && assets.bbl;
  if (!same) {
    char keepPal[16];
    strcpy(keepPal, assets.palName);  // the palette stays (release forgets its name); it is read again only if the level's differs
    assets.release();
    strcpy(assets.palName, keepPal);
  }
  if (!mountSD()) return;
  if (!same && !assets.readInfo(level)) { unmountSD(); return; }
  const gm::LevelFiles& L = assets.files;
  bool mons = L.nmon > 0;
  const char* want[8];
  int n = 0;
  if (!same) {
    want[n++] = L.bbl;
    want[n++] = L.cbl;
    want[n++] = L.chr;
    if (strcmp(assets.palName, L.pal)) want[n++] = L.pal;
    if (mons) { want[n++] = L.mon; want[n++] = L.mbl; }
    if (L.snd[0]) want[n++] = L.snd;
  }
  want[n++] = L.map;
  for (int i = 0; i < n; i++) {
    size_t len = 0;
    uint8_t* p = readGameFile(want[i], &len);
    if (!p) continue;
    strncpy(pre[i].name, want[i], sizeof pre[i].name - 1);
    pre[i].name[sizeof pre[i].name - 1] = 0;
    pre[i].p = p;
    pre[i].n = len;
  }
  unmountSD();
}
// ---- settings ----------------------------------------------------------------------------------

static bool smallerPicture = false;
static uint8_t brightStep = 3;   // Settings, Brightness: 25 / 50 / 75 / 100 percent (NVS "bright")
static bool clicksOn = false;    // optional button clicks (NVS "clicks"); never in a game
static bool ledOn = true;        // the 2.8 inch board's status LED (NVS "led")
// ---- idle, backlight, status LED, clicks ------------------------------------------------------------
static idle::Machine idleM;
static sled::Led statusLed;
static void applyBacklight() { tftHw.setBrightness(idle::forState(idleM.state, brightStep)); }
// The 2.8 inch board's LED: red is plain GPIO (active low), green is dim through its own LEDC channel (6; 4 is the speaker, 7 the backlight).
static void ledWrite(uint32_t now) {
#ifdef POCKET_CYD28
  static uint8_t lastR = 255, lastG = 255;
  uint8_t r, g;
  statusLed.at(now, r, g);
  if (idleM.state == idle::OFF) r = g = 0;
  if (r != lastR) { digitalWrite(PIN_LED_R, r ? LOW : HIGH); lastR = r; }
  if (g != lastG) { ledcWrite(6, 255 - g); lastG = g; }
#else
  (void)now;
#endif
}
// A 2-step tick: 1.2 kHz then 1.8 kHz, 3 steps of 1/145.6 s each (36 steps in a tune).
static const uint8_t CLICK_TUNE[72] = {0xB0, 0x04, 0xB0, 0x04, 0xB0, 0x04, 0x08, 0x07, 0x08, 0x07, 0x08, 0x07};
static void clickSound() { if (clicksOn) spk::play(CLICK_TUNE); }  // only the menus call it, never a game in play
static void saveSettings() {
  Preferences pref;
  if (pref.begin("pocket", false)) {
    pref.putBool("smaller", smallerPicture); pref.putBool("sticky", settings.sticky);
    pref.putUChar("bright", brightStep); pref.putBool("clicks", clicksOn); pref.putBool("led", ledOn);
    pref.putUChar("sound", settings.sound);  // also in NVS, so a reflash of the file system keeps the chosen volume
    pref.end();
  }
  File f = LittleFS.open("/settings.txt", "w");
  if (!f) return;
  // Older firmware reads these lines by their first letters ("pad" ...), so the newer keys share no prefix with the old ones and
  // come last: it skips them, and its own save drops them (the pad goes back to Low and Space to the corner).
  f.printf("lefty=%d\nstylus=%d\npad=%d\ndead=%d\npalm=%d\ndebug=%d\nsound=%d\nraised=%d\njumpnear=%d\n", settings.lefty, settings.stylus, settings.padSize,
           settings.dead, settings.palm, settings.debug, settings.sound, settings.raised, settings.jumpNear);
}
static void loadSettings() {
  settings = ctl::Settings();
  Preferences pref;
  int nvsSound = -1;
  if (pref.begin("pocket", true)) { smallerPicture = pref.getBool("smaller", false); settings.sticky = pref.getBool("sticky", false);
    brightStep = pref.getUChar("bright", 3); if (brightStep > 3) brightStep = 3;
    clicksOn = pref.getBool("clicks", false); ledOn = pref.getBool("led", true);
    if (pref.isKey("sound")) nvsSound = pref.getUChar("sound", 0);
    pref.end(); }
  // Sound: NVS first, then an older firmware's settings.txt line, else Off (the default, ctl::Settings).
  if (nvsSound >= 0 && nvsSound <= 3) settings.sound = (uint8_t)nvsSound;
  File f = LittleFS.open("/settings.txt", "r");
  if (!f) return;
  while (f.available()) {
    String l = f.readStringUntil('\n');
    int eq = l.indexOf('=');
    if (eq < 0) continue;
    String k = l.substring(0, eq);  // whole keys: "pad" and a later "padX" must not be mixed up
    int v = l.substring(eq + 1).toInt();
    if (k == "lefty") settings.lefty = v ? 1 : 0;
    else if (k == "stylus") settings.stylus = v ? 1 : 0;
    else if (k == "pad") settings.padSize = v < 0 ? 0 : v > 2 ? 2 : v;
    else if (k == "dead") settings.dead = v < 0 ? 0 : v > 2 ? 2 : v;
    else if (k == "palm") settings.palm = v < 0 ? 0 : v > 2 ? 2 : v;
    else if (k == "debug") settings.debug = v ? 1 : 0;
    else if (k == "sound") { if (nvsSound < 0) settings.sound = v < 0 ? 0 : v > 3 ? 3 : v; }
    else if (k == "raised") settings.raised = v ? 1 : 0;
    else if (k == "jumpnear") settings.jumpNear = v ? 1 : 0;
  }
}

// ---- touch input -------------------------------------------------------------------------------

struct Pts { int n, id[5], x[5], y[5], size[5]; };
static Pts pts;
static uint32_t lastPoll = 0;
// Serial debug (see the README, "Held-input trace"): `V 1` prints every new GT911 report ("R") and every game tick's held keys ("K");
// `I x y` holds a made-up finger at screen x,y (as if a thumb rested there) and `I off` lifts it; `G n` starts game n from the list.
static bool traceOn = false, injOn = false;
static int injX = 0, injY = 0;
static void pollTouch(uint32_t now) {
  if (injOn) { pts.n = 1; pts.id[0] = 0; pts.x[0] = injX; pts.y[0] = injY; pts.size[0] = 40; return; }
  if (!haveGT) { pts.n = 0; return; }
  if (now - lastPoll >= 8) {
    lastPoll = now;
    gt.poll();
    if (traceOn && gt.fresh) {
      int x = -1, y = -1;
      if (gt.n > 0) Touch::toScreen(gt.rawX[0], gt.rawY[0], x, y);
      Serial.printf("R %lu n=%d id=%d x=%d y=%d size=%d\n", (unsigned long)now, gt.n, gt.n ? gt.id[0] : -1, x, y, gt.n ? gt.size[0] : 0);
    }
  }
  pts.n = gt.n;
  for (int i = 0; i < gt.n; i++) {
    Touch::toScreen(gt.rawX[i], gt.rawY[i], pts.x[i], pts.y[i]);
    pts.id[i] = gt.id[i];
    pts.size[i] = gt.size[i];
  }
}
// A fresh press (no touch before it) on a menu screen: returns true once per touch, with its position.
static bool wasDown = false;
static bool freshTap(int& x, int& y) {
  bool down = pts.n > 0;
  bool fresh = down && !wasDown;
  wasDown = down;
  if (fresh) { x = pts.x[0]; y = pts.y[0]; }
  return fresh;
}

// ---- drawing -----------------------------------------------------------------------------------

static void button(int x0, int y0, int x1, int y1, const char* label, bool hot = false, uint16_t fill = C_DARK) {
  ovl::button(tft, x0, y0, x1, y1, label, hot, fill);
}
// Where the screens put things (the 480x320 numbers are the 3248S035's; the 320x240 ones are for the 2432S028).
constexpr int TITLE_H = scr::SMALL ? 28 : 40;

static void title(const char* s) {
  tft.fillRect(0, 0, scr::W, TITLE_H, C_BLUE);
  tft.setTextColor(C_WHITE, C_BLUE);
  tft.setTextSize(2);
  tft.setCursor(8, scr::SMALL ? 6 : 12);
  tft.print(s);
  char fl[40];  // the board and firmware, small, at the right of the bar
  fwLabel(fl, sizeof fl, false);
  int room = scr::W - 8 - (int)strlen(s) * 12 - 8;
  if ((int)strlen(fl) * 6 > room) fwLabel(fl, sizeof fl, true);
  if ((int)strlen(fl) * 6 > room) return;  // no room (the 3.5 inch list's long title)
  tft.setTextSize(1);
  tft.setTextColor(C_WHITE, C_BLUE);
  tft.setCursor(scr::W - (int)strlen(fl) * 6 - 4, scr::SMALL ? 12 : 16);
  tft.print(fl);
}

// ---- the picture with the controls on it ----------------------------------------------------------
// Each band of the picture is built in `band`, the controls that touch it are drawn into the band (through
// a sprite on the same memory, so the colors need no conversion) and the band is pushed once. The panel
// never shows the game without the controls (no blink), and a solid chip is never painted twice (no black
// flash). Only the controls that overlap a band are drawn into it.
static lgfx::LGFX_Sprite spr(&tftHw);
static bool sprReady = false;

// What each button shows beside its name: the picture of what the key throws or uses (btnicon.h).
// Index 0 Space, 1 Enter, 2 + i the key tile i. The signature says when the picture changed.
static gm::BtnIcon icons[2 + ctl::MAXEXTRA];
static ovl::Overlay<lgfx::LGFX_Sprite> ov(spr, band, pal, cfg, controls, icons);  // the overlay drawing (overlaydraw.h)
static void refreshIcons() {
  const ctl::Need& nd = controls.need;
  icons[0] = nd.space ? gm::iconForKey(world, ctl::S_SPACE) : gm::BtnIcon();
  icons[1] = nd.enter ? gm::iconForKey(world, ctl::S_ENTER) : gm::BtnIcon();
  for (int i = 0; i < ctl::MAXEXTRA; i++) icons[2 + i] = i < nd.nextra ? gm::iconForKey(world, nd.extra[i]) : gm::BtnIcon();
}


// Reduced view anchored at the top, completely past the pad (and Space when it sits near the pad) and its 14 px touch slop.
static scr::Picture picture() {
  const auto& pad = controls.L.pad;
  int edge = settings.lefty ? VIEW_W - pad.cx + pad.r : pad.cx + pad.r;
  if (settings.jumpNear) {  // Space beside the pad: the picture starts past it too
    const auto& sp = controls.L.space;
    int e2 = settings.lefty ? VIEW_W - sp.cx + sp.r : sp.cx + sp.r;
    if (e2 > edge) edge = e2;
  }
  return {VIEW_W, VIEW_H, smallerPicture, settings.lefty != 0, edge + 14};
}
static int gameX(int x) { return picture().toX(x); }
static int gameY(int y) { return picture().toY(y); }

// Draws screen rectangle [X0,X1) x [Y0,Y1) of the 480x300 view: the game's rows at 1.5x, with the controls on top.
static void drawRegion(int X0, int Y0, int X1, int Y1) {
  if (X0 < 0) X0 = 0;
  if (Y0 < 0) Y0 = 0;
  if (X1 > VIEW_W) X1 = VIEW_W;
  if (Y1 > VIEW_H) Y1 = VIEW_H;
  int w = X1 - X0;
  if (w <= 0 || Y1 <= Y0) return;
  if (!sprReady) { spr.setColorDepth(16); sprReady = true; }
  int rowGy = -1;
  const scr::Picture view = picture();
  for (int Ys = Y0; Ys < Y1; Ys += BAND) {
    int rows = Y1 - Ys < BAND ? Y1 - Ys : BAND;
    for (int r = 0; r < rows; r++) {
      int gy = view.fromY(Ys + r);
      if (gy < gm::SIZEY && gy != rowGy) { world.renderRow(gy, rowIdx); rowGy = gy; }
      uint16_t* o = band + r * w;
      for (int X = X0; X < X1; X++) {
        int gx = view.fromX(X);
        bool inside = view.contains(X, Ys + r);
        *o++ = inside ? pal[rowIdx[gx]] : 0;
      }
    }
    spr.setBuffer(band, w, rows, 16);
    ov.bandX = X0; ov.bandY = Ys; ov.bandW = w; ov.bandH = rows;
    ov.drawControls();
    tft.pushImage(X0, Ys, w, rows, band);
  }
}

struct R { int x0, y0, x1, y1; };
static bool emptyR(const R& r) { return r.x1 <= r.x0 || r.y1 <= r.y0; }
static R unionR(const R& a, const R& b) {
  if (emptyR(a)) return b;
  if (emptyR(b)) return a;
  return {a.x0 < b.x0 ? a.x0 : b.x0, a.y0 < b.y0 ? a.y0 : b.y0, a.x1 > b.x1 ? a.x1 : b.x1, a.y1 > b.y1 ? a.y1 : b.y1};
}
// The screen rectangle the hero covers (two blocks high), a pixel wider than it is.
static R heroRect() {
  if (world.scrx <= gm::OFFSCRN) return {0, 0, 0, 0};
  int gx = world.scrx - world.sc.lsx, gy = world.scry - world.sc.lsy;
  int gy0 = world.curtop < gm::CHARBL ? gy - gm::BLEN : gy;
  return {gameX(gx) - 2, gameY(gy0) - 2, gameX(gx + gm::BLEN) + 3, gameY(gy + gm::BLEN) + 3};
}

static struct { int mx, my, nx, ny, lsx, lsy; uint32_t gen; R hero; bool valid; } last;
// The screen rectangles of the monsters drawn last frame (a moved or gone monster is drawn over again).
static R lastMon[gm::MAXMONSSHOWN];
static int nLastMon = 0;
static R monRect(const gm::MonDraw& d) {
  int gx = d.x - world.sc.lsx, gy = d.y - world.sc.lsy;
  return {gameX(gx) - 2, gameY(gy) - 2, gameX(gx + gm::BLEN) + 3, gameY(gy + gm::BLEN) + 3};
}
static uint8_t lastPad = 0, lastBtn = 0;
static uint16_t lastTile = 0;

static void controlRects(R* out, int& n) {
  const ctl::Layout& L = controls.L;
  n = 0;
  out[n++] = {L.pad.cx - L.pad.r - 2, L.pad.cy - L.pad.r - 2, L.pad.cx + L.pad.r + 3, L.pad.cy + L.pad.r + 3};
  out[n++] = {L.space.cx - L.space.r - 2, L.space.cy - L.space.r - 2, L.space.cx + L.space.r + 3, L.space.cy + L.space.r + 3};
  out[n++] = {L.enter.cx - L.enter.r - 2, L.enter.cy - L.enter.r - 2, L.enter.cx + L.enter.r + 3, L.enter.cy + L.enter.r + 3};
  out[n++] = {L.menu.x0, L.menu.y0, L.menu.x1, L.menu.y1};
  out[n++] = {L.keys.x0, L.keys.y0, L.keys.x1, L.keys.y1};
}

static void drawFrame(bool forceFull) {
  const auto& s = world.sc;
  int oldSig[2 + ctl::MAXEXTRA];
  for (int i = 0; i < 2 + ctl::MAXEXTRA; i++) oldSig[i] = icons[i].sig;
  refreshIcons();
  bool iconCh = false, tileIconCh = false;
  for (int i = 0; i < 2 + ctl::MAXEXTRA; i++)
    if (oldSig[i] != icons[i].sig) { if (i < 2) iconCh = true; else tileIconCh = true; }
  bool full = forceFull || !last.valid || last.mx != world.mx || last.my != world.my || last.nx != s.nx || last.ny != s.ny || last.lsx != s.lsx ||
              last.lsy != s.lsy || last.gen != world.gen;
  R hero = heroRect();
  R curMon[gm::MAXMONSSHOWN];
  int nCurMon = world.ndraw;
  for (int i = 0; i < nCurMon; i++) curMon[i] = monRect(world.draw[i]);
  // Many moving monsters: one full redraw is cheaper than a rectangle each.
  if (!full && nCurMon + nLastMon > 6) full = true;
  if (full) {
    drawRegion(0, 0, VIEW_W, VIEW_H);
  } else {
    R dirty = unionR(hero, last.hero);
    if (!emptyR(dirty)) {
      drawRegion(dirty.x0, dirty.y0, dirty.x1, dirty.y1);
    }
    for (int i = 0; i < nCurMon + nLastMon; i++) {
      const R& r = i < nCurMon ? curMon[i] : lastMon[i - nCurMon];
      drawRegion(r.x0, r.y0, r.x1, r.y1);
    }
    // A control whose state changed is drawn again over the game behind it.
    bool padCh = controls.padDirs != lastPad, btnCh = controls.btnDown != lastBtn, tileCh = controls.tileDown != lastTile;
    tileCh = tileCh || tileIconCh;
    if (padCh || btnCh || tileCh || iconCh) {
      R rs[5];
      int n;
      controlRects(rs, n);
      for (int i = 0; i < n; i++) {
        bool ch = (i == 0 && padCh) || ((btnCh || iconCh) && i > 0);
        if (!ch) continue;
        drawRegion(rs[i].x0, rs[i].y0, rs[i].x1, rs[i].y1);
      }
      if (tileCh && controls.keysOpen) drawRegion(0, ctl::CHIP_BOTTOM, VIEW_W, ctl::TILE_Y0 + ctl::TILE_STEP * controls.L.tileRows);
    }
  }
  last = {world.mx, world.my, s.nx, s.ny, s.lsx, s.lsy, world.gen, hero, true};
  for (int i = 0; i < nCurMon; i++) lastMon[i] = curMon[i];
  nLastMon = nCurMon;
  lastPad = controls.padDirs;
  lastBtn = controls.btnDown;
  lastTile = controls.tileDown;
}

// ---- status strip ------------------------------------------------------------------------------

static uint32_t drawMsLast = 0, tickMsLast = 0, frames = 0, fpsT0 = 0, fps = 0, stripT = 0;

static void drawStrip() {
  tft.fillRect(0, VIEW_H, VIEW_W, scr::STRIP_H, C_BLACK);
  tft.setTextSize(1);
  tft.setTextColor(C_WHITE, C_BLACK);
  tft.setCursor(2, VIEW_H + (scr::SMALL ? 4 : 6));
  char line[128];
  int n = 0;
  if (world.hitpts > 0 && world.hitpts < gm::INF_REPEAT) n += snprintf(line + n, sizeof line - n, "HP %d  ", world.hitpts);
  if (world.lives > 0 && world.lives < gm::INF_REPEAT) n += snprintf(line + n, sizeof line - n, "Lives %d  ", world.lives);
  n += snprintf(line + n, sizeof line - n, "Score %d  ", world.score);
  if (world.meter[3] > 0 && world.meter[3] < gm::INF_REPEAT) n += snprintf(line + n, sizeof line - n, "Money %d  ", world.meter[3] - 1);
  for (int i = 0; i < cfg.nctr; i++) {
    int v = world.meter[cfg.ctr[i].n];
    n += snprintf(line + n, sizeof line - n, "%s %d  ", cfg.ctr[i].label, v < 0 || v == gm::INF_REPEAT ? 0 : v);
  }
  line[n] = 0;
  if (scr::SMALL && n > VIEW_W / 6 - 1) line[VIEW_W / 6 - 1] = 0;  // 53 characters fit a 320 px line
  tft.print(line);
  if (settings.debug) {
    snprintf(line, sizeof line, "lv%d %lufps t%lu d%lu s%d", world.level + 1, (unsigned long)fps, (unsigned long)tickMsLast, (unsigned long)drawMsLast, controls.lastSize);
    tft.setCursor(scr::SMALL ? 2 : VIEW_W - 6 * (int)strlen(line) - 2, VIEW_H + (scr::SMALL ? 16 : 6));
    tft.print(line);
  }
}

// ---- screens -------------------------------------------------------------------------------------

enum Mode { PICKER, PLAYING, PAUSED, HELP_SCREEN, SETTINGS_SCREEN, SEARCH_SCREEN, DETAILS_SCREEN, DONE };
static Mode mode = PICKER;
static int page = 0, selected = -1, nmatch = 0;
static char searchText[25] = "", savedSearch[25] = "";
static bool searchAll = true, savedAll = true, browsingCategories = true, savedBrowsing = true;
static int category = 0, subcategory = -1;
constexpr int PK_BTN_Y = scr::SMALL ? 208 : 280;
static int categorySlots[32], categoryCount = 0;
static const char* rootLabel(int c) {const char*names[]={"All games","Starters","Sandbox","Bizarre","My games","Imported","CD","Good on touch","Continue","Recently played","Favorites"};return names[c];}
// ---- Continue: the last level entered, kept in NVS (pocket/resume) ----------------------------------------------
// Written as each level is entered (a fade is on screen, never mid-tick), cleared on a win or a game over. A board
// convenience: DOS saves are untouched. `sd`: the game was on the card, so with the card out the home page says to put it back.
struct ResumeRec { uint32_t magic; uint8_t uid[16]; uint8_t sd, pad[3]; gm::EntryState e; uint32_t crc; };
constexpr uint32_t RESUME_MAGIC = 0x31534552;  // "RES1"
constexpr int CONTINUE_SLOT = 8;               // the root page's category number for the Continue tile
static ResumeRec resumeRec;
static bool resumeValid = false;
static void resumeLoad() {
  Preferences p;
  resumeValid = false;
  if (!p.begin("pocket", true)) return;
  resumeValid = p.getBytes("resume", &resumeRec, sizeof resumeRec) == sizeof resumeRec && resumeRec.magic == RESUME_MAGIC &&
                resumeRec.e.magic == gm::ENTRY_MAGIC && resumeRec.crc == pk::crc32(&resumeRec, offsetof(ResumeRec, crc));
  p.end();
}
static void resumeSave(const GameEntry& g) {
  memset(&resumeRec, 0, sizeof resumeRec);
  resumeRec.magic = RESUME_MAGIC;
  memcpy(resumeRec.uid, g.uid, 16);
  resumeRec.sd = g.sd;
  resumeRec.e = world.entry;
  resumeRec.crc = pk::crc32(&resumeRec, offsetof(ResumeRec, crc));
  Preferences p;
  if (p.begin("pocket", false)) { p.putBytes("resume", &resumeRec, sizeof resumeRec); p.end(); }
  resumeValid = true;
}
static void resumeClear() {
  if (!resumeValid) return;
  resumeValid = false;
  Preferences p;
  if (p.begin("pocket", false)) { p.remove("resume"); p.end(); }
}
// The game of the resume point in the list (-1: not there, such as a card game with the card out).
static int resumeGame() { return resumeValid && games ? pk::selection(games, ngames, resumeRec.uid) : -1; }
static const char* subLabel(int c,int s) {
  static const char*stages[]={"All stages","1** First Steps","2** Moving and Pushing","3** Heroes and Foes","4** Story and Finish","5** Wiring and Worlds","6** Blocks and Showcase","Graduations","Other"};
  if(c==1)return stages[s>=0&&s<9?s:8];if(c==6)return s==2?"Shareware":"Gameware";
  if(c==5)return s>0&&s<=ncollections?catalog->collections[s-1].label:"Unsorted";return rootLabel(c);
}
/** The icon (icons_data.h order) for a category tile: root slot c of All, or sub slot c of a category. */
static int tileIcon(int cat,int c){static const int roots[]={0,6,9,10,11,12,13,16,0,19,20};if(!cat)return roots[c>=0&&c<11?c:0];if(cat==1)return c>=1&&c<=8?c:8;if(cat==6)return c==2?15:14;if(cat==5)return c>0?18:8;return -1;}
static bool inCategory(const GameEntry&g) {return pk::belongs(g,category,subcategory);}
static void filterGames() {
  nmatch=0;if(!catalog)return;
  bool was=sdUp;if(haveSD)mountSD();uint32_t t=millis();
  bool virt=(category==pk::CAT_RECENT||category==pk::CAT_FAVORITES)&&!(searchText[0]&&searchAll);  // the list's installed games, newest first
  if(virt){int n=category==pk::CAT_RECENT?pk::listGames(games,ngames,catalog->recent,catalog->matches):pk::listGames(games,ngames,catalog->pins,catalog->matches);
    for(int k=0;k<n;k++){int i=catalog->matches[k];if(searchText[0]){pk::Meta m;gameMeta(games[i],m);if(!pk::matches(m.title,searchText))continue;}catalog->matches[nmatch++]=i;}}
  else for(int i=0;i<ngames;i++) {
    if(!(searchText[0]&&searchAll)&&!inCategory(games[i]))continue;
    if(searchText[0]){pk::Meta m;gameMeta(games[i],m);if(!pk::matches(m.title,searchText))continue;}
    catalog->matches[nmatch++]=i;
  }
  // Stable insertion order is title order from games.txt; courses and score are explicit ranks.
  if(category==1||category==7)for(int i=1;i<nmatch;i++){uint16_t g=catalog->matches[i];int j=i;while(j>0){auto&a=games[catalog->matches[j-1]];bool before=pk::before(games[g],a,category);if(!before)break;catalog->matches[j]=catalog->matches[j-1];j--;}catalog->matches[j]=g;}
  if(!was)unmountSD();Serial.printf("LIB search ms=%lu results=%d\n",(unsigned long)(millis()-t),nmatch);
}
static void categories() {
  categoryCount=0;
  if(category==0) {
    if(resumeValid&&(resumeGame()>=0||resumeRec.sd))categorySlots[categoryCount++]=CONTINUE_SLOT;  // first: what was being played
    if(pk::anyListed(games,ngames,catalog->recent))categorySlots[categoryCount++]=pk::CAT_RECENT;  // once a game here has been played
    // Only what holds something: Favorites once a game is starred (its page still explains a card that is out), and the
    // categories with a game in them (a card's games add theirs as the scan finds them).
    if(ngames&&catalog->pins.n)categorySlots[categoryCount++]=pk::CAT_FAVORITES;
    for(int c=1;c<=7;c++){bool any=false;for(int i=0;i<ngames&&!any;i++)any=c==7?games[i].scored:games[i].category==c;if(any)categorySlots[categoryCount++]=c;}
  }else{
    int last=category==1?8:category==6?2:category==5?ncollections:-1;
    for(int s=category==5?0:1;s<=last;s++){bool any=false;for(int i=0;i<ngames&&!any;i++)any=pk::belongs(games[i],category,s);if(any)categorySlots[categoryCount++]=s;}
  }
}
static uint8_t* preview(const GameEntry&g) {
  if(!g.metadata)return nullptr;
  char path[48],name[32];snprintf(path,sizeof path,g.one?"/pocket/%s":g.sd?"/pocket/thumbs.pak":"/thumbs.pak",g.file);
  snprintf(name,sizeof name,g.one?"thumb.pth":"%s.pth",g.id);
  File f;gm::SmallPak pak;uint32_t off,len;uint8_t*raw=nullptr;
  if(packOpen(g.sd?(fs::FS&)SD:(fs::FS&)LittleFS,path,f,pak)&&pak.find(name,&off,&len)&&len>=5&&len<=sizeof band) {
    uint8_t*compressed=(uint8_t*)band;
    if(smallReadAt(&f,off,compressed,len)&&(uint32_t(compressed[0])|uint32_t(compressed[1])<<8|uint32_t(compressed[2])<<16|uint32_t(compressed[3])<<24)==pk::THUMB_RAW){raw=(uint8_t*)malloc(pk::THUMB_RAW);if(raw&&(!inflateRaw(compressed+4,len-4,raw,pk::THUMB_RAW)||!pk::thumb(raw,pk::THUMB_RAW))){free(raw);raw=nullptr;}}
  }f.close();return raw;
}
static void drawPicker(bool clear = true, bool paging = false) {
  (void)clear;(void)paging;
  if(!catalog){assets.release();world.releaseAll();loadGameList();}
  uint32_t t=millis();if(restoreSelection)selected=pk::selection(games,ngames,activeGame.uid);filterGames();categories();int count=browsingCategories?categoryCount:nmatch,pages=(count+5)/6;page=pk::clampPage(page,count,haveSD&&!scanDone);
  pk::clearTiles(tft,scr::W);
  const char*crumb=searchText[0]?(searchAll?"Search: All games":"Search: This category"):subcategory>=0?subLabel(category,subcategory):category?rootLabel(category):"Pocket Player";
  bool home=browsingCategories&&!category&&!searchText[0],none=home&&!ngames;  // the root page: no back arrow, a card chip; no games at all: a notice instead of tiles
  pk::libraryFrame(tft,scr::W,scr::H,crumb,page,pages,searchText[0]&&!nmatch?"Clear":browsingCategories?nullptr:"Details",!home);
  if(home)pk::drawCardChip(tft,scr::W,cardState,cardGames());
  bool was=sdUp;if(haveSD&&!browsingCategories)mountSD();
  for(int r=0;r<6&&!none;r++) {
    int at=page*6+r;if(at>=count)continue;
    if(browsingCategories){int c=categorySlots[at];
      if(!category&&c==CONTINUE_SLOT){int g=resumeGame();uint8_t*raw=nullptr;if(g>=0){if(games[g].sd&&haveSD)mountSD();raw=preview(games[g]);}pk::continueTile(tft,scr::W,r,raw,resumeRec.e.level,g<0,true);free(raw);}
      else pk::tileLabel(tft,scr::W,r,category?subLabel(category,c):rootLabel(c),false,tileIcon(category,c),true);}
    else {int i=catalog->matches[at];pk::Meta m;gameMeta(games[i],m);uint8_t*raw=preview(games[i]);bool starter=games[i].category==1;pk::thumbnail(tft,scr::W,r,raw,m.dos,i==selected,true,catalog->pins.has(games[i].uid),starter?m.title:nullptr,starter?m.course:0);free(raw);}
  }
  if(!was)unmountSD();
  if(!count&&searchText[0])pk::drawSmallIcon(tft,17,16,68,true);
  if(none&&pk::drawEmptyNotice(tft,scr::W,cardState,cardGames())){}
  else if(!count&&category==pk::CAT_FAVORITES&&!searchText[0])pk::emptyFavorites(tft,scr::W,catalog->pins.n>0);
  else if(!count){tft.setTextColor(C_WHITE,C_BLACK);tft.setTextSize(1);tft.setCursor(16,90);tft.print(searchText[0]?"No matching titles":"No games found");}
  if(uidConflict){tft.setTextColor(C_YELLOW,C_BLACK);tft.setTextSize(1);tft.setCursor(4,188);tft.print("UID conflict: first copy kept");}
  if(catalogOverflow){tft.setTextColor(C_YELLOW,C_BLACK);tft.setTextSize(1);tft.setCursor(4,198);tft.print("Library limit: 512 games / 24 collections");}
  Serial.printf("LIB page ms=%lu catalog=%u free=%u largest=%u\n",(unsigned long)(millis()-t),(unsigned)sizeof(pk::Catalog),(unsigned)ESP.getFreeHeap(),(unsigned)heap_caps_get_largest_free_block(MALLOC_CAP_8BIT));
}
static void drawSearch() {
  tft.fillScreen(C_BLACK);pk::drawKeyboard(tft,scr::W,scr::H,32,searchText);
  pk::drawButton(tft,0,0,40,32,"<");
  pk::drawButton(tft,42,0,scr::W,32,searchAll?"All games":"This category");
  pk::drawSmallIcon(tft,searchAll?0:18,50,8,true);
}
static int detailsMask = 0;  // the selected game's own pages (picker.h detailsPageSpan), read from its .cfg when Details opens
static void drawDetails() {
  tft.fillScreen(C_BLACK);title("Game details");
  pk::Meta m;gameMeta(games[selected],m);
  pk::Tile clip={8,40,scr::W-16,pk::detailsPagesTop(scr::H)-44,0,0};
  size_t at=0,n=strlen(m.title);int y=44,cols=(scr::W-16)/6;
  while(at<n){char b[81];size_t take=n-at<(size_t)cols?n-at:cols;memcpy(b,m.title+at,take);b[take]=0;pk::clippedText(tft,clip,b,8,y,1,C_WHITE);at+=take;y+=12;}
  bool pinned=catalog&&catalog->pins.has(games[selected].uid);
  pk::detailsPages(tft,scr::W,scr::H,detailsMask);
  pk::detailsFooter(tft,scr::W,scr::H,pinned);if(pinned)pk::detailsNote(tft,scr::W,scr::H,"In Favorites");
}
// A short rising beep to hear the volume with (36 steps of 1/145.6 s, little endian frequencies in Hz).
static const uint8_t SAMPLE_TUNE[72] = {
    0xB8, 0x01, 0xB8, 0x01, 0xB8, 0x01, 0xB8, 0x01, 0xB8, 0x01, 0xB8, 0x01, 0xB8, 0x01, 0xB8, 0x01, 0xB8, 0x01,
    0x30, 0x02, 0x30, 0x02, 0x30, 0x02, 0x30, 0x02, 0x30, 0x02, 0x30, 0x02, 0x30, 0x02, 0x30, 0x02, 0x30, 0x02,
    0x88, 0x02, 0x88, 0x02, 0x88, 0x02, 0x88, 0x02, 0x88, 0x02, 0x88, 0x02, 0x88, 0x02, 0x88, 0x02, 0x88, 0x02,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
#ifdef POCKET_CYD28
static uint8_t panelType = PANEL_ILI9341, turnIdx = 0, softIdx = 0;  // softIdx 0: the glass's own landscape turn, 1 and 2: turned in software
static const char* panelName(char* b) {  // "ILI", "ST inv", "ILI inv bgr", ...
  snprintf(b, 16, "%s%s%s", (panelType & 1) ? "ST" : "ILI", (panelType & 2) ? " inv" : "", (panelType & 4) ? " bgr" : "");
  return b;
}
#endif
static void enterPicker();
// Settings, Card, Rescan: forget the cache, look at the card again, and show the list (its chip counts the games as they are found).
static void rescanCard() {
  cardScanKnown = false;
  stopCardScan();
  if (mountSD()) { SD.remove("/pocket/LIBRARY.CCH"); SD.remove("/pocket/LIBRARY.NEW"); unmountSD(); }
  probeCard();
  unmountSD();
  loadGameList();
  if (haveSD && cardState == pk::CARD_READING && !scanDone) { /* the loop's scan reads it */ }
  else scanDone = true;
  selected = -1;
  restoreSelection = false;
  browsingCategories = true;
  category = 0;
  subcategory = -1;
  page = 0;
  searchText[0] = 0;
  enterPicker();
}
// ---- the Settings screen: settingsdraw.h draws it and finds what a tap is on -----------------------------------------
static st::View setView;
static char cardSpace[40] = "";  // the Card tab's free-space line, measured once a visit
static uint8_t pvHeld = 0;       // the keys the preview's finger holds (bits as st::heldText)
static ctl::Need previewNeed() {
  ctl::Need n;
  n.left = n.right = n.up = n.down = n.space = n.enter = n.jump = true;
  return n;
}
static st::Values settingsValues() {
  st::Values v;
  v.s = settings; v.bright = brightStep; v.clicks = clicksOn; v.led = ledOn; v.smaller = smallerPicture;
  return v;
}
// The whole screen. On Controls the controls model is set up for the preview (a game sets it up again as it starts or resumes).
static void drawSettings() {
  st::CardInfo card;
  if (setView.tab == st::T_CARD) {
    card.builtIn = ngames - cardGames();
    pk::cardChipText(cardState, cardGames(), card.state, sizeof card.state);
    memcpy(card.space, cardSpace, sizeof card.space);
    st::sizeText(card.flash, sizeof card.flash, "Built-in", LittleFS.totalBytes() - LittleFS.usedBytes(), 0);
    card.fromPause = setView.fromPause;
  }
  if (setView.tab == st::T_CONTROLS) controls.configure(settings, previewNeed());
  pvHeld = 0;
  st::screen(tft, setView, settingsValues(), card, controls.L, controls.need, 0, 0, 0);
  banner::paint(tft, 0, 0);
}

static bool pausePinned = false;  // whether the paused game is a favorite (read from NVS as the game pauses)
static void drawPause() { ovl::pauseMenu(tft, cfg.title, world.level, pausePinned ? 1 : 0); }

static uint32_t t0 = 0, ticksRun = 0;
static int curGame = -1;
static bool fromPause = false;

static void applyControls() {
  ctl::Need need;
  for (int i = 0; i < cfg.nkeys; i++) ctl::needAdd(need, cfg.keys[i].scan, cfg.keys[i].label);
  if (!need.left && !need.right && !need.up && !need.down && !need.anyDiag()) need.left = need.right = true;  // a game that lists no keys still gets the walk keys
  if (!need.space && !need.enter && need.nextra == 0) need.space = true;
  controls.configure(settings, need);
}

// ---- between scenes: fades and cards -----------------------------------------------------------
// What PLAYGAME shows around play (README, "Between levels"): the screen fades out and in (FadeTo: 65 steps
// over 65/70 s, as many as the panel can draw in that time) and the pictures and text pages of the game's
// .lst files, drawn at 1.5x like the game. Taps move on wherever the engine waits for a key.

static bool cardsDry = false;   // the serial self-test: no waits, one drawing per fade
static bool readingPages = false;  // Details is showing the game's own pages: every wait is for a touch (paged by touch)
static int cardsShown = 0, cardsFailed = 0;
static void setPalette6(const uint8_t* p768) {
  for (int i = 0; i < 256; i++) {
    auto v8 = [](uint8_t c) { c &= 63; return (uint8_t)((c << 2) | (c >> 4)); };
    pal[i] = panel565(v8(p768[i * 3]), v8(p768[i * 3 + 1]), v8(p768[i * 3 + 2]));
  }
}
// A 320 x 200 picture of palette indices over the whole view, through `pal`.
static void pushPicture(const uint8_t* px) {
  carddraw::pushPicture(tft, px, pal, band, BAND);
}
// FadeTo from one palette (6 bit values) to another, each step drawn as the picture `px`, or as the playing
// level when px is null. The clock decides the step, as the engine's does, so a slow panel shows fewer steps.
static void fadePalette(const uint8_t* from, const uint8_t* to, const uint8_t* px) {
  uint8_t mid[768];
  uint32_t start = cardsDry ? millis() - gm::FADE_MS : millis();
  for (;;) {
    uint32_t el = millis() - start;
    int step = el >= (uint32_t)gm::FADE_MS ? gm::FADE_STEPS : (int)(el * gm::FADE_STEPS / gm::FADE_MS);
    gm::fadeColor(from, to, step, mid);
    setPalette6(mid);
    if (px) pushPicture(px);
    else drawRegion(0, 0, VIEW_W, VIEW_H);
    if (step >= gm::FADE_STEPS) break;
  }
}
// GetKey / PauseTimeKey: a touch (or the time) moves on. gm::PAUSE_KEY waits for the touch alone.
static void waitTap(int seconds) {
  if (seconds <= 0 || cardsDry) return;
  if (readingPages) seconds = gm::PAUSE_KEY;
  uint32_t end = millis() + (uint32_t)seconds * 1000u;
  wasDown = true;  // a finger still down from before is not a tap
  int tx, ty;
  for (;;) {
    uint32_t now = millis();
    pollTouch(now);
    if (freshTap(tx, ty)) break;
    if (seconds != gm::PAUSE_KEY && (int32_t)(now - end) >= 0) return;
    delay(5);
  }
  for (uint32_t until = millis() + 400; pts.n > 0 && millis() < until;) {  // let go before the game reads the touch
    delay(5);
    pollTouch(millis());
  }
  wasDown = true;
}
// Bytes [off, off + len) of data/cards.pak, where every card picture and text page is.
static uint8_t* readPak(size_t off, size_t len) {
  bool card = curFs == &SD, wasUp = sdUp;
  if (card && !mountSD()) return nullptr;
  uint8_t* p = nullptr;
  File f = curFs->open(curPak, "r");
  if (f && f.seek(off + curPakBase)) {
    p = (uint8_t*)malloc(len + 1);
    if (p && f.read(p, len) != len) { free(p); p = nullptr; }
  }
  if (f) f.close();
  if (card && !wasUp) unmountSD();
  return p;
}
static uint8_t* fontData = nullptr;  // 95 glyphs of 8 rows (data/font.bin), kept once read

// FLI::View: every frame once, c.color (the packed speed) vertical retraces (1/70 s) apart, one frame unpacked at a time
// (the table of frames, the 64 KB canvas and the frame in turn; never the whole file). A touch ends it early.
static void playFli(const gm::Card& c) {
  size_t tn = 0;
  uint8_t* table = gm::readCard(assets, readPak, c.file, &tn);
  uint8_t* buf = (uint8_t*)calloc(gm::PIC_BYTES, 1);  // 768 palette bytes, then the canvas
  if (!table || !buf) { free(table); free(buf); cardsFailed++; return; }
  setPalette6(buf);
  carddraw::clear(tft, pal[0]);
  uint32_t due = millis();
  bool tapped = false;
  int tx, ty;
  wasDown = true;
  for (int i = 0; i < c.more && !tapped; i++) {
    size_t n = 0;
    uint8_t* d = gm::fliFrameData(assets, readPak, table, tn, i, &n);
    if (!d) { cardsFailed++; break; }
    if (gm::fliApply(d, n, buf + 768, buf)) setPalette6(buf);
    free(d);
    pushPicture(buf + 768);
    cardsShown++;
    if (cardsDry) continue;
    due += (uint32_t)c.color * 1000u / 70u;
    while ((int32_t)(millis() - due) < 0) {
      pollTouch(millis());
      if (freshTap(tx, ty)) { tapped = true; break; }
      delay(2);
    }
  }
  free(table);
  free(buf);
  waitTap(c.pause);
}

// ShowGraphic for one scene slot (where: i<level>, x<level>, w, l): the pictures fade in from black, the text
// pages are written over the picture before them. A card that can't be read is left out (the engine cleared the screen).
static void showCards(const char* where) {
  bool cardWasUp = sdUp, card = curFs == &SD;
  if (card) mountSD();  // held while the cards show (the level's buffers are already freed)
  carddraw::clear(tft, pal[0]);
  gm::Card cards[gm::MAX_CARDS];
  int n = gm::cardsOfFile(cfgLines, assets.cfgName, where, cards, gm::MAX_CARDS);
  uint8_t* pic = nullptr;
  gm::Card picCard = {};  // the picture's card, to draw it again clean
  bool dirty = false;  // text is on the picture
  gm::TextRect previousText;
  uint8_t black[768];
  memset(black, 0, sizeof black);
  for (int i = 0; i < n; i++) {
    const gm::Card& c = cards[i];
    if (c.kind == 'g' || c.kind == 'p') {
      carddraw::clear(tft, pal[0]);
      free(pic);
      pic = gm::loadCardPicture(assets, readPak, c);
      dirty = false;
      previousText = gm::TextRect();
      if (!pic) { cardsFailed++; continue; }
      picCard = c;
      cardsShown++;
      fadePalette(black, pic, pic + 768);
      waitTap(c.pause);
    } else if (c.kind == 't' && pic) {
      if (!fontData) { size_t fn = 0; fontData = readFileIn(LittleFS, "", "font.bin", &fn); if (fontData && fn < 95 * 8) { free(fontData); fontData = nullptr; } }
      size_t tn = 0;
      uint8_t* t = gm::readCard(assets, readPak, c.file, &tn);
      if (!t || !fontData) { free(t); cardsFailed++; continue; }
      int pages = gm::textPageCount(t, tn);
      for (int pg = 0; pg < pages; pg++) {
        if (dirty) {  // the picture again, clean (Display_File restores the screen after each page and file)
          free(pic);
          pic = gm::loadCardPicture(assets, readPak, picCard);
          if (!pic) break;
        }
        setPalette6(pic);
        carddraw::textPage(tft, pic + 768, pal, band, BAND, fontData, t, tn, pg, c.color, c.more, true, previousText);
        dirty = true;
        cardsShown++;
        waitTap(c.pause);
      }
      free(t);
    }
  }
  free(pic);
  if (card && !cardWasUp) unmountSD();
}
// FadeAllTo black from what is on screen (the playing level).
static void fadeLevelOut() {
  uint8_t black[768];
  memset(black, 0, sizeof black);
  fadePalette(assets.pal, black, nullptr);
  carddraw::clear(tft, pal[0]);
}
// The level just entered fades in from black, then the controls and strip come on.
static void fadeLevelIn() {
  uint8_t black[768];
  memset(black, 0, sizeof black);
  carddraw::clear(tft, 0);
  fadePalette(black, assets.pal, nullptr);
  assets.palChanged = false;
  setPalette6(assets.pal);
  last.valid = false;
  drawFrame(true);
  drawStrip();
}
static void levelWhere(char* out, char kind, int level) { snprintf(out, 8, "%c%d", kind, level); }

static bool cardPresent() { bool was = sdUp, ok = mountSD(); if (!was) unmountSD(); return ok; }
// A start that failed: say why (failWhy), and free every buffer the attempt took (the assets, the world's blocks, the prefetched
// files, the card), so the list can load its catalog again. `missing` says a level buffer did not load.
static bool startFailed(bool missing) {
  failWhy = pk::whyFailed(activeGame.sd, !activeGame.sd || cardPresent(), missing, heap_caps_get_largest_free_block(MALLOC_CAP_8BIT));
  Serial.printf("SG fail %s: why %d free %u largest %u\n", activeGame.id, (int)failWhy, (unsigned)ESP.getFreeHeap(), (unsigned)heap_caps_get_largest_free_block(MALLOC_CAP_8BIT));
  assets.release();
  world.releaseAll();
  clearPrefetched();
  stopCardScan();
  loadBarOn = false;
  return false;
}
static void loadStep(int n) { if (loadBarOn) pk::drawLoadingBar(tft, scr::W, scr::H, n, 3); }

static bool startGame(int g, bool withCards = true, const gm::EntryState* from = nullptr) {
  curGame = g;
  if (games) activeGame = games[g];
  assets.release();  // whatever the last game (or a failed start) left; a card must be mounted with the heap at its emptiest
  assets.heroChr[0] = 0;
  clearPrefetched();
  if (!selectGame(activeGame)) return startFailed(false);
  if (withCards) noteRecent(activeGame.uid);  // a launch, before the level's memory is taken (the serial self-test leaves it alone)
  loadStep(1);
  snprintf(assets.cfgName, sizeof assets.cfgName, "%s.cfg", fileOf(activeGame));
  releaseCatalog();
  if (!gm::parseCfgFile(cfgLines, assets.cfgName, world, cfg)) return startFailed(false);
  loadStep(2);
  assets.attach(world, cfg, readFile, inflateRaw);
  assets.lines = &cfgLines;
  assets.beforeLoad = prefetchLevel;
  assets.palName[0] = 0;
  loadStep(3);
  loadBarOn = false;  // the intro card takes the screen
  if (withCards) {  // the intro card shows before the level's files load: a card needs a 64 KB block of its own
    char where[8];
    levelWhere(where, 'i', from ? from->level : 0);
    tft.fillScreen(C_BLACK);
    showCards(where);
  }
  world.seed = micros() ^ (millis() << 7);  // the monsters that wander pick differently each play
  if (from ? !world.restore(*from) : !world.begin()) {
    Serial.printf("SG fail %s: nbl %d nmon %d nmbl %d have bbl%d mbl%d cbl%d chr%d mon%d free %u largest %u\n", activeGame.id, assets.files.nbl, assets.files.nmon, assets.files.nmbl, !!assets.bbl, !!assets.mbl, !!assets.cbl, !!assets.chr, !!assets.mon, (unsigned)ESP.getFreeHeap(), (unsigned)heap_caps_get_largest_free_block(MALLOC_CAP_8BIT));
    return startFailed((assets.files.nbl && !assets.bbl) || !assets.cbl || !assets.chr || (assets.files.nmon && (!assets.mon || !assets.mbl)));
  }
  world.nsnd = 0;
  spk::stop();
  for (int i = 0; i < 256; i++) {
    auto v8 = [](uint8_t c) { c &= 63; return (uint8_t)((c << 2) | (c >> 4)); };
    pal[i] = panel565(v8(assets.pal[i * 3]), v8(assets.pal[i * 3 + 1]), v8(assets.pal[i * 3 + 2]));
  }
  assets.palChanged = false;
  applyControls();
  world.hold = withCards;  // a level change waits for the fade and the cards (the serial self-test has none)
  if (withCards) {
    resumeSave(activeGame);  // the serial self-test leaves the resume point alone
    fadeLevelIn();
  } else {
    tft.fillScreen(C_BLACK);
    last.valid = false;
    drawFrame(true);
    drawStrip();
  }
  t0 = millis();
  ticksRun = 0;
  mode = PLAYING;
  return true;
}
static void refreshPalette() {
  if (!assets.palChanged) return;
  assets.palChanged = false;
  for (int i = 0; i < 256; i++) {
    auto v8 = [](uint8_t c) { c &= 63; return (uint8_t)((c << 2) | (c >> 4)); };
    pal[i] = panel565(v8(assets.pal[i * 3]), v8(assets.pal[i * 3 + 1]), v8(assets.pal[i * 3 + 2]));
  }
}

static void enterPicker() {
  spk::stop();
  stopCardScan();
  if (!catalog) { assets.release(); world.releaseAll(); loadGameList(); restoreSelection=true; }
  mode = PICKER;
  wasDown = true;
  drawPicker();
}
// Details for the selected game: which of its own pages (title, story, instructions) its .cfg has, then the screen.
static void openDetails() {
  stopCardScan();
  char name[24];
  snprintf(name, sizeof name, "%s.cfg", fileOf(games[selected]));
  detailsMask = selectGame(games[selected]) ? gm::menuPagesOfFile(cfgLines, name) : 0;
  mode = DETAILS_SCREEN;
  drawDetails();
}
// Title, Story or Instructions from Details (k: 0, 1, 2): the game's own pictures and text pages, as its DOS menu showed them,
// each waiting for a touch. The catalog is let go first, as for a launch, so a 64 KB picture has the heap; then Details again.
static void readMenuPages(int k) {
  activeGame = games[selected];
  curGame = selected;
  if (!selectGame(activeGame)) { drawDetails(); return; }
  snprintf(assets.cfgName, sizeof assets.cfgName, "%s.cfg", fileOf(activeGame));
  assets.inflate = inflateRaw;  // before any game has played it is not set yet
  releaseCatalog();
  char where[2] = {pk::detailsPageWhere(k), 0};
  tft.fillScreen(C_BLACK);
  readingPages = true;
  showCards(where);
  readingPages = false;
  spk::stop();
  loadGameList();
  restoreSelection = true;
  selected = pk::selection(games, ngames, activeGame.uid);
  wasDown = true;
  if (selected < 0) { enterPicker(); return; }
  openDetails();
}

// A game or level that cannot load: the failure card (instead of a reset) until the button is tapped (or 30 seconds pass).
// Everything the attempt allocated is already freed (startFailed, levelFailed).
static void showFailCard(const char* name) {
  spk::stop();
  statusLed.load(false);
  statusLed.error(millis());
  ledWrite(millis());
  pk::drawFailCard(tft, scr::W, scr::H, name, failWhy);
  uint32_t t = millis();
  wasDown = true;
  while (millis() - t < 30000) {
    uint32_t now = millis();
    pollTouch(now);
    ledWrite(now);  // the blinks run while the card waits
    int x, y;
    if (freshTap(x, y) && pk::inFailButton(scr::W, scr::H, x, y)) break;
    delay(5);
  }
  wasDown = true;
}
// The title (or DOS name) of a game, for the loading screen and the failure card.
static void gameName(const GameEntry& g, char* out, size_t cap) {
  pk::Meta m;
  bool was = sdUp;
  if (haveSD) mountSD();
  bool ok = gameMeta(g, m);
  if (!was) unmountSD();
  snprintf(out, cap, "%s", ok && m.title[0] ? m.title : g.id);
}
// A tap on Play: the loading screen with its bar, the game, or the failure card. False: back to the list.
static bool launchGame(int g, const gm::EntryState* from = nullptr) {
  char name[96];
  gameName(games[g], name, sizeof name);
  pk::drawLoading(tft, scr::W, scr::H, name, 0, 3);
  loadBarOn = true;
  statusLed.load(true);
  ledWrite(millis());
  bool started = startGame(g, true, from);
  statusLed.load(false);
  if (started) return true;
  loadBarOn = false;
  showFailCard(name);
  return false;
}
// The level the game is entering did not load (a file, the memory, or the card went away): free it and show the card.
static void levelFailed() {
  failWhy = pk::whyFailed(activeGame.sd, !activeGame.sd || cardPresent(), true, heap_caps_get_largest_free_block(MALLOC_CAP_8BIT));
  Serial.printf("LV fail %s: why %d\n", activeGame.id, (int)failWhy);
  assets.release();
  world.releaseAll();
  clearPrefetched();
  stopCardScan();
  char name[96];
  gameName(activeGame, name, sizeof name);
  showFailCard(name);
}

// ---- setup and loop ------------------------------------------------------------------------------

static void message(const char* a, const char* b = nullptr) {
  tft.fillScreen(C_BLACK);
  tft.setTextColor(C_WHITE, C_BLACK);
  tft.setTextSize(2);
  tft.setCursor(20, 120);
  tft.print(a);
  if (b) {
    char line[96];
    pk::ellipsize(b, line, sizeof line, (scr::W - 40) / 12);
    tft.setCursor(20, 150); tft.print(line);
  }
}
// Restart level (the pause menu): the level as it was entered (gmcore.h EntryState), at no cost of a life, with its
// intro cards as after a death.
static void restartLevel() {
  spk::stop();
  world.releaseAll();
  controls.reset();
  tft.fillScreen(C_BLACK);
  last.valid = false;
  drawFrame(true);
  fadeLevelOut();
  assets.release();
  char where[8];
  levelWhere(where, 'i', world.entry.level);
  showCards(where);
  if (!world.restartLevel()) { message("Could not load"); delay(1500); enterPicker(); return; }
  fadeLevelIn();
  t0 = millis();
  ticksRun = 0;
  mode = PLAYING;
  wasDown = true;
}

// ---- serial self-test ----------------------------------------------------------------------------
// "T <index> <ticks>" or "T all <ticks>" on Serial (115200), accepted only on the game list: loads each
// game the way a tap does, runs it with no input (drawing too), prints one "ST" line, then returns to the list.

static void pollSerial();
#ifdef POCKET_CYD28
// ---- the 2.8 inch board: touch calibration and the display driver --------------------------------------
// Three taps (touchcal.h) on crosses at the top left, top right and bottom left; the calibration is kept in NVS.
// Waits for a press and release; returns the median raw reading of the press. false: BOOT pressed or 60 s of nothing.
static void nextPanel();
#include "displaysetup_ui.h"
static bool waitRawTap(tc::Raw& out) {
  uint32_t end = millis() + 60000;
  wasDown = true;
  for (;;) {  // a finger still down from before does not count
    pollTouch(millis());
    if (pts.n == 0) break;
    delay(4);
    if ((int32_t)(millis() - end) >= 0) return false;
  }
  int xs[40], ys[40], n = 0;
  for (;;) {
    uint32_t now = millis();
    if (dsInjTake(out)) return true;
    if (digitalRead(0) == LOW || (int32_t)(now - end) >= 0) return false;
    pollTouch(now);
    if (pts.n > 0 && n < 40 && gt.fresh) { xs[n] = gt.rawX[0]; ys[n] = gt.rawY[0]; n++; }
    if (pts.n == 0 && n > 0) {
      if (n < 4) { n = 0; continue; }  // a brush, not a tap
      auto med = [](int* a, int m) {
        for (int i = 1; i < m; i++) for (int j = i; j > 0 && a[j - 1] > a[j]; j--) { int t = a[j]; a[j] = a[j - 1]; a[j - 1] = t; }
        return a[m / 2];
      };
      out = {med(xs, n), med(ys, n)};
      return true;
    }
    delay(4);
  }
}
// ONE target: a filled dot in a ring with a cross through it (thick, so it can't be mistaken for two). The screen is cleared
// first with clearAll() (the panel's whole memory), so no earlier target stays behind.
static void drawCross(int x, int y) {
  tft.fillCircle(x, y, 7, C_YELLOW);
  tft.drawCircle(x, y, 12, C_YELLOW);
  tft.drawCircle(x, y, 13, C_YELLOW);
  tft.fillRect(x - 20, y - 1, 41, 3, C_YELLOW);
  tft.fillRect(x - 1, y - 20, 3, 41, C_YELLOW);
}
// Three pips at the screen's center, the first n filled: how many taps are done (no reading needed).
static void calPips(int n) {
  for (int i = 0; i < 3; i++) {
    int x = scr::W / 2 - 20 + i * 20, y = scr::H / 2 + 30;
    if (i < n) tft.fillCircle(x, y, 6, C_WHITE); else tft.drawCircle(x, y, 6, C_WHITE);
  }
}
static void say(const char* a, const char* b) {
  tft.setTextSize(1);
  tft.setTextColor(C_WHITE, C_BLACK);
  tft.setCursor(60, 100);
  tft.print(a);
  tft.setCursor(60, 114);
  tft.print(b);
}
// Returns true after a good calibration was kept and tried out (Done), false when BOOT / a minute of waiting cancels.
static bool runCalibration() {
  const int M = tc::MARGIN;
  const int tx[3] = {M, scr::W - 1 - M, M}, ty[3] = {M, M, scr::H - 1 - M};
  for (;;) {
    tc::Raw r[3];
    for (int i = 0; i < 3; i++) {
      clearAll();
      drawCross(tx[i], ty[i]);
      calPips(i);
      char l[32];
      snprintf(l, sizeof l, "Tap the cross  %d of 3", i + 1);
      say(l, "(BOOT button cancels)");
      if (!waitRawTap(r[i])) return false;
      Serial.printf("cal tap %d raw %d,%d\n", i + 1, r[i].x, r[i].y);
    }
    tc::Cal c;
    if (!tc::solve(r[0], r[1], r[2], c)) {
      tft.fillScreen(C_BLACK);
      say("Those taps did not line up.", "Tap anywhere to try again.");
      tc::Raw dummy;
      if (!waitRawTap(dummy)) return false;
      continue;
    }
    XPT2046::setCal(c);
    Serial.printf("cal saved swap=%d u=%d..%d v=%d..%d\n", c.swap, c.u0, c.u1, c.v0, c.v1);
    // try it out: a dot follows the finger; Redo or Done
    tft.fillScreen(C_BLACK);
    say("Touch the screen: a dot follows.", "Done saves it. Redo starts over.");
    button(6, 198, 106, 238, "Redo");
    button(214, 198, 314, 238, "Done");
    uint32_t idle = millis();
    wasDown = true;
    for (;;) {
      uint32_t now = millis();
      pollTouch(now);
      tc::Raw ij;
      if (dsInjTake(ij)) {  // a serial "S tap" (testing): the same as a tap on Redo or Done
        int sx, sy;
        XPT2046::toScreen(ij.x, ij.y, sx, sy);
        if (sy >= 198 && sx >= 214) return true;
        if (sy >= 198 && sx < 106) break;
      }
      if (digitalRead(0) == LOW || now - idle > 45000) return true;  // the calibration is saved already
      if (pts.n > 0) {
        idle = now;
        int x = pts.x[0], y = pts.y[0];
        if (y >= 198 && freshTap(x, y)) {
          if (x >= 214) return true;
          if (x < 106) break;
        } else if (y < 198) tft.fillCircle(x, y, 3, C_WHITE);
      } else wasDown = false;
      delay(4);
    }
  }
}
// BOOT held (setup screen, or 2 s on the list): the other display driver, then a restart into setup step 1 (displaysetup_ui.h).
static void nextPanel() { dsDriverRestart(); }
#endif

static void selfTestOne(int g, int ticks, bool cards) {
  if (Serial.available()) pollSerial();  // a banner line from the script (the new text shows with this game's first frame)
  bool ok = startGame(g, false);
  for (int i = 0; ok && i < ticks; i++) {
    world.tick();
    world.nsnd = 0;
    if (assets.palChanged) { refreshPalette(); last.valid = false; }
    drawFrame(false);
    if ((i & 15) == 0) delay(1);  // let the watchdog and idle task breathe
  }
  Serial.printf("ST id=%s ok=%d free=%u largest=%u min=%u stack=%u\n", activeGame.id, ok ? 1 : 0, (unsigned)ESP.getFreeHeap(),
                (unsigned)heap_caps_get_largest_free_block(MALLOC_CAP_8BIT), (unsigned)ESP.getMinFreeHeap(),
                (unsigned)uxTaskGetStackHighWaterMark(nullptr));
  if (ok && cards) {
    // Every card of the game, the way play shows them (no waiting, one drawing per fade), with the level still loaded.
    assets.release();
    cardsDry = true;
    cardsShown = cardsFailed = 0;
    uint32_t t0c = millis();
    char where[8];
    for (int l = 0; l < world.nlevels; l++) {
      levelWhere(where, 'i', l);
      showCards(where);
      levelWhere(where, 'x', l);
      showCards(where);
    }
    showCards("w");
    showCards("l");
    cardsDry = false;
    Serial.printf("SC id=%s ok=%d shown=%d failed=%d ms=%u free=%u largest=%u min=%u stack=%u\n", activeGame.id, cardsFailed == 0 ? 1 : 0, cardsShown,
                  cardsFailed, (unsigned)(millis() - t0c), (unsigned)ESP.getFreeHeap(), (unsigned)heap_caps_get_largest_free_block(MALLOC_CAP_8BIT),
                  (unsigned)ESP.getMinFreeHeap(), (unsigned)uxTaskGetStackHighWaterMark(nullptr));
  }
  spk::stop();
  world.releaseAll();
  assets.release();
  loadGameList();
  while(haveSD&&!scanDone) { scanCardBatch(); delay(1); }
}

static void serialCommand(const char* cmd) {
  char what[16], opt[8] = "";
  int ticks = 0;
  if (sscanf(cmd, "T %15s %d %7s", what, &ticks, opt) < 2 || ticks < 0) return;
  bool cards = !strcmp(opt, "cards");
  if (!strcmp(what, "all")) {
    for (int g = 0; g < ngames; g++) selfTestOne(g, ticks, cards);
    Serial.printf("ST done n=%d\n", ngames);
  } else {
    int g = atoi(what);
    if (g < 0 || g >= ngames) { Serial.println("ST error index"); return; }
    selfTestOne(g, ticks, cards);
    Serial.println("ST done n=1");
  }
  enterPicker();
}

// "W <name> <bytes>" on Serial (list screen only): writes the next <bytes> bytes to /pocket/<name> on the card, 256 at a time, the
// board answering "GO", then "." after each piece, then "OK" or "ERR ..." (web/scripts/pocketSdWrite.py sends a card's files this
// way when there is no card reader at hand). Never used in play.
static void serialWrite(const char* cmd) {
  char name[24];
  unsigned long len = 0;
  stopCardScan();
  if (!haveSD || !mountSD()) { Serial.println("ERR no card"); return; }
  if (sscanf(cmd, "W %23s %lu", name, &len) != 2 || strchr(name, '/')) { Serial.println("ERR args"); return; }
  SD.mkdir("/pocket");
  char path[40];
  snprintf(path, sizeof path, "/pocket/%s", name);
  SD.remove(path);
  File f = SD.open(path, FILE_WRITE);
  if (!f) { Serial.println("ERR open"); return; }
  Serial.println("GO");
  uint8_t buf[256];
  unsigned long got = 0;
  uint32_t last = millis();
  while (got < len) {
    size_t want = len - got < sizeof buf ? len - got : sizeof buf, k = 0;
    while (k < want && millis() - last < 5000) {
      int c = Serial.read();
      if (c < 0) { delay(1); continue; }
      buf[k++] = (uint8_t)c;
      last = millis();
    }
    if (k < want || f.write(buf, k) != k) { f.close(); Serial.println("ERR write"); return; }
    got += k;
    Serial.print('.');
  }
  f.close();
  Serial.println("OK");
}

// The screen after the banner came, changed or went: the list and the settings repaint (they paint it themselves), the
// game redraws everything in its next frame, and a pause menu repaints over the game.
static void bannerChanged(bool changed) {
  if (!changed) return;
  switch (mode) {
    case PICKER: drawPicker(false); break;
    case SETTINGS_SCREEN: drawSettings(); break;
    case SEARCH_SCREEN: drawSearch(); break;
    case PLAYING: last.valid = false; break;
    case PAUSED: tft.fillScreen(C_BLACK); last.valid = false; drawFrame(true); drawStrip(); drawPause(); break;
    case HELP_SCREEN: ovl::helpPage(tft, cfg); break;
    default: break;
  }
}

/** "S st", "S tap …" and the other display-setup words go to the setup; any other "S <text>" is the test banner. */
static bool isSetupCommand(const char* buf) {
  static const char* const words[] = {"st", "tap", "btn", "boot", "skip", "open", "forget"};
  for (const char* w : words) {
    size_t n = strlen(w);
    if (!strncmp(buf + 2, w, n) && (buf[2 + n] == 0 || buf[2 + n] == ' ')) return true;
  }
  return false;
}

static void pollSerial() {
  static char buf[48];
  static int n = 0;
  while (Serial.available()) {
    char c = (char)Serial.read();
    banner::st.seen = millis();
    if (c == '\n' || c == '\r') {
      buf[n] = 0;
      n = 0;
      if (buf[0] == 'S' && isSetupCommand(buf)) {
#ifdef POCKET_CYD28
        dsSerial(buf);
#endif
      } else if (buf[0] == 'S' && buf[1] == '2' && buf[2] == ' ') {  // the big banner, for filming
        bannerChanged(banner::set(!strncmp(buf, "S2 off", 6) ? "" : buf + 3, true));
      } else if (buf[0] == 'S') {
        bannerChanged(banner::set(!strncmp(buf, "S off", 5) ? "" : buf + 2));
      } else if (fwSerial(buf)) {
      } else if (buf[0] == 'I' && buf[1] == 'D') {
        bannerChanged(banner::setId(!strncmp(buf, "ID off", 6) ? "" : buf + 3));
      } else if (buf[0] == 'V') traceOn = buf[2] == '1';
      else if (buf[0] == 'I') {
        int x, y;
        injOn = sscanf(buf, "I %d %d", &x, &y) == 2;
        if (injOn) { injX = x; injY = y; }
      } else if (buf[0] == 'G' && mode == PICKER) {
        int g = atoi(buf + 2);
        if (g >= 0 && g < ngames && startGame(g)) wasDown = true;
        Serial.printf("G %d %s %s\n", g, g >= 0 && g < ngames ? activeGame.id : "?", mode == PLAYING ? "playing" : "failed");
      } else if (buf[0] == 'L' && mode == PICKER) {  // the game list: "L <index> <id> <on the card 0|1>" per game, then "L done <count>"
        for (int g = 0; g < ngames; g++) Serial.printf("L %d %s %d\n", g, games[g].id, games[g].sd ? 1 : 0);
        Serial.printf("L done %d\n", ngames);
      } else if (buf[0] == 'T' && mode == PICKER) serialCommand(buf);
      else if (buf[0] == 'W' && mode == PICKER) serialWrite(buf);
    } else if (n < (int)sizeof buf - 1) buf[n++] = c;
  }
}

void setup() {
  Serial.begin(115200);
  Serial.printf("BOOT ms=%lu start\n", (unsigned long)millis());
  fwBoardLoad();
  Serial.printf("FW board=%s git=%s date=%s env=%s built=%s %s\n", boardName, FW_GIT, FW_DATE, FW_ENV, __DATE__, __TIME__);
  banner::configure(scr::W, scr::SMALL ? 28 : 40);  // the 320 px bar must stay clear of the MENU and KEYS chips
#ifdef POCKET_CYD28
  for (int pin : {PIN_LED_R, PIN_LED_G, PIN_LED_B}) { pinMode(pin, OUTPUT); digitalWrite(pin, HIGH); }  // the RGB LED is active low
  ledcSetup(6, 5000, 8);  // green is dimmed with LEDC channel 6 (inverted: 255 is off)
  ledcAttachPin(PIN_LED_G, 6);
  ledcWrite(6, 255);
  pinMode(0, INPUT_PULLUP);  // BOOT
  dsBoot();  // chip id, the saved display setup (NVS, else this chip's file on the card)
  tftHw.choose(panelType);
#endif
  tftHw.init();
#ifdef POCKET_CYD28
  tft.setBandBuffer(tband);
  applyDisplay();
#else
  tftHw.setRotation(1);
#endif
  tftHw.setBrightness(255);
  tftHw.setSwapBytes(false);
#ifdef POCKET_CYD28
  haveGT = gt.probe();
  if (dsState != 3) runDisplaySetup();  // first start (or one left unfinished): the display setup screen
#endif
  pk::drawSplash(tft, scr::W, scr::H, true);  // the Sandbox logo first; the picker replaces it once the list is loaded
  pk::splashLine(tft, scr::W, scr::H, "Starting up");
  spk::begin();
  haveGT = gt.probe();
  char line[64];
#ifdef POCKET_CYD28
  if (haveGT) snprintf(line, sizeof line, "Touch: XPT2046 (%s)", XPT2046::calibrated() ? "calibrated" : "not calibrated");
  else snprintf(line, sizeof line, "Touch: no XPT2046 found");
  {
    char nb[16];
    Serial.printf("display mode %s turn %d soft %d\n", panelName(nb), turnIdx + 1, softIdx);
  }
#else
  if (haveGT) snprintf(line, sizeof line, "Touch: GT911 at 0x%02X", gt.addr);
  else snprintf(line, sizeof line, "Touch: no GT911 found");
#endif
  Serial.println(line);
  if (!LittleFS.begin(false)) {
    message("LittleFS mount failed");
    for (;;) delay(1000);
  }
  loadSettings();
  applyBacklight();  // the saved brightness (the first screens above came up at full)
  statusLed.enabled = ledOn;
  resumeLoad();
  spk::setVolume(settings.sound);
  pk::splashLine(tft, scr::W, scr::H, "Looking for games");
  loadGameList();
  Serial.printf("BOOT ms=%lu list-loaded games=%d\n", (unsigned long)millis(), ngames);
  if (!ngames) Serial.println("BOOT no flash games: card discovery is pending");

  Serial.printf("ready: %d games (microSD %s), heap %u, largest %u\n", ngames, haveSD ? "in" : "out", (unsigned)ESP.getFreeHeap(), (unsigned)heap_caps_get_largest_free_block(MALLOC_CAP_8BIT));
  enterPicker();
  Serial.printf("BOOT ms=%lu picker-ready games=%d\n", (unsigned long)millis(), ngames);
}

static void applyKeys(uint32_t now) {
  ctl::Change ch[16];
  int n = controls.flush(ch, 16);
  for (int i = 0; i < n; i++) world.key(ch[i].scan, ch[i].down);
  (void)now;
}

// ---- Settings: what a chip does, the Card tab's free space, the preview's touches -----------------------------------------
// The card is mounted only here, and never under a paused game (its files may be open): the line says so instead.
static void measureCard() {
  if (setView.fromPause) { snprintf(cardSpace, sizeof cardSpace, "Free space: see it from the game list"); drawSettings(); return; }
  if (cardState == pk::CARD_NONE) { snprintf(cardSpace, sizeof cardSpace, "Card: none in the slot"); drawSettings(); return; }
  snprintf(cardSpace, sizeof cardSpace, "Card: measuring free space...");
  drawSettings();
  if (mountSD()) {
    uint64_t total = SD.totalBytes(), used = SD.usedBytes();
    unmountSD();
    st::sizeText(cardSpace, sizeof cardSpace, "Card", total - used, total);
  } else snprintf(cardSpace, sizeof cardSpace, "Card: could not be read");
  drawSettings();
}
static void openSettings(bool paused) {
  setView = st::View();
  setView.fromPause = fromPause = paused;
  cardSpace[0] = 0;
  mode = SETTINGS_SCREEN;
  drawSettings();
}
// A chip: an action runs, a value is chosen (its effect is heard or seen at once) and the row's hint shows under the preview.
// Everything is saved once, on Back (or before an action leaves the screen).
static void chooseSetting(st::Item it, int chip) {
  switch (it) {
    case st::I_RESCAN:
      if (!fromPause) { saveSettings(); rescanCard(); return; }
      drawSettings();
      return;
#ifdef POCKET_CYD28
    case st::I_CAL: saveSettings(); if (runCalibration()) dsCalDone(); drawSettings(); return;
    case st::I_PANEL: saveSettings(); runDisplaySetup(); drawSettings(); return;
#endif
    default: break;
  }
  st::Values v = settingsValues();
  st::choose(it, chip, v);
  settings = v.s; brightStep = v.bright; clicksOn = v.clicks; ledOn = v.led;
  if (v.smaller != smallerPicture) { smallerPicture = v.smaller; last.valid = false; }
  if (it == st::I_SOUND) { spk::setVolume(settings.sound); spk::play(SAMPLE_TUNE); }
  if (it == st::I_BRIGHT) applyBacklight();
  if (it == st::I_LED) statusLed.enabled = ledOn;
  setView.last = it;
  drawSettings();
}
// The Card tab's bottom line: where the glass says a finger is (raw, then screen, and the contact size), for checking a board.
static void touchInfo() {
  const int y = scr::H - 12;
  tft.fillRect(0, y - 2, scr::W, 12, C_BLACK);
  tft.setTextSize(1);
  tft.setTextColor(C_GRAY, C_BLACK);
  tft.setCursor(6, y);
  char l[64];
  if (pts.n) snprintf(l, sizeof l, "Touch: raw %d,%d > screen %d,%d size %d", gt.rawX[0], gt.rawY[0], pts.x[0], pts.y[0], pts.size[0]);
  else snprintf(l, sizeof l, "Touch: none");
  l[(scr::W - 12) / 6] = 0;
  tft.print(l);
}
// Touches on the preview go to the real controls model, scaled up to the game view; what it presses lights up.
static void previewTouch(uint32_t now) {
  st::Box b = st::previewBox();
  int ids[5], xs[5], ys[5], sz[5], n = 0;
  for (int i = 0; i < pts.n && n < 5; i++)
    if (b.has(pts.x[i], pts.y[i])) {
      ids[n] = pts.id[i];
      xs[n] = (pts.x[i] - b.x0) * st::G.pvDen / st::G.pvNum;
      ys[n] = (pts.y[i] - b.y0) * st::G.pvDen / st::G.pvNum;
      sz[n] = pts.size[i];
      n++;
    }
  uint8_t d0 = controls.padDirs, b0 = controls.btnDown, h0 = pvHeld;
  controls.update(ids, xs, ys, sz, n, now);
  controls.takeEvent();  // the little MENU chip does nothing here
  ctl::Change ch[16];
  int k = controls.flush(ch, 16);
  for (int i = 0; i < k; i++) {
    int s = ch[i].scan;
    uint8_t bit = s == ctl::S_LEFT ? 1 : s == ctl::S_RIGHT ? 2 : s == ctl::S_UP ? 4 : s == ctl::S_DOWN ? 8 : s == ctl::S_SPACE ? 16 : s == ctl::S_ENTER ? 32 : 0;
    if (ch[i].down) pvHeld |= bit;
    else pvHeld &= ~bit;
  }
  if (controls.padDirs != d0 || controls.btnDown != b0 || pvHeld != h0) {
    st::preview(tft, controls.L, controls.need, controls.padDirs, controls.btnDown);
    st::previewNote(tft, setView, pvHeld);
  }
}

// ---- buttons that act on release, and the idle timer -----------------------------------------------
static prs::Press press;
static pk::CardState lastCardState = pk::CARD_UNKNOWN;
static prs::Ctx ctxFor(prs::Screen sc) {
  prs::Ctx c;
  c.screen = sc;
  c.W = scr::W;
  c.H = scr::H;
  c.titleH = TITLE_H;
  if (sc == prs::SC_PICKER) {
    int count = browsingCategories ? categoryCount : nmatch, pages = (count + 5) / 6;
    c.back = !(browsingCategories && !category && !searchText[0]);
    c.prev = page > 0;
    c.next = page + 1 < pages;
    c.action = (searchText[0] && !nmatch) || (selected >= 0 && selected < ngames && !browsingCategories);
    c.tiles = count - page * 6 < 0 ? 0 : count - page * 6 > 6 ? 6 : count - page * 6;
  } else if (sc == prs::SC_DETAILS) {
    c.pages = detailsMask;
  } else if (sc == prs::SC_SETTINGS) {
    c.settings = setView;
  } else if (sc == prs::SC_DISPLAY) {
#ifdef POCKET_CYD28
    c.displayRows = 2;
#endif
  }
  return c;
}
static void redrawMenu(prs::Screen sc) {
  switch (sc) {
    case prs::SC_PICKER: drawPicker(false); break;
    case prs::SC_DETAILS: drawDetails(); break;
    case prs::SC_DISPLAY: break;  // the Display tab is part of Settings now
    case prs::SC_SETTINGS: drawSettings(); break;
    case prs::SC_PAUSE: drawPause(); break;
  }
}
// A tap on a library, settings or pause button: the button shows pressed on touch-down and the tap counts when the finger lifts on
// it; sliding off cancels. Returns true once, with the position the touch began at.
static bool menuTap(prs::Screen sc, int& tx, int& ty) {
  prs::Ctx c = ctxFor(sc);
  uint32_t now = millis();
  prs::Ev e = press.update(now, pts.n > 0, pts.n ? pts.x[0] : 0, pts.n ? pts.y[0] : 0, [&](int x, int y, prs::Rect& r) { return prs::under(c, x, y, r); });
  if (e == prs::PRESS) {
    if (sc == prs::SC_PAUSE) prs::drawPausePressed(tft, ovl::pauseHit(press.dx, press.dy));
    else prs::drawPressed(tft, press.r);
  }
  else if (e == prs::CANCEL) redrawMenu(sc);
  else if (e == prs::ACT) {
    uint32_t wait = press.showLeft(now);
    if (wait) delay(wait);  // a very short tap still shows its pressed look
    tx = press.dx;
    ty = press.dy;
    clickSound();
    return true;
  }
  return false;
}
static void pauseGame() {
  spk::stop();
  world.releaseAll();
  applyKeys(millis());
  controls.reset();
  mode = PAUSED;
  pausePinned = storedFavorite(activeGame.uid);
  drawPause();
  wasDown = true;
}
#ifdef POCKET_LIGHT_SLEEP
// Optional (build with -DPOCKET_LIGHT_SLEEP): while the screen is off, sleep the CPU in 250 ms naps, woken early by the touch
// interrupt (XPT2046 IRQ on the 2.8 inch board, GT911 INT on the 3.5 inch) or a serial byte. Not proved on either board.
#include <esp_sleep.h>
#include <driver/uart.h>
#include <driver/gpio.h>
static void napUntilTouch() {
#ifdef POCKET_CYD28
  const gpio_num_t irq = (gpio_num_t)PIN_XIRQ;
#else
  const gpio_num_t irq = (gpio_num_t)21;
#endif
  Serial.flush();
  gpio_wakeup_enable(irq, GPIO_INTR_LOW_LEVEL);
  esp_sleep_enable_gpio_wakeup();
  uart_set_wakeup_threshold(UART_NUM_0, 3);
  esp_sleep_enable_uart_wakeup(UART_NUM_0);
  esp_sleep_enable_timer_wakeup(250000);
  esp_light_sleep_start();
}
#endif

void loop() {
  uint32_t now = millis();
  pollTouch(now);
  int tx, ty;
  {  // the idle timer: dim, off, wake (the waking touch is swallowed) and, in a game, the auto-pause
    static Mode seenMode = PICKER;
    bool serialAct = Serial.available() > 0, bootAct = false;
#ifdef POCKET_CYD28
    bootAct = digitalRead(0) == LOW;
#endif
    if (mode != seenMode) { seenMode = mode; idleM.bump(now); press.screenChanged(pts.n > 0); }
    idle::Act a = idleM.update(now, pts.n > 0 && !injOn, serialAct || bootAct || injOn, mode == PLAYING);
    if (a == idle::DIM_NOW || a == idle::WAKE_NOW) applyBacklight();
    if (a == idle::OFF_NOW) {
      applyBacklight();
#ifdef POCKET_LIGHT_SLEEP
      tftHw.sleep();
#endif
    }
#ifdef POCKET_LIGHT_SLEEP
    if (a == idle::WAKE_NOW) tftHw.wakeup();
    if (idleM.state == idle::OFF && !Serial.available() && pts.n == 0) napUntilTouch();
#endif
    if (a == idle::AUTOPAUSE) { pauseGame(); return; }
    if (idleM.swallow(pts.n > 0)) pts.n = 0;
    if (idleM.state == idle::OFF) delay(50);  // screen off: touch is polled at about 20 Hz
    if (mode == PICKER && cardState != lastCardState) {
      lastCardState = cardState;
      if (cardState == pk::CARD_UNREADABLE || cardState == pk::CARD_NOFOLDER) statusLed.error(now);
    }
    statusLed.load(cardState == pk::CARD_READING && !scanDone && mode == PICKER);
    ledWrite(now);
  }
  if (Serial.available()) {
    Mode before = mode;
    pollSerial();
    if (mode != before) return;  // a G started a game
  }
  if (banner::shown() && ((pts.n > 0 && !injOn) || now - banner::st.seen > banner::IDLE_MS)) { bool a = banner::set(""), b = banner::setId(""); bannerChanged(a || b); }  // Lewis takes over, or the agent is gone

  if (mode == PICKER) {
    if(cardProbePending) {
      uint32_t t=millis();cardProbePending=false;probeCard();
      Serial.printf("BOOT card-mount ms=%lu present=%d\n",(unsigned long)(millis()-t),haveSD);
      if(haveSD&&cardState==pk::CARD_READING)addGames(SD,"/pocket",true);
      unmountSD();scanDone=cardState!=pk::CARD_READING;drawPicker(false);
    }
    if (scanCardBatch()) drawPicker(false);
#ifdef POCKET_CYD28
    {  // BOOT: a short press opens the display setup, 2 seconds changes the display mode (for a screen that is unreadable)
      static uint32_t bootT = 0;
      static bool bootActed = false;
      if (digitalRead(0) == LOW) {
        if (!bootT) bootT = now ? now : 1;
        if (!bootActed && now - bootT >= 2000) { bootActed = true; nextPanel(); }
      } else {
        if (bootT && !bootActed && now - bootT > 30) { bootT = 0; runDisplaySetup(); enterPicker(); return; }
        bootT = 0;
        bootActed = false;
      }
      if (dsOpenReq) { dsOpenReq = false; runDisplaySetup(); enterPicker(); return; }
    }
#endif
    if (menuTap(prs::SC_PICKER, tx, ty)) {
      int count=browsingCategories?categoryCount:nmatch,pages=(count+5)/6;
      if(ty<32) {
        if(tx>=scr::W-32){stopCardScan();openSettings(false);}
        else if(tx>=scr::W-64){stopCardScan();strcpy(savedSearch,searchText);savedAll=searchAll;savedBrowsing=browsingCategories;mode=SEARCH_SCREEN;drawSearch();}
        else if(tx<32&&!(browsingCategories&&!category&&!searchText[0])){  // the root page has no back arrow
          if(searchText[0])searchText[0]=0;
          else if(!browsingCategories&&(category==1||category==5||category==6)){browsingCategories=true;subcategory=-1;}
          else {browsingCategories=true;category=0;subcategory=-1;}page=0;selected=-1;drawPicker();
        }
      }else if(ty>=PK_BTN_Y) {
        if(tx<48&&page>0){page--;restoreSelection=false;selected=-1;drawPicker(false,true);}
        else if(tx>=50&&tx<98&&page+1<pages){page++;restoreSelection=false;selected=-1;drawPicker(false,true);}
        else if(tx>=scr::W-100){
          if(searchText[0]&&!nmatch){searchText[0]=0;drawPicker();}
          else if(selected>=0&&selected<ngames)openDetails();
        }
      }else {
        int slot=pk::hitTile(scr::W,tx,ty),at=page*6+slot;
        if(slot>=0&&at<count){
          if(browsingCategories&&!category&&categorySlots[at]==CONTINUE_SLOT){int g=resumeGame();if(g>=0){gm::EntryState e=resumeRec.e;if(!launchGame(g,&e)){resumeClear();enterPicker();}else wasDown=true;}}
          else if(browsingCategories){if(!category){category=categorySlots[at];subcategory=-1;browsingCategories=category==1||category==5||category==6;}else{subcategory=categorySlots[at];browsingCategories=false;}page=0;selected=-1;drawPicker();}
          else {int i=catalog->matches[at];if(selected!=i){restoreSelection=false;selected=i;drawPicker();}else{if(!launchGame(i))enterPicker();else wasDown=true;}}
        }
      }
    }
    delay(5);
    return;
  }
  if(mode==DETAILS_SCREEN){
    if(menuTap(prs::SC_DETAILS,tx,ty)){int b=pk::detailsButton(scr::W,tx),k=pk::detailsPageAt(scr::W,scr::H,detailsMask,tx,ty);
      if(k>=0)readMenuPages(k);
      else if(b==0){mode=PICKER;drawPicker();}
      else if(b==1){int r=toggleFavorite(games[selected].uid);drawDetails();pk::detailsNote(tft,scr::W,scr::H,pinMessage(r));}
      else{if(!launchGame(selected))enterPicker();else wasDown=true;}}delay(5);return;
  }
  if (mode == SEARCH_SCREEN) {
    if (freshTap(tx, ty)) {
      char previous[sizeof searchText];memcpy(previous,searchText,sizeof previous);
      int n=strlen(searchText),top=58,step=(scr::H-top-38)/4;
      if(ty<32){if(tx<40){strcpy(searchText,savedSearch);searchAll=savedAll;browsingCategories=savedBrowsing;mode=PICKER;drawPicker();return;}searchAll=!searchAll;drawSearch();}
      else if(ty>=scr::H-36){int b=tx*4/scr::W;if(b==0&&n<24){searchText[n]=' ';searchText[n+1]=0;}if(b==1&&n)searchText[n-1]=0;if(b==2)searchText[0]=0;if(b==3){page=0;selected=-1;browsingCategories=false;mode=PICKER;drawPicker();return;}}
      else if(ty>=top&&ty<top+4*step&&n<24){searchText[n]="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[(ty-top)/step*9+tx*9/scr::W];searchText[n+1]=0;}
      pk::drawSearchText(tft,32,searchText,previous);
    }delay(5);return;
  }
  if (mode == SETTINGS_SCREEN) {
    if (menuTap(prs::SC_SETTINGS, tx, ty)) {
      st::Hit h = st::hit(setView, tx, ty);
      switch (h.kind) {
        case st::K_BACK:
          saveSettings();
          if (fromPause) { applyControls(); mode = PAUSED; tft.fillScreen(C_BLACK); last.valid = false; drawFrame(true); drawStrip(); drawPause(); }
          else enterPicker();
          return;
        case st::K_TAB:
          if (h.tab != setView.tab) { setView.tab = (st::Tab)h.tab; setView.page = 0; setView.last = st::I_NONE; }
          drawSettings();
          if (setView.tab == st::T_CARD && !cardSpace[0]) measureCard();
          return;
        case st::K_MORE: setView.page = (setView.page + 1) % st::pages(setView.tab); drawSettings(); return;
        case st::K_CHIP: chooseSetting(h.item, h.chip); return;
        default: break;
      }
    }
    if (setView.tab == st::T_CONTROLS) previewTouch(now);
    static uint32_t infoT = 0;
    if (setView.tab == st::T_CARD && now - infoT > 100) { infoT = now; touchInfo(); }
    delay(5);
    return;
  }
  if (mode == PAUSED) {
    if (menuTap(prs::SC_PAUSE, tx, ty)) {
      switch (ovl::pauseHit(tx, ty)) {
        case ovl::PA_RESUME:
          mode = PLAYING; world.releaseAll(); controls.reset(); last.valid = false; drawFrame(true); drawStrip();
          t0 = millis(); ticksRun = 0; wasDown = true;
          break;
        case ovl::PA_RESTART_LEVEL: restartLevel(); break;
        case ovl::PA_RESTART_GAME: if (!launchGame(curGame)) enterPicker(); break;
        case ovl::PA_HELP: mode = HELP_SCREEN; ovl::helpPage(tft, cfg); wasDown = true; break;
        case ovl::PA_SETTINGS: openSettings(true); break;
        case ovl::PA_QUIT: enterPicker(); break;  // the resume point stays: Continue on the home page
        case ovl::PA_STAR: {  // star or unstar this game; the title line says what happened until the next redraw
          int r = toggleFavorite(activeGame.uid);
          if (r == pk::PIN_ADDED || r == pk::PIN_REMOVED) pausePinned = r == pk::PIN_ADDED;
          drawPause();
          const ovl::PauseGeom& p = ovl::PAUSE;
          int sx0, sy0, sx1, sy1;
          ovl::pauseCell(ovl::PA_STAR, sx0, sy0, sx1, sy1);
          tft.fillRect(p.x0, sy0 + 1, sx0 - 2 - p.x0, sy1 - sy0 - 2, C_BLACK);
          tft.setTextSize(1);
          tft.setTextColor(C_YELLOW, C_BLACK);
          tft.setCursor(p.x0, p.titleY);
          tft.print(pinMessage(r));
          break;
        }
        default: break;
      }
    }
    delay(5);
    return;
  }
  if (mode == HELP_SCREEN) {
    if (freshTap(tx, ty)) { mode = PAUSED; tft.fillScreen(C_BLACK); last.valid = false; drawFrame(true); drawStrip(); drawPause(); wasDown = true; }
    delay(5);
    return;
  }
  if (mode == DONE) {
    if (freshTap(tx, ty)) enterPicker();
    delay(5);
    return;
  }

  if (mode == PLAYING) pollSerial();  // V and I only act here
  // PLAYING: the contacts go through the controls model; its key changes go to the game.
  controls.update(pts.id, pts.x, pts.y, pts.size, pts.n, now);
  int ev = controls.takeEvent();
  if (ev == ctl::EV_MENU) {
    pauseGame();
    return;
  }
  if (ev == ctl::EV_KEYS) {
    last.valid = false;  // the key tiles come or go: draw everything again
  }
  applyKeys(now);

  // Game ticks run at 18.2 Hz; after a slow frame several run to catch up (at most 4).
  uint32_t due = (now - t0) * 182 / 10000;
  int ran = 0;
  uint32_t ts = millis();
  bool oneLevelUp = false;
  while (ticksRun < due && ran < 4) {
    int lv = world.level;
    if (traceOn) Serial.printf("K %lu tick=%lu up=%d down=%d left=%d right=%d space=%d pad=%d n=%d seq=%d frame=%d sugar=%d gx=%d gy=%d\n", (unsigned long)millis(), (unsigned long)ticksRun, world.held[ctl::S_UP], world.held[ctl::S_DOWN], world.held[ctl::S_LEFT], world.held[ctl::S_RIGHT], world.held[ctl::S_SPACE], controls.padDirs, pts.n, world.cseq, world.cframe, world.meter[3] - 1, world.gravx, world.gravy);
    char r = world.tick();
    if (world.nsnd && world.snd) spk::play(world.snd + world.sndQ[world.nsnd - 1] * 72);  // the effect heard is the last one started (a new one cuts the old)
    world.nsnd = 0;
    ticksRun++;
    ran++;
    if (world.level != lv) oneLevelUp = true;
    if (r == 'W' || r == 'D' || r == 'L') {
      // The engine's order: the screen fades out, the scene's exit cards, then (the next level's intro cards and
      // the fade in | the won or lost cards and back to the list).
      spk::stop();
      world.releaseAll();
      controls.reset();
      char where[8];
      int from = world.level;
      bool lost = r == 'D' && world.lives <= 0;
      fadeLevelOut();
      assets.release();  // the level's big buffers go while a card shows (the next level loads them again); a card needs a 64 KB block
      if (r == 'W') {
        resumeClear();
        levelWhere(where, 'x', from);
        showCards(where);
        showCards("w");
        enterPicker();
        return;
      }
      if (lost) {
        resumeClear();
        showCards("l");
        enterPicker();
        return;
      }
      if (r == 'L') {
        levelWhere(where, 'x', from);
        showCards(where);
      }
      levelWhere(where, 'i', r == 'D' ? from : world.pendLevel);
      showCards(where);
      if (!world.finish()) { levelFailed(); enterPicker(); return; }
      world.buildDrawList();
      resumeSave(activeGame);
      fadeLevelIn();
      t0 = millis();
      ticksRun = 0;
      wasDown = true;
      return;
    }
  }
  if (ticksRun + 4 < due) { t0 = millis(); ticksRun = 0; }  // far behind: drop the lost time
  if (ran) tickMsLast = (millis() - ts) / ran;
  if (oneLevelUp || assets.palChanged) { refreshPalette(); last.valid = false; }

  if (ran || !last.valid || controls.padDirs != lastPad || controls.btnDown != lastBtn || controls.tileDown != lastTile) {
    uint32_t ds = millis();
    drawFrame(false);
    drawMsLast = millis() - ds;
    frames++;
  }
  if (now - fpsT0 >= 1000) {
    fps = frames * 1000 / (now - fpsT0);
    frames = 0;
    fpsT0 = now;
  }
  if (now - stripT >= 300) {
    stripT = now;
    drawStrip();
  }
  delay(1);
}
