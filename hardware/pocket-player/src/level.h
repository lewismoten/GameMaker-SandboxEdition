// Reads a Game-Maker level's real DOS files from LittleFS and draws its first screen at 1.5x.
// Formats follow web/packages/engine/src/formats: map.ts (100x100 cells of {block, monster},
// 2 bytes each), blocks.ts (.bbl: 150 blocks of 420 bytes, the first 400 are 20x20 palette
// indices) and palette.ts (.pal: 256 x RGB, 6-bit VGA components). See code/GM/MAP.H, BLOC.H.
#pragma once
#include <LittleFS.h>
#include "board.h"

constexpr int MAPW = 100, BLEN = 20, SCR_W = 16, SCR_H = 10, BLOCK_BYTES = 420;
constexpr int TILE = 30;  // 20 * 1.5

// Pixel order: pushImage(uint16_t*) with swapBytes off sends each value's bytes in memory order
// (low byte first), but the ST7796 reads RGB565 high byte first. So the buffer holds byte-swapped
// 565 (hi byte in the low half). Without that the light blue sky showed mint, grass magenta.
inline uint16_t panel565(uint8_t r, uint8_t g, uint8_t b) {
  uint16_t v = (uint16_t)(((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3));
  return (uint16_t)((v << 8) | (v >> 8));
}

// Self-check in the status strip (right end): red, green, blue, white drawn by LovyanGFX itself, a
// gap, then the palette's first 16 colors through pushImage. Both rows must look alike where the
// palette has the same hue; the first 16 colors are shown in order.
inline uint16_t gPal[256];  // the level's palette in panel order
inline void drawSwatches(LGFX& g) {
  const uint16_t* pal = gPal;
  const uint32_t refs[4] = {TFT_RED, TFT_GREEN, TFT_BLUE, TFT_WHITE};
  int x = 290;
  for (uint32_t c : refs) { g.fillRect(x, 302, 8, 16, c); x += 9; }
  x += 6;
  uint16_t sw[8 * 16];
  for (int i = 0; i < 16; i++) {
    for (int k = 0; k < 8 * 16; k++) sw[k] = pal[i];
    g.pushImage(x, 302, 8, 16, sw);
    x += 9;
  }
}

// Draws cells [ox, ox+16) x [oy, oy+10) with block pixels scaled 1.5x. Returns ms, or -1 on error.
inline int drawFirstScreen(LGFX& g, const char* mapPath, const char* bblPath, const char* palPath, int ox, int oy) {
  File pf = LittleFS.open(palPath, "r");
  File mf = LittleFS.open(mapPath, "r");
  File bf = LittleFS.open(bblPath, "r");
  if (!pf || !mf || !bf) return -1;
  uint16_t* pal = gPal;
  uint8_t rgb[768];
  if (pf.read(rgb, 768) != 768) return -1;
  for (int i = 0; i < 256; i++) {
    auto v8 = [](uint8_t c) { c &= 63; return (uint8_t)((c << 2) | (c >> 4)); };
    pal[i] = panel565(v8(rgb[i * 3]), v8(rgb[i * 3 + 1]), v8(rgb[i * 3 + 2]));
  }
  g.setSwapBytes(false);  // the swap is in panel565, so the flag must stay off
  uint32_t t0 = millis();
  static uint8_t src[BLEN * BLEN];
  static uint16_t tile[TILE * TILE];
  uint8_t row[SCR_W * 2];
  for (int cy = 0; cy < SCR_H; cy++) {
    mf.seek(((oy + cy) * MAPW + ox) * 2);
    if (mf.read(row, sizeof row) != sizeof row) return -1;
    for (int cx = 0; cx < SCR_W; cx++) {
      int blk = row[cx * 2];
      bf.seek(blk * BLOCK_BYTES);
      if (bf.read(src, sizeof src) != sizeof src) return -1;
      for (int j = 0; j < TILE; j++)
        for (int i = 0; i < TILE; i++) tile[j * TILE + i] = pal[src[(j * 2 / 3) * BLEN + (i * 2 / 3)]];
      g.pushImage(cx * TILE, cy * TILE, TILE, TILE, tile);
    }
  }
  int ms = (int)(millis() - t0);
  return ms;
}
