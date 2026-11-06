// The on-screen controls of the Pocket Player: Left, Right, Jump, and Up/Down for ladders, drawn over
// the game as darkened squares with a symbol. Pure arithmetic per pixel, so it composes into the
// game's own rows (main.cpp) and needs no extra redraw pass.
#pragma once
#include <stdint.h>

namespace ui {

enum Btn { LEFT, RIGHT, JUMP, UP, DOWN, NBTN };
struct Rect { int x0, y0, x1, y1; };  // x1 and y1 exclusive
constexpr Rect rects[NBTN] = {
    {6, 214, 86, 294},     // Left
    {92, 214, 172, 294},   // Right
    {394, 214, 474, 294},  // Jump
    {304, 214, 384, 254},  // Up
    {304, 254, 384, 294},  // Down
};
constexpr int SLOP = 10;  // a touch this close outside a button still counts
constexpr int scans[NBTN] = {0x4B, 0x4D, 0x39, 0x48, 0x50};  // the keys the hero's sequences use

inline bool hit(int b, int x, int y) {
  const Rect& r = rects[b];
  return x >= r.x0 - SLOP && x < r.x1 + SLOP && y >= r.y0 - SLOP && y < r.y1 + SLOP;
}
inline int abs_(int v) { return v < 0 ? -v : v; }

// What to draw at screen pixel (X, Y) for button b: 0 nothing (show the game), 1 shade the game,
// 2 border, 3 symbol.
inline int pixel(int b, int X, int Y) {
  const Rect& r = rects[b];
  if (X < r.x0 || X >= r.x1 || Y < r.y0 || Y >= r.y1) return 0;
  if (X == r.x0 || X == r.x1 - 1 || Y == r.y0 || Y == r.y1 - 1) return 2;
  int lx = X - (r.x0 + r.x1) / 2, ly = Y - (r.y0 + r.y1) / 2;
  bool sym = false;
  switch (b) {
    case LEFT: sym = lx >= -20 && lx <= 14 && abs_(ly) <= (lx + 20) * 4 / 5; break;
    case RIGHT: sym = lx <= 20 && lx >= -14 && abs_(ly) <= (20 - lx) * 4 / 5; break;
    case UP: sym = ly >= -12 && ly <= 8 && abs_(lx) <= (ly + 12) * 3 / 2; break;
    case DOWN: sym = ly <= 12 && ly >= -8 && abs_(lx) <= (12 - ly) * 3 / 2; break;
    case JUMP: {
      int d2 = lx * lx + ly * ly;
      sym = (d2 >= 22 * 22 && d2 <= 28 * 28) || d2 <= 10 * 10;
      break;
    }
  }
  return sym ? 3 : 1;
}

// Does any button cover (X, Y)'s row? Rows outside the controls skip the per-pixel work.
inline bool rowHasButtons(int Y) { return Y >= 214 && Y < 294; }

}  // namespace ui
