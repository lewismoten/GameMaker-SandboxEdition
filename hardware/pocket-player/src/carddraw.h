// Full-panel card background and bounded picture bands, shared by firmware and host regression checks.
#pragma once
#include <stdint.h>
#include "screen.h"

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
}  // namespace carddraw
