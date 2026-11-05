// The Mac tests' line reader for a .cfg (gm::Lines over stdio), so the host checks run the same streaming code the board does:
// the level table is never held, each level's record is found by reading the .cfg again.
#pragma once
#include <stdio.h>
#include <string.h>
#include <string>
#include "gmcfg.h"

static std::string linesDir;  // set by the test: the data folder
static void* stdioOpen(void*, const char* name) { return fopen((linesDir + "/" + name).c_str(), "rb"); }
static bool stdioNext(void* h, char* line, int cap) {
  int n = 0, c, any = 0;
  while ((c = fgetc((FILE*)h)) != EOF) {
    any = 1;
    if (c == '\n') break;
    if (n < cap - 1) line[n++] = (char)c;
  }
  line[n] = 0;
  return any;
}
static void stdioClose(void* h) { fclose((FILE*)h); }
static const gm::Lines stdioLines = {stdioOpen, stdioNext, stdioClose, nullptr};
