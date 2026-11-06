// Three display steps: Mirror, Landscape (includes every mounting turn), Colors; then touch calibration.
#pragma once
#include <stdint.h>

namespace sf {

constexpr int SQ = 240;  // the square Mirror and Colors draw in
enum Step { FLIP = 0, ORIENT = 1, COLORS = 2, STEPS = 3 };

// The panel's portrait turns that differ in MADCTL's mirror bits only: bit 0 of u = mirrored left to right (MX), bit 1 = upside
// down (MY). They are the LovyanGFX rotations 0, 6, 4 and 2, in that order, and they never touch the row/column exchange.
constexpr uint8_t PORTRAIT_ROT[4] = {0, 6, 4, 2};
// The hardware rotation for a saved setup: soft 0 is an old setup (turns 1, 3, 5, 7: the glass's own landscape), otherwise the
// portrait turn of u.
inline int rotationFor(int u, int soft) { return soft ? PORTRAIT_ROT[u & 3] : 1 + 2 * (u & 3); }
// soft 3 is the third way to land the wide picture: no software turn, the glass itself is 320 wide x 240 tall in these mirror
// turns (some glasses of this model are wired that way round). The other two are the quarter turns; soft 0 an old setup.
constexpr int WIDE = 3;
inline int xfMode(int soft) { return soft >= WIDE ? 0 : soft; }
inline bool isWide(int soft) { return soft == WIDE; }

// A setup in progress.
struct Flow {
  uint8_t step = FLIP, u = 0, soft = 0, color = 0;  // soft: 0 portrait, 1 and 2 the two quarter turns; color: panel bits 1..2 as 0..3
  // the BOOT button's action for this step
  void boot() {
    if (step == FLIP) u ^= 1;
    else if (step == ORIENT) {
      if (soft >= WIDE) { soft = 1; u ^= 3; } else soft++;
    }  // quarter turn, the other, the glass itself, round again
    else if (step == COLORS) color = (color + 1) & 3;
  }
  // OK (a tap anywhere); false after the last step
  bool ok() {
    if (step + 1 >= STEPS) return false;
    step++;
    if (step == ORIENT && !soft) soft = 1;
    return true;
  }
  // Mirror uses the portrait square; Landscape and Colors use the selected orientation.
  int softMode() const { return step >= ORIENT ? xfMode(soft) : 0; }
  bool wide() const { return step >= ORIENT && isWide(soft); }  // the glass is run 320 x 240 (see WIDE)
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
