// Pad symbols shared by firmware bands and the host framebuffer check. Colors match the other controls.
#pragma once
#include <stdint.h>
#include "controls.h"
namespace paddraw {
constexpr uint16_t C_BLACK = 0, C_WHITE = 0xffff, C_YELLOW = 0xff2a;
// Triangle pointing in direction d (0 left, 1 right, 2 up, 3 down) at (cx, cy), size s.
template <class G> void arrow(G& spr, int cx, int cy, int d, int s, bool lit) {
  int x0 = cx, y0 = cy, x1, y1, x2, y2;
  switch (d) {
    case 0: x0 = cx - s; y0 = cy; x1 = cx + s / 2; y1 = cy - s; x2 = cx + s / 2; y2 = cy + s; break;
    case 1: x0 = cx + s; y0 = cy; x1 = cx - s / 2; y1 = cy - s; x2 = cx - s / 2; y2 = cy + s; break;
    case 2: x0 = cx; y0 = cy - s; x1 = cx - s; y1 = cy + s / 2; x2 = cx + s; y2 = cy + s / 2; break;
    default: x0 = cx; y0 = cy + s; x1 = cx - s; y1 = cy - s / 2; x2 = cx + s; y2 = cy - s / 2; break;
  }
  if (lit) spr.fillTriangle(x0, y0, x1, y1, x2, y2, C_YELLOW);
  spr.drawTriangle(x0, y0, x1, y1, x2, y2, lit ? C_BLACK : C_WHITE);
}

// A thick arch rises from the inner foot, crests, then points over toward the chosen side.
// Work in a fixed small grid so the 42 px and 50 px pads retain a clear hump and arrowhead.
inline bool arcPixel(int x, int y) {
  int curve = -6 + (x * x + 4) / 8;
  bool stem = x >= -8 && x <= 5 && y >= curve - 1 && y <= curve + 1;
  bool head = y >= -3 && y <= 4 && x >= 2 + (y + 3) / 2 && x <= 9;
  return stem || head;
}
template <class G> void jumpArc(G& g, int cx, int cy, int side, int size, bool lit) {
  auto on = [size](int x, int y) { return arcPixel(x * 10 / size, y * 10 / size); };
  for (int y = -size; y <= size; y++) for (int x = -size; x <= size; x++) {
    if (!on(x, y)) continue;
    bool edge = !on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1);
    if (edge || lit) g.drawPixel(cx + side * x, cy + y, lit ? (edge ? C_BLACK : C_YELLOW) : C_WHITE);
  }
}
template <class G> void pad(G& spr, const ctl::Layout& L, const ctl::Need& nd, uint8_t d, int bandX = 0, int bandY = 0) {
  const auto& p = L.pad;
  int px = p.cx - bandX, py = p.cy - bandY;
  spr.drawCircle(px, py, p.r + 1, C_BLACK);
  spr.drawCircle(px, py, p.r, C_WHITE);
  spr.drawCircle(px, py, L.deadR, C_WHITE);
  int a = p.r * 2 / 3, s = p.r / 6 + 4;
  if (nd.left) arrow(spr, px - a, py, 0, s, d & 1);
  if (nd.right) arrow(spr, px + a, py, 1, s, d & 2);
  if (nd.up) arrow(spr, px, py - a, 2, s, d & 4);
  if (nd.down) arrow(spr, px, py + a, 3, s, d & 8);
#ifdef POCKET_CYD28
  if (nd.jump) for (int side : {-1, 1}) {
    int x = px + side * p.r / 2, y = py - p.r / 2;
    jumpArc(spr, x, y, side, s - 1, (d & 4) && (d & (side < 0 ? 1 : 2)));
  }
#endif
}
}  // namespace paddraw
