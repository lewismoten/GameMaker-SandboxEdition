// small.pak: the Starters' many small files (each game's .cfg, the shared .b .m .p .r .c .o .k .s files) in ONE file, so
// LittleFS's 4 KB block per file stops wasting space (554 files took 2.2 MB for 0.5 MB of data).
// Layout (little endian): "GMS1", u32 count, then `count` entries sorted by name (strcmp), 40 bytes each
// (name[32] padded with 0, u32 offset from the file start, u32 length), then the data. A lookup is a binary search that
// reads entries from flash one at a time, so nothing is held in RAM. The reader is generic over where the bytes come from
// (the board's LittleFS file, the Mac tests' stdio file), so both run this code.
#pragma once
#include <stdint.h>
#include <string.h>

namespace gm {

struct SmallEntry { char name[32]; uint32_t off, len; };

struct SmallPak {
  void* user = nullptr;
  bool (*readAt)(void* user, uint32_t off, void* buf, uint32_t n) = nullptr;
  uint32_t count = 0, size = 0;

  bool begin() {
    uint8_t h[8];
    if (!readAt(user, 0, h, 8) || memcmp(h, "GMS1", 4)) return false;
    count = h[4] | (h[5] << 8) | (h[6] << 16) | ((uint32_t)h[7] << 24);
    return count <= 65536 && (!size || 8 + count * 40 <= size);
  }
  bool find(const char* name, uint32_t* off, uint32_t* len) const {
    if (strlen(name) > 31) return false;
    uint32_t lo = 0, hi = count;
    while (lo < hi) {
      uint32_t mid = (lo + hi) / 2;
      SmallEntry e;
      if (!readAt(user, 8 + mid * sizeof(SmallEntry), &e, sizeof e)) return false;
      e.name[31] = 0;
      int c = strcmp(name, e.name);
      if (!c) { if (e.off < 8 + count * 40 || (size && (e.off > size || e.len > size - e.off))) return false; *off = e.off; *len = e.len; return true; }
      if (c < 0) hi = mid; else lo = mid + 1;
    }
    return false;
  }
};

// A line reader over one entry of the pak (a .cfg is read line by line, never held).
struct SmallLines {
  const SmallPak* pak = nullptr;
  uint32_t pos = 0, end = 0;
  uint8_t buf[256];
  int bp = 0, bl = 0;

  bool open(const SmallPak* p, const char* name) {
    uint32_t off, len;
    if (!p->find(name, &off, &len)) return false;
    pak = p; pos = off; end = off + len; bp = bl = 0;
    return true;
  }
  // The next line without its newline, cut at cap - 1; false at the end.
  bool next(char* line, int cap) {
    int n = 0;
    for (;;) {
      if (bp >= bl) {
        uint32_t take = end - pos < sizeof buf ? end - pos : (uint32_t)sizeof buf;
        if (!take || !pak->readAt(pak->user, pos, buf, take)) { bl = bp = 0; if (!n) return false; break; }
        pos += take; bl = (int)take; bp = 0;
      }
      char c = (char)buf[bp++];
      if (c == '\n') break;
      if (n < cap - 1) line[n++] = c;
    }
    line[n] = 0;
    return true;
  }
};

}  // namespace gm
