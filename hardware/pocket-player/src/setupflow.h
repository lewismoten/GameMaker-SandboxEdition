// The first-boot setup of the 2.8 inch board in four steps, each answered with two controls that need no touch map and no
// reading: the BOOT button does the step's action and a tap ANYWHERE on the glass is OK. No board code in it (host/setuptest.cpp
// checks all of it on the Mac).
//   1 flip      "MIRROR?"  BOOT mirrors the picture left to right until the word reads right
//   2 rotate    "UP"       BOOT turns the picture half a turn until the arrow points up
//   3 orient    "LANDSCAPE" BOOT turns the wide picture a quarter turn the other way (the glass is run in its portrait turn
//               and the picture is turned in software, see softgfx.h, because some glasses ignore the row/column exchange)
//   4 colors    RED GREEN BLUE  BOOT steps the four color modes (plain, inverted, red/blue swapped, both) until the words
//               are written in their own colors and the patches are white and black
// then the 3-tap touch calibration (touchcal.h works out any touch wiring).
// Steps 1, 2 and 4 draw only inside a 240 x 240 square at the origin, so nothing is clipped in any turn.
#pragma once
#include <stdint.h>

namespace sf {

constexpr int SQ = 240;  // the square steps 1, 2 and 4 draw in
enum Step { FLIP = 0, ROTATE = 1, ORIENT = 2, COLORS = 3, STEPS = 4 };

// The panel's portrait turns that differ in MADCTL's mirror bits only: bit 0 of u = mirrored left to right (MX), bit 1 = upside
// down (MY). They are the LovyanGFX rotations 0, 6, 4 and 2, in that order, and they never touch the row/column exchange.
constexpr uint8_t PORTRAIT_ROT[4] = {0, 6, 4, 2};
// The hardware rotation for a saved setup: soft 0 is an old setup (turns 1, 3, 5, 7: the glass's own landscape), otherwise the
// portrait turn of u.
inline int rotationFor(int u, int soft) { return soft ? PORTRAIT_ROT[u & 3] : 1 + 2 * (u & 3); }

// A setup in progress.
struct Flow {
  uint8_t step = FLIP, u = 0, soft = 0, color = 0;  // soft: 0 portrait, 1 and 2 the two quarter turns; color: panel bits 1..2 as 0..3
  // the BOOT button's action for this step
  void boot() {
    if (step == FLIP) u ^= 1;
    else if (step == ROTATE) u ^= 3;
    else if (step == ORIENT) soft = soft == 1 ? 2 : 1;
    else if (step == COLORS) color = (color + 1) & 3;
  }
  // OK (a tap anywhere); false after the last step
  bool ok() {
    if (step + 1 >= STEPS) return false;
    step++;
    if (step == ORIENT && !soft) soft = 1;
    return true;
  }
  // How the picture is turned on the glass in this step: steps 1 and 2 draw in the panel's portrait turn, step 3 on.
  int softMode() const { return step >= ORIENT ? soft : 0; }
  int rotation() const { return PORTRAIT_ROT[u & 3]; }
  // panelType bits for the colors (2 inverted, 4 red/blue swapped) given the driver bit
  int panelBits(int driver) const { return (driver & 1) | (color << 1); }
};

// The four glass states of the colors step (what the panel shows for each of the four modes it can be put in), as the
// color the words RED, GREEN and BLUE come out in when the glass is in mode m but the picture was drawn for mode `want`.
// Bit 0 of a mode: colors inverted, bit 1: red and blue swapped. Returns the 24 bit color.
inline uint32_t shownColor(uint32_t drawn, int glassMode, int wantMode) {
  int diff = glassMode ^ wantMode;
  uint8_t c[3] = {(uint8_t)(drawn >> 16), (uint8_t)(drawn >> 8), (uint8_t)drawn};
  if (diff & 1) for (int i = 0; i < 3; i++) c[i] = (uint8_t)(255 - c[i]);
  if (diff & 2) { uint8_t t = c[0]; c[0] = c[2]; c[2] = t; }
  return (uint32_t)c[0] << 16 | (uint32_t)c[1] << 8 | c[2];
}

}  // namespace sf
