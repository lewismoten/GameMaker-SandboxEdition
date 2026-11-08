// Host-only scoped allocation audit: heaptest <data folder or GMP> <id>.
// Each level loads in cfg order, then releases its buffers (as between cards).
// Counts requested bytes, including packed read buffers and zlib work; not ESP32 heap.
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <map>
#include <string>
#include <vector>
#include <zlib.h>

static std::map<void*, size_t> allocations;
static size_t liveBytes = 0, peakBytes = 0, largestRequest = 0, allocationCount = 0;
static void* measuredMalloc(size_t n) {
  void* p = malloc(n);
  if (p) {
    allocations[p] = n;
    liveBytes += n;
    if (liveBytes > peakBytes) peakBytes = liveBytes;
    if (n > largestRequest) largestRequest = n;
    allocationCount++;
  }
  return p;
}
static void measuredFree(void* p) {
  auto at = allocations.find(p);
  if (at != allocations.end()) { liveBytes -= at->second; allocations.erase(at); }
  free(p);
}
// Only core explicit malloc/free and this probe's input/decompression callbacks.
// C++ containers, stdio, allocator overhead, stacks and static World are excluded.
#define malloc measuredMalloc
#define free measuredFree
#include "gmcfg.h"
#undef malloc
#undef free
#include "stdiolines.h"

static std::string dataDir;
static bool missingRead = false;
static uint8_t* readMeasured(const char* name, size_t* n) {
  std::vector<uint8_t> data;
  FILE* f = fopen((dataDir + "/" + name).c_str(), "rb");
  if (f) {
    uint8_t block[4096];
    size_t got;
    while ((got = fread(block, 1, sizeof block, f))) data.insert(data.end(), block, block + got);
    bool ok = !ferror(f);
    fclose(f);
    if (!ok) { missingRead = true; return nullptr; }
  } else if (!pakSlurp(dataDir + "/" + name, data)) { missingRead = true; return nullptr; }
  auto* out = static_cast<uint8_t*>(measuredMalloc(data.size() + 1));
  if (!out) return nullptr;
  memcpy(out, data.data(), data.size());
  *n = data.size();
  return out;
}
static void* zallocate(void*, unsigned n, unsigned size) { return measuredMalloc(static_cast<size_t>(n) * size); }
static void zrelease(void*, void* p) { measuredFree(p); }
static bool inflateMeasured(const uint8_t* src, size_t n, uint8_t* dst, size_t cap) {
  z_stream z = {};
  z.zalloc = zallocate; z.zfree = zrelease;
  if (inflateInit2(&z, -15) != Z_OK) return false;
  z.next_in = const_cast<Bytef*>(src); z.avail_in = static_cast<uInt>(n);
  z.next_out = dst; z.avail_out = static_cast<uInt>(cap);
  int result = inflate(&z, Z_FINISH);
  bool ok = result == Z_STREAM_END && z.total_out == cap;
  inflateEnd(&z);
  return ok;
}
int main(int argc, char** argv) {
  if (argc != 3) { fprintf(stderr, "usage: heaptest <data folder or GMP> <id>\n"); return 2; }
  dataDir = linesDir = argv[1];
  static gm::World world;
  gm::Cfg cfg;
  std::string name = std::string(argv[2]) + ".cfg";
  if (!gm::parseCfgFile(stdioLines, name.c_str(), world, cfg)) {
    fprintf(stderr, "cannot parse cfg: %s\n", name.c_str()); return 2;
  }
  gm::Assets assets;
  assets.attach(world, cfg, readMeasured, inflateMeasured);
  assets.lines = &stdioLines;
  snprintf(assets.cfgName, sizeof assets.cfgName, "%s", name.c_str());
  int bad = 0;
  for (int level = 0; level < world.nlevels; level++) {
    peakBytes = liveBytes; largestRequest = allocationCount = 0; missingRead = false;
    // Preserve inherited hero filenames, but force each level's explicit buffers to reload.
    uint8_t mm[gm::LASTMM * 3];
    bool hasMons = false;
    bool loaded = gm::Assets::load(&assets, level, world.map, world.mapMon, mm, &hasMons);
    loaded = loaded && !missingRead;
    size_t retained = liveBytes;
    assets.release();
    printf("{\"level\":%d,\"loaded\":%s,\"live_bytes\":%zu,\"peak_bytes\":%zu,\"largest_request_bytes\":%zu,\"allocation_count\":%zu,\"after_release_bytes\":%zu}\n",
           level, loaded ? "true" : "false", retained, peakBytes, largestRequest, allocationCount, liveBytes);
    if (!loaded || liveBytes) bad++;
  }
  return bad ? 1 : 0;
}
