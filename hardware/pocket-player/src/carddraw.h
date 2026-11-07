// Full-panel card background and bounded picture bands, shared by firmware and host regression checks.
#pragma once
#include <stdint.h>
#include "screen.h"
#include "gmcards.h"

namespace carddraw {
// Palette words are byte-swapped for pushImage; shape calls take native RGB565.
inline uint16_t native(uint16_t c) { return (uint16_t)((c << 8) | (c >> 8)); }
template <class G> void clear(G& g, uint16_t zero) { g.fillScreen(native(zero)); }

template <class G> void pushPicture(G& g, const uint8_t* px, const uint16_t* pal, uint16_t* band, int bandRows) {
  // Cards always cover the full game view, even when play uses Smaller picture.
  // The status strip is a letterbox margin here and follows palette index 0 during fades too.
  g.fillRect(0, scr::VIEW_H, scr::W, scr::STRIP_H, native(pal[0]));
  for (int y = 0; y < scr::VIEW_H; y += bandRows) {
    int rows = scr::VIEW_H - y < bandRows ? scr::VIEW_H - y : bandRows;
    for (int r = 0; r < rows; r++) {
      const uint8_t* src = px + scr::down(y + r) * 320;
      for (int x = 0; x < scr::W; x++) band[r * scr::W + x] = pal[src[scr::down(x)]];
    }
    g.pushImage(0, y, scr::W, rows, band);
  }
}
// Map source bounds with ceiling edges: at 1.5x an odd source pixel spans two panel pixels.
template <class G> void pushTextRect(G& g, const uint8_t* px, const uint16_t* pal, uint16_t* band, int bandRows, const gm::TextRect& rect) {
  if (rect.x1 <= rect.x0 || rect.y1 <= rect.y0) return;
  auto edge = [](int v) { return (v * scr::GN + scr::GD - 1) / scr::GD; };
  int x0 = edge(rect.x0), x1 = edge(rect.x1), y1 = edge(rect.y1), w = x1 - x0;
  for (int y = edge(rect.y0); y < y1; y += bandRows) {
    int rows = y1 - y < bandRows ? y1 - y : bandRows;
    for (int r = 0; r < rows; r++) for (int x = x0; x < x1; x++)
      band[r * w + x - x0] = pal[px[scr::down(y + r) * 320 + scr::down(x)]];
    g.pushImage(x0, y, w, rows, band);
  }
}
// px is the clean, reloaded scene picture. Reuse is allowed only for the same picture and palette.
template <class G> void textPage(G& g, uint8_t* px, const uint16_t* pal, uint16_t* band, int bandRows,
    const uint8_t* font, const uint8_t* text, size_t n, int page, int color, int more, bool reuse, gm::TextRect& previous) {
  if (reuse) pushTextRect(g, px, pal, band, bandRows, previous);
  gm::TextRect next;
  gm::drawTextPage(px, font, text, n, page, color, more, &next);
  if (reuse) pushTextRect(g, px, pal, band, bandRows, next);
  else { clear(g, pal[0]); pushPicture(g, px, pal, band, bandRows); }
  previous = next;
}
}  // namespace carddraw
