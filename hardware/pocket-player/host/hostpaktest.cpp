// A malformed bundle must not allocate its advertised payload before validating the file range.
// hostpaktest <scratch-dir>; uses a tiny generated bundle, never a large allocation/OOM test.
#include <assert.h>
#include <stdio.h>
#include <string>
#include <vector>
#include "stdiolines.h"

static void put32(uint8_t* p, uint32_t v) { for (int i = 0; i < 4; i++) p[i] = (uint8_t)(v >> (i * 8)); }
static void writeBundle(const std::string& path, uint32_t off, uint32_t len) {
  uint8_t data[49] = {};
  memcpy(data, "GMS1", 4); put32(data + 4, 1); strcpy((char*)data + 8, "asset");
  put32(data + 40, off); put32(data + 44, len); data[48] = 42;
  FILE* f = fopen(path.c_str(), "wb"); assert(f);
  assert(fwrite(data, 1, sizeof data, f) == sizeof data); fclose(f);
}
int main(int argc, char** argv) {
  assert(argc == 2);
  std::string file = std::string(argv[1]) + "/fixture.GMP";
  std::vector<uint8_t> out;
  writeBundle(file, 48, 1); assert(pakSlurp(file + "/asset", out)); assert(out.size() == 1 && out[0] == 42);
  out.clear(); writeBundle(file, 48, 1024 * 1024);
  assert(!pakSlurp(file + "/asset", out)); assert(out.empty()); // no allocation for a physically impossible range
  writeBundle(file, 0xfffffff0u, 32);
  assert(!pakSlurp(file + "/asset", out)); assert(out.empty()); // addition must not wrap
  writeBundle(file, 49, 0); assert(pakSlurp(file + "/asset", out)); assert(out.empty());
  assert(remove(file.c_str()) == 0);
  puts("PASS stdio bundle: valid bytes, impossible length rejected before allocation, overflow range, empty entry");
}
