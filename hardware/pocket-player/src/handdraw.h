// The "How to hold it" hand, drawn from handshape.h (art/hand-left.svg, made by Lewis Moten with ChatGPT's image generation,
// OpenAI; tools/svgHand.py turned it into polygons). Each shape in draw order: a nonzero-winding polygon fill with 4 sub-scanlines
// and exact horizontal coverage (anti-aliased edges), then its stroke as a distance to the polyline. A shape marked `behind`
// (the curled fingers) shows only outside the board, so the fingers come out from under its bottom edge. A mirror image makes
// the right hand. The hand is a friendly cartoon mint green, not a skin tone, with a blue cuff. No board code: the Mac renders it.
#pragma once
#include <stdint.h>
#include "handshape.h"
#include "screen.h"
namespace hd {
constexpr uint16_t rgb(int r, int g, int b) { return (uint16_t)(((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3)); }
constexpr uint16_t FILL = rgb(0x9E, 0xE6, 0xB8), SHADE = rgb(0x5F, 0xBF, 0x86), LIGHT = rgb(0xD4, 0xF7, 0xE1), NAIL = rgb(0xC8, 0xF2, 0xD6),
                   NAIL_LINE = rgb(0x7B, 0xCB, 0x98), LINE = rgb(0x2E, 0x4A, 0x3A), CUFF = rgb(0x07, 0x89, 0xE6);
inline uint16_t mix(uint16_t a, uint16_t b, float t) {  // RGB565 blend, t of b
  if (t <= 0) return a;
  if (t >= 1) return b;
  int ar = a >> 11, ag = (a >> 5) & 63, ab = a & 31, br = b >> 11, bg = (b >> 5) & 63, bb = b & 31;
  int r = ar + (int)((br - ar) * t + (br > ar ? 0.5f : -0.5f)), g = ag + (int)((bg - ag) * t + (bg > ag ? 0.5f : -0.5f)),
      bl = ab + (int)((bb - ab) * t + (bb > ab ? 0.5f : -0.5f));
  return (uint16_t)((r << 11) | (g << 5) | bl);
}
inline uint16_t fillColor(hs::Role r) {
  switch (r) {
    case hs::CUFF: return CUFF;
    case hs::SKIN: return FILL;
    case hs::SKIN_SHADE: return SHADE;
    case hs::NAIL: return NAIL;
    case hs::HIGHLIGHT: return LIGHT;
    default: return LINE;
  }
}
// Where the hand lands: scale (pixels per unit of the art), the screen position of its thumbnail's center, and the side.
// The hand is turned a little (c, sn: cosine and sine) about its thumbnail's center, so a slightly different size still reaches.
struct Place { float s, tipX, tipY, c, sn; int side; };
inline float sx(const Place& p, int i) {
  const float u = hs::pts[2 * i] - hs::TIP_X, v = hs::pts[2 * i + 1] - hs::TIP_Y;
  return p.tipX + (u * p.c + v * p.sn) * p.s * (p.side < 0 ? 1.0f : -1.0f);
}
inline float sy(const Place& p, int i) {
  const float u = hs::pts[2 * i] - hs::TIP_X, v = hs::pts[2 * i + 1] - hs::TIP_Y;
  return p.tipY + (-u * p.sn + v * p.c) * p.s;
}
// Size that puts the palm's vertical outline just outside a border `d` pixels from the thumbnail's column.
inline float flushScale(float d) { return d / (hs::TIP_X - (hs::SEG_X + hs::HALF_STROKE)); }
// The hand of size s (a mirror image for side +1): its thumbnail's center on column tipX and the index finger's flat top on the board's
// bottom edge `edgeY`. With tipX at flushScale's distance from the board's outer edge, the palm's vertical outline (where the hand
// goes behind the device) ends exactly at that edge, so it sits just outside the border line and never covers it.
inline Place fit(int side, int tipX, int edgeY, float s) {
  Place p{s, (float)tipX, 0, 1.0f, 0.0f, side};
  p.tipY = edgeY - (hs::EDGE_Y - hs::TIP_Y) * s;
  return p;
}
// The screen rows the palm's vertical outline covers.
inline float segTop(const Place& p) { return p.tipY + (hs::SEG_Y0 - hs::TIP_Y) * p.s; }
inline float segBottom(const Place& p) { return p.tipY + (hs::SEG_Y1 - hs::TIP_Y) * p.s; }

// Draws the hand. `bg(x, y)` is the color under a pixel, `behind(x, y)` how much of a pixel is outside the board (0 to 1).
template <class G, class BG, class BEHIND> void draw(G& g, const Place& pl, BG bg, BEHIND behind) {
  static float X[hs::POINTS], Y[hs::POINTS];
  static float cov[scr::W + 2], scov[scr::W + 2];
  static uint16_t col[scr::W + 2];
  static uint8_t any[scr::W + 2];
  struct Cross { float x; int d; };
  Cross xs[96];
  for (int i = 0; i < hs::POINTS; i++) { X[i] = sx(pl, i); Y[i] = sy(pl, i); }
  float xA = 1e9f, xB = -1e9f, yA = 1e9f, yB = -1e9f;
  for (int i = 0; i < hs::POINTS; i++) {
    if (X[i] < xA) xA = X[i];
    if (X[i] > xB) xB = X[i];
    if (Y[i] < yA) yA = Y[i];
    if (Y[i] > yB) yB = Y[i];
  }
  int xa = (int)xA - 3, xb = (int)xB + 3, ya = (int)yA - 3, yb = (int)yB + 3;
  if (xa < 0) xa = 0;
  if (xb >= scr::W) xb = scr::W - 1;
  if (ya < 0) ya = 0;
  if (yb >= scr::H) yb = scr::H - 1;
  for (int y = ya; y <= yb; y++) {
    for (int x = xa; x <= xb; x++) { col[x] = bg(x, y); any[x] = 0; }
    for (int si = 0; si < hs::SHAPES; si++) {
      const hs::Shape& sh = hs::shapes[si];
      // the fill: 4 sub-scanlines of nonzero winding
      if (sh.role != hs::CREASE) {
        for (int x = xa; x <= xb; x++) cov[x] = 0;
        for (int ss = 0; ss < 4; ss++) {
          const float yy = y + (ss + 0.5f) * 0.25f;
          int n = 0;
          for (int k = 0; k < sh.subs; k++) {
            const hs::Sub& sb = hs::subs[sh.first + k];
            for (int i = 0; i < sb.n; i++) {
              const int a = sb.start + i, b = sb.start + (i + 1 == sb.n ? 0 : i + 1);
              if ((Y[a] <= yy) == (Y[b] <= yy) || n >= 96) continue;
              xs[n++] = {X[a] + (yy - Y[a]) / (Y[b] - Y[a]) * (X[b] - X[a]), Y[b] > Y[a] ? 1 : -1};
            }
          }
          for (int i = 1; i < n; i++) { Cross c = xs[i]; int j = i - 1; while (j >= 0 && xs[j].x > c.x) { xs[j + 1] = xs[j]; j--; } xs[j + 1] = c; }
          int w = 0;
          for (int i = 0; i + 1 < n; i++) {
            w += xs[i].d;
            if (!w) continue;
            float x0 = xs[i].x < xa ? xa : xs[i].x, x1 = xs[i + 1].x > xb + 1 ? xb + 1 : xs[i + 1].x;
            if (x1 <= x0) continue;
            int i0 = (int)x0, i1 = (int)x1;
            if (i0 == i1) cov[i0] += (x1 - x0) * 0.25f;
            else {
              cov[i0] += (i0 + 1 - x0) * 0.25f;
              for (int x = i0 + 1; x < i1; x++) cov[x] += 0.25f;
              if (i1 <= xb) cov[i1] += (x1 - i1) * 0.25f;
            }
          }
        }
        const uint16_t fc = fillColor(sh.role);
        for (int x = xa; x <= xb; x++)
          if (cov[x] > 0.01f) {
            float v = sh.behind ? behind(x, y) : 1.0f;
            if (v <= 0) continue;
            col[x] = mix(col[x], fc, (cov[x] > 1 ? 1 : cov[x]) * v);
            any[x] = 1;
          }
      }
      // the stroke: coverage from the distance to the shape's polyline (a crease is open; the rest are closed)
      if (sh.stroke) {
        float wpx = sh.width * pl.s * (sh.role == hs::CREASE ? 0.6f : 1.0f);
        if (wpx < 1.0f) wpx = 1.0f;
        const float hw = wpx * 0.5f, py = y + 0.5f;
        for (int x = xa; x <= xb; x++) scov[x] = 0;
        for (int k = 0; k < sh.subs; k++) {
          const hs::Sub& sb = hs::subs[sh.first + k];
          const int segs = sh.role == hs::CREASE ? sb.n - 1 : sb.n;
          for (int i = 0; i < segs; i++) {
            const int a = sb.start + i, b = sb.start + (i + 1 == sb.n ? 0 : i + 1);
            const float lo = Y[a] < Y[b] ? Y[a] : Y[b], hi = Y[a] < Y[b] ? Y[b] : Y[a];
            if (py < lo - hw - 1 || py > hi + hw + 1) continue;
            const float vx = X[b] - X[a], vy = Y[b] - Y[a], l2 = vx * vx + vy * vy;
            const float mnx = X[a] < X[b] ? X[a] : X[b], mxx = X[a] < X[b] ? X[b] : X[a];
            int x0 = (int)(mnx - hw - 1), x1 = (int)(mxx + hw + 2);
            if (x0 < xa) x0 = xa;
            if (x1 > xb) x1 = xb;
            for (int x = x0; x <= x1; x++) {
              const float wx = x + 0.5f - X[a], wy = py - Y[a];
              float t = l2 > 0 ? (wx * vx + wy * vy) / l2 : 0;
              t = t < 0 ? 0 : t > 1 ? 1 : t;
              const float dx = wx - vx * t, dy = wy - vy * t, d = __builtin_sqrtf(dx * dx + dy * dy);
              float c = hw + 0.5f - d;
              c = c < 0 ? 0 : c > 1 ? 1 : c;
              if (c > scov[x]) scov[x] = c;
            }
          }
        }
        const uint16_t lc = sh.stroke == 2 ? NAIL_LINE : LINE;
        for (int x = xa; x <= xb; x++)
          if (scov[x] > 0.01f) {
            float v = sh.behind ? behind(x, y) : 1.0f;
            if (v <= 0) continue;
            col[x] = mix(col[x], lc, scov[x] * v);
            any[x] = 1;
          }
      }
    }
    for (int x = xa; x <= xb; x++)
      if (any[x]) g.drawPixel(x, y, col[x]);
  }
}
}  // namespace hd
