// The pictures and text pages PLAYGAME shows between scenes (ShowGraphic and Display_File), with no board
// code, so the Mac test builds the same pixels. A game's .cfg lists them in the order the engine shows them:
//   card <where> g <file> <seconds>                       a 320 x 200 picture (768 palette bytes, 6 bit VGA, then 64000 indices)
//   card <where> t <file> <seconds> <color> <more color>  a text page over the picture before it (lines joined by \n)
//   card <where> f <table> <seconds> <speed> <frames>     an FLI animation: <table> lists each frame's pak bytes (offset and length,
//                                                         two u32 each); <speed> is the wait after a frame in 1/70 s
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

// One `card` line of `where` (null-terminated, one line): adds the card to out[*n].
inline void cardLine(const char* line, const char* where, Card* out, int* n) {
  size_t wl = strlen(where), len = strlen(line);
  if (len > 8 && len < 80 && !strncmp(line, "card ", 5) && !strncmp(line + 5, where, wl) && line[5 + wl] == ' ') {
    char kind = 0, file[20];
    int pause = 0, color = 0, more = 0;
    if (sscanf(line + 5 + wl, " %c %19s %d %d %d", &kind, file, &pause, &color, &more) >= 3) {
      Card& c = out[(*n)++];
      c.kind = kind;
      strcpy(c.file, file);
      c.pause = pause;
      c.color = color;
      c.more = more;
    }
  }
}

// Collects the cards of `where` from the .cfg text, in order; returns how many (at most `max`).
inline int cardsOf(const char* cfgText, const char* where, Card* out, int max) {
  int n = 0;
  for (const char* p = cfgText; *p && n < max;) {
    const char* e = strchr(p, '\n');
    size_t len = e ? (size_t)(e - p) : strlen(p);
    char line[80];
    if (len < sizeof line) {
      memcpy(line, p, len);
      line[len] = 0;
      cardLine(line, where, out, &n);
    }
    if (!e) break;
    p = e + 1;
  }
  return n;
}
// The same, reading the .cfg line by line (the board: a big game's .cfg is too large to hold).
inline int cardsOfFile(const Lines& ln, const char* name, const char* where, Card* out, int max) {
  void* h = ln.open(ln.user, name);
  if (!h) return 0;
  int n = 0;
  char line[128];
  while (n < max && ln.next(h, line, sizeof line)) cardLine(line, where, out, &n);
  ln.close(h);
  return n;
}

// Reads `len` bytes at `off` of cards.pak (malloc'd; the caller frees): LittleFS on the board, stdio in the Mac test.
typedef uint8_t* (*ReadRange)(size_t off, size_t len);
// A card file ("<offset>.<length>") unpacked; n gets the unpacked size. Null on any error.
inline uint8_t* readCardAt(const Assets& a, ReadRange rr, size_t off, size_t len, size_t* n) {
  if (len < 5) return nullptr;
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
inline uint8_t* readCard(const Assets& a, ReadRange rr, const char* file, size_t* n) {
  size_t off = 0, len = 0;
  if (sscanf(file, "%zu.%zu", &off, &len) != 2) return nullptr;
  return readCardAt(a, rr, off, len, n);
}

// One FLI frame (its 16 byte header and chunks) from an animation's table, unpacked; null on any error.
inline uint8_t* fliFrameData(const Assets& a, ReadRange rr, const uint8_t* table, size_t tableBytes, int i, size_t* n) {
  if ((size_t)(i + 1) * 8 > tableBytes) return nullptr;
  const uint8_t* t = table + i * 8;
  size_t off = t[0] | (t[1] << 8) | (t[2] << 16) | ((size_t)t[3] << 24);
  size_t len = t[4] | (t[5] << 8) | (t[6] << 16) | ((size_t)t[7] << 24);
  return readCardAt(a, rr, off, len, n);
}

// FLI::View's frame decoder (the engine's applyFliFrame) for a 320 x 200 animation: chunks COLOR (11), LC (12),
// BLACK (13), BRUN (15) and COPY (16). `px` is the 64000 indices, `pal` the 768 palette bytes (6 bit).
// Returns true when the palette changed.
inline bool fliApply(const uint8_t* f, size_t n, uint8_t* px, uint8_t* pal) {
  auto u16 = [&](size_t p) { return p + 2 <= n ? f[p] | (f[p + 1] << 8) : 0; };
  auto u32 = [&](size_t p) { return p + 4 <= n ? (size_t)f[p] | ((size_t)f[p + 1] << 8) | ((size_t)f[p + 2] << 16) | ((size_t)f[p + 3] << 24) : 0; };
  if (n < 16) return false;
  int chunks = u16(6);
  size_t p = 16;
  bool palChanged = false;
  for (int c = 0; c < chunks && p + 6 <= n; c++) {
    size_t size = u32(p);
    int type = u16(p + 4);
    size_t d = p + 6, end = p + (size < 6 ? 6 : size);
    if (end > n) end = n;
    if (type == 11) {
      int packets = u16(d);
      d += 2;
      int idx = 0;
      for (int k = 0; k < packets && d + 2 <= end; k++) {
        idx += f[d++];
        int cnt = f[d++];
        if (cnt == 0) cnt = 256;
        for (int j = 0; j < cnt && idx < 256 && d + 3 <= end; j++, idx++) {
          pal[idx * 3] = f[d] & 63; pal[idx * 3 + 1] = f[d + 1] & 63; pal[idx * 3 + 2] = f[d + 2] & 63;
          d += 3;
        }
      }
      palChanged = true;
    } else if (type == 12) {
      int y = u16(d), lines = u16(d + 2);
      d += 4;
      for (int l = 0; l < lines && d < end; l++, y++) {
        int packets = f[d++];
        int x = 0;
        for (int k = 0; k < packets && d + 2 <= end; k++) {
          x += f[d++];
          int cnt = (int8_t)f[d++];
          if (cnt >= 0) {
            for (int j = 0; j < cnt && d < end; j++, x++, d++) if (y < PIC_H && x < PIC_W) px[y * PIC_W + x] = f[d];
          } else if (d < end) {
            uint8_t v = f[d++];
            for (int j = 0; j < -cnt; j++, x++) if (y < PIC_H && x < PIC_W) px[y * PIC_W + x] = v;
          }
        }
      }
    } else if (type == 13) {
      memset(px, 0, PIC_PIXELS);
    } else if (type == 15) {
      for (int y = 0; y < PIC_H && d < end; y++) {
        d++;  // packet count: unreliable, decode by width
        int x = 0;
        while (x < PIC_W && d < end) {
          int cnt = (int8_t)f[d++];
          if (cnt >= 0) {
            if (d >= end) break;
            uint8_t v = f[d++];
            for (int j = 0; j < cnt && x < PIC_W; j++) px[y * PIC_W + x++] = v;
          } else {
            for (int j = 0; j < -cnt && x < PIC_W && d < end; j++) px[y * PIC_W + x++] = f[d++];
          }
        }
      }
    } else if (type == 16) {
      size_t k = end > d ? end - d : 0;
      memcpy(px, f + d, k < (size_t)PIC_PIXELS ? k : (size_t)PIC_PIXELS);
    }
    if (size < 6) break;
    p += size;
  }
  return palChanged;
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

struct TextRect { int x0 = PIC_W, y0 = PIC_H, x1 = 0, y1 = 0; };

// Display_File: writes page `page` of the text into the 320 x 200 indices `px`, 8 x 8 glyphs (bit 0 leftmost) at
// column 5, row 5, and "MORE..." at (224, 168) when more lines follow. `font` is 95 glyphs of 8 rows, from ' '.
inline void drawTextPage(uint8_t* px, const uint8_t* font, const uint8_t* t, size_t n, int page, int color, int more, TextRect* bounds = nullptr) {
  auto glyph = [&](int x, int y, int col, unsigned char ch) {
    if (ch < 32 || ch > 126) ch = '?';
    const uint8_t* g = font + (ch - 32) * 8;
    for (int r = 0; r < 8; r++) {
      if (y + r < 0 || y + r >= PIC_H) continue;
      for (int b = 0; b < 8; b++)
        if ((g[r] & (1 << b)) && x + b >= 0 && x + b < PIC_W) {
          px[(y + r) * PIC_W + x + b] = (uint8_t)col;
          if (bounds) {
            if (x + b < bounds->x0) bounds->x0 = x + b;
            if (y + r < bounds->y0) bounds->y0 = y + r;
            if (x + b + 1 > bounds->x1) bounds->x1 = x + b + 1;
            if (y + r + 1 > bounds->y1) bounds->y1 = y + r + 1;
          }
        }
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
