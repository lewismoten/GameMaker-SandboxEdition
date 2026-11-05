// Lists, for one game, each key it uses with the picture btnicon.h picks for its button, after `ticks`
// ticks of play (so a level has loaded and the character has set up its inventory):
//   iconsdump <data dir> <game id> <ticks> [sequence to give ammo ...]
// Prints "K <scan> <name>|<label>|<0 or 1: has a picture>" and, for a picture, "I <400 tokens: rrggbb per
// pixel of 20 x 20, - = see-through>". web/scripts/pocketIconsShot.py draws these onto a button layout.
#include <stdio.h>
#include <string>
#include <vector>
#include <zlib.h>
#include "btnicon.h"
#include "controls.h"
#include "gmcfg.h"
#include "stdiolines.h"

using namespace gm;

static std::string dir;
static Cfg cfg;
static Assets assets;

static std::vector<uint8_t> slurp(const std::string& path) {
  std::vector<uint8_t> v;
  FILE* f = fopen(path.c_str(), "rb");
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

int main(int argc, char** argv) {
  if (argc < 4) return 2;
  dir = argv[1];
  static World w;
  std::vector<uint8_t> text = slurp(dir + "/" + argv[2] + ".cfg");
  text.push_back(0);
  if (!parseCfg((const char*)text.data(), w, cfg)) return 2;
  assets.attach(w, cfg, readFile, inflateRaw);
  linesDir = dir;
  assets.lines = &stdioLines;
  snprintf(assets.cfgName, sizeof assets.cfgName, "%s.cfg", argv[2]);
  w.begin();
  int ticks = atoi(argv[3]);
  for (int t = 0; t < ticks; t++) w.tick();
  for (int i = 4; i < argc; i++) w.meter[atoi(argv[i])] = 5;  // optional: sequences to give ammo, to see their pictures
  ctl::Need need;
  for (int i = 0; i < cfg.nkeys; i++) ctl::needAdd(need, cfg.keys[i].scan);
  std::vector<int> scans;
  if (need.space) scans.push_back(ctl::S_SPACE);
  if (need.enter) scans.push_back(ctl::S_ENTER);
  for (int i = 0; i < need.nextra; i++) scans.push_back(need.extra[i]);
  for (int scan : scans) {
    BtnIcon ic = iconForKey(w, scan);
    const char* label = "";
    for (int i = 0; i < cfg.nkeys; i++) if (cfg.keys[i].scan == scan) label = cfg.keys[i].label;
    printf("K %d %s|%s|%d\n", scan, ctl::scanName(scan), label, ic.px ? 1 : 0);
    if (!ic.px) continue;
    printf("I ");
    for (int i = 0; i < 400; i++) {
      uint8_t v = ic.px[i];
      if (v == 255) printf("- ");
      else printf("%02x%02x%02x ", (assets.pal[v * 3] * 255 / 63), (assets.pal[v * 3 + 1] * 255 / 63), (assets.pal[v * 3 + 2] * 255 / 63));
    }
    printf("\n");
  }
  return 0;
}
