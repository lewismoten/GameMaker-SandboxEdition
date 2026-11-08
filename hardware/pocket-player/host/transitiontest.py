#!/usr/bin/env python3
"""Compile the real board transition tail with panel/time stubs, not a copied guard.

The hardware loop is not host-buildable; this narrowly exercises its failure branch.
Run: python3 hardware/pocket-player/host/transitiontest.py
"""
from pathlib import Path
import os
import subprocess
import tempfile

host = Path(__file__).resolve().parent
source = (host.parent / "src/main.cpp").read_text()
start = source.index("      world.finish();") if "      world.finish();" in source else source.index("      if (!world.finish())")
end = source.index("      return;", source.index("      wasDown = true;", start)) + len("      return;")
tail = source[start:end]
program = r'''
#include <assert.h>
#include <stdint.h>
struct { bool ok; int draws = 0; bool finish() { return ok; } void buildDrawList() { draws++; } } world;
struct { int releases = 0; void release() { releases++; } } assets;
struct { const char* title = "fixture"; } games[1];
int curGame = 0, fades = 0, pickers = 0, errors = 0, ticksRun = 0;
bool wasDown = false;
uint32_t t0 = 0;
void fadeLevelIn() { fades++; }
void enterPicker() { pickers++; }
void message(const char*, const char*) { errors++; }
void levelFailed() { errors++; } // develop's bounded failure card (releases, shows the card)
int activeGame = 0;
void resumeSave(int) {}
void delay(int ms) { assert(ms >= 0 && ms <= 1500); }
uint32_t millis() { return 123; }
void clearPrefetched() {}
void transition() {
''' + tail + r'''
}
int main() {
  world.ok = false; transition();
  assert(world.draws == 0 && fades == 0); // no stale/freed level resources drawn
  assert(errors == 1 && pickers == 1); // bounded error then return to picker
  world.ok = true; transition();
  assert(world.draws == 1 && fades == 1 && t0 == 123 && ticksRun == 0 && wasDown);
}
'''
with tempfile.TemporaryDirectory(prefix="pocket-transition-", dir=os.environ.get("TMPDIR")) as work:
    cpp = Path(work) / "test.cpp"
    cpp.write_text(program)
    exe = Path(work) / "test"
    subprocess.run(["c++", "-std=c++17", "-Wall", "-Wextra", str(cpp), "-o", str(exe)], check=True)
    subprocess.run([str(exe)], check=True, timeout=5)
print("PASS actual board transition tail: failed load never draws, bounded error/picker; successful load draws")
