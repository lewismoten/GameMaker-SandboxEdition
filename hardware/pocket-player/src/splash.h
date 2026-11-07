// The boot splash: the Sandbox sting's last full frame (splash_data.h, from web/scripts/pocketArt.ts), drawn first at 2x or 3x,
// one scaled row at a time so it needs no frame buffer. panelOrder swaps the bytes for the panel, as thumbnail() does.
#pragma once
#include <stdint.h>
#include "splash_data.h"
namespace pk {
template <class G> void drawSplash(G& g, int W, int H, bool panelOrder = false) {
  int s = W / SPLASH_W, y0 = (H - SPLASH_H * s) / 2;
  g.fillRect(0, 0, W, H, 0);
  uint16_t row[480];
  for (int y = 0; y < SPLASH_H; y++) {
    for (int x = 0; x < SPLASH_W; x++) {
      uint16_t c = SPLASH[y * SPLASH_W + x];
      if (panelOrder) c = (c << 8) | (c >> 8);
      for (int k = 0; k < s; k++) row[x * s + k] = c;
    }
    for (int k = 0; k < s; k++) g.pushImage(0, y0 + y * s + k, W, 1, row);
  }
}
}  // namespace pk
