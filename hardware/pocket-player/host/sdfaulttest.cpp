// Deterministic failures at the platform reader seams; no SD controller or panel is emulated.
// Build with ASan/UBSan and zlib; run with a data folder and game id (default first-steps).
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string>
#include <vector>
#include <zlib.h>
#include "gmcards.h"
#include "stdiolines.h"

static std::string root, pakName = "cards.pak";
static int fault = 0, calls = 0, failAt = 1;
static uint8_t* reader(const char* name, size_t* n) {
  calls++;
  if (calls == failAt && fault == 1) return nullptr; // unavailable media / failed open
  std::vector<uint8_t> v;
  if (!pakSlurp(root + "/" + name, v)) {
    FILE* f = fopen((root + "/" + name).c_str(), "rb");
    if (!f) return nullptr;
    uint8_t buf[4096]; size_t k;
    while ((k = fread(buf, 1, sizeof buf, f))) v.insert(v.end(), buf, buf + k);
    bool ok = !ferror(f); fclose(f); if (!ok) return nullptr;
  }
  if (calls == failAt) {
    if (fault == 2) v.resize(v.size() > 3 ? 3 : 0); // short packed read
    if (fault == 3 && v.size() > 4) v.resize(v.size() - 1); // truncated deflate
    if (fault == 4 && v.size() > 4) v[4] = 0xff; // invalid deflate block
    if (fault == 5 && v.size() >= 4) v[3] = 0x7f; // excessive raw size
  }
  uint8_t* p = (uint8_t*)malloc(v.size() + 1);
  assert(p); memcpy(p, v.data(), v.size()); *n = v.size(); return p;
}
static bool inflateRaw(const uint8_t* src, size_t n, uint8_t* dst, size_t cap) {
  z_stream z = {}; if (inflateInit2(&z, -15) != Z_OK) return false;
  z.next_in = (Bytef*)src; z.avail_in = (uInt)n; z.next_out = dst; z.avail_out = (uInt)cap;
  int r = inflate(&z, Z_FINISH); bool ok = r == Z_STREAM_END && z.total_out == cap;
  inflateEnd(&z); return ok;
}
static uint8_t* rangeRead(size_t off, size_t len) {
  if (fault == 1 || fault == 2) return nullptr; // adapter must reject a failed/short exact range
  uint8_t* p = (uint8_t*)malloc(len + 1); assert(p);
  bool ok = false;
  if (isGmp(root)) {
    std::vector<uint8_t> pak;
    ok = pakSlurp(root + "/cards.pak", pak) && off <= pak.size() && len <= pak.size() - off;
    if (ok) memcpy(p, pak.data() + off, len);
  } else {
    FILE* f = fopen((root + "/" + pakName).c_str(), "rb");
    if (f) {
      ok = off <= 0x7fffffff && fseek(f, (long)off, SEEK_SET) == 0 && fread(p, 1, len, f) == len;
      fclose(f);
    }
  }
  if (!ok) { free(p); return nullptr; }
  if (fault == 3 && len > 4) memset(p + 4, 0xff, len - 4);
  if (fault == 4 && len >= 4) p[3] = 0x7f;
  return p;
}
struct BundleProbe {
  std::vector<uint8_t> bytes;
  int calls = 0, failAt = 0;
  static bool readAt(void* user, uint32_t off, void* out, uint32_t n) {
    auto& p = *(BundleProbe*)user;
    if (++p.calls == p.failAt || off > p.bytes.size() || n > p.bytes.size() - off) return false;
    memcpy(out, p.bytes.data() + off, n); return true;
  }
};
static void bundleChecks(const std::string& name) {
  FILE* f = fopen((isGmp(root) ? root : root + "/small.pak").c_str(), "rb");
  if (!f) { puts("N/A bundle: loose files"); return; }
  BundleProbe probe; uint8_t buf[4096]; size_t n;
  while ((n = fread(buf, 1, sizeof buf, f))) probe.bytes.insert(probe.bytes.end(), buf, buf + n);
  assert(!ferror(f)); fclose(f);
  gm::SmallPak pak; pak.user = &probe; pak.readAt = BundleProbe::readAt;
  assert(pak.begin());
  uint32_t off, len; assert(pak.find(name.c_str(), &off, &len));
  uint8_t magic = probe.bytes[0]; probe.bytes[0] ^= 255;
  assert(!pak.begin()); probe.bytes[0] = magic;
  auto saved = probe.bytes; probe.bytes.resize(7); assert(!pak.begin()); probe.bytes = saved;
  probe.calls = 0; probe.failAt = 1; assert(!pak.begin()); probe.failAt = 0;
  assert(pak.begin()); probe.failAt = probe.calls + 1; assert(!pak.find(name.c_str(), &off, &len)); probe.failAt = 0;
  gm::SmallLines lines; assert(lines.open(&pak, name.c_str()));
  probe.failAt = probe.calls + 1; char line[128]; assert(!lines.next(line, sizeof line));
  probe.failAt = 0; assert(lines.open(&pak, name.c_str())); assert(lines.next(line, sizeof line));
  puts("PASS bundle bad magic, short header, failed header/index/cfg range read; retry=ok");
}
static void* unavailable(void*, const char*) { return nullptr; }
static bool noLine(void*, char*, int) { assert(false); return false; }
static void noClose(void*) { assert(false); }
int main(int argc, char** argv) {
  setvbuf(stdout, nullptr, _IOLBF, 0);
  assert(argc >= 2); root = argv[1]; linesDir = root;
  if (argc > 3) pakName = argv[3];
  std::string id = argc > 2 ? argv[2] : "first-steps", name = id + ".cfg";
  bundleChecks(name);
  static gm::World w; gm::Cfg cfg; gm::Assets a;
  gm::Lines missing = {unavailable, noLine, noClose, nullptr};
  assert(!gm::parseCfgFile(missing, name.c_str(), w, cfg));
  puts("PASS cfg unavailable/open failure");
  assert(gm::parseCfgFile(stdioLines, name.c_str(), w, cfg));
  a.attach(w, cfg, reader, inflateRaw); a.lines = &stdioLines;
  snprintf(a.cfgName, sizeof a.cfgName, "%s", name.c_str());
  assert(w.begin()); int normalCalls = calls; a.release();
  a.lines = &missing; a.filesLevel = w.lvlIdx = -1;
  assert(!w.begin()); a.release();
  a.lines = &stdioLines; calls = 0; assert(w.begin()); a.release();
  assert(!gm::parseCfg("title corrupt\nlevel invalid\n", w, cfg));
  assert(gm::parseCfgFile(stdioLines, name.c_str(), w, cfg));
  puts("PASS cfg removed at level reload and malformed header; retry=ok");
  // Every mandatory asset read, after successful initial load (removed card at the next load).
  // Sound is optional by design, so its failed read is permitted, but must not retain a stale pointer.
  for (int mode = 1; mode <= 5; mode++) for (int at = 1; at <= normalCalls; at++) {
    fault = 0; calls = 0; a.filesLevel = w.lvlIdx = -1; assert(w.begin());
    a.release(); fault = mode; failAt = at; calls = 0;
    bool ok = w.begin();
    if (ok) assert(w.snd == nullptr); // only optional sound may be dropped
    a.release(); a.release(); // safe cleanup after any partial load, including retry
    fault = 0; calls = 0; assert(w.begin()); a.release();
    printf("PASS asset mode=%d read=%d outcome=%s retry=ok\n", mode, at, ok ? "optional-sound" : "rejected");
  }
  fault = 0; gm::Card cards[10];
  int count = 0;
  std::vector<std::string> wheres;
  for (int lv = 0; lv < w.nlevels; lv++) {
    wheres.push_back("i" + std::to_string(lv));
    wheres.push_back("x" + std::to_string(lv));
  }
  wheres.push_back("w"); wheres.push_back("l");
  for (const auto& where : wheres) {
    count = gm::cardsOfFile(stdioLines, name.c_str(), where.c_str(), cards, 10);
    bool picture = false;
    for (int i = 0; i < count; i++) if (cards[i].kind == 'g') picture = true;
    if (picture) break;
  }
  int checked = 0;
  for (int i = 0; i < count; i++) if (cards[i].kind == 'g') {
    uint8_t* p = gm::loadPicture(a, rangeRead, cards[i].file); assert(p); free(p);
    for (fault = 1; fault <= 4; fault++) { p = gm::loadPicture(a, rangeRead, cards[i].file); assert(!p); }
    fault = 0; p = gm::loadPicture(a, rangeRead, cards[i].file); assert(p); free(p); checked++;
  }
  if (checked) puts("PASS card unavailable/open, short exact range, invalid deflate, excessive length; retry=ok");
  else puts("N/A picture faults: no picture cards configured in this game");
  return 0;
}
