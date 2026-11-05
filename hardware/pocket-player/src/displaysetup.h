// Display setup of the 2.8 inch board, with no board code in it (host/setuptest.cpp checks it on the Mac).
// The screen's buttons all sit in a 200 x 200 square at the panel's memory origin, logical (0,0) in every turn. The
// panel is 240 x 320 in memory, so in any of the four landscape turns that square lands whole in one corner of the
// glass and is never clipped, however the picture is rotated, mirrored or colored. Everything else on that screen is
// information. This file also holds: the touch mapping worked out from one or two taps on that corner (before any
// 3-tap calibration), the saved record (text, kept in NVS and on the card at /pocket/boards/<chip id>.cfg) and the
// button effects.
#pragma once
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include "touchcal.h"

namespace ds {

constexpr int SQ = 200;          // the square's side
constexpr int TX0 = tc::MARGIN;  // first touch target (top left of the square, x and y)
constexpr int TX1 = 176;         // second target, same y, further along the square's top edge
constexpr int TY = tc::MARGIN;
constexpr int PANELS = 8, TURNS = 4;

enum Btn { ROT, MIR, RB, INV, DRV, OK, NBTN };  // turn 180, mirror, swap red and blue, invert colors, driver, done
constexpr int COLS = 2, ROWS = 3, CELL_W = SQ / COLS, CELL_H = SQ / ROWS;  // 100 x 66

struct Rect { int x0, y0, x1, y1; };
inline Rect rect(int b) { return {(b % COLS) * CELL_W, (b / COLS) * CELL_H, (b % COLS + 1) * CELL_W, (b / COLS + 1) * CELL_H}; }
// Which button is at screen (x, y), or -1.
inline int hit(int x, int y) {
  if (x < 0 || y < 0 || x >= SQ || y >= CELL_H * ROWS) return -1;
  return (y / CELL_H) * COLS + x / CELL_W;
}

// One button's effect on the display mode (panel bits: 1 ST7789, 2 inverted, 4 red/blue swapped) and the turn (bit 0 is
// the half turn, bit 1 the mirror). Returns true when the picture changes (OK changes nothing).
inline bool press(int b, uint8_t& panel, uint8_t& turn) {
  switch (b) {
    case ROT: turn ^= 1; return true;
    case MIR: turn ^= 2; return true;
    case RB: panel ^= 4; return true;
    case INV: panel ^= 2; return true;
    case DRV: panel ^= 1; return true;
  }
  return false;
}
// A change of driver or color order restarts the board (the driver is chosen before the panel starts); a turn is live.
inline bool needsRestart(int b) { return b == RB || b == INV || b == DRV; }

// ---- touch mapping from taps on the square's corner ----------------------------------------------------------------
// The user touches the dot at (TX0, TY), then (when the axes' order is not known yet) the dot at (TX1, TY). Raw values
// run 0..4095 across the glass, so a tap near the screen's left edge reads below the middle on the axis that runs along
// it when that axis counts up, above when it counts down: one tap settles both directions. The second tap, which moved
// along the screen's x, settles which raw axis that is. Not a calibration (the 3-tap one is the exact one), just enough
// to hit buttons that are 100 x 66 pixels.
inline int absi(int v) { return v < 0 ? -v : v; }
inline void finish(int swap, int rx, int ry, int perPxU, tc::Cal& out, int W, int H) {
  // perPxU: counts per pixel along the screen's x axis (positive); y has W/H times as many (the same raw span, fewer pixels)
  int u = swap ? ry : rx, v = swap ? rx : ry;
  int su = u < 2048 ? perPxU : -perPxU;
  int perPxV = perPxU * W / H;
  int sv = v < 2048 ? perPxV : -perPxV;
  tc::Cal c;
  c.swap = swap;
  c.u0 = (int16_t)u;
  c.u1 = (int16_t)(u + su * (W - 1 - 2 * tc::MARGIN));
  c.v0 = (int16_t)v;
  c.v1 = (int16_t)(v + sv * (H - 1 - 2 * tc::MARGIN));
  c.valid = 1;
  out = c;
}
// Two taps: first at (TX0, TY), second at (TX1, TY). False when they don't look like that (the same spot, a diagonal).
inline bool fromTwo(const tc::Raw& a, const tc::Raw& b, int W, int H, tc::Cal& out) {
  int dx = absi(b.x - a.x), dy = absi(b.y - a.y);
  int swap = dy > dx;
  int major = swap ? dy : dx, minor = swap ? dx : dy;
  if (major < tc::MIN_SPAN * (TX1 - TX0) / (W - 1 - 2 * tc::MARGIN) || minor * 2 > major) return false;
  finish(swap, a.x, a.y, major / (TX1 - TX0), out, W, H);
  return true;
}
// One tap at (TX0, TY) when the order of the axes and their scale are known from before (`prev`, any earlier calibration).
inline bool fromOne(const tc::Raw& a, const tc::Cal& prev, int W, int H, tc::Cal& out) {
  int span = absi(prev.u1 - prev.u0), px = W - 1 - 2 * tc::MARGIN;
  int per = span / px;
  if (per < 4 || per > 40) per = 12;  // an unset or odd previous calibration: about the usual 3600 counts over 300 pixels
  int u = prev.swap ? a.y : a.x;
  if (u <= 0 || u >= 4095) return false;
  finish(prev.swap, a.x, a.y, per, out, W, H);
  return true;
}

// ---- the saved record -------------------------------------------------------------------------------------------
// state: 0 never set up, 1 set up begun (a display change restarted the board, or it was never finished), 3 saved.
struct Record {
  uint8_t panel = 0, turn = 0;
  tc::Cal cal;
  uint8_t full = 0;  // 1 when the 3-tap calibration was done after the last display change
};
inline bool valid(const Record& r) {
  auto in = [](int v) { return v >= 0 && v <= 4095; };
  return r.panel < PANELS && r.turn < TURNS && r.cal.swap <= 1 && in(r.cal.u0) && in(r.cal.u1) && in(r.cal.v0) && in(r.cal.v1);
}
inline int format(const Record& r, char* out, int n) {
  return snprintf(out, n, "pocket-board 1\npanel=%d\nturn=%d\nswap=%d\nu0=%d\nu1=%d\nv0=%d\nv1=%d\nfull=%d\n", r.panel, r.turn, r.cal.swap,
                  r.cal.u0, r.cal.u1, r.cal.v0, r.cal.v1, r.full);
}
// Parses a record; false for anything that is not one of ours or has values out of range.
inline bool parse(const char* text, Record& out) {
  if (strncmp(text, "pocket-board 1", 14) != 0) return false;
  Record r;
  int seen = 0;
  const char* p = text;
  while (*p) {
    const char* e = strchr(p, '\n');
    int len = e ? (int)(e - p) : (int)strlen(p);
    char line[40];
    if (len > 0 && len < (int)sizeof line) {
      memcpy(line, p, len);
      line[len] = 0;
      char* eq = strchr(line, '=');
      if (eq) {
        *eq = 0;
        int v = atoi(eq + 1);
        if (!strcmp(line, "panel")) { r.panel = (uint8_t)v; seen |= 1; }
        else if (!strcmp(line, "turn")) { r.turn = (uint8_t)v; seen |= 2; }
        else if (!strcmp(line, "swap")) { r.cal.swap = (uint8_t)v; seen |= 4; }
        else if (!strcmp(line, "u0")) { r.cal.u0 = (int16_t)v; seen |= 8; }
        else if (!strcmp(line, "u1")) { r.cal.u1 = (int16_t)v; seen |= 16; }
        else if (!strcmp(line, "v0")) { r.cal.v0 = (int16_t)v; seen |= 32; }
        else if (!strcmp(line, "v1")) { r.cal.v1 = (int16_t)v; seen |= 64; }
        else if (!strcmp(line, "full")) r.full = v ? 1 : 0;
      }
    }
    if (!e) break;
    p = e + 1;
  }
  r.cal.valid = 1;
  if (seen != 127 || !valid(r)) return false;
  out = r;
  return true;
}
// The chip's id (the ESP32's 48-bit efuse MAC) as 12 hex digits, and the card file for it.
inline void chipHex(uint64_t mac, char* out) { snprintf(out, 13, "%012llX", (unsigned long long)(mac & 0xFFFFFFFFFFFFULL)); }
inline void cardPath(const char* chip, char* out, int n) { snprintf(out, n, "/pocket/boards/%s.cfg", chip); }

}  // namespace ds
