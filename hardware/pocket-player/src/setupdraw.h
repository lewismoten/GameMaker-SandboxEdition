// What setup steps 1 and 2 draw, for any graphics object with LovyanGFX's calls (fillScreen, fillRect, drawRect, fillCircle,
// drawCircle, color565, setTextSize, setTextColor, setCursor, print). The board passes its LGFX; host/setupshots.cpp passes a
// 320 x 240 frame buffer and saves PNGs to look at. The drawing never reads the hardware turn: the flips are all in the pixels
// (setupflow.h), so the picture is the same buffer whatever the panel does with it.
#pragma once
#include <stdint.h>
#include "setupflow.h"

namespace sf {

constexpr uint16_t BLACK = 0x0000, WHITE = 0xFFFF, GRAYC = 0x7BEF, YELLOW = 0xFF2A;

// Step 1: the word flipped by each box's label, inside the 240 x 240 square (setupflow.h SQ), a pip per round at its center.
// `pips` is how many are filled (the check after the flip is applied shows all).
template <class G> void drawOrient(G& g, int round, int pips) {
  g.fillScreen(BLACK);
  const int S = WORD_SCALE, ox = (BOX - WORD_W * S) / 2, oy = (BOX - WORD_H * S) / 2;
  for (int q = 0; q < 4; q++) {
    int s = LAYOUT[round][q], cx = (q & 1) * BOX, cy = (q >> 1) * BOX;
    g.drawRect(cx + 3, cy + 3, BOX - 6, BOX - 6, GRAYC);
    for (int y = 0; y < WORD_H; y++)
      for (int x = 0; x < WORD_W; x++)
        if (wordCell(s, x, y)) g.fillRect(cx + ox + x * S, cy + oy + y * S, S, S, WHITE);
  }
  for (int i = 0; i < ROUNDS; i++) {
    int x = SQ / 2 - 16 + i * 16, y = SQ / 2;
    g.fillCircle(x, y, 7, BLACK);
    if (i < pips) g.fillCircle(x, y, 5, YELLOW); else g.drawCircle(x, y, 5, YELLOW);
  }
}

// One band's label, the same in every set: black letter with a white outline (it stays readable when the panel inverts).
template <class G> void bandLabel(G& g, int cx, int cy, char letter) {
  char t[2] = {letter, 0};
  g.setTextSize(2);
  g.setTextColor(WHITE);
  for (int dx = -2; dx <= 2; dx += 2)
    for (int dy = -2; dy <= 2; dy += 2)
      if (dx || dy) { g.setCursor(cx - 6 + dx, cy - 8 + dy); g.print(t); }
  g.setTextColor(BLACK);
  g.setCursor(cx - 6, cy - 8);
  g.print(t);
}

// Step 2: four sets of the five bands, each colored as one of the four faults would show it, every band labeled R G B W K.
template <class G> void drawColors(G& g) {
  static const char LABELS[BARS] = {'R', 'G', 'B', 'W', 'K'};
  g.fillScreen(BLACK);
  g.setTextSize(1);
  g.setTextColor(WHITE);
  g.setCursor(8, 8);
  g.print("Tap the set whose colors match the letters");
  const int BW = SET_W / BARS;
  for (int k = 0; k < 4; k++) {
    int x0 = (k & 1) * SET_W, y0 = HEADER_H + (k >> 1) * SET_H;
    for (int b = 0; b < BARS; b++) {
      uint8_t c[3];
      faulted(k, b, c);
      g.fillRect(x0 + 4 + b * (BW - 1), y0 + 4, BW - 2, SET_H - 8, g.color565(c[0], c[1], c[2]));
    }
    g.drawRect(x0 + 2, y0 + 2, SET_W - 4, SET_H - 4, GRAYC);
    for (int b = 0; b < BARS; b++) bandLabel(g, x0 + 4 + b * (BW - 1) + (BW - 2) / 2, y0 + SET_H / 2, LABELS[b]);
  }
}

}  // namespace sf
