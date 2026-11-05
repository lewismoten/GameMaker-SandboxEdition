// The test banner: a slim yellow bar at the top edge of the screen with a small robot and up to 40 characters (33 on the 320 px board), so
// whoever holds the board can see an agent is testing it and what it is doing. "S <text>" on Serial shows it, "S off"
// clears it. It also clears on a real touch (main.cpp) and after 2 minutes with no serial traffic. The bar sits
// between the MENU and KEYS chips, 12 px tall, and is drawn into the game's bands with the controls (no flicker).
// No board code in here: `paint` takes any LovyanGFX-like target (the screen or the band's sprite).
#pragma once
#include <stdint.h>
#include <string.h>

namespace banner {

constexpr int MAXLEN = 40, H = 12, ICON_W = 11, ICON_H = 10, PAD = 4;
constexpr uint32_t IDLE_MS = 120000;
constexpr uint16_t BG = 0xFF2A, FG = 0x0000;  // the yellow of the controls, and black

// The robot (# = ink, . = bar color showing through): an antenna, a head with ears, two eyes, a toothy mouth.
constexpr const char* ICON[ICON_H] = {
    ".....#.....", ".....#.....", "..#######..", ".#########.", "##..###..##", "##..###..##", ".#########.", ".#.#.#.#.#.", ".#########.", "..#######..",
};

struct State {
  bool on = false;
  char text[MAXLEN + 1] = "";
  uint32_t seen = 0;  // millis() of the last serial byte
};
inline State st;
inline int screenW = 480, maxLen = MAXLEN;  // main.cpp sets them for the board: a 320 px screen has room for 33 characters between its chips
inline void configure(int w, int n) { screenW = w; maxLen = n < MAXLEN ? n : MAXLEN; }

inline int width() { return PAD + ICON_W + PAD + 6 * (int)strlen(st.text) + PAD; }
inline int left() { return (screenW - width()) / 2; }

// Shows `t` (printable ASCII only, cut at 40); an empty text clears. Returns true when what is on screen changes.
inline bool set(const char* t) {
  char n[MAXLEN + 1];
  int k = 0;
  for (; *t && k < maxLen; t++)
    if (*t >= 32 && *t < 127) n[k++] = *t;
  n[k] = 0;
  bool on = k > 0;
  bool changed = on != st.on || strcmp(n, st.text) != 0;
  st.on = on;
  memcpy(st.text, n, k + 1);
  return changed;
}

// Does the bar touch the rectangle (x, y, w, h)?
inline bool hits(int x, int y, int w, int h) { return st.on && y < H && y + h > 0 && x < left() + width() && x + w > left(); }

// Draws the bar with the target's origin at screen (ox, oy).
template <class G>
void paint(G& g, int ox, int oy) {
  if (!st.on) return;
  int x = left() - ox, y = -oy;
  g.fillRect(x, y, width(), H, BG);
  for (int r = 0; r < ICON_H; r++)
    for (int c = 0; c < ICON_W; c++)
      if (ICON[r][c] == '#') g.drawPixel(x + PAD + c, y + 1 + r, FG);
  g.setTextSize(1);
  g.setTextColor(FG, BG);
  g.setCursor(x + PAD + ICON_W + PAD, y + 2);
  g.print(st.text);
}

}  // namespace banner
