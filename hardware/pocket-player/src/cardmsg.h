// Card and loading messages: the card chip on the home page, the notice that replaces an empty page, the loading bar and the
// failure card shown instead of a reset. Pure drawing and decisions (no hardware), so host/librarytest.cpp renders them all.
#pragma once
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include "picker_draw.h"
namespace pk {
enum CardState : uint8_t { CARD_UNKNOWN, CARD_READING, CARD_READY, CARD_NONE, CARD_UNREADABLE, CARD_NOFOLDER };
enum LoadFail : uint8_t { FAIL_MEMORY, FAIL_FILE, FAIL_CARD };
// What the boot scan found: no mount = no card (the driver cannot tell an empty slot from a card it cannot start);
// mounted but the top folder will not open = unreadable; mounted, root opens, /pocket does not = no folder.
inline CardState cardStateAfterMount(bool mounted, bool rootOpens, bool pocketOpens) {
  if (!mounted) return CARD_NONE;
  if (!rootOpens) return CARD_UNREADABLE;
  return pocketOpens ? CARD_READING : CARD_NOFOLDER;
}
// Why a game could not start. A game on the card whose card is gone first; a missing buffer with little memory is memory.
inline LoadFail whyFailed(bool onCard, bool cardThere, bool missingBuffer, uint32_t largestFree) {
  if (onCard && !cardThere) return FAIL_CARD;
  if (missingBuffer && largestFree < 70000) return FAIL_MEMORY;
  return FAIL_FILE;
}
inline void cardChipText(CardState s, int count, char* out, size_t cap) {
  switch (s) {
    case CARD_READING: snprintf(out, cap, "Reading card: %d", count); break;
    case CARD_READY: snprintf(out, cap, count == 1 ? "Card: %d game" : "Card: %d games", count); break;
    case CARD_NONE: snprintf(out, cap, "No card"); break;
    case CARD_UNREADABLE: snprintf(out, cap, "Card unreadable"); break;
    case CARD_NOFOLDER: snprintf(out, cap, "No /pocket folder"); break;
    default: out[0] = 0;
  }
}
// In the title bar of the home page, between the name and the Search button. Problems are yellow.
template <class G> void drawCardChip(G& g, int W, CardState s, int count) {
  char t[32];
  cardChipText(s, count, t, sizeof t);
  if (!t[0]) return;
  int sc = W == 320 ? 1 : 2, x0 = W == 320 ? 94 : 110, x1 = W - 68, w = (int)strlen(t) * 6 * sc;
  if (x0 + w + 8 > x1) return;  // never over the buttons
  bool bad = s == CARD_NONE || s == CARD_UNREADABLE || s == CARD_NOFOLDER;
  g.fillRoundRect(x0, 4, w + 8, 24, 6, C_BLACK);
  g.drawRoundRect(x0, 4, w + 8, 24, 6, bad ? C_YELLOW : C_GRAY);
  Tile clip = {x0, 4, w + 8, 24, 0, 0};
  clippedText(g, clip, t, x0 + 4, 16 - 4 * sc, sc, bad ? C_YELLOW : C_WHITE);
}
// Words wrapped to `cols` characters, at most `max` lines of 40.
inline int wrapText(const char* s, int cols, char (*lines)[41], int max) {
  int n = 0;
  size_t at = 0, len = strlen(s);
  if (cols > 40) cols = 40;
  while (n < max && at < len) {
    size_t take = len - at < (size_t)cols ? len - at : (size_t)cols;
    if (at + take < len) { size_t w = take; while (w && s[at + w] != ' ') w--; if (w) take = w; }
    memcpy(lines[n], s + at, take);
    lines[n][take] = 0;
    n++;
    at += take;
    while (s[at] == ' ') at++;
  }
  return n;
}
// A boxed message between rows `top` and `bottom`: a heading and wrapped text. Returns the box's bottom edge.
template <class G> int drawNotice(G& g, int W, int top, int bottom, const char* heading, const char* body, uint16_t accent) {
  int sc = W == 320 ? 1 : 2, cols = (W - 48) / (6 * sc);
  char lines[8][41];
  int n = wrapText(body, cols, lines, 8);
  int hh = 24, h = hh + 10 + n * 10 * sc + 12;
  int y = top + (bottom - top - h) / 2;
  if (y < top + 2) y = top + 2;
  g.fillRoundRect(12, y, W - 24, h, 6, C_DARK);
  g.drawRoundRect(12, y, W - 24, h, 6, accent);
  Tile all = {12, y, W - 24, h, 0, 0};
  int hw = (int)strlen(heading) * 12;
  clippedText(g, all, heading, (W - hw) / 2, y + 8, 2, accent);
  for (int i = 0; i < n; i++) clippedText(g, all, lines[i], 24, y + hh + 10 + i * 10 * sc, sc, C_WHITE);
  return y + h;
}
// The page area when no game is listed: what the card says, in words. The box's bottom edge; 0 when there is nothing to say.
template <class G> int drawEmptyNotice(G& g, int W, CardState s, int count) {
  int top = 40, bottom = footer(W) - 4;
  switch (s) {
    case CARD_NONE: return drawNotice(g, W, top, bottom, "No card", "Put a microSD card in the slot, then open Settings, Card, Rescan. Games kept in the Pocket Player itself are still listed.", C_YELLOW);
    case CARD_UNREADABLE: return drawNotice(g, W, top, bottom, "Can't read the card", "Take it out and put it back in. The card should be FAT32. Then open Settings, Card, Rescan.", C_YELLOW);
    case CARD_NOFOLDER: return drawNotice(g, W, top, bottom, "No pocket folder", "The card has no folder named pocket. Make one on a computer and copy .gmp games into it.", C_YELLOW);
    case CARD_READING: { char b[48]; snprintf(b, sizeof b, "Looking for games. Found so far: %d.", count); return drawNotice(g, W, top, bottom, "Reading the card", b, C_WHITE); }
    case CARD_READY: return drawNotice(g, W, top, bottom, "No games found", "Copy .gmp game files into the pocket folder on the card.", C_WHITE);
    default: return 0;
  }
}
// Loading: the game's name, a bar. drawLoadingBar alone repaints the bar for the next step.
template <class G> void drawLoadingBar(G& g, int W, int H, int step, int of) {
  int x0 = 40, x1 = W - 40, y = H / 2 + 12;
  g.fillRect(x0, y, x1 - x0, 16, C_BLACK);
  g.drawRect(x0, y, x1 - x0, 16, C_GRAY);
  int fill = (x1 - x0 - 4) * (step < 0 ? 0 : step > of ? of : step) / (of ? of : 1);
  g.fillRect(x0 + 2, y + 2, fill, 12, C_YELLOW);
}
template <class G> void drawLoading(G& g, int W, int H, const char* name, int step, int of) {
  g.fillRect(0, 0, W, H, C_BLACK);
  char t[48];
  ellipsize(name, t, sizeof t, (W - 32) / 12);
  Tile all = {0, 0, W, H, 0, 0};
  clippedText(g, all, t, (W - (int)strlen(t) * 12) / 2, H / 2 - 32, 2, C_WHITE);
  clippedText(g, all, "Loading", (W - 7 * 12) / 2, H / 2 - 10, 2, C_GRAY);
  drawLoadingBar(g, W, H, step, of);
}
inline Tile failButton(int W, int H) { return {W / 2 - 80, H - 54, 160, 44, 0, 0}; }
inline const char* failHeading(LoadFail f) { return f == FAIL_MEMORY ? "Not enough memory" : f == FAIL_CARD ? "Card removed" : "A file is missing"; }
inline const char* failBody(LoadFail f) {
  return f == FAIL_MEMORY ? "This game needs more memory than is free right now. Go back and try it again first. If it keeps failing, it is too big for this board."
       : f == FAIL_CARD ? "Put the card back in the slot, then try the game again."
                        : "The game's files are damaged or incomplete. Copy the game to the card again.";
}
// Shown instead of a reset when a game or one of its levels cannot load. `name` may be empty. The button returns to the list.
template <class G> void drawFailCard(G& g, int W, int H, const char* name, LoadFail f) {
  g.fillRect(0, 0, W, H, C_BLACK);
  Tile all = {0, 0, W, H, 0, 0};
  const char* top = "Could not load";
  clippedText(g, all, top, (W - (int)strlen(top) * 12) / 2, 8, 2, C_WHITE);
  if (name && name[0]) { char t[48]; ellipsize(name, t, sizeof t, (W - 16) / 6); clippedText(g, all, t, (W - (int)strlen(t) * 6) / 2, 30, 1, C_GRAY); }
  drawNotice(g, W, 44, H - 58, failHeading(f), failBody(f), C_YELLOW);
  Tile b = failButton(W, H);
  drawButton(g, b.x, b.y, b.x + b.w, b.y + b.h, "Back to games");
}
inline bool inFailButton(int W, int H, int x, int y) { Tile b = failButton(W, H); return x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h; }
} // namespace pk
