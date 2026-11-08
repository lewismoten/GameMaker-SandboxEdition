// Title-only search and bounded single-line labels shared by the picker and host tests.
#pragma once
#include <stddef.h>
#include <string.h>
namespace pk {
inline char lower(char c) { return c >= 'A' && c <= 'Z' ? c + ('a' - 'A') : c; }
inline bool matches(const char* title, const char* query) {
  if (!*query) return true;
  for (; *title; title++) {
    const char* a = title; const char* b = query;
    while (*a && *b && lower(*a) == lower(*b)) { a++; b++; }
    if (!*b) return true;
  }
  return false;
}
inline void ellipsize(const char* title, char* out, size_t cap, size_t columns) {
  if (!cap) return;
  size_t n = columns < cap - 1 ? columns : cap - 1;
  if (strlen(title) < n) n = strlen(title);
  memcpy(out, title, n); out[n] = 0;
  if (strlen(title) > n && n >= 3) memcpy(out + n - 3, "...", 3);
}
// Details: the game's own pages from its DOS menu (the title, Read Storyline, Read Instructions), one button each above the
// footer, only for the pages the game has. mask: bit 0 title, 1 story, 2 instructions (the .cfg's `card t`, `card s`, `card h`).
constexpr int DETAILS_PAGES = 3;
inline const char* detailsPageLabel(int k) { return k == 0 ? "Title" : k == 1 ? "Story" : "Instructions"; }
inline char detailsPageWhere(int k) { return k == 0 ? 't' : k == 1 ? 's' : 'h'; }
inline int detailsPagesTop(int H) { return H - 96; }  // to H - 58; the note line and the footer are below
inline int detailsPagesBottom(int H) { return H - 58; }
// The shown buttons share the row; kind k's span (x0, x1 one past), or false when the game lacks that page.
inline bool detailsPageSpan(int W, int mask, int k, int& x0, int& x1) {
  if (!(mask >> k & 1)) return false;
  int n = 0, at = 0;
  for (int i = 0; i < DETAILS_PAGES; i++)
    if (mask >> i & 1) { if (i < k) at++; n++; }
  x0 = 4 + at * (W - 8) / n;
  x1 = 4 + (at + 1) * (W - 8) / n - 4;
  return true;
}
// The page button under (x, y): 0 title, 1 story, 2 instructions, or -1.
inline int detailsPageAt(int W, int H, int mask, int x, int y) {
  if (y < detailsPagesTop(H) || y >= detailsPagesBottom(H)) return -1;
  for (int k = 0, x0, x1; k < DETAILS_PAGES; k++)
    if (detailsPageSpan(W, mask, k, x0, x1) && x >= x0 && x < x1) return k;
  return -1;
}
}  // namespace pk
