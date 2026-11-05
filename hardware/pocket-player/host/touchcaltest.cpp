// Mac test for src/touchcal.h: every way the resistive touch can be wired against the screen (swapped axes, either
// axis flipped, a slightly different range) must calibrate from three taps within 3 pixels everywhere on the screen;
// bad taps (two on the same spot, a tap on the wrong corner) must be refused. Built by web/scripts/pocketControlsCheck.ts.
#include <stdio.h>
#include "touchcal.h"

static int fails = 0;
#define CHECK(c, ...) do { if (!(c)) { fails++; printf("FAIL: " __VA_ARGS__); printf("\n"); } } while (0)

int main() {
  const int W = 320, H = 240;
  int cases = 0;
  for (int swap = 0; swap < 2; swap++)
    for (int fu = 0; fu < 2; fu++)
      for (int fv = 0; fv < 2; fv++)
        for (int range = 0; range < 3; range++) {
          int lo = range == 0 ? 200 : range == 1 ? 350 : 120, hi = range == 0 ? 3900 : range == 1 ? 3700 : 4000;
          // a made-up panel: raw = lo + (hi - lo) * position, flipped or not, axes swapped or not
          auto raw = [&](int sx, int sy, int& rx, int& ry) {
            long u = lo + (long)(hi - lo) * (fu ? (W - 1 - sx) : sx) / (W - 1);
            long v = lo + (long)(hi - lo) * (fv ? (H - 1 - sy) : sy) / (H - 1);
            if (swap) { rx = (int)v; ry = (int)u; } else { rx = (int)u; ry = (int)v; }
          };
          tc::Raw a, b, c;
          raw(tc::MARGIN, tc::MARGIN, a.x, a.y);
          raw(W - 1 - tc::MARGIN, tc::MARGIN, b.x, b.y);
          raw(tc::MARGIN, H - 1 - tc::MARGIN, c.x, c.y);
          tc::Cal cal;
          CHECK(tc::solve(a, b, c, cal), "solve swap=%d fu=%d fv=%d range=%d", swap, fu, fv, range);
          int worst = 0;
          for (int sy = 0; sy < H; sy += 20)
            for (int sx = 0; sx < W; sx += 20) {
              int rx, ry, x, y;
              raw(sx, sy, rx, ry);
              tc::toScreen(cal, rx, ry, W, H, x, y);
              int e = abs(x - sx) > abs(y - sy) ? abs(x - sx) : abs(y - sy);
              // outside the targets' rectangle the clamp may pull a pixel or two
              if (e > worst) worst = e;
            }
          CHECK(worst <= 3, "swap=%d fu=%d fv=%d range=%d worst error %d px", swap, fu, fv, range, worst);
          cases++;
        }
  tc::Cal cal;
  CHECK(!tc::solve({1000, 1000}, {1000, 1000}, {1000, 3000}, cal), "two taps on one spot are refused");
  CHECK(!tc::solve({300, 300}, {3600, 300}, {3600, 3600}, cal), "a third tap on the wrong corner is refused");
  CHECK(!tc::solve({300, 300}, {3600, 3000}, {300, 3000}, cal), "a diagonal second tap is refused");
  printf("touchcal: %d wirings, %d failures\n", cases, fails);
  return fails ? 1 : 0;
}
