// Which firmware and which board this is, so a photo or a serial log tells them apart: the build's id (git hash + date + env,
// baked by fwid.py) and the board's letter (A, B, C: the same letters as web/scripts/pocketStatus.py), kept in NVS ("bid")
// and set over serial with `ID set C`. Until it is set the board is named by the last 4 hex digits of its chip id.
// Pure formatting is here; the NVS part is the two small functions at the end (board code, used by main.cpp).
#pragma once
#include <stdio.h>
#include <string.h>
#include <stdint.h>

#ifndef FW_GIT
#define FW_GIT "dev"
#endif
#ifndef FW_DATE
#define FW_DATE "0000-00-00"
#endif
#ifndef FW_ENV
#define FW_ENV "host"
#endif

namespace fw {

// "Board C fw 1a2b3c4 2026-11-05"; the short form "C fw 1a2b3c4" is for a narrow title bar.
inline int label(const char* board, const char* git, const char* date, char* out, int n, bool shortForm = false) {
  return shortForm ? snprintf(out, n, "%s fw %s", board, git) : snprintf(out, n, "Board %s fw %s %s", board, git, date);
}
// The default board name from a chip's mac: its last 4 hex digits.
inline void defaultBoard(uint64_t mac, char* out) { snprintf(out, 5, "%04llX", (unsigned long long)(mac & 0xFFFF)); }
// A board name is 1 to 4 letters or digits.
inline bool validBoard(const char* s) {
  int n = (int)strlen(s);
  if (n < 1 || n > 4) return false;
  for (int i = 0; i < n; i++) if (!((s[i] >= '0' && s[i] <= '9') || (s[i] >= 'A' && s[i] <= 'Z'))) return false;
  return true;
}

}  // namespace fw
