// Game-Maker Pocket Player for the ESP32-3248S035: a list of games (the Starters packed into LittleFS by
// web/scripts/pocketData.ts), the play loop (gmcore.h, also built and tested on the Mac), touch
// controls for fingers and a stylus (controls.h, also tested on the Mac), a settings screen, and a
// status strip. This file is the board: files, the panel, drawing 320x200 at 1.5x, the screens; sound is in speaker.h.
#include <Arduino.h>
#include <LittleFS.h>
#include <SD.h>
#include <SPI.h>
#include <esp_heap_caps.h>
#include <rom/miniz.h>
#include "board.h"
#include "controls.h"
#include "btnicon.h"
#include "gmcards.h"
#include "gmcfg.h"
#include "screen.h"
#ifdef POCKET_CYD28
#include "xpt2046.h"
using Touch = XPT2046;
#else
#include "gt911.h"
using Touch = GT911;
#endif
#include "speaker.h"

static LGFX tft;
static Touch gt;
static bool haveGT = false;
static gm::World world;
static gm::Cfg cfg;
static gm::Assets assets;
static ctl::Controls controls;
static ctl::Settings settings;
static uint16_t pal[256];  // panel byte order (high byte first)

constexpr int VIEW_W = scr::W, VIEW_H = scr::VIEW_H, BAND = 30;
static uint16_t band[VIEW_W * BAND];
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
// card are in /pocket (their files, <file>.cfg and <file>.pak; see "The microSD card" in README.md).
static fs::FS* curFs = &LittleFS;
static char curBase[10] = "";
static char curPak[24] = "/cards.pak";
static bool sdUp = false;
static bool mountSD();
static void unmountSD();
// The card is mounted only while a file is read from it (a mounted card holds about 33 KB of heap and splits the free blocks,
// which a level that fills the heap cannot spare), so a read of a card file is mount, read, unmount.
static uint8_t* readFileIn(fs::FS& fsys, const char* base, const char* name, size_t* n) {
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
// A game's .cfg text.
static bool readCfgText(const char* path, String& out);
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
  return readFileIn(*curFs, curBase, name, n);
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

struct GameEntry { char id[28]; char title[40]; int levels; bool sd; char file[12]; };  // file: the 8 character name of an SD game's .cfg and .pak
constexpr int MAXGAMES = 96;
static GameEntry games[MAXGAMES];
static int ngames = 0;
static bool haveSD = false;  // a card was found at start (it is mounted only while it is read: a mounted card holds about 33 KB of heap)
static SPIClass sdSpi(VSPI);
static bool mountSD() {
  if (sdUp) return true;
  sdSpi.begin(PIN_SD_SCLK, PIN_SD_MISO, PIN_SD_MOSI, PIN_SD_CS);
  sdUp = SD.begin(PIN_SD_CS, sdSpi, 20000000);
  if (!sdUp) sdSpi.end();
  return sdUp;
}
static void unmountSD() {
  if (!sdUp) return;
  SD.end();
  sdSpi.end();
  sdUp = false;
}

// Adds the games of a list file (lines id|title|levels, and for the card also |<file>) to the picker.
static void addGames(fs::FS& fsys, const char* base, bool sd) {
  size_t n = 0;
  uint8_t* t = readFileIn(fsys, base, "games.txt", &n);
  if (!t) return;
  t[n] = 0;
  char* p = (char*)t;
  while (*p && ngames < MAXGAMES) {
    char* e = strchr(p, '\n');
    if (e) *e = 0;
    GameEntry& g = games[ngames];
    char* a = strchr(p, '|');
    char* b = a ? strchr(a + 1, '|') : nullptr;
    char* c = b ? strchr(b + 1, '|') : nullptr;
    if (c) *c = 0;
    if (a && b && (!sd || c)) {
      *a = 0; *b = 0;
      strncpy(g.id, p, sizeof g.id - 1); g.id[sizeof g.id - 1] = 0;
      strncpy(g.title, a + 1, sizeof g.title - 1); g.title[sizeof g.title - 1] = 0;
      g.levels = atoi(b + 1);
      g.sd = sd;
      if (sd) { strncpy(g.file, c + 1, sizeof g.file - 1); g.file[sizeof g.file - 1] = 0; }
      else g.file[0] = 0;
      ngames++;
    }
    if (!e) break;
    p = e + 1;
  }
  free(t);
}
// The Starters from LittleFS, then (when a card is in) the games on it. With no card the list is the Starters alone.
static void loadGameList() {
  ngames = 0;
  addGames(LittleFS, "", false);
  if (haveSD && mountSD()) {
    addGames(SD, "/pocket", true);
    unmountSD();
  }
}
static const char* fileOf(const GameEntry& g) { return g.sd ? g.file : g.id; }  // the name of its .cfg (and .pak)
// Points the file readers at game g.
static bool selectGame(int g) {
  if (games[g].sd) {
    curFs = &SD;
    strcpy(curBase, "/pocket");
    snprintf(curPak, sizeof curPak, "/pocket/%s.pak", fileOf(games[g]));
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
  const gm::LevelFiles& L = cfg.lv[level];
  bool mons = L.nmon > 0;
  auto drop = [](uint8_t*& slot, char* have, const char* want) {
    if (slot && strcmp(have, want)) { free(slot); slot = nullptr; have[0] = 0; }
  };
  drop(assets.bbl, assets.bblName, L.bbl);
  drop(assets.cbl, assets.cblName, L.cbl);
  drop(assets.chr, assets.chrName, L.chr);
  if (mons) { drop(assets.mon, assets.monName, L.mon); drop(assets.mbl, assets.mblName, L.mbl); }
  if (L.snd[0]) drop(assets.snd, assets.sndName, L.snd);
  const char* want[8];
  int n = 0;
  if (!assets.bbl) want[n++] = L.bbl;
  if (!assets.cbl) want[n++] = L.cbl;
  if (!assets.chr) want[n++] = L.chr;
  if (strcmp(assets.palName, L.pal)) want[n++] = L.pal;
  if (mons && !assets.mon) want[n++] = L.mon;
  if (mons && !assets.mbl) want[n++] = L.mbl;
  if (L.snd[0] && !assets.snd) want[n++] = L.snd;
  want[n++] = L.map;
  if (!mountSD()) return;
  for (int i = 0; i < n; i++) {
    size_t len = 0;
    uint8_t* p = readFileIn(SD, curBase, want[i], &len);
    if (!p) continue;
    strncpy(pre[i].name, want[i], sizeof pre[i].name - 1);
    pre[i].name[sizeof pre[i].name - 1] = 0;
    pre[i].p = p;
    pre[i].n = len;
  }
  unmountSD();
}
static bool readCfgText(const char* path, String& out) {
  bool card = curFs == &SD, wasUp = sdUp;
  if (card && !mountSD()) return false;
  File f = curFs->open(path, "r");
  bool ok = (bool)f;
  if (ok) { out = f.readString(); f.close(); }
  if (card && !wasUp) unmountSD();
  return ok;
}

// ---- settings ----------------------------------------------------------------------------------

static void saveSettings() {
  File f = LittleFS.open("/settings.txt", "w");
  if (!f) return;
  f.printf("lefty=%d\nstylus=%d\npad=%d\ndead=%d\npalm=%d\ndebug=%d\nsound=%d\n", settings.lefty, settings.stylus, settings.padSize, settings.dead, settings.palm, settings.debug, settings.sound);
}
static void loadSettings() {
  settings = ctl::Settings();
  File f = LittleFS.open("/settings.txt", "r");
  if (!f) return;
  while (f.available()) {
    String l = f.readStringUntil('\n');
    int v = l.substring(l.indexOf('=') + 1).toInt();
    if (l.startsWith("lefty")) settings.lefty = v ? 1 : 0;
    else if (l.startsWith("stylus")) settings.stylus = v ? 1 : 0;
    else if (l.startsWith("pad")) settings.padSize = v < 0 ? 0 : v > 2 ? 2 : v;
    else if (l.startsWith("dead")) settings.dead = v < 0 ? 0 : v > 2 ? 2 : v;
    else if (l.startsWith("palm")) settings.palm = v < 0 ? 0 : v > 2 ? 2 : v;
    else if (l.startsWith("debug")) settings.debug = v ? 1 : 0;
    else if (l.startsWith("sound")) settings.sound = v < 0 ? 0 : v > 3 ? 3 : v;
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
  tft.fillRoundRect(x0, y0, x1 - x0, y1 - y0, 6, hot ? C_YELLOW : fill);
  tft.drawRoundRect(x0, y0, x1 - x0, y1 - y0, 6, C_WHITE);
  tft.setTextColor(hot ? C_BLACK : C_WHITE, hot ? C_YELLOW : fill);
  tft.setTextSize(2);
  tft.setTextDatum(textdatum_t::middle_center);
  tft.drawString(label, (x0 + x1) / 2, (y0 + y1) / 2);
  tft.setTextDatum(textdatum_t::top_left);
}
// Where the screens put things (the 480x320 numbers are the 3248S035's; the 320x240 ones are for the 2432S028).
constexpr int TITLE_H = scr::SMALL ? 28 : 40;
constexpr int PK_Y0 = scr::SMALL ? 30 : 44, PK_STEP = scr::SMALL ? 42 : 46, PK_H = scr::SMALL ? 38 : 42, PK_BTN_Y = scr::SMALL ? 200 : 276;
constexpr int PK_SPLIT1 = scr::SMALL ? 104 : 130, PK_SPLIT2 = scr::SMALL ? 208 : 260, PK_SPLIT3 = scr::SMALL ? 208 : 340;
constexpr int ST_Y0 = scr::SMALL ? 30 : 42, ST_STEP = 34, ST_PER_PAGE = scr::SMALL ? 5 : 7, ST_FOOT_Y = scr::SMALL ? 200 : 288;
constexpr int PA_BOX_X = scr::SMALL ? 50 : 100, PA_BOX_Y = scr::SMALL ? 8 : 40, PA_BOX_W = scr::SMALL ? 220 : 280, PA_BOX_H = scr::SMALL ? 184 : 236;
constexpr int PA_X0 = PA_BOX_X + 12, PA_X1 = PA_BOX_X + PA_BOX_W - 12, PA_Y0 = scr::SMALL ? 18 : 52, PA_STEP = scr::SMALL ? 42 : 56, PA_H = scr::SMALL ? 36 : 48;
static void title(const char* s) {
  tft.fillRect(0, 0, scr::W, TITLE_H, C_BLUE);
  tft.setTextColor(C_WHITE, C_BLUE);
  tft.setTextSize(2);
  tft.setCursor(8, scr::SMALL ? 6 : 12);
  tft.print(s);
}

// ---- the picture with the controls on it ----------------------------------------------------------
// Each band of the picture is built in `band`, the controls that touch it are drawn into the band (through
// a sprite on the same memory, so the colors need no conversion) and the band is pushed once. The panel
// never shows the game without the controls (no blink), and a solid chip is never painted twice (no black
// flash). Only the controls that overlap a band are drawn into it.
static lgfx::LGFX_Sprite spr(&tft);
static bool sprReady = false;
static int bandX = 0, bandY = 0, bandW = 0, bandH = 0;  // the band's corner and size on the screen

static const char* labelOf(int scan, const char* fallback) {
  for (int i = 0; i < cfg.nkeys; i++) if (cfg.keys[i].scan == scan) return cfg.keys[i].label;
  return fallback;
}

// What each button shows beside its name: the picture of what the key throws or uses (btnicon.h).
// Index 0 Space, 1 Enter, 2 + i the key tile i. The signature says when the picture changed.
static gm::BtnIcon icons[2 + ctl::MAXEXTRA];
static void refreshIcons() {
  const ctl::Need& nd = controls.need;
  icons[0] = nd.space ? gm::iconForKey(world, ctl::S_SPACE) : gm::BtnIcon();
  icons[1] = nd.enter ? gm::iconForKey(world, ctl::S_ENTER) : gm::BtnIcon();
  for (int i = 0; i < ctl::MAXEXTRA; i++) icons[2 + i] = i < nd.nextra ? gm::iconForKey(world, nd.extra[i]) : gm::BtnIcon();
}

static int textW(const char* s, float size) {
  spr.setTextSize(size);
  return spr.textWidth(s);
}
static int textH(float size) { return (int)(8 * size + 0.5f); }

// Where a label may go: a disc (the width left at a height is its chord, less the ring) or a rectangle.
struct Box { bool round; int cx, cy, r, w; };
static int availW(const Box& b, int y0, int y1) {
  if (!b.round) return b.w - 6;
  int dy = abs(y0 - b.cy) > abs(y1 - b.cy) ? abs(y0 - b.cy) : abs(y1 - b.cy);
  int rr = b.r - 2;
  return dy >= rr ? 0 : (int)(2 * sqrtf((float)(rr * rr - dy * dy)));
}

// Text centered on (x, y) of the screen, with a dark edge when it sits on the game.
static void putText(const char* s, int x, int y, uint16_t fg, bool edge) {
  spr.setTextDatum(textdatum_t::middle_center);
  x -= bandX; y -= bandY;
  if (edge) {
    spr.setTextColor(C_BLACK);
    spr.drawString(s, x - 1, y); spr.drawString(s, x + 1, y); spr.drawString(s, x, y - 1); spr.drawString(s, x, y + 1);
  }
  spr.setTextColor(fg);
  spr.drawString(s, x, y);
}

// The key's name, as large as fits (2, 1.5, then 1), centered at (cx, yc).
static void drawName(const Box& b, const char* name, int yc, uint16_t fg, bool edge) {
  static const float sizes[3] = {2.0f, 1.5f, 1.0f};
  float sz = 1.0f;
  for (int i = 0; i < 3; i++) {
    sz = sizes[i];
    int h = textH(sz);
    if (textW(name, sz) <= availW(b, yc - h / 2, yc + h / 2)) break;
  }
  spr.setTextSize(sz);
  putText(name, b.cx, yc, fg, edge);
}

// The game's label, small, from topY down, at most maxH tall and never outside the box: one line, else two
// (split at the space nearest the middle), else smaller, else cut with "...".
static void drawLabel(const Box& b, const char* label, int topY, int maxH, uint16_t fg, bool edge) {
  static const float sizes[2] = {1.0f, 0.75f};
  char l1[24], l2[24];
  int len = (int)strlen(label);
  if (len > 23) len = 23;
  for (int pass = 0; pass < 3; pass++) {
    float sz = pass < 2 ? sizes[pass] : sizes[1];
    int h = textH(sz);
    if (h > maxH) continue;
    bool cut = pass == 2;
    int nl = 1;
    memcpy(l1, label, len); l1[len] = 0; l2[0] = 0;
    if (textW(l1, sz) > availW(b, topY, topY + h) && 2 * h <= maxH) {
      int best = -1;
      for (int i = 1; i < len - 1; i++)
        if (label[i] == ' ' && (best < 0 || abs(i - len / 2) < abs(best - len / 2))) best = i;
      if (best > 0) {
        memcpy(l1, label, best); l1[best] = 0;
        memcpy(l2, label + best + 1, len - best - 1); l2[len - best - 1] = 0;
        nl = 2;
      }
    }
    bool ok = true;
    for (int k = 0; k < nl; k++) {
      char* s = k ? l2 : l1;
      int y0 = topY + k * h, aw = availW(b, y0, y0 + h);
      if (textW(s, sz) <= aw) continue;
      if (!cut) { ok = false; break; }
      int n = (int)strlen(s);
      while (n > 0) {
        s[n - 1] = 0; n--;
        char t[28];
        snprintf(t, sizeof t, "%s...", s);
        if (textW(t, sz) <= aw) { strcpy(s, t); break; }
      }
      if (n == 0) s[0] = 0;
    }
    if (!ok) continue;
    spr.setTextSize(sz);
    for (int k = 0; k < nl; k++) {
      const char* s = k ? l2 : l1;
      if (s[0]) putText(s, b.cx, topY + k * h + h / 2, fg, edge);
    }
    return;
  }
}

// A 20 x 20 picture (palette indices) scaled to S x S at (x0, y0) of the screen, on a dark backing, written
// straight into the band (it holds panel colors, as `pal` does).
static void drawIcon(const uint8_t* px, int x0, int y0, int S, bool backing = true, int clipR = 0) {
  if (backing) spr.fillRect(x0 - 1 - bandX, y0 - 1 - bandY, S + 2, S + 2, C_BLACK);
  for (int dy = 0; dy < S; dy++) {
    int Y = y0 + dy - bandY;
    if (Y < 0 || Y >= bandH) continue;
    for (int dx = 0; dx < S; dx++) {
      int X = x0 + dx - bandX;
      if (X < 0 || X >= bandW) continue;
      uint8_t v = px[(dy * 20 / S) * 20 + dx * 20 / S];
      if (clipR) {  // keep to a disc around the picture's middle (the ring of a round button)
        int ex = 2 * dx - S + 1, ey = 2 * dy - S + 1;
        if (ex * ex + ey * ey > 4 * clipR * clipR) continue;
      }
      if (v != 255) band[Y * bandW + X] = pal[v];
    }
  }
}

// Triangle pointing in direction d (0 left, 1 right, 2 up, 3 down) at (cx, cy), size s.
static void arrow(int cx, int cy, int d, int s, bool lit) {
  int x0 = cx, y0 = cy, x1, y1, x2, y2;
  switch (d) {
    case 0: x0 = cx - s; y0 = cy; x1 = cx + s / 2; y1 = cy - s; x2 = cx + s / 2; y2 = cy + s; break;
    case 1: x0 = cx + s; y0 = cy; x1 = cx - s / 2; y1 = cy - s; x2 = cx - s / 2; y2 = cy + s; break;
    case 2: x0 = cx; y0 = cy - s; x1 = cx - s; y1 = cy + s / 2; x2 = cx + s; y2 = cy + s / 2; break;
    default: x0 = cx; y0 = cy + s; x1 = cx - s; y1 = cy - s / 2; x2 = cx + s; y2 = cy - s / 2; break;
  }
  x0 -= bandX; x1 -= bandX; x2 -= bandX; y0 -= bandY; y1 -= bandY; y2 -= bandY;
  if (lit) spr.fillTriangle(x0, y0, x1, y1, x2, y2, C_YELLOW);
  spr.drawTriangle(x0, y0, x1, y1, x2, y2, lit ? C_BLACK : C_WHITE);
}
// A round button: the key's name big, and under it the picture of what it throws or uses, else the game's label.
static void disc(const ctl::Disc& d, bool down, int scan, const char* fallback, const gm::BtnIcon& ic) {
  int cx = d.cx - bandX, cy = d.cy - bandY;
  if (down) spr.fillCircle(cx, cy, d.r, C_YELLOW);
  spr.drawCircle(cx, cy, d.r + 1, C_BLACK);
  spr.drawCircle(cx, cy, d.r, down ? C_BLACK : C_WHITE);
  spr.drawCircle(cx, cy, d.r - 1, down ? C_BLACK : C_WHITE);
  const char* name = ctl::scanName(scan);
  const char* label = labelOf(scan, fallback);
  bool sub = ic.px || (label[0] && strcmp(label, name));
  Box b{true, d.cx, d.cy, d.r, 0};
  uint16_t fg = down ? C_BLACK : C_WHITE;
  if (ic.px) {  // the picture fills the button (clipped to the ring), no text
    if (!down) spr.fillCircle(cx, cy, d.r - 2, C_BLACK);
    int S = (d.r - 2) * 17 / 10;
    drawIcon(ic.px, d.cx - S / 2, d.cy - S / 2, S, false, d.r - 2);
    return;
  }
  drawName(b, name, sub ? d.cy - d.r / 3 : d.cy, fg, !down);
  if (sub) {
    drawLabel(b, label, d.cy + 3, d.r - 7, fg, !down);
  }
}
static void chip(const ctl::Rect& r, const char* label, bool down) {
  int x0 = r.x0 - bandX, y0 = r.y0 - bandY, w = r.x1 - r.x0, h = r.y1 - r.y0;
  spr.fillRect(x0, y0, w, h, C_BLACK);  // square: the game isn't shown in its corners
  spr.fillRoundRect(x0, y0, w, h, 6, down ? C_YELLOW : C_DARK);
  spr.drawRoundRect(x0, y0, w, h, 6, C_WHITE);
  spr.setTextSize(1);
  putText(label, (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, down ? C_BLACK : C_WHITE, false);
}
// A key tile: the key's name, then the picture or the game's label.
static void tile(const ctl::Rect& r, int scan, bool on, const gm::BtnIcon& ic) {
  int x0 = r.x0 - bandX, y0 = r.y0 - bandY, w = r.x1 - r.x0, h = r.y1 - r.y0;
  spr.fillRect(x0, y0, w, h, C_BLACK);
  spr.fillRoundRect(x0, y0, w, h, 6, on ? C_YELLOW : C_DARK);
  spr.drawRoundRect(x0, y0, w, h, 6, C_WHITE);
  uint16_t fg = on ? C_BLACK : C_WHITE;
  Box b{false, (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, 0, w};
  const char* name = ctl::scanName(scan);
  const char* label = labelOf(scan, "");
  if (ic.px) {  // the picture fills the tile, no text
    int S = h - 6;
    drawIcon(ic.px, b.cx - S / 2, r.y0 + 3, S, false);
    return;
  }
  drawName(b, name, r.y0 + 13, fg, false);
  if (label[0] && strcmp(label, name)) drawLabel(b, label, r.y0 + 25, h - 28, fg, false);
}

static bool hitsBand(int x0, int y0, int x1, int y1) { return x0 < bandX + bandW && x1 > bandX && y0 < bandY + bandH && y1 > bandY; }
static bool hitsDisc(const ctl::Disc& d) { return hitsBand(d.cx - d.r - 2, d.cy - d.r - 2, d.cx + d.r + 3, d.cy + d.r + 3); }
static bool hitsRect(const ctl::Rect& r) { return hitsBand(r.x0, r.y0, r.x1, r.y1); }

// The controls that overlap the current band, drawn into it.
static void drawControls() {
  const ctl::Layout& L = controls.L;
  const ctl::Need& nd = controls.need;
  const ctl::Disc& p = L.pad;
  if (hitsDisc(p)) {
    int px = p.cx - bandX, py = p.cy - bandY;
    spr.drawCircle(px, py, p.r + 1, C_BLACK);
    spr.drawCircle(px, py, p.r, C_WHITE);
    spr.drawCircle(px, py, L.deadR, C_WHITE);
    uint8_t d = controls.padDirs;
    int a = p.r * 2 / 3, s = p.r / 6 + 4;
    if (nd.left) arrow(p.cx - a, p.cy, 0, s, d & 1);
    if (nd.right) arrow(p.cx + a, p.cy, 1, s, d & 2);
    if (nd.up) arrow(p.cx, p.cy - a, 2, s, d & 4);
    if (nd.down) arrow(p.cx, p.cy + a, 3, s, d & 8);
  }
  if (nd.space && hitsDisc(L.space)) disc(L.space, controls.btnDown & 1, ctl::S_SPACE, "Space", icons[0]);
  if (nd.enter && hitsDisc(L.enter)) disc(L.enter, controls.btnDown & 2, ctl::S_ENTER, "Enter", icons[1]);
  if (hitsRect(L.menu)) chip(L.menu, "MENU", controls.btnDown & 4);
  if (nd.nextra && hitsRect(L.keys)) chip(L.keys, "KEYS", (controls.btnDown & 8) || controls.keysOpen);
  if (controls.keysOpen)
    for (int i = 0; i < nd.nextra; i++)
      if (hitsRect(L.tile[i])) tile(L.tile[i], nd.extra[i], controls.tileDown & (1 << i), icons[2 + i]);
}

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
  for (int Ys = Y0; Ys < Y1; Ys += BAND) {
    int rows = Y1 - Ys < BAND ? Y1 - Ys : BAND;
    for (int r = 0; r < rows; r++) {
      int gy = scr::down(Ys + r);
      if (gy != rowGy) { world.renderRow(gy, rowIdx); rowGy = gy; }
      uint16_t* o = band + r * w;
      for (int X = X0; X < X1; X++) *o++ = pal[rowIdx[scr::down(X)]];
    }
    spr.setBuffer(band, w, rows, 16);
    bandX = X0; bandY = Ys; bandW = w; bandH = rows;
    drawControls();
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
  return {scr::up(gx) - 2, scr::up(gy0) - 2, scr::up(gx + gm::BLEN) + 3, scr::up(gy + gm::BLEN) + 3};
}

static struct { int mx, my, nx, ny, lsx, lsy; uint32_t gen; R hero; bool valid; } last;
// The screen rectangles of the monsters drawn last frame (a moved or gone monster is drawn over again).
static R lastMon[gm::MAXMONSSHOWN];
static int nLastMon = 0;
static R monRect(const gm::MonDraw& d) {
  int gx = d.x - world.sc.lsx, gy = d.y - world.sc.lsy;
  return {scr::up(gx) - 2, scr::up(gy) - 2, scr::up(gx + gm::BLEN) + 3, scr::up(gy + gm::BLEN) + 3};
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

enum Mode { PICKER, PLAYING, PAUSED, SETTINGS_SCREEN, DONE };
static Mode mode = PICKER;
static int page = 0;
constexpr int ROWS = scr::SMALL ? 4 : 5;

// Draws the list. `clear` blacks the screen first (entering the picker); a page change paints over the old
// page instead (each row paints its own background, a row with no game is blacked), so nothing flashes.
static void drawPicker(bool clear = true) {
  if (clear) tft.fillScreen(C_BLACK);
  char t[48];
  int pages = (ngames + ROWS - 1) / ROWS;
  if (scr::SMALL) snprintf(t, sizeof t, "Pocket Player  %d/%d", page + 1, pages ? pages : 1);
  else snprintf(t, sizeof t, "Pocket Player   %d games   page %d/%d", ngames, page + 1, pages ? pages : 1);
  title(t);
  for (int r = 0; r < ROWS; r++) {
    int i = page * ROWS + r;
    int y = PK_Y0 + r * PK_STEP;
    if (i >= ngames) {  // no game here on the last page: black the slot
      tft.fillRect(0, y, scr::W, PK_STEP, C_BLACK);
      continue;
    }
    char l[64];
    if (scr::SMALL) {  // 21 characters fit beside the SD tag
      snprintf(l, sizeof l, "%.21s", games[i].title);
      if (strlen(games[i].title) > 21) strcpy(l + 18, "...");
    } else snprintf(l, sizeof l, "%s  (%d level%s)", games[i].title, games[i].levels, games[i].levels == 1 ? "" : "s");
    tft.fillRoundRect(6, y, scr::W - 12, PK_H, 6, C_DARK);
    tft.drawRoundRect(6, y, scr::W - 12, PK_H, 6, C_GRAY);
    tft.setTextColor(C_WHITE, C_DARK);
    tft.setTextSize(2);
    tft.setCursor(16, y + (PK_H - 16) / 2);
    tft.print(l);
    if (games[i].sd) {  // a game on the microSD card
      tft.setTextColor(C_YELLOW, C_DARK);
      tft.setCursor(scr::W - 40, y + (PK_H - 16) / 2);
      tft.print("SD");
    }
  }
  if (scr::SMALL) {
    button(6, PK_BTN_Y + 2, 100, scr::H - 2, "< Prev");
    button(108, PK_BTN_Y + 2, 202, scr::H - 2, "Next >");
    button(210, PK_BTN_Y + 2, 314, scr::H - 2, "Settings");
  } else {
    button(6, 276, 126, 318, "< Prev");
    button(134, 276, 254, 318, "Next >");
    button(342, 276, 474, 318, "Settings");
  }
}

static const char* const HAND[] = {"Right", "Left"};
static const char* const ONOFF[] = {"Off", "On"};
static const char* const SIZE3[] = {"Small", "Medium", "Large"};
// A short rising beep to hear the volume with (36 steps of 1/145.6 s, little endian frequencies in Hz).
static const uint8_t SAMPLE_TUNE[72] = {
    0xB8, 0x01, 0xB8, 0x01, 0xB8, 0x01, 0xB8, 0x01, 0xB8, 0x01, 0xB8, 0x01, 0xB8, 0x01, 0xB8, 0x01, 0xB8, 0x01,
    0x30, 0x02, 0x30, 0x02, 0x30, 0x02, 0x30, 0x02, 0x30, 0x02, 0x30, 0x02, 0x30, 0x02, 0x30, 0x02, 0x30, 0x02,
    0x88, 0x02, 0x88, 0x02, 0x88, 0x02, 0x88, 0x02, 0x88, 0x02, 0x88, 0x02, 0x88, 0x02, 0x88, 0x02, 0x88, 0x02,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
static const char* const VOLUME[] = {"Off", "Low", "Medium", "High"};
static const char* const PALM[] = {"Off", "Size", "Size+near"};
#ifdef POCKET_CYD28
static const char* const PANELS[] = {"ILI9341", "ILI inv", "ST7789"};
static uint8_t panelType = PANEL_ILI9341;
#endif
constexpr int ST_ROWS = scr::SMALL ? 9 : 7;  // the 2.8 inch board's Settings also has Calibrate and Display
static int setPage = 0;
static void drawSettings() {
  tft.fillScreen(C_BLACK);
  title("Settings");
  struct Row { const char* name; const char* value; };
  Row rows[ST_ROWS] = {{"Hand", HAND[settings.lefty]},
                       {scr::SMALL ? "Stylus latch" : "Stylus (taps latch)", ONOFF[settings.stylus]},
                       {"Pad size", SIZE3[settings.padSize]},
                       {scr::SMALL ? "Dead zone" : "Pad dead zone", SIZE3[settings.dead]},
                       {scr::SMALL ? "Palm reject" : "Palm rejection", PALM[settings.palm]},
                       {scr::SMALL ? "Status nums" : "Status numbers", ONOFF[settings.debug]},
                       {"Sound", VOLUME[settings.sound]}
#ifdef POCKET_CYD28
                       ,
                       {"Calibrate", "tap 3"},
                       {"Display", PANELS[panelType]}
#endif
  };
  int pages = (ST_ROWS + ST_PER_PAGE - 1) / ST_PER_PAGE;
  if (setPage >= pages) setPage = 0;
  for (int k = 0; k < ST_PER_PAGE; k++) {
    int i = setPage * ST_PER_PAGE + k;
    if (i >= ST_ROWS) break;
    int y = ST_Y0 + k * ST_STEP;
    tft.fillRoundRect(6, y, scr::W - 12, 32, 6, C_DARK);
    tft.drawRoundRect(6, y, scr::W - 12, 32, 6, C_GRAY);
    tft.setTextSize(2);
    tft.setTextColor(C_WHITE, C_DARK);
    tft.setCursor(14, y + 8);
    tft.print(rows[i].name);
    tft.setTextColor(C_YELLOW, C_DARK);
    tft.setCursor(scr::SMALL ? 176 : 300, y + 8);
    tft.print(rows[i].value);
  }
  if (scr::SMALL) {
    button(6, ST_FOOT_Y + 2, 100, scr::H - 2, "Back");
    button(108, ST_FOOT_Y + 2, 202, scr::H - 2, pages > 1 ? (setPage + 1 < pages ? "More >" : "< First") : "");
    tft.setTextSize(1);
    tft.setTextColor(C_GRAY, C_BLACK);
    tft.setCursor(210, ST_FOOT_Y + 8);
    tft.print("touch: x,y z");
  } else {
    button(6, 288, 150, 318, "Back");
    tft.setTextSize(1);
    tft.setTextColor(C_GRAY, C_BLACK);
    tft.setCursor(160, 296);
    tft.print("touch the screen: x,y size shows here");
  }
}
static void settingsTouchInfo() {
  int ix = scr::SMALL ? 210 : 160, iy = scr::SMALL ? ST_FOOT_Y + 22 : 308;
  tft.fillRect(ix, iy - (scr::SMALL ? 2 : 2), scr::W - ix, 12, C_BLACK);
  tft.setTextSize(1);
  tft.setTextColor(C_WHITE, C_BLACK);
  tft.setCursor(ix, iy);
  char l[64];
  if (pts.n && scr::SMALL) snprintf(l, sizeof l, "%d,%d z%d", pts.x[0], pts.y[0], pts.size[0]);
  else if (pts.n) snprintf(l, sizeof l, "raw %d,%d  screen %d,%d  size %d", gt.rawX[0], gt.rawY[0], pts.x[0], pts.y[0], pts.size[0]);
  else snprintf(l, sizeof l, "no touch");
  tft.print(l);
}

static const char* const PAUSE_ITEMS[] = {"Resume", "Restart game", "Games", "Settings"};
static void drawPause() {
  tft.fillRect(PA_BOX_X, PA_BOX_Y, PA_BOX_W, PA_BOX_H, C_BLACK);
  tft.drawRect(PA_BOX_X, PA_BOX_Y, PA_BOX_W, PA_BOX_H, C_WHITE);
  for (int i = 0; i < 4; i++) button(PA_X0, PA_Y0 + i * PA_STEP, PA_X1, PA_Y0 + i * PA_STEP + PA_H, PAUSE_ITEMS[i]);
}

static uint32_t t0 = 0, ticksRun = 0;
static int curGame = -1;
static bool fromPause = false;

static void applyControls() {
  ctl::Need need;
  for (int i = 0; i < cfg.nkeys; i++) ctl::needAdd(need, cfg.keys[i].scan);
  if (!need.left && !need.right && !need.up && !need.down) need.left = need.right = true;  // a game that lists no keys still gets the walk keys
  if (!need.space && !need.enter && need.nextra == 0) need.space = true;
  controls.configure(settings, need);
}

// ---- between scenes: fades and cards -----------------------------------------------------------
// What PLAYGAME shows around play (README, "Between levels"): the screen fades out and in (FadeTo: 65 steps
// over 65/70 s, as many as the panel can draw in that time) and the pictures and text pages of the game's
// .lst files, drawn at 1.5x like the game. Taps move on wherever the engine waits for a key.

static bool cardsDry = false;   // the serial self-test: no waits, one drawing per fade
static int cardsShown = 0, cardsFailed = 0;
static void setPalette6(const uint8_t* p768) {
  for (int i = 0; i < 256; i++) {
    auto v8 = [](uint8_t c) { c &= 63; return (uint8_t)((c << 2) | (c >> 4)); };
    pal[i] = panel565(v8(p768[i * 3]), v8(p768[i * 3 + 1]), v8(p768[i * 3 + 2]));
  }
}
// A 320 x 200 picture of palette indices over the whole view, through `pal`.
static void pushPicture(const uint8_t* px) {
  for (int Ys = 0; Ys < VIEW_H; Ys += BAND) {
    for (int r = 0; r < BAND; r++) {
      const uint8_t* src = px + scr::down(Ys + r) * gm::PIC_W;
      uint16_t* o = band + r * VIEW_W;
      for (int X = 0; X < VIEW_W; X++) *o++ = pal[src[scr::down(X)]];
    }
    tft.pushImage(0, Ys, VIEW_W, BAND, band);
  }
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
  if (f && f.seek(off)) {
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
  tft.fillScreen(C_BLACK);
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
  char path[48];
  snprintf(path, sizeof path, "%s/%s.cfg", curBase, fileOf(games[curGame]));
  bool cardWasUp = sdUp, card = curFs == &SD;
  if (card) mountSD();  // held while the cards show (the level's buffers are already freed)
  String text;
  if (!readCfgText(path, text)) { if (card && !cardWasUp) unmountSD(); return; }
  gm::Card cards[10];
  int n = gm::cardsOf(text.c_str(), where, cards, 10);
  uint8_t* pic = nullptr;
  char picFile[20] = "";
  bool dirty = false;  // text is on the picture
  uint8_t black[768];
  memset(black, 0, sizeof black);
  for (int i = 0; i < n; i++) {
    const gm::Card& c = cards[i];
    if (c.kind == 'g') {
      free(pic);
      pic = gm::loadPicture(assets, readPak, c.file);
      dirty = false;
      if (!pic) { picFile[0] = 0; cardsFailed++; continue; }
      strcpy(picFile, c.file);
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
          pic = gm::loadPicture(assets, readPak, picFile);
          if (!pic) break;
        }
        dirty = true;
        gm::drawTextPage(pic + 768, fontData, t, tn, pg, c.color, c.more);
        setPalette6(pic);
        pushPicture(pic + 768);
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
  tft.fillScreen(C_BLACK);
}
// The level just entered fades in from black, then the controls and strip come on.
static void fadeLevelIn() {
  uint8_t black[768];
  memset(black, 0, sizeof black);
  tft.fillScreen(C_BLACK);
  fadePalette(black, assets.pal, nullptr);
  assets.palChanged = false;
  setPalette6(assets.pal);
  last.valid = false;
  drawFrame(true);
  drawStrip();
}
static void levelWhere(char* out, char kind, int level) { snprintf(out, 8, "%c%d", kind, level); }

static bool startGame(int g, bool withCards = true) {
  curGame = g;
  char path[48];
  assets.release();  // whatever the last game (or a failed start) left; a card must be mounted with the heap at its emptiest
  clearPrefetched();
  if (!selectGame(g)) return false;
  snprintf(path, sizeof path, "%s/%s.cfg", curBase, fileOf(games[g]));
  String text;
  if (!readCfgText(path, text)) return false;
  assets.release();
  if (!gm::parseCfg(text.c_str(), world, cfg)) return false;
  assets.attach(world, cfg, readFile, inflateRaw);
  assets.beforeLoad = prefetchLevel;
  assets.palName[0] = 0;
  if (withCards) {  // the intro card shows before the level's files load: a card needs a 64 KB block of its own
    char where[8];
    levelWhere(where, 'i', 0);
    tft.fillScreen(C_BLACK);
    showCards(where);
  }
  world.seed = micros() ^ (millis() << 7);  // the monsters that wander pick differently each play
  if (!world.begin()) {
    Serial.printf("SG fail %s: nbl %d nmon %d nmbl %d have bbl%d mbl%d cbl%d chr%d mon%d free %u largest %u\n", games[g].id, cfg.lv[0].nbl, cfg.lv[0].nmon, cfg.lv[0].nmbl, !!assets.bbl, !!assets.mbl, !!assets.cbl, !!assets.chr, !!assets.mon, (unsigned)ESP.getFreeHeap(), (unsigned)heap_caps_get_largest_free_block(MALLOC_CAP_8BIT));
    return false;
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
  unmountSD();
  mode = PICKER;
  wasDown = true;
  drawPicker();
}

// ---- setup and loop ------------------------------------------------------------------------------

static void message(const char* a, const char* b = nullptr) {
  tft.fillScreen(C_BLACK);
  tft.setTextColor(C_WHITE, C_BLACK);
  tft.setTextSize(2);
  tft.setCursor(20, 120);
  tft.print(a);
  if (b) { tft.setCursor(20, 150); tft.print(b); }
}

// ---- serial self-test ----------------------------------------------------------------------------
// "T <index> <ticks>" or "T all <ticks>" on Serial (115200), accepted only on the game list: loads each
// game the way a tap does, runs it with no input (drawing too), prints one "ST" line, then returns to the list.

#ifdef POCKET_CYD28
// ---- the 2.8 inch board: touch calibration and the display driver --------------------------------------
// Three taps (touchcal.h) on crosses at the top left, top right and bottom left; the calibration is kept in NVS.
// Waits for a press and release; returns the median raw reading of the press. false: BOOT pressed or 60 s of nothing.
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
static void drawCross(int x, int y) {
  tft.drawCircle(x, y, 10, C_YELLOW);
  tft.drawFastHLine(x - 16, y, 33, C_YELLOW);
  tft.drawFastVLine(x, y - 16, 33, C_YELLOW);
}
static void say(const char* a, const char* b) {
  tft.setTextSize(1);
  tft.setTextColor(C_WHITE, C_BLACK);
  tft.setCursor(60, 100);
  tft.print(a);
  tft.setCursor(60, 114);
  tft.print(b);
}
// Returns after a good calibration was kept and tried out, or when BOOT / a minute of waiting cancels.
static void runCalibration() {
  const int M = tc::MARGIN;
  const int tx[3] = {M, scr::W - 1 - M, M}, ty[3] = {M, M, scr::H - 1 - M};
  for (;;) {
    tc::Raw r[3];
    for (int i = 0; i < 3; i++) {
      tft.fillScreen(C_BLACK);
      drawCross(tx[i], ty[i]);
      char l[32];
      snprintf(l, sizeof l, "Tap the cross  %d of 3", i + 1);
      say(l, "(BOOT button cancels)");
      if (!waitRawTap(r[i])) { enterPicker(); return; }
      Serial.printf("cal tap %d raw %d,%d\n", i + 1, r[i].x, r[i].y);
    }
    tc::Cal c;
    if (!tc::solve(r[0], r[1], r[2], c)) {
      tft.fillScreen(C_BLACK);
      say("Those taps did not line up.", "Tap anywhere to try again.");
      tc::Raw dummy;
      if (!waitRawTap(dummy)) { enterPicker(); return; }
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
      if (digitalRead(0) == LOW || now - idle > 45000) { enterPicker(); return; }
      if (pts.n > 0) {
        idle = now;
        int x = pts.x[0], y = pts.y[0];
        if (y >= 198 && freshTap(x, y)) {
          if (x >= 214) { enterPicker(); return; }
          if (x < 106) break;
        } else if (y < 198) tft.fillCircle(x, y, 3, C_WHITE);
      } else wasDown = false;
      delay(4);
    }
  }
}
// Next display driver (ILI9341, ILI9341 inverted, ST7789), kept in NVS, then a restart.
static void nextPanel() {
  panelType = (panelType + 1) % PANEL_TYPES;
  Preferences p;
  if (p.begin("pocket", false)) { p.putUChar("panel", panelType); p.end(); }
  saveSettings();
  message("Display driver", PANELS[panelType]);
  delay(900);
  ESP.restart();
}
#endif

static void selfTestOne(int g, int ticks, bool cards) {
  bool ok = startGame(g, false);
  for (int i = 0; ok && i < ticks; i++) {
    world.tick();
    world.nsnd = 0;
    if (assets.palChanged) { refreshPalette(); last.valid = false; }
    drawFrame(false);
    if ((i & 15) == 0) delay(1);  // let the watchdog and idle task breathe
  }
  Serial.printf("ST id=%s ok=%d free=%u largest=%u min=%u stack=%u\n", games[g].id, ok ? 1 : 0, (unsigned)ESP.getFreeHeap(),
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
    Serial.printf("SC id=%s ok=%d shown=%d failed=%d ms=%u free=%u largest=%u min=%u stack=%u\n", games[g].id, cardsFailed == 0 ? 1 : 0, cardsShown,
                  cardsFailed, (unsigned)(millis() - t0c), (unsigned)ESP.getFreeHeap(), (unsigned)heap_caps_get_largest_free_block(MALLOC_CAP_8BIT),
                  (unsigned)ESP.getMinFreeHeap(), (unsigned)uxTaskGetStackHighWaterMark(nullptr));
  }
  spk::stop();
  world.releaseAll();
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

static void pollSerial() {
  static char buf[48];
  static int n = 0;
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\n' || c == '\r') {
      buf[n] = 0;
      n = 0;
      if (buf[0] == 'V') traceOn = buf[2] == '1';
      else if (buf[0] == 'I') {
        int x, y;
        injOn = sscanf(buf, "I %d %d", &x, &y) == 2;
        if (injOn) { injX = x; injY = y; }
      } else if (buf[0] == 'G' && mode == PICKER) {
        int g = atoi(buf + 2);
        if (g >= 0 && g < ngames && startGame(g)) wasDown = true;
        Serial.printf("G %d %s %s\n", g, g >= 0 && g < ngames ? games[g].id : "?", mode == PLAYING ? "playing" : "failed");
      } else if (buf[0] == 'T' && mode == PICKER) serialCommand(buf);
      else if (buf[0] == 'W') serialWrite(buf);
    } else if (n < (int)sizeof buf - 1) buf[n++] = c;
  }
}

void setup() {
  Serial.begin(115200);
#ifdef POCKET_CYD28
  for (int pin : {PIN_LED_R, PIN_LED_G, PIN_LED_B}) { pinMode(pin, OUTPUT); digitalWrite(pin, HIGH); }  // the RGB LED is active low
  pinMode(0, INPUT_PULLUP);  // BOOT
  {
    Preferences pf;
    if (pf.begin("pocket", true)) { panelType = pf.getUChar("panel", PANEL_ILI9341); pf.end(); }
    if (panelType >= PANEL_TYPES) panelType = PANEL_ILI9341;
    tft.choose(panelType);
  }
#endif
  tft.init();
  tft.setRotation(1);
  tft.setBrightness(255);
  tft.setSwapBytes(false);
  message("Game-Maker Pocket Player");
  spk::begin();
  haveGT = gt.probe();
  char line[64];
#ifdef POCKET_CYD28
  if (haveGT) snprintf(line, sizeof line, "Touch: XPT2046 (%s)", XPT2046::calibrated() ? "calibrated" : "not calibrated");
  else snprintf(line, sizeof line, "Touch: no XPT2046 found");
  Serial.printf("display driver %s\n", PANELS[panelType]);
#else
  if (haveGT) snprintf(line, sizeof line, "Touch: GT911 at 0x%02X", gt.addr);
  else snprintf(line, sizeof line, "Touch: no GT911 found");
#endif
  tft.setCursor(20, 150);
  tft.print(line);
  Serial.println(line);
  if (!LittleFS.begin(false)) {
    message("LittleFS mount failed");
    for (;;) delay(1000);
  }
  {  // the microSD slot (TF_CS 5, TF_SPI_SCLK 18, TF_SPI_MISO 19, TF_SPI_MOSI 23 in board.h); no card is no error
    haveSD = mountSD();
    unmountSD();
    Serial.printf("microSD: %s\n", haveSD ? "card found" : "no card");
  }
  loadSettings();
  spk::setVolume(settings.sound);
  loadGameList();
  if (!ngames) {
    message("No games on the board", "flash the LittleFS image");
    for (;;) delay(1000);
  }
  delay(900);
  Serial.printf("ready: %d games (microSD %s), heap %u, largest %u\n", ngames, haveSD ? "in" : "out", (unsigned)ESP.getFreeHeap(), (unsigned)heap_caps_get_largest_free_block(MALLOC_CAP_8BIT));
  enterPicker();
}

static void applyKeys(uint32_t now) {
  ctl::Change ch[16];
  int n = controls.flush(ch, 16);
  for (int i = 0; i < n; i++) world.key(ch[i].scan, ch[i].down);
  (void)now;
}

void loop() {
  uint32_t now = millis();
  pollTouch(now);
  int tx, ty;

  if (mode == PICKER) {
    pollSerial();
    if (mode != PICKER) return;
#ifdef POCKET_CYD28
    {  // BOOT: a short press calibrates the touch, 2 seconds changes the display driver (for a screen that is unreadable or has wrong colors)
      static uint32_t bootT = 0;
      static bool bootActed = false;
      if (digitalRead(0) == LOW) {
        if (!bootT) bootT = now ? now : 1;
        if (!bootActed && now - bootT >= 2000) { bootActed = true; nextPanel(); }
      } else {
        if (bootT && !bootActed && now - bootT > 30) { bootT = 0; runCalibration(); return; }
        bootT = 0;
        bootActed = false;
      }
    }
#endif
    if (freshTap(tx, ty)) {
      int pages = (ngames + ROWS - 1) / ROWS;
      if (ty >= PK_BTN_Y) {
        if (tx < PK_SPLIT1 && page > 0) { page--; drawPicker(false); }
        else if (tx >= PK_SPLIT1 && tx < PK_SPLIT2 && page + 1 < pages) { page++; drawPicker(false); }
        else if (tx >= PK_SPLIT3) { mode = SETTINGS_SCREEN; fromPause = false; setPage = 0; drawSettings(); }
      } else if (ty >= PK_Y0) {
        int r = (ty - PK_Y0) / PK_STEP, i = page * ROWS + r;
        if (r < ROWS && i < ngames) {
          message("Loading", games[i].title);
          if (!startGame(i)) { message("Could not load", games[i].title); delay(1500); enterPicker(); }
          else wasDown = true;
        }
      }
    }
    delay(5);
    return;
  }
  if (mode == SETTINGS_SCREEN) {
    if (freshTap(tx, ty)) {
      int pagesS = (ST_ROWS + ST_PER_PAGE - 1) / ST_PER_PAGE;
      if (scr::SMALL && ty >= ST_FOOT_Y && tx >= 104 && tx < 208) {
        if (pagesS > 1) { setPage = (setPage + 1) % pagesS; drawSettings(); }
        return;
      }
      if (ty >= ST_FOOT_Y && tx < (scr::SMALL ? 104 : 160)) {
        saveSettings();
        if (fromPause) { applyControls(); mode = PAUSED; tft.fillScreen(C_BLACK); last.valid = false; drawFrame(true); drawStrip(); drawPause(); }
        else enterPicker();
        return;
      }
      int row = (ty - ST_Y0) / ST_STEP;
      if (ty >= ST_Y0 && row >= 0 && row < ST_PER_PAGE && setPage * ST_PER_PAGE + row < ST_ROWS) {
        switch (setPage * ST_PER_PAGE + row) {
          case 0: settings.lefty ^= 1; break;
          case 1: settings.stylus ^= 1; break;
          case 2: settings.padSize = (settings.padSize + 1) % 3; break;
          case 3: settings.dead = (settings.dead + 1) % 3; break;
          case 4: settings.palm = (settings.palm + 1) % 3; break;
          case 5: settings.debug ^= 1; break;
          case 6:
            settings.sound = (settings.sound + 1) % 4;
            spk::setVolume(settings.sound);
            spk::play(SAMPLE_TUNE);
            break;
#ifdef POCKET_CYD28
          case 7: saveSettings(); runCalibration(); drawSettings(); wasDown = true; return;
          case 8: nextPanel(); return;  // restarts
#endif
        }
        drawSettings();
      }
    }
    static uint32_t infoT = 0;
    if (now - infoT > 100) { infoT = now; settingsTouchInfo(); }
    delay(5);
    return;
  }
  if (mode == PAUSED) {
    if (freshTap(tx, ty)) {
      int i = (ty - PA_Y0) / PA_STEP;
      if (tx >= PA_X0 && tx < PA_X1 && ty >= PA_Y0 && i >= 0 && i < 4 && (ty - PA_Y0) % PA_STEP < PA_H) {
        if (i == 0) {
          mode = PLAYING; world.releaseAll(); controls.reset(); last.valid = false; drawFrame(true); drawStrip();
          t0 = millis(); ticksRun = 0; wasDown = true;
        } else if (i == 1) startGame(curGame);
        else if (i == 2) enterPicker();
        else { mode = SETTINGS_SCREEN; fromPause = true; drawSettings(); }
      }
    }
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
    spk::stop();
    world.releaseAll();
    applyKeys(now);
    controls.reset();
    mode = PAUSED;
    drawPause();
    wasDown = true;
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
    if (traceOn) Serial.printf("K %lu tick=%lu up=%d down=%d left=%d right=%d space=%d pad=%d n=%d\n", (unsigned long)millis(), (unsigned long)ticksRun, world.held[ctl::S_UP], world.held[ctl::S_DOWN], world.held[ctl::S_LEFT], world.held[ctl::S_RIGHT], world.held[ctl::S_SPACE], controls.padDirs, pts.n);
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
        levelWhere(where, 'x', from);
        showCards(where);
        showCards("w");
        enterPicker();
        return;
      }
      if (lost) {
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
      world.finish();
      world.buildDrawList();
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
