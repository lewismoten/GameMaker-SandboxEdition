// Pad symbols shared by firmware bands and the host framebuffer check. Colors match the other controls.
#pragma once
#include <stdint.h>
#include "controls.h"
namespace paddraw {
constexpr uint16_t C_BLACK = 0, C_WHITE = 0xffff, C_YELLOW = 0xff2a, C_FILL = 0x7bef;  // C_FILL: a jump arc at rest is a solid mid gray with a white edge
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

// A thick half ring, open below, whose outer end carries a solid arrowhead pointing down: Left (or Right) and Jump together.
// Work in a fixed small grid so the 42 px and 50 px pads retain a clear hump and arrowhead.
inline bool arcPixel(int x, int y) {
  int r2 = x * x + y * y;
  bool ring = y <= 2 && r2 >= 13 && r2 <= 44;
  int dx = x > 5 ? x - 5 : 5 - x;
  bool head = y >= 2 && y <= 9 && dx <= (9 - y) / 2 + 1;
  return ring || head;
}
template <class G> void jumpArc(G& g, int cx, int cy, int side, int size, bool lit) {
  auto on = [size](int x, int y) { return arcPixel(x * 10 / size, y * 10 / size); };
  for (int y = -size; y <= size; y++) for (int x = -size; x <= size; x++) {
    if (!on(x, y)) continue;
    bool edge = !on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1);
    g.drawPixel(cx + side * x, cy + y, edge ? (lit ? C_BLACK : C_WHITE) : (lit ? C_YELLOW : C_FILL));
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
  if (L.arcs) for (int side : {-1, 1}) {
    int x = px + side * p.r / 2, y = py - p.r / 2;
    jumpArc(spr, x, y, side, s, (d & 4) && (d & (side < 0 ? 1 : 2)));
  }
}
// The floating pad drawn see-through (ctl::LOOK_FAINT half, ctl::LOOK_DIM a quarter): every pixel is mixed with the picture
// under it, straight in a band of panel colors (byte-swapped RGB565 on the board, plain on the Mac). It has the calls
// pad() uses, clipped to the band; no buffer of its own.
struct Faint {
  uint16_t* px;
  int w, h, look;
  bool swapped;
  static uint16_t sw(uint16_t c) { return (uint16_t)((c << 8) | (c >> 8)); }
  static uint16_t half(uint16_t a, uint16_t b) { return (uint16_t)(((a & 0xF7DE) >> 1) + ((b & 0xF7DE) >> 1)); }
  void drawPixel(int x, int y, uint16_t c) {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    uint16_t& d = px[y * w + x];
    uint16_t under = swapped ? sw(d) : d, m = half(under, c);
    if (look < ctl::LOOK_FAINT) m = half(under, m);
    d = swapped ? sw(m) : m;
  }
  void drawCircle(int cx, int cy, int r, uint16_t c) {
    int j0 = -r > -cy ? -r : -cy, j1 = r < h - 1 - cy ? r : h - 1 - cy;
    for (int j = j0; j <= j1; j++)
      for (int i = -r; i <= r; i++) { int d = i * i + j * j; if (d <= r * r && d > (r - 1) * (r - 1)) drawPixel(cx + i, cy + j, c); }
  }
  void drawLine(int x, int y, int x1, int y1, uint16_t c) {
    int dx = x1 > x ? x1 - x : x - x1, sx = x < x1 ? 1 : -1, dy = -(y1 > y ? y1 - y : y - y1), sy = y < y1 ? 1 : -1, e = dx + dy;
    for (;;) { drawPixel(x, y, c); if (x == x1 && y == y1) break; int e2 = 2 * e; if (e2 >= dy) { e += dy; x += sx; } if (e2 <= dx) { e += dx; y += sy; } }
  }
  void drawTriangle(int a, int b, int c, int d, int e, int f, uint16_t k) { drawLine(a, b, c, d, k); drawLine(c, d, e, f, k); drawLine(e, f, a, b, k); }
  void fillTriangle(int a, int b, int c, int d, int e, int f, uint16_t k) {
    auto cross = [](int x, int y, int u, int v, int p, int q) { return (u - x) * (q - y) - (v - y) * (p - x); };
    auto mn = [](int p, int q, int r) { return p < q ? (p < r ? p : r) : (q < r ? q : r); };
    auto mx = [](int p, int q, int r) { return p > q ? (p > r ? p : r) : (q > r ? q : r); };
    for (int y = mn(b, d, f); y <= mx(b, d, f); y++)
      for (int x = mn(a, c, e); x <= mx(a, c, e); x++) {
        int s = cross(a, b, c, d, x, y), t = cross(c, d, e, f, x, y), u = cross(e, f, a, b, x, y);
        if ((s >= 0 && t >= 0 && u >= 0) || (s <= 0 && t <= 0 && u <= 0)) drawPixel(x, y, k);
      }
  }
};
}  // namespace paddraw
