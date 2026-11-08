#!/usr/bin/env python3
"""Compile the real showCards routine with time/panel stubs; inject missing/corrupt picture bytes."""
from pathlib import Path
import os
import subprocess
import tempfile

host = Path(__file__).resolve().parent
source = (host.parent / "src/main.cpp").read_text()
start = source.index("static void showCards(const char* where)")
end = source.index("// FadeAllTo black", start)
program = r'''
#include <assert.h>
#include <stdlib.h>
#include <string.h>
#include "gmcards.h"
static int SD = 1, LittleFS = 2, *curFs = &SD;
static bool sdUp = false, cardsDry = false;
static int cardsShown = 0, cardsFailed = 0, errors = 0, waits = 0, delays = 0;
static int mode = 0;
static bool mountSD() { sdUp = true; return true; }
static void unmountSD() { sdUp = false; }
static gm::Assets assets;
static uint16_t pal[256], band[320 * 30];
static const int BAND = 30;
static uint8_t* fontData = nullptr;
static int tft;
namespace carddraw {
void clear(int, int) {}
void textPage(int, const uint8_t*, const uint16_t*, uint16_t*, int, const uint8_t*, const uint8_t*, size_t, int, int, int, bool, gm::TextRect&) {}
}
[[maybe_unused]] static void playFli(const gm::Card&) {}
static void setPalette6(const uint8_t*) {}
static void fadePalette(const uint8_t*, const uint8_t*, const uint8_t*) {}
static void waitTap(int) { waits++; }
static void message(const char*, const char* = nullptr) { errors++; }
static void delay(int ms) { assert(ms <= 1500 && ms >= 0); delays++; }
static uint8_t* readFileIn(int, const char*, const char*, size_t*) { return nullptr; }
static bool badInflate(const uint8_t*, size_t, uint8_t*, size_t) { return false; }
static uint8_t* readPak(size_t, size_t n) {
  if (!mode) return nullptr; // media removed, open failed, short exact range
  uint8_t* p = (uint8_t*)calloc(n, 1); assert(p);
  p[0] = 0; p[1] = 0xfd; // 64768 byte picture, invalid deflate payload
  return p;
}
static int lineNo;
static void* open(void*, const char*) { lineNo = 0; return &lineNo; }
static bool next(void*, char* out, int cap) {
  if (lineNo++) return false;
  snprintf(out, cap, "card i0 g 0.100 65535"); return true;
}
static void close(void*) {}
static gm::Lines cfgLines = {open, next, close, nullptr};
''' + source[start:end] + r'''
int main() {
  assets.inflate = badInflate;
  for (mode = 0; mode < 2; mode++) {
    errors = waits = delays = cardsFailed = 0;
    showCards("i0");
    assert(cardsFailed == 1 && !sdUp);
    assert(errors == 1 && delays == 1 && waits == 0); // no PAUSE_KEY wait for failed picture
  }
  errors = delays = 0; cardsDry = true; showCards("i0");
  assert(errors == 0 && delays == 0); // serial dry check reports counters without UI delay
}
'''
with tempfile.TemporaryDirectory(prefix="pocket-card-failure-", dir=os.environ.get("TMPDIR")) as work:
    cpp = Path(work) / "test.cpp"
    cpp.write_text(program)
    exe = Path(work) / "test"
    subprocess.run(["c++", "-std=c++17", "-O1", "-Wall", "-Wextra", "-I" + str(host.parent / "src"), str(cpp), "-o", str(exe)], check=True)
    subprocess.run([str(exe)], check=True, timeout=5)
print("PASS actual showCards: unavailable/corrupt picture gets one bounded notice, no key wait; dry check stays noninteractive")
