// The pictures and text pages PLAYGAME shows between scenes (ShowGraphic and Display_File), with no board
// code, so the Mac test builds the same pixels. A game's .cfg lists them in the order the engine shows them:
//   card <where> g <file> <seconds>                       a 320 x 200 picture (768 palette bytes, 6 bit VGA, then 64000 indices)
//   card <where> t <file> <seconds> <color> <more color>  a text page over the picture before it (lines joined by \n)
// <where> is i<level> (before the level), x<level> (after it), w (the game is won) or l (every life lost).
// <seconds> is how long to wait for a key or touch: 0 shows and goes on, 65535 waits for one. Colors are palette
// indices picked when the game was packed (the engine matches RGB(50,10,50) and RGB(63,10,10) in the picture's palette).
// <file> is "<offset>.<length>": the packed bytes (like the other files: 4 byte length, raw deflate) inside data/cards.pak,
// one file for all the cards because LittleFS gives every file at least one 4 KB block. Not here: FLI animations, which the packer leaves out.
#pragma once
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "gmcfg.h"

namespace gm {

constexpr int PIC_W = 320, PIC_H = 200, PIC_PIXELS = PIC_W * PIC_H, PIC_BYTES = 768 + PIC_PIXELS;
constexpr int TEXT_LINES = 16;       // rows 5 to 20 of 8 pixels
constexpr int TEXT_X = 40, TEXT_Y = 40;
constexpr int FADE_STEPS = 65;       // FadeTo: 65 steps, one per VGA retrace at 70 Hz
constexpr int FADE_MS = FADE_STEPS * 1000 / 70;  // 928 ms
constexpr int PAUSE_KEY = 65535;     // wait for a key

struct Card { char kind; char file[20]; int pause; int color, more; };

// Collects the cards of `where` from the .cfg text, in order; returns how many (at most `max`).
inline int cardsOf(const char* cfgText, const char* where, Card* out, int max) {
  int n = 0;
  size_t wl = strlen(where);
  for (const char* p = cfgText; *p && n < max;) {
    const char* e = strchr(p, '\n');
    size_t len = e ? (size_t)(e - p) : strlen(p);
    if (len > 8 && len < 80 && !strncmp(p, "card ", 5) && !strncmp(p + 5, where, wl) && p[5 + wl] == ' ') {
      char line[80];
      memcpy(line, p, len);
      line[len] = 0;
      char kind = 0, file[20];
      int pause = 0, color = 0, more = 0;
      if (sscanf(line + 5 + wl, " %c %19s %d %d %d", &kind, file, &pause, &color, &more) >= 3) {
        Card& c = out[n++];
        c.kind = kind;
        strcpy(c.file, file);
        c.pause = pause;
        c.color = color;
        c.more = more;
      }
    }
    if (!e) break;
    p = e + 1;
  }
  return n;
}

// Reads `len` bytes at `off` of cards.pak (malloc'd; the caller frees): LittleFS on the board, stdio in the Mac test.
typedef uint8_t* (*ReadRange)(size_t off, size_t len);
// A card file ("<offset>.<length>") unpacked; n gets the unpacked size. Null on any error.
inline uint8_t* readCard(const Assets& a, ReadRange rr, const char* file, size_t* n) {
  size_t off = 0, len = 0;
  if (sscanf(file, "%zu.%zu", &off, &len) != 2 || len < 5) return nullptr;
  uint8_t* f = rr(off, len);
  if (!f) return nullptr;
  size_t raw = f[0] | (f[1] << 8) | (f[2] << 16) | ((size_t)f[3] << 24);
  uint8_t* out = raw < (1u << 20) ? (uint8_t*)malloc(raw + 1) : nullptr;
  bool ok = out && a.inflate(f + 4, len - 4, out, raw);
  free(f);
  if (!ok) { free(out); return nullptr; }
  *n = raw;
  return out;
}

// A picture: 768 palette bytes then 64000 indices in one malloc'd block (null when it can't be read).
inline uint8_t* loadPicture(const Assets& a, ReadRange rr, const char* file) {
  size_t n = 0;
  uint8_t* p = readCard(a, rr, file, &n);
  if (p && n != (size_t)PIC_BYTES) { free(p); p = nullptr; }
  return p;
}

// A text page's lines: the file is lines joined by \n. Returns the number of lines; line i starts at start[i].
inline int textLineCount(const uint8_t* t, size_t n) {
  int c = 1;
  for (size_t i = 0; i < n; i++) if (t[i] == '\n') c++;
  return n ? c : 0;
}
inline int textPageCount(const uint8_t* t, size_t n) {
  int l = textLineCount(t, n);
  return l ? (l + TEXT_LINES - 1) / TEXT_LINES : 1;
}

// Display_File: writes page `page` of the text into the 320 x 200 indices `px`, 8 x 8 glyphs (bit 0 leftmost) at
// column 5, row 5, and "MORE..." at (224, 168) when more lines follow. `font` is 95 glyphs of 8 rows, from ' '.
inline void drawTextPage(uint8_t* px, const uint8_t* font, const uint8_t* t, size_t n, int page, int color, int more) {
  auto glyph = [&](int x, int y, int col, unsigned char ch) {
    if (ch < 32 || ch > 126) ch = '?';
    const uint8_t* g = font + (ch - 32) * 8;
    for (int r = 0; r < 8; r++) {
      if (y + r < 0 || y + r >= PIC_H) continue;
      for (int b = 0; b < 8; b++)
        if ((g[r] & (1 << b)) && x + b >= 0 && x + b < PIC_W) px[(y + r) * PIC_W + x + b] = (uint8_t)col;
    }
  };
  int line = 0, col = 0;
  bool moreFollows = false;
  for (size_t i = 0; i <= n; i++) {
    bool end = i == n || t[i] == '\n';
    if (!end) {
      if (line >= page * TEXT_LINES && line < (page + 1) * TEXT_LINES) glyph(TEXT_X + col * 8, TEXT_Y + (line - page * TEXT_LINES) * 8, color, t[i]);
      col++;
      continue;
    }
    if (i == n && n == 0) break;
    line++;
    col = 0;
    if (line > (page + 1) * TEXT_LINES) { moreFollows = true; break; }
  }
  if (moreFollows) {
    const char* s = "MORE...";
    for (int i = 0; s[i]; i++) glyph(224 + i * 8, 168, more, (unsigned char)s[i]);
  }
}

// FadeTo's palette at `step` of FADE_STEPS: each channel from -> to, truncated like the engine's d * step / steps.
inline void fadeColor(const uint8_t* from, const uint8_t* to, int step, uint8_t* out768) {
  for (int i = 0; i < 768; i++) {
    int d = (int)(to[i] & 63) - (int)(from[i] & 63);
    out768[i] = (uint8_t)((from[i] & 63) + d * step / FADE_STEPS);
  }
}

}  // namespace gm
