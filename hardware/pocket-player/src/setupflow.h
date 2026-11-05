// The first-boot setup of the 2.8 inch board with no reading and no hunting, and no board code in it (host/setuptest.cpp
// checks all of it on the Mac).
//
// Step 1, which way up: the word TAP is drawn in the four quadrants of the screen, each copy flipped in software (a
// "label": bit 0 mirrored left to right, bit 1 upside down). The panel shows the whole picture flipped by an unknown label
// h, so the copy whose label is h reads right, and it sits at quadrant (its own) xor h. The user taps the copy that reads
// right, three times, each time with the copies shuffled. A tap says only which quarter of the glass was touched in raw
// touch numbers, and the touch chip's wiring is unknown too (swapped axes, either axis counting down: 8 wirings), so one
// tap cannot say which copy it was. LAYOUT is three shuffles chosen (host test, and search script in the commit message)
// so that the three quarters together tell all 32 (flip, wiring) pairs apart: the flip, and the wiring, are both known
// after the third tap.
// Step 2, colors: four bar sets, each pre-colored as one of the four color faults (inverted, red and blue swapped, both,
// neither) would show them, the user taps the set that reads red, green, blue, white, black. The touch is known by then.
// Step 3 is the 3-tap calibration (touchcal.h).
#pragma once
#include <stdint.h>
#include "touchcal.h"

namespace sf {

constexpr int ROUNDS = 3, MID = 2000;  // raw touch values 0..4095, the middle of the usable 300..3700
constexpr int W = 320, H = 240, CELL_W = W / 2, CELL_H = H / 2;  // the four quadrants, 160 x 120 each

// The label shown in each quadrant (bit 0 of the quadrant: right, bit 1: bottom) in each round.
constexpr uint8_t LAYOUT[ROUNDS][4] = {{0, 1, 2, 3}, {0, 2, 3, 1}, {1, 0, 3, 2}};

// A touch wiring: bit 2 = the raw x axis carries the screen's y (swapped), bit 1 = the axis that carries the screen's x counts
// down, bit 0 = the axis that carries y counts down.
constexpr int WIRINGS = 8, FLIPS = 4, PAIRS = FLIPS * WIRINGS;

// Raw touch to its quarter of the glass as the touch chip sees it: bit 0 raw x high, bit 1 raw y high.
inline int rawQuad(int rx, int ry) { return (rx >= MID ? 1 : 0) | (ry >= MID ? 2 : 0); }
// The quarter a tap on glass quadrant p (bit 0 right, bit 1 bottom) reads as, with a wiring.
inline int rawQuadOf(int p, int wiring) {
  int sw = wiring >> 2 & 1, fx = wiring >> 1 & 1, fy = wiring & 1;
  int px = (p & 1) ^ fx, py = (p >> 1) ^ fy;  // the axis that carries x / y, counted from its own end
  return sw ? (py | px << 1) : (px | py << 1);
}
// Where a user who sees the picture flipped by h taps in round r: the glass quadrant of the copy that reads right.
inline int glassQuad(int r, int h) {
  for (int q = 0; q < 4; q++) if (LAYOUT[r][q] == h) return q ^ h;
  return 0;
}
// What the touch chip reports for that tap.
inline int expectedQuad(int r, int h, int wiring) { return rawQuadOf(glassQuad(r, h), wiring); }

// The (flip, wiring) pairs still possible after the taps so far.
struct Solver {
  uint32_t alive = 0xFFFFFFFFu;
  void reset() { alive = 0xFFFFFFFFu; }
  void tap(int r, int quad) {
    for (int i = 0; i < PAIRS; i++)
      if ((alive >> i & 1) && expectedQuad(r, i / WIRINGS, i % WIRINGS) != quad) alive &= ~(1u << i);
  }
  int count() const { int n = 0; for (int i = 0; i < PAIRS; i++) n += alive >> i & 1; return n; }
  int flip() const { for (int i = 0; i < PAIRS; i++) if (alive >> i & 1) return i / WIRINGS; return 0; }
  int wiring() const { for (int i = 0; i < PAIRS; i++) if (alive >> i & 1) return i % WIRINGS; return 0; }
};

// The hardware turns (board.h turnRotation: rotations 1, 3, 5, 7) and the flip each adds to the picture: bit 0 of the turn is
// the half turn (mirrored both ways), bit 1 the mirror (rotation 5 against 1 clears MADCTL's MX, which turns the picture
// upside down in landscape; 7 against 1 clears MY, mirrored left to right). Turns combine by xor, as labels do.
constexpr uint8_t TURN_OF_LABEL[4] = {0, 3, 2, 1};
inline int turnFor(int turn, int flip) { return (turn ^ TURN_OF_LABEL[flip & 3]) & 3; }

// A rough touch calibration from a wiring (the 3-tap one refines it): usable raw span 450..3650 across the screen.
inline tc::Cal roughCal(int wiring) {
  tc::Cal c;
  bool sw = wiring >> 2 & 1, fx = wiring >> 1 & 1, fy = wiring & 1;
  c.swap = sw;
  c.u0 = fx ? 3650 : 450; c.u1 = fx ? 450 : 3650;
  c.v0 = fy ? 3650 : 450; c.v1 = fy ? 450 : 3650;
  c.valid = 1;
  return c;
}

// ---- the word: 17 x 11 cells, drawn 8 pixels each (136 x 88), with an arrow under the T so no flip looks like another ----
constexpr int WORD_W = 17, WORD_H = 11, WORD_SCALE = 8;
inline const char* wordRow(int y) {
  static const char* const rows[WORD_H] = {"#####..###..####.", "..#...#...#.#...#", "..#...#...#.#...#", "..#...#####.####.", "..#...#...#.#....", "..#...#...#.#....", "..#...#...#.#....", ".................", "..#..............", ".###.............", "#####............"};
  return rows[y];
}
// Is cell (x, y) of the word, drawn with label s (mirrored left to right: bit 0, upside down: bit 1), set?
inline bool wordCell(int s, int x, int y) {
  if (s & 1) x = WORD_W - 1 - x;
  if (s & 2) y = WORD_H - 1 - y;
  return wordRow(y)[x] == '#';
}

// ---- step 2: bar sets ----
constexpr int BARS = 5;  // red, green, blue, white, black
constexpr uint8_t BAR_RGB[BARS][3] = {{255, 0, 0}, {0, 255, 0}, {0, 0, 255}, {255, 255, 255}, {0, 0, 0}};
constexpr int HEADER_H = 24, SET_W = W / 2, SET_H = (H - HEADER_H) / 2;  // the four sets, 160 x 108
// A color as the set with label k pre-colors it (bit 0: inverted, bit 1: red and blue swapped).
inline void faulted(int k, int bar, uint8_t out[3]) {
  uint8_t c[3] = {BAR_RGB[bar][0], BAR_RGB[bar][1], BAR_RGB[bar][2]};
  if (k & 1) for (int i = 0; i < 3; i++) c[i] = 255 - c[i];
  if (k & 2) { uint8_t t = c[0]; c[0] = c[2]; c[2] = t; }
  for (int i = 0; i < 3; i++) out[i] = c[i];
}
// The set under a screen point, or -1.
inline int setAt(int x, int y) {
  if (y < HEADER_H || y >= H || x < 0 || x >= W) return -1;
  return (y - HEADER_H) / SET_H * 2 + x / SET_W;
}
// The display-mode bits (displaysetup: 2 inverted, 4 red/blue swapped) to flip when set k is the one that looks right.
inline uint8_t panelBitsFor(int k) { return (uint8_t)((k & 1 ? 2 : 0) | (k & 2 ? 4 : 0)); }

}  // namespace sf
