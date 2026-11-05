// The Mac tests' line reader for a .cfg (gm::Lines over stdio), so the host checks run the same streaming code the board does:
// the level table is never held, each level's record is found by reading the .cfg again.
#pragma once
#include <stdio.h>
#include <string.h>
#include <string>
#include <vector>
#include "gmcfg.h"
#include "gmsmall.h"

static std::string linesDir;  // set by the test: the data folder

// small.pak (gmsmall.h) of a data folder, read by the same code the board runs; a name it doesn't hold is a file of the folder.
static bool pakReadAt(void* user, uint32_t off, void* buf, uint32_t n) {
  FILE* f = (FILE*)user;
  return fseek(f, (long)off, SEEK_SET) == 0 && fread(buf, 1, n, f) == n;
}
struct HostPak {
  FILE* f = nullptr;
  gm::SmallPak pak;
  bool open(const std::string& dir) {
    f = fopen((dir + "/small.pak").c_str(), "rb");
    if (!f) return false;
    pak.user = f;
    pak.readAt = pakReadAt;
    if (pak.begin()) return true;
    fclose(f);
    f = nullptr;
    return false;
  }
  void close() { if (f) fclose(f); f = nullptr; }
};
// The file at `path` from small.pak (same folder) when the pak holds its name.
static bool pakSlurp(const std::string& path, std::vector<uint8_t>& out) {
  size_t cut = path.rfind('/');
  HostPak hp;
  if (!hp.open(path.substr(0, cut == std::string::npos ? 0 : cut))) return false;
  uint32_t off, len;
  bool ok = hp.pak.find(path.substr(cut == std::string::npos ? 0 : cut + 1).c_str(), &off, &len);
  if (ok) {
    out.resize(len);
    ok = pakReadAt(hp.f, off, out.data(), len);
  }
  hp.close();
  return ok;
}
struct StdioLines { HostPak hp; gm::SmallLines sl; FILE* plain = nullptr; };
static void* stdioOpen(void*, const char* name) {
  StdioLines* h = new StdioLines;
  if (h->hp.open(linesDir) && h->sl.open(&h->hp.pak, name)) return h;
  h->hp.close();
  h->plain = fopen((linesDir + "/" + name).c_str(), "rb");
  if (!h->plain) { delete h; return nullptr; }
  return h;
}
static bool stdioNext(void* hv, char* line, int cap) {
  StdioLines* h = (StdioLines*)hv;
  if (!h->plain) return h->sl.next(line, cap);
  int n = 0, c, any = 0;
  while ((c = fgetc(h->plain)) != EOF) {
    any = 1;
    if (c == '\n') break;
    if (n < cap - 1) line[n++] = (char)c;
  }
  line[n] = 0;
  return any;
}
static void stdioClose(void* hv) {
  StdioLines* h = (StdioLines*)hv;
  h->hp.close();
  if (h->plain) fclose(h->plain);
  delete h;
}
static const gm::Lines stdioLines = {stdioOpen, stdioNext, stdioClose, nullptr};
