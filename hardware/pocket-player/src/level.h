// Reads a Game-Maker level's real DOS files from LittleFS and draws its first screen at 1.5x.
// Formats follow web/packages/engine/src/formats: map.ts (100x100 cells of {block, monster},
// 2 bytes each), blocks.ts (.bbl: 150 blocks of 420 bytes, the first 400 are 20x20 palette
// indices) and palette.ts (.pal: 256 x RGB, 6-bit VGA components). See code/GM/MAP.H, BLOC.H.
#pragma once
#include <LittleFS.h>
#include "board.h"

constexpr int MAPW = 100, BLEN = 20, SCR_W = 16, SCR_H = 10, BLOCK_BYTES = 420;
constexpr int TILE = 30;  // 20 * 1.5

// Draws cells [ox, ox+16) x [oy, oy+10) with block pixels scaled 1.5x. Returns ms, or -1 on error.
inline int drawFirstScreen(LGFX& g, const char* mapPath, const char* bblPath, const char* palPath, int ox, int oy) {
  File pf = LittleFS.open(palPath, "r");
  File mf = LittleFS.open(mapPath, "r");
  File bf = LittleFS.open(bblPath, "r");
  if (!pf || !mf || !bf) return -1;
  uint16_t pal[256];
  uint8_t rgb[768];
  if (pf.read(rgb, 768) != 768) return -1;
  for (int i = 0; i < 256; i++) {
    auto v8 = [](uint8_t c) { c &= 63; return (uint8_t)((c << 2) | (c >> 4)); };
    pal[i] = g.color565(v8(rgb[i * 3]), v8(rgb[i * 3 + 1]), v8(rgb[i * 3 + 2]));
  }
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
  return (int)(millis() - t0);
}
