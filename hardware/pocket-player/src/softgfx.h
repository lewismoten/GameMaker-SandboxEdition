// Software landscape for the 2.8 inch board, with no board code in it (host/setuptest.cpp and host/setupshots.cpp use it on the Mac).
// Some of these glasses ignore the display chip's row/column exchange (MADCTL's MV bit): a 320 x 240 picture then lands
// clipped and mirrored on the 240 x 320 panel. So the panel is always run in a portrait turn (240 x 320) and the picture is
// turned in software: mode 1 turns it a quarter clockwise, mode 2 a quarter the other way, mode 0 draws as is (portrait, or
// the old hardware landscape turns). Xf is the pure map; SoftGfx wraps a graphics object with LovyanGFX's calls (the board's
// LGFX) and sends every shape and text through the map, and pushImage transposed. Text is drawn from the 6 x 8 glyph table
// (softfont.h), a glyph at a time. Mode 0 passes everything straight through (the 3.5 inch board and old setups are untouched).
#pragma once
#include <stdint.h>
#include <string.h>
#include "softfont.h"

namespace sg {

constexpr int LW = 320, LH = 240;  // the logical canvas in modes 1 and 2
constexpr int PW = 240, PH = 320;  // the panel in its portrait turn

struct Xf {
  uint8_t mode = 0;  // 0 none, 1 quarter turn clockwise (x,y -> PW-1-y, x), 2 the other way (x,y -> y, PH-1-x)
  void pt(int x, int y, int& px, int& py) const {
    if (mode == 1) { px = PW - 1 - y; py = x; }
    else if (mode == 2) { px = y; py = PH - 1 - x; }
    else { px = x; py = y; }
  }
  void rect(int x, int y, int w, int h, int& px, int& py, int& pw, int& ph) const {
    if (mode == 1) { px = PW - y - h; py = x; pw = h; ph = w; }
    else if (mode == 2) { px = y; py = PH - x - w; pw = h; ph = w; }
    else { px = x; py = y; pw = w; ph = h; }
  }
  // the logical point under a panel point (the inverse)
  void inv(int px, int py, int& x, int& y) const {
    if (mode == 1) { x = py; y = PW - 1 - px; }
    else if (mode == 2) { x = PH - 1 - py; y = px; }
    else { x = px; y = py; }
  }
};

// Where a band of `rows` full-width lines at logical (x0, y0), `w` wide, lands on the panel, and where each pixel goes in the
// transposed copy: out[row * pw + col]. Returns false in mode 0 (push as is).
inline bool bandRect(const Xf& f, int x0, int y0, int w, int rows, int& px, int& py, int& pw, int& ph) {
  if (!f.mode) return false;
  f.rect(x0, y0, w, rows, px, py, pw, ph);
  return true;
}
inline void transposeBand(const Xf& f, const uint16_t* in, int w, int rows, uint16_t* out) {
  if (f.mode == 1) {  // pixel (X, r): col = rows-1-r, row = X
    for (int r = 0; r < rows; r++) for (int X = 0; X < w; X++) out[X * rows + (rows - 1 - r)] = in[r * w + X];
  } else {  // mode 2: col = r, row = w-1-X
    for (int r = 0; r < rows; r++) for (int X = 0; X < w; X++) out[(w - 1 - X) * rows + r] = in[r * w + X];
  }
}

constexpr int GLYPH_W = 6, GLYPH_H = 8, MAX_SIZE = 4;
inline bool glyphOn(char ch, int gx, int gy) {
  int g = (unsigned char)ch - 32;
  if (g < 0 || g >= 95 || gx < 0 || gx >= GLYPH_W || gy < 0 || gy >= GLYPH_H) return false;
  return SOFT_FONT[g][gy] >> gx & 1;
}
inline uint16_t swap16(uint16_t v) { return (uint16_t)((v << 8) | (v >> 8)); }

// B: LovyanGFX's calls (fillRect, drawRect, fillRoundRect, drawRoundRect, fillCircle, drawCircle, fillTriangle, drawLine,
// fillScreen, pushImage) and, for mode 0, its text calls too.
template <class B> class SoftGfx {
  B& b;
  Xf xf;
  int cx = 0, cy = 0, ts = 1, datum = 0;
  uint16_t fg = 0xFFFF, bg = 0;
  bool hasBg = false;
  uint16_t* tbuf = nullptr;  // for pushImage in the modes 1 and 2: as big as the biggest band

 public:
  explicit SoftGfx(B& base) : b(base) {}
  B& base() { return b; }
  void setMode(int m) { xf.mode = (uint8_t)m; }
  int mode() const { return xf.mode; }
  void setBandBuffer(uint16_t* p) { tbuf = p; }

  void fillScreen(uint16_t c) { b.fillScreen(c); }
  void fillRect(int x, int y, int w, int h, uint16_t c) { int a, d, e, f; xf.rect(x, y, w, h, a, d, e, f); b.fillRect(a, d, e, f, c); }
  void drawRect(int x, int y, int w, int h, uint16_t c) { int a, d, e, f; xf.rect(x, y, w, h, a, d, e, f); b.drawRect(a, d, e, f, c); }
  void fillRoundRect(int x, int y, int w, int h, int r, uint16_t c) { int a, d, e, f; xf.rect(x, y, w, h, a, d, e, f); b.fillRoundRect(a, d, e, f, r, c); }
  void drawRoundRect(int x, int y, int w, int h, int r, uint16_t c) { int a, d, e, f; xf.rect(x, y, w, h, a, d, e, f); b.drawRoundRect(a, d, e, f, r, c); }
  void fillCircle(int x, int y, int r, uint16_t c) { int a, d; xf.pt(x, y, a, d); b.fillCircle(a, d, r, c); }
  void drawCircle(int x, int y, int r, uint16_t c) { int a, d; xf.pt(x, y, a, d); b.drawCircle(a, d, r, c); }
  void drawLine(int x0, int y0, int x1, int y1, uint16_t c) { int a, d, e, f; xf.pt(x0, y0, a, d); xf.pt(x1, y1, e, f); b.drawLine(a, d, e, f, c); }
  void fillTriangle(int x0, int y0, int x1, int y1, int x2, int y2, uint16_t c) {
    int p[6];
    xf.pt(x0, y0, p[0], p[1]); xf.pt(x1, y1, p[2], p[3]); xf.pt(x2, y2, p[4], p[5]);
    b.fillTriangle(p[0], p[1], p[2], p[3], p[4], p[5], c);
  }
  // A band of the game picture (words already in the panel's byte order, as the board builds them).
  void pushImage(int x, int y, int w, int h, const uint16_t* data) {
    if (!xf.mode || !tbuf) { b.pushImage(x, y, w, h, data); return; }
    int a, d, e, f;
    xf.rect(x, y, w, h, a, d, e, f);
    transposeBand(xf, data, w, h, tbuf);
    b.pushImage(a, d, e, f, tbuf);
  }

  // ---- text ----
  void setTextSize(int s) { ts = s; b.setTextSize(s); }
  void setTextColor(uint16_t f) { fg = f; hasBg = false; b.setTextColor(f); }
  void setTextColor(uint16_t f, uint16_t g) { fg = f; bg = g; hasBg = true; b.setTextColor(f, g); }
  void setCursor(int x, int y) { cx = x; cy = y; b.setCursor(x, y); }
  // the base's own datum enum (LovyanGFX's textdatum_t: middle_center is 5); only middle center is told apart
  template <class D> void setTextDatum(D d) { datum = ((int)d == 5) ? 1 : 0; b.setTextDatum(d); }
  int textWidth(const char* s) const { return (int)strlen(s) * GLYPH_W * ts; }
  void print(const char* s) {
    if (!xf.mode) { b.print(s); return; }
    for (; *s; s++) {
      if (*s == '\n') { cx = 0; cy += GLYPH_H * ts; continue; }
      glyph(*s, cx, cy);
      cx += GLYPH_W * ts;
    }
  }
  void drawString(const char* s, int x, int y) {
    if (!xf.mode) { b.drawString(s, x, y); return; }
    int w = textWidth(s), h = GLYPH_H * ts;
    if (datum == 1) { x -= w / 2; y -= h / 2; }
    int sx = cx, sy = cy;
    cx = x; cy = y;
    print(s);
    cx = sx; cy = sy;
  }

 private:
  // One glyph at logical (x, y), size ts: an opaque cell with a background color, else only its lit pixels in runs.
  void glyph(char ch, int x, int y) {
    int cw = GLYPH_W * ts, chh = GLYPH_H * ts;
    if (ts > MAX_SIZE) return;
    if (hasBg) {
      static uint16_t gb[GLYPH_W * GLYPH_H * MAX_SIZE * MAX_SIZE];
      int px, py, pw, ph;
      xf.rect(x, y, cw, chh, px, py, pw, ph);
      uint16_t on = swap16(fg), off = swap16(bg);
      for (int v = 0; v < ph; v++)
        for (int u = 0; u < pw; u++) {
          int lx, ly;
          xf.inv(px + u, py + v, lx, ly);
          gb[v * pw + u] = glyphOn(ch, (lx - x) / ts, (ly - y) / ts) ? on : off;
        }
      b.pushImage(px, py, pw, ph, gb);
      return;
    }
    for (int gy = 0; gy < GLYPH_H; gy++) {
      int gx = 0;
      while (gx < GLYPH_W) {
        if (!glyphOn(ch, gx, gy)) { gx++; continue; }
        int run = 1;
        while (gx + run < GLYPH_W && glyphOn(ch, gx + run, gy)) run++;
        fillRect(x + gx * ts, y + gy * ts, run * ts, ts, fg);
        gx += run;
      }
    }
  }
};

}  // namespace sg
