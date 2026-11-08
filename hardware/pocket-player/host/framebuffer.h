// Shared host RGB565 framebuffer using the Pocket bitmap font.
#pragma once
#include <algorithm>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include "softgfx.h"

struct Phys {  // the glass: 240 x 320 (W, H), or 320 x 240 for the wide way (sf::WIDE), stored as it is seen
  uint16_t px[480 * 320];
  int W = 240, H = 320;
  int tc = 0xFFFF, bgc = 0, ts = 1, cx = 0, cy = 0;
  bool hasBg = false;
  int fx = 0, fy = 0;   // MADCTL mirror bits
  int clipped = 0;      // writes of a non-black pixel outside the panel
  int outside = 0;      // lit pixels outside the logical square (set by the caller's region test)
  int rowY = -1, rowH = 0, rowOutside = 0, rowBlack = 0;
  int searchY = -1, searchOutside = 0, writes = 0;  // count every write, including black clears
  Phys() { clear(); }
  void clear() { memset(px, 0, sizeof px); clipped = 0; }
  void set(int x, int y, uint16_t c) {
    writes++;
    if (rowY >= 0) {
      if (x < 6 || x >= W - 6 || y < rowY || y >= rowY + rowH) rowOutside++;
      if (!c) rowBlack++;
    }
    if (searchY >= 0 && (x < 8 || x >= 298 || y < searchY || y >= searchY + 16)) searchOutside++;
    if (x < 0 || y < 0 || x >= W || y >= H) { if (c) clipped++; return; }
    if (fx) x = W - 1 - x;
    if (fy) y = H - 1 - y;
    px[y * W + x] = c;
  }
  uint16_t color565(int r, int g, int b) { return (uint16_t)((r >> 3) << 11 | (g >> 2) << 5 | b >> 3); }
  void fillScreen(uint16_t c) { for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) set(x, y, c); }
  void fillRect(int x, int y, int w, int h, uint16_t c) { for (int j = 0; j < h; j++) for (int i = 0; i < w; i++) set(x + i, y + j, c); }
  void drawRect(int x, int y, int w, int h, uint16_t c) { fillRect(x, y, w, 1, c); fillRect(x, y + h - 1, w, 1, c); fillRect(x, y, 1, h, c); fillRect(x + w - 1, y, 1, h, c); }
  void fillRoundRect(int x, int y, int w, int h, int, uint16_t c) { fillRect(x, y, w, h, c); }
  void drawRoundRect(int x, int y, int w, int h, int, uint16_t c) { drawRect(x, y, w, h, c); }
  void fillCircle(int x, int y, int r, uint16_t c) { for (int j = -r; j <= r; j++) for (int i = -r; i <= r; i++) if (i * i + j * j <= r * r) set(x + i, y + j, c); }
  void drawCircle(int x, int y, int r, uint16_t c) { for (int j = -r; j <= r; j++) for (int i = -r; i <= r; i++) { int d = i * i + j * j; if (d <= r * r && d > (r - 1) * (r - 1)) set(x + i, y + j, c); } }
  void drawLine(int, int, int, int, uint16_t) {}
  void fillTriangle(int x0, int y0, int x1, int y1, int x2, int y2, uint16_t c) {
    int minx = std::min({x0, x1, x2}), maxx = std::max({x0, x1, x2}), miny = std::min({y0, y1, y2}), maxy = std::max({y0, y1, y2});
    auto e = [](int ax, int ay, int bx, int by, int x, int y) { return (long)(bx - ax) * (y - ay) - (long)(by - ay) * (x - ax); };
    for (int y = miny; y <= maxy; y++) for (int x = minx; x <= maxx; x++) {
      long a = e(x0, y0, x1, y1, x, y), b = e(x1, y1, x2, y2, x, y), d = e(x2, y2, x0, y0, x, y);
      if ((a >= 0 && b >= 0 && d >= 0) || (a <= 0 && b <= 0 && d <= 0)) set(x, y, c);
    }
  }
  void pushImage(int x, int y, int w, int h, const uint16_t* d) { for (int j = 0; j < h; j++) for (int i = 0; i < w; i++) set(x + i, y + j, d[j * w + i]); }
  void setTextSize(int s) { ts = s; }
  void setTextColor(uint16_t f) { tc = f; hasBg = false; }
  void setTextColor(uint16_t f, uint16_t g) { tc = f; bgc = g; hasBg = true; }
  void setCursor(int x, int y) { cx = x; cy = y; }
  void setTextDatum(int) {}
  void drawString(const char*, int, int) {}
  void print(const char* t) {
    for (; *t; t++, cx += 6 * ts) {
      if (hasBg) fillRect(cx, cy, 6 * ts, 8 * ts, (uint16_t)bgc);
      for (int j = 0; j < 8; j++) for (int i = 0; i < 6; i++) if (sg::glyphOn(*t, i, j)) fillRect(cx + i * ts, cy + j * ts, ts, ts, (uint16_t)tc);
    }
  }
};

