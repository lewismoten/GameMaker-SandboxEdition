// What the four setup steps draw (setupflow.h), for any graphics object with LovyanGFX's calls (fillScreen, fillRect, drawRect,
// fillTriangle, fillCircle, drawCircle, color565, setTextSize, setTextColor, setCursor, print). The board passes its SoftGfx
// (softgfx.h); host/setupshots.cpp passes a frame buffer that turns and flips like the glass and saves PNGs to look at.
// White on black, big. Steps 1, 2 and 4 draw only inside the 240 x 240 square at the origin; step 3 draws the whole 320 x 240.
// Every step ends with the two controls drawn the way they work: the boxed icon = the BOOT button, OK = tap anywhere.
#pragma once
#include <string.h>
#include "setupflow.h"

namespace sf {

constexpr uint16_t BLACK = 0x0000, WHITE = 0xFFFF, GRAYC = 0x7BEF, REDC = 0xF800, GREENC = 0x07E0, BLUEC = 0x001F, YELLOW = 0xFF2A;

template <class G> void say(G& g, int x, int y, int size, uint16_t c, const char* s) {
  g.setTextSize(size);
  g.setTextColor(c, BLACK);
  g.setCursor(x, y);
  g.print(s);
}
template <class G> void sayCentered(G& g, int cx, int y, int size, uint16_t c, const char* s) { say(g, cx - (int)strlen(s) * 3 * size, y, size, c, s); }

// ---- icons, each in a 52 x 36 box centered on (cx, cy) ----
template <class G> void iconFlip(G& g, int cx, int cy) {  // two triangles facing each other across a dashed line
  g.fillTriangle(cx - 22, cy - 13, cx - 22, cy + 13, cx - 5, cy, WHITE);
  g.fillTriangle(cx + 22, cy - 13, cx + 22, cy + 13, cx + 5, cy, GRAYC);
  for (int y = -15; y <= 13; y += 6) g.fillRect(cx - 1, cy + y, 2, 3, WHITE);
}
template <class G> void iconRotate(G& g, int cx, int cy) {  // a ring with an arrow head: turn
  g.drawCircle(cx, cy, 14, WHITE);
  g.drawCircle(cx, cy, 13, WHITE);
  g.drawCircle(cx, cy, 12, WHITE);
  g.fillRect(cx, cy - 17, 18, 17, BLACK);
  g.fillTriangle(cx - 2, cy - 21, cx - 2, cy - 5, cx + 10, cy - 13, WHITE);
}
template <class G> void iconOrient(G& g, int cx, int cy) {  // a tall box and a wide one
  g.drawRect(cx - 23, cy - 14, 16, 28, WHITE);
  g.drawRect(cx - 22, cy - 13, 14, 26, WHITE);
  g.fillRect(cx - 2, cy - 8, 26, 16, WHITE);
}
template <class G> void iconColors(G& g, int cx, int cy) {  // red, green, blue and an arrow on: step through them
  g.fillCircle(cx - 16, cy - 6, 6, REDC);
  g.fillCircle(cx, cy - 6, 6, GREENC);
  g.fillCircle(cx + 16, cy - 6, 6, BLUEC);
  g.fillRect(cx - 20, cy + 8, 30, 3, WHITE);
  g.fillTriangle(cx + 8, cy + 3, cx + 8, cy + 16, cx + 20, cy + 9, WHITE);
}
template <class G> void iconFor(G& g, int step, int cx, int cy) {
  if (step == FLIP) iconFlip(g, cx, cy);
  else if (step == ROTATE) iconRotate(g, cx, cy);
  else if (step == ORIENT) iconOrient(g, cx, cy);
  else iconColors(g, cx, cy);
}

// The two controls: "[icon] = BOOT button" and "[OK] = tap anywhere", in the bottom 80 rows of the 240 square.
template <class G> void controls(G& g, int step) {
  const int BX = 6, BW = 52, BH = 36;
  for (int row = 0; row < 2; row++) {
    int y = 158 + row * 42;
    g.drawRect(BX, y, BW, BH, WHITE);
    g.drawRect(BX + 1, y + 1, BW - 2, BH - 2, WHITE);
    if (row == 0) iconFor(g, step, BX + BW / 2, y + BH / 2);
    else say(g, BX + 12, y + 10, 2, WHITE, "OK");
    say(g, BX + BW + 8, y + 10, 2, WHITE, row == 0 ? "= BOOT button" : "= tap anywhere");
  }
}
// The board's letter and firmware (fwid.h), small, in the top left corner of every step (up to 29 characters, 6 px each).
template <class G> void idLine(G& g, const char* id) {
  if (id && *id) say(g, 6, 4, 1, GRAYC, id);
}
template <class G> void counter(G& g, int step, int x) {
  char t[4] = {(char)('1' + step), '/', (char)('0' + STEPS), 0};
  say(g, x, 2, 2, GRAYC, t);
}

// Step 1: a word that reads backwards when the picture is mirrored, and a big R that can't be mistaken.
template <class G> void drawFlip(G& g) {
  g.fillScreen(BLACK);
  say(g, 6, 22, 4, WHITE, "MIRROR?");
  say(g, 24, 66, 9, WHITE, "R");
  say(g, 88, 90, 2, GRAYC, "reads right?");
  say(g, 88, 110, 2, GRAYC, "then tap OK");
  counter(g, FLIP, 200);
  controls(g, FLIP);
}
// Step 2: an arrow and UP; upside down means turn.
template <class G> void drawRotate(G& g) {
  g.fillScreen(BLACK);
  g.fillTriangle(70, 12, 28, 62, 112, 62, WHITE);
  g.fillRect(54, 62, 32, 70, WHITE);
  say(g, 130, 56, 5, WHITE, "UP");
  say(g, 126, 112, 2, GRAYC, "arrow up?");
  counter(g, ROTATE, 200);
  controls(g, ROTATE);
}
// Step 3: the wide picture, 320 x 240, with a frame on its edge; it fills the glass when the turn is right.
template <class G> void drawOrient(G& g) {
  g.fillScreen(BLACK);
  for (int i = 0; i < 3; i++) g.drawRect(i, i, 320 - 2 * i, 240 - 2 * i, WHITE);
  sayCentered(g, 160, 14, 4, WHITE, "LANDSCAPE");
  g.fillTriangle(284, 66, 262, 100, 306, 100, WHITE);
  g.fillRect(276, 100, 16, 40, WHITE);
  say(g, 250, 150, 2, WHITE, "UP");
  say(g, 12, 66, 2, GRAYC, "fills the glass?");
  say(g, 12, 90, 2, GRAYC, "reads right?");
  counter(g, ORIENT, 276);
  controls(g, ORIENT);
}
// Step 4: the words in their own colors on black, then a white patch and a black one (outlined).
template <class G> void drawColors(G& g) {
  g.fillScreen(BLACK);
  sayCentered(g, 120, 14, 3, REDC, "RED");
  sayCentered(g, 120, 44, 3, GREENC, "GREEN");
  sayCentered(g, 120, 74, 3, BLUEC, "BLUE");
  g.fillRect(8, 102, 108, 46, WHITE);
  g.setTextSize(2);
  g.setTextColor(BLACK, WHITE);
  g.setCursor(8 + (108 - 60) / 2, 102 + 15);
  g.print("WHITE");
  g.drawRect(124, 102, 108, 46, WHITE);
  say(g, 124 + (108 - 60) / 2, 102 + 15, 2, WHITE, "BLACK");
  counter(g, COLORS, 200);
  controls(g, COLORS);
}
template <class G> void drawStep(G& g, int step, const char* id = "") {
  if (step == FLIP) drawFlip(g);
  else if (step == ROTATE) drawRotate(g);
  else if (step == ORIENT) drawOrient(g);
  else drawColors(g);
  idLine(g, id);
}

}  // namespace sf
