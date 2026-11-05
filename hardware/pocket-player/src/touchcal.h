// Resistive touch calibration with no board code in it (host/touchcaltest.cpp checks it on the Mac).
// The XPT2046 reports raw 12-bit x,y (0..4095) whose axes may be swapped or flipped against the screen, so the
// calibration screen asks for three taps, each on a target drawn inset by MARGIN pixels: top left, top right,
// bottom left. Which raw axis moved from tap 1 to tap 2 is the screen's x axis (that settles swapped or not), and
// the raw values at the targets give the scale and the direction (flipped or not) of each axis.
#pragma once
#include <stdint.h>
#include <stdlib.h>

namespace tc {

constexpr int MARGIN = 24;      // targets sit this many pixels inside the screen's corners
constexpr int MIN_SPAN = 900;   // raw counts between two targets; less means the taps missed (the whole screen is about 3300)

struct Cal {
  uint8_t swap = 1;                         // 1: screen x comes from raw y
  int16_t u0 = 3700, u1 = 300;              // raw value (on the screen-x axis) at x = MARGIN and at x = W - 1 - MARGIN
  int16_t v0 = 300, v1 = 3700;              // raw value (on the screen-y axis) at y = MARGIN and at y = H - 1 - MARGIN
  uint8_t valid = 0;                        // 1 once calibrated and saved
};

struct Raw { int x, y; };

inline int clampi(int v, int lo, int hi) { return v < lo ? lo : v > hi ? hi : v; }

// Raw reading to screen pixel.
inline void toScreen(const Cal& c, int rx, int ry, int W, int H, int& x, int& y) {
  int u = c.swap ? ry : rx, v = c.swap ? rx : ry;
  int du = c.u1 - c.u0, dv = c.v1 - c.v0;
  if (!du) du = 1;
  if (!dv) dv = 1;
  x = MARGIN + (int)((int64_t)(u - c.u0) * (W - 1 - 2 * MARGIN) / du);
  y = MARGIN + (int)((int64_t)(v - c.v0) * (H - 1 - 2 * MARGIN) / dv);
  x = clampi(x, 0, W - 1);
  y = clampi(y, 0, H - 1);
}

// The three taps (top left, top right, bottom left) to a calibration; false when they don't make sense (tap again).
inline bool solve(const Raw& p1, const Raw& p2, const Raw& p3, Cal& out) {
  int dx12 = abs(p2.x - p1.x), dy12 = abs(p2.y - p1.y);
  bool swap = dy12 > dx12;
  int major12 = swap ? dy12 : dx12, minor12 = swap ? dx12 : dy12;
  if (major12 < MIN_SPAN || minor12 * 2 > major12) return false;
  int dx13 = abs(p3.x - p1.x), dy13 = abs(p3.y - p1.y);
  int major13 = swap ? dx13 : dy13, minor13 = swap ? dy13 : dx13;  // the screen's y axis is the other raw axis
  if (major13 < MIN_SPAN || minor13 * 2 > major13) return false;
  Cal c;
  c.swap = swap;
  c.u0 = swap ? p1.y : p1.x;
  c.u1 = swap ? p2.y : p2.x;
  c.v0 = swap ? p1.x : p1.y;
  c.v1 = swap ? p3.x : p3.y;
  c.valid = 1;
  out = c;
  return true;
}

}  // namespace tc
