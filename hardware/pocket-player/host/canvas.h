// A plain RGB565 canvas with the drawing calls the board's LovyanGFX screens use, and a PNG writer: the same as
// host/playshots.cpp's (copied, so its snapshot hashes stay put), for host/settingstest.cpp. Text is the 6 x 8 bitmap font.
#pragma once
#include <algorithm>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <string>
#include <vector>
#include <zlib.h>
#include "softgfx.h"

// A buffer the overlay draws into, standing in for the board's sprite and screen (plain RGB565).
struct Canvas {
  int W, H;
  std::vector<uint16_t> px;
  uint16_t tc = 0xFFFF;
  float ts = 1;
  Canvas(int w, int h) : W(w), H(h), px((size_t)w * h, 0) {}
  void put(int x, int y, uint16_t c) { if (x >= 0 && y >= 0 && x < W && y < H) px[(size_t)y * W + x] = c; }
  void fillRect(int x, int y, int w, int h, uint16_t c) { for (int j = 0; j < h; j++) for (int i = 0; i < w; i++) put(x + i, y + j, c); }
  void drawRect(int x, int y, int w, int h, uint16_t c) { fillRect(x, y, w, 1, c); fillRect(x, y + h - 1, w, 1, c); fillRect(x, y, 1, h, c); fillRect(x + w - 1, y, 1, h, c); }
  void fillRoundRect(int x, int y, int w, int h, int r, uint16_t c) {
    for (int j = 0; j < h; j++) for (int i = 0; i < w; i++) {
      int dx = i < r ? r - i : i >= w - r ? i - (w - r - 1) : 0, dy = j < r ? r - j : j >= h - r ? j - (h - r - 1) : 0;
      if (dx * dx + dy * dy <= r * r) put(x + i, y + j, c);
    }
  }
  void drawRoundRect(int x, int y, int w, int h, int r, uint16_t c) {
    for (int j = 0; j < h; j++) for (int i = 0; i < w; i++) {
      int dx = i < r ? r - i : i >= w - r ? i - (w - r - 1) : 0, dy = j < r ? r - j : j >= h - r ? j - (h - r - 1) : 0;
      int d = dx * dx + dy * dy;
      bool edge = (i == 0 || j == 0 || i == w - 1 || j == h - 1) && d <= r * r;
      if (edge || (d <= r * r && d > (r - 1) * (r - 1) && (dx || dy))) put(x + i, y + j, c);
    }
  }
  void fillCircle(int x, int y, int r, uint16_t c) { for (int j = -r; j <= r; j++) for (int i = -r; i <= r; i++) if (i * i + j * j <= r * r) put(x + i, y + j, c); }
  void drawCircle(int x, int y, int r, uint16_t c) { for (int j = -r; j <= r; j++) for (int i = -r; i <= r; i++) { int d = i * i + j * j; if (d <= r * r && d > (r - 1) * (r - 1)) put(x + i, y + j, c); } }
  void drawLine(int x, int y, int x1, int y1, uint16_t c) {
    int dx = abs(x1 - x), sx = x < x1 ? 1 : -1, dy = -abs(y1 - y), sy = y < y1 ? 1 : -1, e = dx + dy;
    for (;;) { put(x, y, c); if (x == x1 && y == y1) break; int e2 = 2 * e; if (e2 >= dy) { e += dy; x += sx; } if (e2 <= dx) { e += dx; y += sy; } }
  }
  void drawTriangle(int a, int b, int c, int d, int e, int f, uint16_t col) { drawLine(a, b, c, d, col); drawLine(c, d, e, f, col); drawLine(e, f, a, b, col); }
  void fillTriangle(int a, int b, int c, int d, int e, int f, uint16_t col) {
    auto cross = [](int x, int y, int u, int v, int p, int q) { return (u - x) * (q - y) - (v - y) * (p - x); };
    for (int y = std::min({b, d, f}); y <= std::max({b, d, f}); y++) for (int x = std::min({a, c, e}); x <= std::max({a, c, e}); x++) {
      int s = cross(a, b, c, d, x, y), t = cross(c, d, e, f, x, y), u = cross(e, f, a, b, x, y);
      if ((s >= 0 && t >= 0 && u >= 0) || (s <= 0 && t <= 0 && u <= 0)) put(x, y, col);
    }
  }
  void drawPixel(int x, int y, uint16_t c) { put(x, y, c); }
  void setTextSize(float s) { ts = s; }
  void setTextColor(uint16_t f) { tc = f; }
  void setTextColor(uint16_t f, uint16_t) { tc = f; }
  void setTextDatum(int) {}
  int cx = 0, cy = 0;
  void setCursor(int x, int y) { cx = x; cy = y; }
  void print(const char* s) {  // scaled like the board's font, 1.5 included
    for (; *s; s++, cx += (int)(6 * ts + 0.5f)) for (int j = 0; j < 8; j++) for (int i = 0; i < 6; i++) {
      if (!sg::glyphOn(*s, i, j)) continue;
      int ax = cx + (int)(i * ts), bx = cx + (int)((i + 1) * ts), ay = cy + (int)(j * ts), by = cy + (int)((j + 1) * ts);
      fillRect(ax, ay, bx > ax ? bx - ax : 1, by > ay ? by - ay : 1, tc);
    }
  }
  void fillScreen(uint16_t c) { fillRect(0, 0, W, H, c); }
  int textWidth(const char* s) { return (int)(6 * strlen(s) * ts); }
  void drawString(const char* s, int x, int y) {  // middle_center
    int n = (int)strlen(s), w = (int)(6 * n * ts), h = (int)(8 * ts + 0.5f);
    int x0 = x - w / 2, y0 = y - h / 2;
    for (int k = 0; k < n; k++) for (int j = 0; j < 8; j++) for (int i = 0; i < 6; i++) {
      if (!sg::glyphOn(s[k], i, j)) continue;
      int ax = x0 + (int)((k * 6 + i) * ts), bx = x0 + (int)((k * 6 + i + 1) * ts), ay = y0 + (int)(j * ts), by = y0 + (int)((j + 1) * ts);
      fillRect(ax, ay, bx > ax ? bx - ax : 1, by > ay ? by - ay : 1, tc);
    }
  }
};

inline void writePng(const std::string& path, int w, int h, const std::vector<uint8_t>& rgb) {
  std::vector<uint8_t> raw;
  for (int y = 0; y < h; y++) { raw.push_back(0); raw.insert(raw.end(), rgb.begin() + (size_t)y * w * 3, rgb.begin() + (size_t)(y + 1) * w * 3); }
  uLongf cl = compressBound((uLong)raw.size());
  std::vector<uint8_t> comp(cl);
  compress2(comp.data(), &cl, raw.data(), (uLong)raw.size(), 9);
  FILE* f = fopen(path.c_str(), "wb");
  if (!f) { fprintf(stderr, "cannot write %s\n", path.c_str()); exit(2); }
  auto chunk = [&](const char* t, const uint8_t* d, uint32_t n) {
    uint8_t len[4] = {(uint8_t)(n >> 24), (uint8_t)(n >> 16), (uint8_t)(n >> 8), (uint8_t)n};
    fwrite(len, 1, 4, f);
    fwrite(t, 1, 4, f);
    if (n) fwrite(d, 1, n, f);
    uLong c = crc32(0, (const Bytef*)t, 4);
    if (n) c = crc32(c, d, n);
    uint8_t cr[4] = {(uint8_t)(c >> 24), (uint8_t)(c >> 16), (uint8_t)(c >> 8), (uint8_t)c};
    fwrite(cr, 1, 4, f);
  };
  fwrite("\x89PNG\r\n\x1a\n", 1, 8, f);
  uint8_t ih[13] = {(uint8_t)(w >> 24), (uint8_t)(w >> 16), (uint8_t)(w >> 8), (uint8_t)w, (uint8_t)(h >> 24), (uint8_t)(h >> 16), (uint8_t)(h >> 8), (uint8_t)h, 8, 2, 0, 0, 0};
  chunk("IHDR", ih, 13);
  chunk("IDAT", comp.data(), (uint32_t)cl);
  chunk("IEND", nullptr, 0);
  fclose(f);
}

// The canvas as 8-bit RGB for writePng.
inline std::vector<uint8_t> rgbOf(const Canvas& c) {
  std::vector<uint8_t> v;
  v.reserve(c.px.size() * 3);
  for (uint16_t p : c.px) { v.push_back((uint8_t)((p >> 11) * 255 / 31)); v.push_back((uint8_t)(((p >> 5) & 63) * 255 / 63)); v.push_back((uint8_t)((p & 31) * 255 / 31)); }
  return v;
}
