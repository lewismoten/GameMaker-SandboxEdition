// The test banner: a slim yellow bar at the top edge of the screen with a small robot and up to 40 characters (a narrower board calls configure), so
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
  char id[4] = "";  // the board's short name (1 to 3 characters) shown as a bold badge; RAM only, so it shows only during testing
  uint32_t seen = 0;  // millis() of the last serial byte
};
inline State st;
inline int screenW = 480, maxLen = MAXLEN;  // a narrower board calls configure(width, characters): a 320 px screen has room for 33 between its chips
inline void configure(int w, int n) { screenW = w; maxLen = n < MAXLEN ? n : MAXLEN; }

inline bool shown() { return st.on || st.id[0]; }
inline int badgeW() { return st.id[0] ? 6 * (int)strlen(st.id) + 5 : 0; }  // black box, yellow bold letters
inline int width() { return PAD + (st.id[0] ? badgeW() + PAD : 0) + ICON_W + (st.on ? PAD + 6 * (int)strlen(st.text) : 0) + PAD; }
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

// Sets the board ID ("A", "B2"; printable ASCII, cut at 3; empty clears). Returns true when what is on screen changes.
inline bool setId(const char* t) {
  char n[4];
  int k = 0;
  for (; *t && k < 3; t++)
    if (*t > 32 && *t < 127) n[k++] = *t;
  n[k] = 0;
  bool changed = strcmp(n, st.id) != 0;
  memcpy(st.id, n, k + 1);
  return changed;
}

// Does the bar touch the rectangle (x, y, w, h)?
inline bool hits(int x, int y, int w, int h) { return shown() && y < H && y + h > 0 && x < left() + width() && x + w > left(); }

// Draws the bar with the target's origin at screen (ox, oy): [badge] robot text.
template <class G>
void paint(G& g, int ox, int oy) {
  if (!shown()) return;
  int x = left() - ox, y = -oy;
  g.fillRect(x, y, width(), H, BG);
  x += PAD;
  g.setTextSize(1);
  if (st.id[0]) {
    g.fillRect(x - 2, y, badgeW() + 2, H, FG);
    g.setTextColor(BG, FG);
    g.setCursor(x, y + 2);
    g.print(st.id);
    g.setCursor(x + 1, y + 2);  // twice, a pixel apart: bold
    g.print(st.id);
    x += badgeW() + PAD;
  }
  for (int r = 0; r < ICON_H; r++)
    for (int c = 0; c < ICON_W; c++)
      if (ICON[r][c] == '#') g.drawPixel(x + c, y + 1 + r, FG);
  if (st.on) {
    g.setTextColor(FG, BG);
    g.setCursor(x + ICON_W + PAD, y + 2);
    g.print(st.text);
  }
}

}  // namespace banner
