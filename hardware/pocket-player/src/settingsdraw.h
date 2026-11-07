// The Settings screen with no board code in it, so the Mac renders and checks it (host/settingstest.cpp): a bar with Back
// and four tabs (Controls, Display, Sound, Card), each a list of rows, every row a name with its values as chips (the chosen
// one yellow) or one action button. Controls also shows a live pad preview: the game view at a small scale with the pad,
// Space, Enter and MENU where the game puts them, lit where a finger presses (main.cpp feeds those touches to the real
// controls model), and a line that says what the last row changed or what the finger is pressing.
// Chips replace the old tap-to-cycle list: every value is in view, so nothing is changed blind.
#pragma once
#include <initializer_list>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include "controls.h"
#include "overlaydraw.h"
#include "paddraw.h"
#include "screen.h"
namespace st {
constexpr uint16_t C_WHITE = 0xFFFF, C_BLACK = 0, C_YELLOW = 0xFF2A, C_GRAY = 0x7BEF, C_DARK = 0x2104, C_BLUE = 0x3A9C, C_VIEW = 0x10A6;
enum Tab : uint8_t { T_CONTROLS, T_DISPLAY, T_SOUND, T_CARD, T_COUNT };
enum Item : uint8_t { I_HAND, I_PAD, I_DEAD, I_POS, I_JUMP, I_STYLUS, I_STICKY, I_PALM, I_CAL, I_BRIGHT, I_SMALLER, I_DEBUG, I_LED, I_PANEL, I_SOUND, I_CLICKS, I_RESCAN, I_NONE };
inline const char* tabName(int t) { static const char* const n[T_COUNT] = {"Controls", "Display", "Sound", "Card"}; return n[t]; }
// A row's name, its chips ("A|B|C"; one label is an action button) and, for Controls, a line that says what it does.
struct Info { const char* name; const char* chips; const char* hint; };
inline Info info(Item i) {
  switch (i) {
    case I_HAND: return {"Hand", "Right|Left", "Which side the pad sits on."};
    case I_PAD: return {"Pad size", "Small|Medium|Large", "How wide the pad is."};
    case I_DEAD: return {"Dead zone", "Small|Medium|Large", "The middle of the pad that presses nothing."};
    case I_POS: return {"Pad position", "Low|Raised|Float", "Raised lifts the pad. Float: no pad until your thumb lands on its side; it centers there."};
    case I_JUMP: return {"Jump button", "Corner|Near pad", "Near pad puts Space beside the pad: one thumb rocks between them."};
    case I_STYLUS: return {"Stylus latch", "Off|On", "A quick tap on the pad keeps walking until the next tap."};
    case I_STICKY: return {"Sticky direction", "Off|On", "Tap left or right to walk; tap again to stop."};
    case I_PALM: return {"Palm reject", "Off|Size|Near", "Ignore big touches (Size), or ones beside a held thumb (Near)."};
    case I_CAL: return {"Touch", "Calibrate", "Tap three targets to line up the touch."};
    case I_BRIGHT: return {"Brightness", "25%|50%|75%|100%", ""};
    case I_SMALLER: return {"Smaller picture", "Off|On", ""};
    case I_DEBUG: return {"Status numbers", "Off|On", ""};
    case I_LED: return {"Status LED", "Off|On", ""};
    case I_PANEL: return {"Panel", "Setup|Picture", ""};
    case I_SOUND: return {"Sound", "Off|Low|Medium|High", ""};
    case I_CLICKS: return {"Button clicks", "Off|On", ""};
    case I_RESCAN: return {"Library", "Rescan card", ""};
    default: return {"", "", ""};
  }
}
inline int chipCount(Item i) { int n = 1; for (const char* c = info(i).chips; *c; c++) n += *c == '|'; return n; }
inline bool isAction(Item i) { return chipCount(i) == 1; }
// The k-th chip's label, copied out of the "A|B|C" list.
inline void chipLabel(Item i, int k, char* out, int cap) {
  const char* c = info(i).chips;
  for (; k > 0 && *c; c++) if (*c == '|') k--;
  int n = 0;
  while (c[n] && c[n] != '|' && n < cap - 1) { out[n] = c[n]; n++; }
  out[n] = 0;
}

// What the rows show and change.
struct Values {
  ctl::Settings s;
  uint8_t bright = 3;
  bool clicks = false, led = true, smaller = false;
};
inline int value(Item i, const Values& v) {
  switch (i) {
    case I_HAND: return v.s.lefty;
    case I_PAD: return v.s.padSize;
    case I_DEAD: return v.s.dead;
    case I_POS: return v.s.floatPad ? 2 : v.s.raised;
    case I_JUMP: return v.s.jumpNear;
    case I_STYLUS: return v.s.stylus;
    case I_STICKY: return v.s.sticky;
    case I_PALM: return v.s.palm;
    case I_BRIGHT: return v.bright;
    case I_SMALLER: return v.smaller;
    case I_DEBUG: return v.s.debug;
    case I_LED: return v.led;
    case I_SOUND: return v.s.sound;
    case I_CLICKS: return v.clicks;
    default: return -1;  // an action
  }
}
inline void choose(Item i, int k, Values& v) {
  uint8_t b = (uint8_t)k;
  switch (i) {
    case I_HAND: v.s.lefty = b; break;
    case I_PAD: v.s.padSize = b; break;
    case I_DEAD: v.s.dead = b; break;
    case I_POS: v.s.floatPad = k == 2; if (k < 2) v.s.raised = b; break;
    case I_JUMP: v.s.jumpNear = b; break;
    case I_STYLUS: v.s.stylus = b; break;
    case I_STICKY: v.s.sticky = b; break;
    case I_PALM: v.s.palm = b; break;
    case I_BRIGHT: v.bright = b; break;
    case I_SMALLER: v.smaller = k != 0; break;
    case I_DEBUG: v.s.debug = b; break;
    case I_LED: v.led = k != 0; break;
    case I_SOUND: v.s.sound = b; break;
    case I_CLICKS: v.clicks = k != 0; break;
    default: break;
  }
}

// The Card tab's lines (main.cpp fills them in; a paused game's card is not touched, so its free space is not measured).
struct CardInfo {
  int builtIn = 0;
  char state[32] = "";     // the home page's card chip text: "Card: 12 games", "No card", ...
  char space[40] = "";     // "Card: 14.2 GB free of 14.8 GB", "Measuring free space..."
  char flash[40] = "";     // "Built-in: 380 KB free"
  char board[40] = "";     // "Board C fw 1a2b3c4 2026-11-05": which board this is (its letter, set over serial with ID set)
  bool fromPause = false;  // Rescan waits for the game list
};

// Which tab and page are showing, and the line under the preview.
struct View {
  Tab tab = T_CONTROLS;
  int page = 0;
  bool fromPause = false;
  Item last = I_NONE;  // the row changed last (its hint shows under the preview)
};

// "Card: 14.2 GB free of 14.8 GB" (total 0: "Built-in: 380 KB free").
inline void sizeText(char* out, int cap, const char* what, uint64_t freeB, uint64_t totalB) {
  auto fmt = [](char* b, int n, uint64_t v) {
    if (v >= (1ull << 30)) snprintf(b, n, "%.1f GB", v / 1073741824.0);
    else if (v >= (1ull << 20)) snprintf(b, n, "%.1f MB", v / 1048576.0);
    else snprintf(b, n, "%u KB", (unsigned)(v >> 10));
  };
  char f[16], t[16];
  fmt(f, sizeof f, freeB);
  if (!totalB) { snprintf(out, cap, "%s: %s free", what, f); return; }
  fmt(t, sizeof t, totalB);
  snprintf(out, cap, "%s: %s free of %s", what, f, t);
}

// ---- geometry -------------------------------------------------------------------------------------------------------
struct Geo {
  int barH, backW, tabH;
  float tabSize;
  int y0;                 // first row
  int stackStep, stackChipH;  // rows with the name above the chips (the Controls column)
  int lineStep, lineChipH;    // rows with the name beside the chips (the other tabs)
  float nameSize, chipSize;
  int pvX, pvY, pvNum, pvDen;  // the preview's corner and scale (game view * num / den)
  int moreY0, moreY1;          // the More button under the preview
  int cardRowY;                // the Card tab's Rescan row
};
// The 2.8 inch board draws through sg::SoftGfx, whose text sizes are whole numbers: its sizes here are 1 or 2.
#ifdef POCKET_CYD28
constexpr Geo G = {32, 34, 32, 1.0f, 34, 41, 32, 40, 32, 1.0f, 1.0f, 156, 36, 1, 2, 198, 238, 150};
#else
constexpr Geo G = {40, 56, 36, 2.0f, 46, 52, 34, 48, 40, 1.5f, 1.5f, 282, 46, 2, 5, 270, 316, 206};
#endif
constexpr int W = scr::W, H = scr::H;
inline int pvW() { return scr::W * G.pvNum / G.pvDen; }
inline int pvH() { return scr::VIEW_H * G.pvNum / G.pvDen; }
inline bool stacked(Tab t) { return t == T_CONTROLS; }
inline int colX1(Tab t) { return stacked(t) ? G.pvX - 6 : W - 4; }

// The items of a tab, in order (the 2.8 inch board adds Calibrate, the status LED and its panel setup).
inline int tabItems(Tab t, Item* out) {
  int n = 0;
  switch (t) {
    case T_CONTROLS:
      for (Item i : {I_HAND, I_PAD, I_DEAD, I_POS, I_JUMP, I_STYLUS, I_STICKY, I_PALM}) out[n++] = i;
      if (scr::SMALL) out[n++] = I_CAL;
      break;
    case T_DISPLAY:
      for (Item i : {I_BRIGHT, I_SMALLER, I_DEBUG}) out[n++] = i;
      if (scr::SMALL) { out[n++] = I_LED; out[n++] = I_PANEL; }
      break;
    case T_SOUND: out[n++] = I_SOUND; out[n++] = I_CLICKS; break;
    default: out[n++] = I_RESCAN; break;
  }
  return n;
}
inline int perPage(Tab t) {  // as many rows as fit above the bottom edge
  if (t == T_CARD) return 1;
  int step = stacked(t) ? G.stackStep : G.lineStep, rowH = stacked(t) ? (int)(8 * G.nameSize) + 1 + G.stackChipH : G.lineChipH;
  return (H - G.y0 - rowH) / step + 1;
}
inline int pages(Tab t) { Item it[12]; int n = tabItems(t, it), p = perPage(t); return (n + p - 1) / p; }
// The items on the showing page.
inline int pageItems(const View& v, Item* out) {
  Item it[12];
  int n = tabItems(v.tab, it), p = perPage(v.tab), k = 0;
  for (int i = v.page * p; i < n && k < p; i++) out[k++] = it[i];
  return k;
}
struct Box { int x0, y0, x1, y1; bool has(int x, int y) const { return x >= x0 && x < x1 && y >= y0 && y < y1; } };
inline Box backBox() { return {2, (G.barH - G.tabH) / 2, 2 + G.backW, (G.barH - G.tabH) / 2 + G.tabH}; }
inline Box tabBox(int t) {
  int base[T_COUNT], sum = 0;
  for (int i = 0; i < T_COUNT; i++) { base[i] = (int)(strlen(tabName(i)) * 6 * G.tabSize) + 10; sum += base[i]; }
  int x = backBox().x1 + 4, room = W - 2 - x - 3 * 2, extra = (room - sum) / T_COUNT;
  for (int i = 0; i < t; i++) x += base[i] + extra + 2;
  return {x, backBox().y0, x + base[t] + extra, backBox().y1};
}
// A row's name line and its chip strip.
struct RowBox { int nameX, nameY; Box chips; };
inline RowBox rowBox(Tab t, int k) {
  if (t == T_CARD) return {6, G.cardRowY + (G.lineChipH - (int)(8 * G.nameSize)) / 2, {W / 3, G.cardRowY, W - 4, G.cardRowY + G.lineChipH}};
  if (stacked(t)) {
    int y = G.y0 + k * G.stackStep, nh = (int)(8 * G.nameSize) + 1;
    return {6, y, {4, y + nh, colX1(t), y + nh + G.stackChipH}};
  }
  int y = G.y0 + k * G.lineStep;
  return {6, y + (G.lineChipH - (int)(8 * G.nameSize)) / 2, {W * 36 / 100, y, W - 4, y + G.lineChipH}};
}
inline Box chipBox(const Box& strip, int n, int k) {
  const int gap = 3;
  int w = (strip.x1 - strip.x0 - gap * (n - 1)) / n;
  return {strip.x0 + k * (w + gap), strip.y0, strip.x0 + k * (w + gap) + w, strip.y1};
}
inline Box previewBox() { return {G.pvX, G.pvY, G.pvX + pvW(), G.pvY + pvH()}; }
inline Box moreBox() { return {G.pvX, G.moreY0, G.pvX + pvW(), G.moreY1}; }

// ---- what a touch is on ---------------------------------------------------------------------------------------------
enum Kind : uint8_t { K_NONE, K_BACK, K_TAB, K_CHIP, K_MORE, K_PREVIEW };
struct Hit { Kind kind = K_NONE; int tab = 0; Item item = I_NONE; int chip = 0; Box box = {0, 0, 0, 0}; };
inline Hit hit(const View& v, int x, int y) {
  Hit h;
  if (backBox().has(x, y)) { h.kind = K_BACK; h.box = backBox(); return h; }
  for (int t = 0; t < T_COUNT; t++)
    if (tabBox(t).has(x, y)) { h.kind = K_TAB; h.tab = t; h.box = tabBox(t); return h; }
  if (v.tab == T_CONTROLS) {
    if (previewBox().has(x, y)) { h.kind = K_PREVIEW; h.box = previewBox(); return h; }
    if (pages(v.tab) > 1 && moreBox().has(x, y)) { h.kind = K_MORE; h.box = moreBox(); return h; }
  }
  Item it[12];
  int n = pageItems(v, it);
  for (int k = 0; k < n; k++) {
    if (it[k] == I_RESCAN && v.fromPause) continue;
    RowBox r = rowBox(v.tab, k);
    int c = chipCount(it[k]);
    for (int j = 0; j < c; j++) {
      Box b = chipBox(r.chips, c, j);
      if (b.has(x, y)) { h.kind = K_CHIP; h.item = it[k]; h.chip = j; h.box = b; return h; }
    }
  }
  return h;
}

// ---- drawing --------------------------------------------------------------------------------------------------------
template <class G_> void text(G_& g, int x, int y, const char* s, float size, uint16_t fg, uint16_t bg) {
  g.setTextSize(size);
  g.setTextColor(fg, bg);
  g.setCursor(x, y);
  g.print(s);
}
// Words wrapped into `cols` columns, from (x, y), at most `rows` lines.
template <class G_> void wrapped(G_& g, int x, int y, const char* s, int cols, int rows, float size, uint16_t fg) {
  char line[64];
  int lh = (int)(8 * size) + 3;
  while (*s && rows-- > 0) {
    int n = (int)strlen(s), take = n;
    if (take > cols) { take = cols; while (take > 0 && s[take] != ' ') take--; if (!take) take = cols; }
    if (take > 63) take = 63;
    memcpy(line, s, take); line[take] = 0;
    text(g, x, y, line, size, fg, C_BLACK);
    s += take; while (*s == ' ') s++;
    y += lh;
  }
}
// A chip's label at the largest size (up to `size`) that fits its width.
inline float fitSize(const char* s, int w, float size) {
  while (size > 1.0f && (int)(strlen(s) * 6 * size) > w - 6) size -= 0.5f;
  return size;
}
template <class G_> void bar(G_& g, const View& v) {
  g.fillRect(0, 0, W, G.barH, C_BLACK);
  Box b = backBox();
  ovl::button(g, b.x0, b.y0, b.x1, b.y1, "<", false, C_DARK, G.tabSize);
  for (int t = 0; t < T_COUNT; t++) {
    Box tb = tabBox(t);
    bool on = t == v.tab;
    ovl::button(g, tb.x0, tb.y0, tb.x1, tb.y1, tabName(t), false, on ? C_BLUE : C_DARK, G.tabSize);
  }
  g.fillRect(0, G.barH - 2, W, 2, C_BLUE);
}
template <class G_> void row(G_& g, Tab t, int k, Item it, const Values& vals, bool disabled) {
  RowBox r = rowBox(t, k);
  text(g, r.nameX, r.nameY, info(it).name, G.nameSize, C_WHITE, C_BLACK);
  int n = chipCount(it), sel = value(it, vals);
  for (int j = 0; j < n; j++) {
    Box b = chipBox(r.chips, n, j);
    char lab[24];
    chipLabel(it, j, lab, sizeof lab);
    float sz = G.chipSize;
    for (int q = 0; q < n; q++) { char o[24]; chipLabel(it, q, o, sizeof o); float f = fitSize(o, b.x1 - b.x0, G.chipSize); if (f < sz) sz = f; }
    if (disabled) {  // gray outline and label: it does nothing here (the note under it says why)
      g.drawRoundRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, 6, C_GRAY);
      g.setTextSize(sz);
      g.setTextColor(C_GRAY, C_BLACK);
      g.setTextDatum(textdatum_t::middle_center);
      g.drawString(lab, (b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2);
      g.setTextDatum(textdatum_t::top_left);
    } else ovl::button(g, b.x0, b.y0, b.x1, b.y1, lab, j == sel, C_DARK, sz);
  }
}
// Names of the keys held now (bits: 1 left, 2 right, 4 up, 8 down, 16 Space (shown as Jump), 32 Enter).
inline void heldText(uint8_t held, char* out, int cap) {
  static const char* const nm[6] = {"Left", "Right", "Up", "Down", "Jump", "Enter"};
  out[0] = 0;
  for (int i = 0; i < 6; i++)
    if (held & (1 << i)) { if (out[0]) strncat(out, " + ", cap - strlen(out) - 1); strncat(out, nm[i], cap - strlen(out) - 1); }
}
// The game view at preview scale: the pad (its arrows lit by `dirs`, as in a game), Space, Enter and MENU (lit by `btn`). A floating
// pad that is not showing (`look` ctl::LOOK_OFF) is a dotted outline of where a thumb may land instead.
template <class G_> void preview(G_& g, const ctl::Layout& L, const ctl::Need& nd, uint8_t dirs, uint8_t btn, int look = ctl::LOOK_FULL) {
  Box p = previewBox();
  g.fillRect(p.x0, p.y0, p.x1 - p.x0, p.y1 - p.y0, C_VIEW);
  g.drawRect(p.x0 - 1, p.y0 - 1, p.x1 - p.x0 + 2, p.y1 - p.y0 + 2, C_GRAY);
  auto sc = [](int v) { return v * G.pvNum / G.pvDen; };
  ctl::Layout s = L;
  s.pad = {sc(L.pad.cx), sc(L.pad.cy), sc(L.pad.r)};
  s.deadR = sc(L.deadR);
  ctl::Need quiet = nd;  // at this scale the jump arcs crowd the arrows: only a lit one is drawn
  quiet.jump = nd.jump && (dirs & 4) && (dirs & 3);
  struct Pen {  // what paddraw needs, with the triangle outline as three lines (sg::SoftGfx has no drawTriangle)
    G_& g;
    void drawCircle(int x, int y, int r, uint16_t c) { g.drawCircle(x, y, r, c); }
    void drawPixel(int x, int y, uint16_t c) { g.drawPixel(x, y, c); }
    void fillTriangle(int a, int b, int c, int d, int e, int f, uint16_t k) { g.fillTriangle(a, b, c, d, e, f, k); }
    void drawTriangle(int a, int b, int c, int d, int e, int f, uint16_t k) { g.drawLine(a, b, c, d, k); g.drawLine(c, d, e, f, k); g.drawLine(e, f, a, b, k); }
  } pen{g};
  if (look != ctl::LOOK_OFF) paddraw::pad(pen, s, quiet, dirs, -p.x0, -p.y0);
  else {
    int x0 = p.x0 + sc(L.zone.x0) + 2, y0 = p.y0 + sc(L.zone.y0) + 2, x1 = p.x0 + sc(L.zone.x1) - 3, y1 = p.y0 + sc(L.zone.y1) - 3;
    for (int x = x0; x <= x1; x += 4) { g.drawPixel(x, y0, C_GRAY); g.drawPixel(x, y1, C_GRAY); }
    for (int y = y0; y <= y1; y += 4) { g.drawPixel(x0, y, C_GRAY); g.drawPixel(x1, y, C_GRAY); }
    g.setTextSize(1);
    g.setTextColor(C_GRAY, C_VIEW);
    g.setTextDatum(textdatum_t::middle_center);
    g.drawString("Pad", (x0 + x1) / 2, (y0 + y1) / 2);
    g.setTextDatum(textdatum_t::top_left);
  }
  auto disc = [&](const ctl::Disc& d, bool lit, const char* name, const char* shortName) {
    int x = p.x0 + sc(d.cx), y = p.y0 + sc(d.cy), r = sc(d.r);
    g.fillCircle(x, y, r, lit ? C_YELLOW : C_DARK);
    g.drawCircle(x, y, r, C_WHITE);
    const char* s2 = (int)strlen(name) * 6 <= 2 * r - 2 ? name : shortName;
    g.setTextSize(1);
    g.setTextColor(lit ? C_BLACK : C_WHITE, lit ? C_YELLOW : C_DARK);
    g.setTextDatum(textdatum_t::middle_center);
    g.drawString(s2, x, y);
    g.setTextDatum(textdatum_t::top_left);
  };
  if (nd.space) disc(L.space, btn & 1, "Jump", "J");
  if (nd.enter) disc(L.enter, btn & 2, "Enter", "E");
  int mx0 = p.x0 + sc(L.menu.x0), my0 = p.y0 + sc(L.menu.y0), mx1 = p.x0 + sc(L.menu.x1), my1 = p.y0 + sc(L.menu.y1);
  ovl::button(g, mx0, my0, mx1, my1, (mx1 - mx0) >= 28 ? "MENU" : "M", btn & 4, C_DARK, 1);
}
// The line under the preview: what the finger presses, else what the last row changed, else how to use it.
template <class G_> void previewNote(G_& g, const View& v, uint8_t held) {
  Box p = previewBox();
  const float sz = scr::SMALL ? 1.0f : 1.5f;
  int y0 = p.y1 + 6, cols = (int)((p.x1 - p.x0) / (6 * sz));
  g.fillRect(p.x0, y0, p.x1 - p.x0, G.moreY0 - 4 - y0, C_BLACK);
  char t[48];
  if (held) {
    heldText(held, t, sizeof t);
    text(g, p.x0, y0, "Pressing:", sz, C_GRAY, C_BLACK);
    wrapped(g, p.x0, y0 + (int)(8 * sz) + 4, t, cols, 2, sz, C_YELLOW);
  } else if (v.last != I_NONE && info(v.last).hint[0]) {
    wrapped(g, p.x0, y0, info(v.last).hint, cols, scr::SMALL ? 4 : 5, sz, C_WHITE);
  } else {
    wrapped(g, p.x0, y0, "Try the pad here: the parts you touch light up.", cols, 4, sz, C_GRAY);
  }
}
template <class G_> void cardLines(G_& g, const CardInfo& c) {
  int y = G.y0 + 4, step = scr::SMALL ? 20 : 30;
  float sz = scr::SMALL ? 1.0f : 1.5f;
  char t[48];
  snprintf(t, sizeof t, c.builtIn == 1 ? "Built in: %d game" : "Built in: %d games", c.builtIn);
  text(g, 6, y, t, sz, C_WHITE, C_BLACK); y += step;
  if (c.state[0]) { text(g, 6, y, c.state, sz, C_WHITE, C_BLACK); y += step; }
  if (c.space[0]) { text(g, 6, y, c.space, sz, C_WHITE, C_BLACK); y += step; }
  if (c.flash[0]) { text(g, 6, y, c.flash, sz, C_GRAY, C_BLACK); y += step; }
  if (c.board[0]) { text(g, 6, y, c.board, sz, C_GRAY, C_BLACK); y += step; }
  if (c.fromPause) text(g, 6, G.cardRowY + G.lineChipH + 8, "Rescan from the game list (a game is paused).", 1, C_GRAY, C_BLACK);
}
// The whole screen. `L`, `nd`, `dirs`, `btn` and `held` are the preview's (Controls only).
template <class G_> void screen(G_& g, const View& v, const Values& vals, const CardInfo& card, const ctl::Layout& L, const ctl::Need& nd,
                                uint8_t dirs, uint8_t btn, uint8_t held) {
  g.fillScreen(C_BLACK);
  bar(g, v);
  Item it[12];
  int n = pageItems(v, it);
  for (int k = 0; k < n; k++) row(g, v.tab, k, it[k], vals, it[k] == I_RESCAN && v.fromPause);
  if (v.tab == T_CARD) cardLines(g, card);
  if (v.tab == T_CONTROLS) {
    preview(g, L, nd, dirs, btn, vals.s.floatPad && !held && !dirs ? ctl::LOOK_OFF : ctl::LOOK_FULL);
    previewNote(g, v, held);
    if (pages(v.tab) > 1) {
      Box m = moreBox();
      char t[16];
      snprintf(t, sizeof t, "More %d/%d", v.page + 1, pages(v.tab));
      ovl::button(g, m.x0, m.y0, m.x1, m.y1, t, false, C_DARK, 2);
    }
  }
}
}  // namespace st
