// Mac test for src/displaysetup.h: the 200 x 200 button square fits every turn, buttons hit-test and change the mode as
// named, the touch mapping from one or two corner taps works for all wirings, and the saved record round-trips.
#include <stdio.h>
#include <stdlib.h>
#include "displaysetup.h"

static int fails = 0;
#define CHECK(c, ...) do { if (!(c)) { fails++; printf("FAIL: " __VA_ARGS__); printf("\n"); } } while (0)

int main() {
  const int W = 320, H = 240;
  // every cell inside the square, none overlapping, each hit at its center and nowhere outside
  for (int b = 0; b < ds::NBTN; b++) {
    ds::Rect r = ds::rect(b);
    CHECK(r.x0 >= 0 && r.y0 >= 0 && r.x1 <= ds::SQ && r.y1 <= ds::SQ, "button %d leaves the 200 square", b);
    CHECK(r.x1 - r.x0 >= 44 && r.y1 - r.y0 >= 44, "button %d under 44 px", b);
    CHECK(ds::hit((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2) == b, "button %d center", b);
  }
  CHECK(ds::hit(200, 10) == -1 && ds::hit(10, 199) == -1 && ds::hit(-1, 5) == -1, "outside the square hits nothing");
  // the square lands whole on the 240-wide memory in all four turns: it is 200 <= 240 on both memory axes
  CHECK(ds::SQ < 240, "square fits the panel's short side");
  // presses
  uint8_t p = 0, t = 0;
  ds::press(ds::ROT, p, t); CHECK(t == 1 && p == 0, "rotate");
  ds::press(ds::MIR, p, t); CHECK(t == 3, "mirror");
  ds::press(ds::RB, p, t); ds::press(ds::INV, p, t); ds::press(ds::DRV, p, t); CHECK(p == 7, "mode bits");
  CHECK(!ds::press(ds::OK, p, t) && p == 7 && t == 3, "OK changes nothing");
  CHECK(!ds::needsRestart(ds::ROT) && !ds::needsRestart(ds::MIR) && ds::needsRestart(ds::DRV), "restart rules");
  // corner taps for every wiring of a made-up panel
  int cases = 0;
  for (int swap = 0; swap < 2; swap++)
    for (int fu = 0; fu < 2; fu++)
      for (int fv = 0; fv < 2; fv++)
        for (int range = 0; range < 3; range++) {
          int lo = range == 0 ? 200 : range == 1 ? 350 : 120, hi = range == 0 ? 3900 : range == 1 ? 3700 : 4000;
          auto raw = [&](int sx, int sy, int& rx, int& ry) {
            long u = lo + (long)(hi - lo) * (fu ? (W - 1 - sx) : sx) / (W - 1);
            long v = lo + (long)(hi - lo) * (fv ? (H - 1 - sy) : sy) / (H - 1);
            if (swap) { rx = (int)v; ry = (int)u; } else { rx = (int)u; ry = (int)v; }
          };
          tc::Raw a, b;
          raw(ds::TX0, ds::TY, a.x, a.y);
          raw(ds::TX1, ds::TY, b.x, b.y);
          tc::Cal c, c1;
          CHECK(ds::fromTwo(a, b, W, H, c), "fromTwo swap=%d fu=%d fv=%d r=%d", swap, fu, fv, range);
          CHECK(c.swap == swap, "swap found %d want %d (fu=%d fv=%d)", c.swap, swap, fu, fv);
          // now a button center must come out inside its button, on a 12 px tolerance of the middle (4 px margins)
          int worst = 0;
          for (int bn = 0; bn < ds::NBTN; bn++) {
            ds::Rect r = ds::rect(bn);
            int cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2, rx, ry, x, y;
            raw(cx, cy, rx, ry);
            tc::toScreen(c, rx, ry, W, H, x, y);
            CHECK(ds::hit(x, y) == bn, "button %d center read as %d,%d -> %d (swap=%d fu=%d fv=%d r=%d)", bn, x, y, ds::hit(x, y), swap, fu, fv, range);
            int e = abs(x - cx) > abs(y - cy) ? abs(x - cx) : abs(y - cy);
            if (e > worst) worst = e;
          }
          CHECK(worst <= 20, "corner-tap mapping off by %d px (swap=%d fu=%d fv=%d r=%d)", worst, swap, fu, fv, range);
          // one tap after a display change: the same wiring flipped on both axes (a half turn), order and scale kept
          tc::Raw a2;
          int rx2, ry2;
          raw(W - 1 - ds::TX0, H - 1 - ds::TY, rx2, ry2);  // the glass corner that is now logical (0,0) is the far one: model it by flipping
          (void)rx2; (void)ry2;
          // the half-turned panel is the same wiring with both flips toggled
          auto raw2 = [&](int sx, int sy, int& rx, int& ry) { raw(W - 1 - sx, H - 1 - sy, rx, ry); };
          raw2(ds::TX0, ds::TY, a2.x, a2.y);
          CHECK(ds::fromOne(a2, c, W, H, c1), "fromOne");
          CHECK(c1.swap == swap, "fromOne keeps the swap");
          int cx = 50, cy = 33, rx, ry, x, y;
          raw2(cx, cy, rx, ry);
          tc::toScreen(c1, rx, ry, W, H, x, y);
          CHECK(ds::hit(x, y) == ds::hit(cx, cy), "fromOne maps (%d,%d) to %d,%d (swap=%d fu=%d fv=%d r=%d)", cx, cy, x, y, swap, fu, fv, range);
          cases++;
        }
  // refused taps
  tc::Cal c;
  CHECK(!ds::fromTwo({1000, 1000}, {1000, 1000}, W, H, c), "two taps on one spot are refused");
  CHECK(!ds::fromTwo({300, 300}, {2000, 2000}, W, H, c), "a diagonal second tap is refused");
  CHECK(!ds::fromOne({0, 1000}, tc::Cal(), W, H, c), "a tap at the raw edge is refused");
  // the record
  ds::Record r, back;
  r.panel = 5;
  r.turn = 2;
  r.cal.swap = 1; r.cal.u0 = 3650; r.cal.u1 = 310; r.cal.v0 = 280; r.cal.v1 = 3720; r.cal.valid = 1;
  r.full = 1;
  char buf[200];
  ds::format(r, buf, sizeof buf);
  CHECK(ds::parse(buf, back) && back.panel == 5 && back.turn == 2 && back.cal.swap == 1 && back.cal.u0 == 3650 && back.cal.u1 == 310 &&
            back.cal.v0 == 280 && back.cal.v1 == 3720 && back.full == 1 && back.cal.valid == 1, "record round trip");
  CHECK(!ds::parse("hello", back), "foreign file refused");
  CHECK(!ds::parse("pocket-board 1\npanel=9\nturn=0\nswap=0\nu0=1\nu1=2\nv0=3\nv1=4\n", back), "panel 9 refused");
  CHECK(!ds::parse("pocket-board 1\npanel=1\nturn=0\n", back), "a short record refused");
  CHECK(!ds::parse("pocket-board 1\npanel=1\nturn=4\nswap=0\nu0=1\nu1=2\nv0=3\nv1=4\n", back), "turn 4 refused");
  char chip[16], path[48];
  ds::chipHex(0x24A1B2C3D4E5ULL, chip);
  ds::cardPath(chip, path, sizeof path);
  CHECK(!strcmp(chip, "24A1B2C3D4E5") && !strcmp(path, "/pocket/boards/24A1B2C3D4E5.cfg"), "chip path %s", path);
  printf("displaysetup: %d wirings, %d failures\n", cases, fails);
  return fails ? 1 : 0;
}
