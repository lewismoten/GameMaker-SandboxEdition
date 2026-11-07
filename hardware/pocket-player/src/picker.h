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
}  // namespace pk
