// Mac test for the Pocket Player's between-level cards (src/gmcards.h). For one game it builds each card list
// (i0.., x0.., w, l) the way the board does and prints one line per picture or text page:
//   C <where> <g|t> <page> <hash of the 64000 indices> <hash of the 768 palette bytes>
// web/scripts/pocketCardsCheck.ts compares them with what the engine's ShowGraphic draws.
//   cardstest <data dir> <game id>
// Build: c++ -std=c++17 -O1 -I../src cardstest.cpp -o cardstest -lz
#include <stdio.h>
#include <stdlib.h>
#include <string>
#include <vector>
#include <zlib.h>
#include "gmcards.h"
#include "stdiolines.h"

using namespace gm;

static std::string dir;
static std::vector<uint8_t> slurp(const std::string& path) {
  std::vector<uint8_t> v;
  FILE* f = fopen(path.c_str(), "rb");
  if (!f && pakSlurp(path, v)) return v;
  if (!f) { fprintf(stderr, "cannot open %s\n", path.c_str()); exit(2); }
  uint8_t buf[4096];
  size_t n;
  while ((n = fread(buf, 1, sizeof buf, f)) > 0) v.insert(v.end(), buf, buf + n);
  fclose(f);
  return v;
}
static bool inflateRaw(const uint8_t* src, size_t n, uint8_t* dst, size_t cap) {
  z_stream z = {};
  if (inflateInit2(&z, -15) != Z_OK) return false;
  z.next_in = (Bytef*)src; z.avail_in = (uInt)n; z.next_out = dst; z.avail_out = (uInt)cap;
  int r = inflate(&z, Z_FINISH);
  bool ok = r == Z_STREAM_END && z.total_out == cap;
  inflateEnd(&z);
  return ok;
}
static uint8_t* readFile(const char* name, size_t* n) {
  std::vector<uint8_t> v = slurp(dir + "/" + name);
  uint8_t* p = (uint8_t*)malloc(v.size() + 1);
  memcpy(p, v.data(), v.size());
  *n = v.size();
  return p;
}
static uint8_t* readRange(size_t off, size_t len) {
  static std::vector<uint8_t> pak = slurp(dir + "/cards.pak");
  if (off + len > pak.size()) return nullptr;
  uint8_t* p = (uint8_t*)malloc(len + 1);
  memcpy(p, pak.data() + off, len);
  return p;
}
static uint32_t fnv(const uint8_t* p, size_t n) {
  uint32_t h = 2166136261u;
  for (size_t i = 0; i < n; i++) h = (h ^ p[i]) * 16777619u;
  return h;
}

int main(int argc, char** argv) {
  if (argc < 3) return 2;
  dir = argv[1];
  std::vector<uint8_t> cv = slurp(dir + "/" + argv[2] + ".cfg");
  std::string cfgText(cv.begin(), cv.end());
  Assets assets;
  assets.read = readFile;
  assets.inflate = inflateRaw;
  size_t fn = 0;
  // a one-file game holds no font (the board's is on LittleFS): the font.bin beside it
  std::string fontDir = isGmp(dir) ? dir.substr(0, dir.rfind('/') == std::string::npos ? 0 : dir.rfind('/')) : dir;
  std::vector<uint8_t> fv = slurp((fontDir.empty() ? std::string(".") : fontDir) + "/font.bin");
  uint8_t* font = (uint8_t*)malloc(fv.size() + 1);
  memcpy(font, fv.data(), fv.size());
  fn = fv.size();
  std::vector<std::string> wheres;
  int nlev = 0;  // as many levels as the .cfg has
  for (size_t at = 0; (at = cfgText.find("\nlevel ", at)) != std::string::npos; at++) nlev++;
  if (!cfgText.compare(0, 6, "level ")) nlev++;
  for (int i = 0; i < nlev; i++) wheres.push_back("i" + std::to_string(i));
  for (int i = 0; i < nlev; i++) wheres.push_back("x" + std::to_string(i));
  wheres.push_back("w");
  wheres.push_back("l");
  for (auto& wh : wheres) {
    Card cards[10];
    int n = cardsOf(cfgText.c_str(), wh.c_str(), cards, 10);
    {  // the line by line reader (the board's) finds the same cards
      Card again[10];
      linesDir = dir;
      std::string name = std::string(argv[2]) + ".cfg";
      int m = cardsOfFile(stdioLines, name.c_str(), wh.c_str(), again, 10);
      bool same = m == n;
      for (int k = 0; same && k < n; k++) same = again[k].kind == cards[k].kind && !strcmp(again[k].file, cards[k].file) && again[k].pause == cards[k].pause && again[k].color == cards[k].color && again[k].more == cards[k].more;
      if (!same) { fprintf(stderr, "cardsOfFile differs for %s\n", wh.c_str()); return 3; }
    }
    uint8_t* pic = nullptr;
    char picFile[20] = "";
    bool dirty = false;
    for (int i = 0; i < n; i++) {
      const Card& c = cards[i];
      if (c.kind == 'g') {
        free(pic);
        pic = loadPicture(assets, readRange, c.file);
        dirty = false;
        if (!pic) { printf("C %s g ERR\n", wh.c_str()); continue; }
        strcpy(picFile, c.file);
        printf("C %s g 0 %u %u %d\n", wh.c_str(), fnv(pic + 768, PIC_PIXELS), fnv(pic, 768), c.pause);
      } else if (c.kind == 'f') {
        size_t tn = 0;
        uint8_t* table = readCard(assets, readRange, c.file, &tn);
        uint8_t* px = (uint8_t*)calloc(PIC_PIXELS, 1);
        uint8_t pal[768] = {};
        for (int fr = 0; table && fr < c.more; fr++) {
          size_t n = 0;
          uint8_t* d = fliFrameData(assets, readRange, table, tn, fr, &n);
          if (!d) { printf("C %s f ERR\n", wh.c_str()); break; }
          fliApply(d, n, px, pal);
          free(d);
          printf("C %s f %d %u %u %d\n", wh.c_str(), fr, fnv(px, PIC_PIXELS), fnv(pal, 768), c.color);
        }
        free(px);
        free(table);
      } else if (c.kind == 't' && pic) {
        size_t tn = 0;
        uint8_t* t = readCard(assets, readRange, c.file, &tn);
        int pages = textPageCount(t, tn);
        for (int pg = 0; pg < pages; pg++) {
          if (dirty) { free(pic); pic = loadPicture(assets, readRange, picFile); }
          dirty = true;
          drawTextPage(pic + 768, font, t, tn, pg, c.color, c.more);
          printf("C %s t %d %u %u %d\n", wh.c_str(), pg, fnv(pic + 768, PIC_PIXELS), fnv(pic, 768), c.pause);
        }
        free(t);
      }
    }
    free(pic);
  }
  return 0;
}
