// Game-Maker Pocket Player for the ESP32-3248S035: a list of games (the Starters packed into LittleFS by
// web/scripts/pocketData.ts), the play loop (gmcore.h, also built and tested on the Mac), touch
// controls for fingers and a stylus (controls.h, also tested on the Mac), a settings screen, and a
// status strip. This file is the board: files, the panel, drawing 320x200 at 1.5x, the screens; sound is in speaker.h.
#include <Arduino.h>
#include <LittleFS.h>
#include <esp_heap_caps.h>
#include <rom/miniz.h>
#include "board.h"
#include "controls.h"
#include "gmcfg.h"
#include "gt911.h"
#include "speaker.h"

static LGFX tft;
static GT911 gt;
static bool haveGT = false;
static gm::World world;
static gm::Cfg cfg;
static gm::Assets assets;
static ctl::Controls controls;
static ctl::Settings settings;
static uint16_t pal[256];  // panel byte order (high byte first)

constexpr int VIEW_W = 480, VIEW_H = 300, BAND = 30;
static uint16_t band[VIEW_W * BAND];
static uint8_t rowIdx[gm::SIZEX];

// Pushing RGB565 with pushImage sends each value low byte first; the ST7796 wants the high byte
// first, so every color is stored byte-swapped (see the colors fix in README.md).
static uint16_t panel565(uint8_t r, uint8_t g, uint8_t b) {
  uint16_t v = (uint16_t)(((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3));
  return (uint16_t)((v << 8) | (v >> 8));
}
// Colors for text and shapes drawn with LovyanGFX's own calls (it swaps the bytes itself).
constexpr uint16_t C_WHITE = 0xFFFF, C_BLACK = 0, C_YELLOW = 0xFF2A, C_GRAY = 0x7BEF, C_DARK = 0x2104, C_BLUE = 0x3A9C;

// ---- files -------------------------------------------------------------------------------------

static uint8_t* readFile(const char* name, size_t* n) {
  char path[40];
  snprintf(path, sizeof path, "/%s", name);
  File f = LittleFS.open(path, "r");
  if (!f) return nullptr;
  size_t len = f.size();
  uint8_t* p = (uint8_t*)malloc(len + 1);
  if (!p) return nullptr;
  if (f.read(p, len) != len) { free(p); return nullptr; }
  *n = len;
  return p;
}
// The decompressor's state is about 11 KB: taken from the heap once, since the loop task's whole
// stack is 8 KB (tinfl_decompress_mem_to_mem puts it on the stack, which overflowed the first time a
// game loaded) and static memory is full.
static tinfl_decompressor* inflater = nullptr;
static bool inflateRaw(const uint8_t* src, size_t n, uint8_t* dst, size_t cap) {
  if (!inflater) inflater = (tinfl_decompressor*)malloc(sizeof(tinfl_decompressor));
  if (!inflater) return false;
  tinfl_init(inflater);
  size_t in = n, out = cap;  // raw deflate: no zlib header
  tinfl_status st = tinfl_decompress(inflater, src, &in, dst, dst, &out, TINFL_FLAG_USING_NON_WRAPPING_OUTPUT_BUF);
  return st == TINFL_STATUS_DONE && out == cap;
}

struct GameEntry { char id[28]; char title[40]; int levels; };
constexpr int MAXGAMES = 96;
static GameEntry games[MAXGAMES];
static int ngames = 0;

static void loadGameList() {
  ngames = 0;
  size_t n = 0;
  uint8_t* t = readFile("games.txt", &n);
  if (!t) return;
  t[n] = 0;
  char* p = (char*)t;
  while (*p && ngames < MAXGAMES) {
    char* e = strchr(p, '\n');
    if (e) *e = 0;
    GameEntry& g = games[ngames];
    char* a = strchr(p, '|');
    char* b = a ? strchr(a + 1, '|') : nullptr;
    if (a && b) {
      *a = 0; *b = 0;
      strncpy(g.id, p, sizeof g.id - 1); g.id[sizeof g.id - 1] = 0;
      strncpy(g.title, a + 1, sizeof g.title - 1); g.title[sizeof g.title - 1] = 0;
      g.levels = atoi(b + 1);
      ngames++;
    }
    if (!e) break;
    p = e + 1;
  }
  free(t);
}

// ---- settings ----------------------------------------------------------------------------------

static void saveSettings() {
  File f = LittleFS.open("/settings.txt", "w");
  if (!f) return;
  f.printf("lefty=%d\nstylus=%d\npad=%d\ndead=%d\npalm=%d\ndebug=%d\nsound=%d\n", settings.lefty, settings.stylus, settings.padSize, settings.dead, settings.palm, settings.debug, settings.sound);
}
static void loadSettings() {
  settings = ctl::Settings();
  File f = LittleFS.open("/settings.txt", "r");
  if (!f) return;
  while (f.available()) {
    String l = f.readStringUntil('\n');
    int v = l.substring(l.indexOf('=') + 1).toInt();
    if (l.startsWith("lefty")) settings.lefty = v ? 1 : 0;
    else if (l.startsWith("stylus")) settings.stylus = v ? 1 : 0;
    else if (l.startsWith("pad")) settings.padSize = v < 0 ? 0 : v > 2 ? 2 : v;
    else if (l.startsWith("dead")) settings.dead = v < 0 ? 0 : v > 2 ? 2 : v;
    else if (l.startsWith("palm")) settings.palm = v < 0 ? 0 : v > 2 ? 2 : v;
    else if (l.startsWith("debug")) settings.debug = v ? 1 : 0;
    else if (l.startsWith("sound")) settings.sound = v < 0 ? 0 : v > 3 ? 3 : v;
  }
}

// ---- touch input -------------------------------------------------------------------------------

struct Pts { int n, id[5], x[5], y[5], size[5]; };
static Pts pts;
static uint32_t lastPoll = 0;
static void pollTouch(uint32_t now) {
  if (!haveGT) { pts.n = 0; return; }
  if (now - lastPoll >= 8) { lastPoll = now; gt.poll(); }
  pts.n = gt.n;
  for (int i = 0; i < gt.n; i++) {
    GT911::toScreen(gt.rawX[i], gt.rawY[i], pts.x[i], pts.y[i]);
    pts.id[i] = gt.id[i];
    pts.size[i] = gt.size[i];
  }
}
// A fresh press (no touch before it) on a menu screen: returns true once per touch, with its position.
static bool wasDown = false;
static bool freshTap(int& x, int& y) {
  bool down = pts.n > 0;
  bool fresh = down && !wasDown;
  wasDown = down;
  if (fresh) { x = pts.x[0]; y = pts.y[0]; }
  return fresh;
}

// ---- drawing -----------------------------------------------------------------------------------

static void button(int x0, int y0, int x1, int y1, const char* label, bool hot = false, uint16_t fill = C_DARK) {
  tft.fillRoundRect(x0, y0, x1 - x0, y1 - y0, 6, hot ? C_YELLOW : fill);
  tft.drawRoundRect(x0, y0, x1 - x0, y1 - y0, 6, C_WHITE);
  tft.setTextColor(hot ? C_BLACK : C_WHITE, hot ? C_YELLOW : fill);
  tft.setTextSize(2);
  tft.setTextDatum(textdatum_t::middle_center);
  tft.drawString(label, (x0 + x1) / 2, (y0 + y1) / 2);
  tft.setTextDatum(textdatum_t::top_left);
}
static void title(const char* s) {
  tft.fillRect(0, 0, 480, 40, C_BLUE);
  tft.setTextColor(C_WHITE, C_BLUE);
  tft.setTextSize(2);
  tft.setCursor(8, 12);
  tft.print(s);
}

// The solid controls (MENU, KEYS and the open key tiles): the game is never pushed under them, so a
// repaint of the picture doesn't blink them off and on (they are drawn once, and again only when they
// change or the controls are redrawn in full).
static int solidRects(int (*out)[4]);
// Pushes `rows` rows of the band at (X0, Ys), w wide, leaving out the solid controls.
static void pushAround(int X0, int Ys, int w, int rows) {
  int sr[3 + ctl::MAXEXTRA][4];
  int ns = solidRects(sr);
  bool hit = false;
  for (int i = 0; i < ns && !hit; i++) hit = sr[i][0] < X0 + w && sr[i][2] > X0 && sr[i][1] < Ys + rows && sr[i][3] > Ys;
  if (!hit) { tft.pushImage(X0, Ys, w, rows, band); return; }
  for (int r = 0; r < rows; r++) {
    int Y = Ys + r, x = X0, X1 = X0 + w;
    while (x < X1) {
      int stop = X1, skipTo = x;  // the next solid span on this row
      for (int i = 0; i < ns; i++) {
        if (Y < sr[i][1] || Y >= sr[i][3] || sr[i][2] <= x || sr[i][0] >= X1) continue;
        if (sr[i][0] <= x) { if (sr[i][2] > skipTo) skipTo = sr[i][2]; }
        else if (sr[i][0] < stop) stop = sr[i][0];
      }
      if (skipTo > x) { x = skipTo; continue; }
      tft.pushImage(x, Y, stop - x, 1, band + r * w + (x - X0));
      x = stop;
    }
  }
}

// Draws screen rectangle [X0,X1) x [Y0,Y1) of the 480x300 view: the game's rows at 1.5x.
static void drawRegion(int X0, int Y0, int X1, int Y1) {
  if (X0 < 0) X0 = 0;
  if (Y0 < 0) Y0 = 0;
  if (X1 > VIEW_W) X1 = VIEW_W;
  if (Y1 > VIEW_H) Y1 = VIEW_H;
  int w = X1 - X0;
  if (w <= 0 || Y1 <= Y0) return;
  int rowGy = -1;
  for (int Ys = Y0; Ys < Y1; Ys += BAND) {
    int rows = Y1 - Ys < BAND ? Y1 - Ys : BAND;
    for (int r = 0; r < rows; r++) {
      int gy = (Ys + r) * 2 / 3;
      if (gy != rowGy) { world.renderRow(gy, rowIdx); rowGy = gy; }
      uint16_t* o = band + r * w;
      for (int X = X0; X < X1; X++) *o++ = pal[rowIdx[X * 2 / 3]];
    }
    pushAround(X0, Ys, w, rows);
  }
}

static const char* labelOf(int scan, const char* fallback) {
  for (int i = 0; i < cfg.nkeys; i++) if (cfg.keys[i].scan == scan) return cfg.keys[i].label;
  return fallback;
}

// Triangle pointing in direction d (0 left, 1 right, 2 up, 3 down) at (cx, cy), size s.
static void arrow(int cx, int cy, int d, int s, bool lit) {
  int x0 = cx, y0 = cy, x1, y1, x2, y2;
  switch (d) {
    case 0: x0 = cx - s; y0 = cy; x1 = cx + s / 2; y1 = cy - s; x2 = cx + s / 2; y2 = cy + s; break;
    case 1: x0 = cx + s; y0 = cy; x1 = cx - s / 2; y1 = cy - s; x2 = cx - s / 2; y2 = cy + s; break;
    case 2: x0 = cx; y0 = cy - s; x1 = cx - s; y1 = cy + s / 2; x2 = cx + s; y2 = cy + s / 2; break;
    default: x0 = cx; y0 = cy + s; x1 = cx - s; y1 = cy - s / 2; x2 = cx + s; y2 = cy - s / 2; break;
  }
  if (lit) tft.fillTriangle(x0, y0, x1, y1, x2, y2, C_YELLOW);
  tft.drawTriangle(x0, y0, x1, y1, x2, y2, lit ? C_BLACK : C_WHITE);
}
static void disc(const ctl::Disc& d, bool down, const char* label) {
  if (down) tft.fillCircle(d.cx, d.cy, d.r, C_YELLOW);
  tft.drawCircle(d.cx, d.cy, d.r + 1, C_BLACK);
  tft.drawCircle(d.cx, d.cy, d.r, down ? C_BLACK : C_WHITE);
  tft.drawCircle(d.cx, d.cy, d.r - 1, down ? C_BLACK : C_WHITE);
  tft.setTextColor(down ? C_BLACK : C_WHITE);
  tft.setTextSize(1);
  tft.setTextDatum(textdatum_t::middle_center);
  tft.drawString(label, d.cx, d.cy);
  tft.setTextDatum(textdatum_t::top_left);
}
static void chip(const ctl::Rect& r, const char* label, bool down) {
  tft.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0, C_BLACK);  // square: the game isn't pushed under its corners
  tft.fillRoundRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0, 6, down ? C_YELLOW : C_DARK);
  tft.drawRoundRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0, 6, C_WHITE);
  tft.setTextColor(down ? C_BLACK : C_WHITE);
  tft.setTextSize(1);
  tft.setTextDatum(textdatum_t::middle_center);
  tft.drawString(label, (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2);
  tft.setTextDatum(textdatum_t::top_left);
}

// The controls, drawn as outlines over the game (clipped to `c`), so the picture shows through.
static void drawControls(int cx0, int cy0, int cx1, int cy1) {
  tft.setClipRect(cx0, cy0, cx1 - cx0, cy1 - cy0);
  const ctl::Layout& L = controls.L;
  const ctl::Need& nd = controls.need;
  const ctl::Disc& p = L.pad;
  tft.drawCircle(p.cx, p.cy, p.r + 1, C_BLACK);
  tft.drawCircle(p.cx, p.cy, p.r, C_WHITE);
  tft.drawCircle(p.cx, p.cy, L.deadR, C_WHITE);
  uint8_t d = controls.padDirs;
  int a = p.r * 2 / 3, s = p.r / 6 + 4;
  if (nd.left) arrow(p.cx - a, p.cy, 0, s, d & 1);
  if (nd.right) arrow(p.cx + a, p.cy, 1, s, d & 2);
  if (nd.up) arrow(p.cx, p.cy - a, 2, s, d & 4);
  if (nd.down) arrow(p.cx, p.cy + a, 3, s, d & 8);
  if (nd.space) disc(L.space, controls.btnDown & 1, labelOf(ctl::S_SPACE, "Space"));
  if (nd.enter) disc(L.enter, controls.btnDown & 2, labelOf(ctl::S_ENTER, "Enter"));
  chip(L.menu, "MENU", controls.btnDown & 4);
  if (nd.nextra) chip(L.keys, "KEYS", (controls.btnDown & 8) || controls.keysOpen);
  if (controls.keysOpen)
    for (int i = 0; i < nd.nextra; i++) {
      const ctl::Rect& r = L.tile[i];
      bool on = controls.tileDown & (1 << i);
      tft.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0, C_BLACK);
      tft.fillRoundRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0, 6, on ? C_YELLOW : C_DARK);
      tft.drawRoundRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0, 6, C_WHITE);
      tft.setTextColor(on ? C_BLACK : C_WHITE);
      tft.setTextSize(2);
      tft.setTextDatum(textdatum_t::middle_center);
      tft.drawString(ctl::scanName(nd.extra[i]), (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2 - 6);
      tft.setTextSize(1);
      tft.drawString(labelOf(nd.extra[i], ""), (r.x0 + r.x1) / 2, r.y1 - 10);
      tft.setTextDatum(textdatum_t::top_left);
    }
  tft.clearClipRect();
}

static int solidRects(int (*out)[4]) {
  const ctl::Layout& L = controls.L;
  int n = 0;
  auto add = [&](const ctl::Rect& r) { out[n][0] = r.x0; out[n][1] = r.y0; out[n][2] = r.x1; out[n][3] = r.y1; n++; };
  add(L.menu);
  if (controls.need.nextra) add(L.keys);
  if (controls.keysOpen) for (int i = 0; i < controls.need.nextra; i++) add(L.tile[i]);
  return n;
}

struct R { int x0, y0, x1, y1; };
static bool emptyR(const R& r) { return r.x1 <= r.x0 || r.y1 <= r.y0; }
static R unionR(const R& a, const R& b) {
  if (emptyR(a)) return b;
  if (emptyR(b)) return a;
  return {a.x0 < b.x0 ? a.x0 : b.x0, a.y0 < b.y0 ? a.y0 : b.y0, a.x1 > b.x1 ? a.x1 : b.x1, a.y1 > b.y1 ? a.y1 : b.y1};
}
// The screen rectangle the hero covers (two blocks high), a pixel wider than it is.
static R heroRect() {
  if (world.scrx <= gm::OFFSCRN) return {0, 0, 0, 0};
  int gx = world.scrx - world.sc.lsx, gy = world.scry - world.sc.lsy;
  int gy0 = world.curtop < gm::CHARBL ? gy - gm::BLEN : gy;
  return {gx * 3 / 2 - 2, gy0 * 3 / 2 - 2, (gx + gm::BLEN) * 3 / 2 + 3, (gy + gm::BLEN) * 3 / 2 + 3};
}

static struct { int mx, my, nx, ny, lsx, lsy; uint32_t gen; R hero; bool valid; } last;
// The screen rectangles of the monsters drawn last frame (a moved or gone monster is drawn over again).
static R lastMon[gm::MAXMONSSHOWN];
static int nLastMon = 0;
static R monRect(const gm::MonDraw& d) {
  int gx = d.x - world.sc.lsx, gy = d.y - world.sc.lsy;
  return {gx * 3 / 2 - 2, gy * 3 / 2 - 2, (gx + gm::BLEN) * 3 / 2 + 3, (gy + gm::BLEN) * 3 / 2 + 3};
}
static uint8_t lastPad = 0, lastBtn = 0;
static uint16_t lastTile = 0;

static void controlRects(R* out, int& n) {
  const ctl::Layout& L = controls.L;
  n = 0;
  out[n++] = {L.pad.cx - L.pad.r - 2, L.pad.cy - L.pad.r - 2, L.pad.cx + L.pad.r + 3, L.pad.cy + L.pad.r + 3};
  out[n++] = {L.space.cx - L.space.r - 2, L.space.cy - L.space.r - 2, L.space.cx + L.space.r + 3, L.space.cy + L.space.r + 3};
  out[n++] = {L.enter.cx - L.enter.r - 2, L.enter.cy - L.enter.r - 2, L.enter.cx + L.enter.r + 3, L.enter.cy + L.enter.r + 3};
  out[n++] = {L.menu.x0, L.menu.y0, L.menu.x1, L.menu.y1};
  out[n++] = {L.keys.x0, L.keys.y0, L.keys.x1, L.keys.y1};
}

static void drawFrame(bool forceFull) {
  const auto& s = world.sc;
  bool full = forceFull || !last.valid || last.mx != world.mx || last.my != world.my || last.nx != s.nx || last.ny != s.ny || last.lsx != s.lsx ||
              last.lsy != s.lsy || last.gen != world.gen;
  R hero = heroRect();
  R curMon[gm::MAXMONSSHOWN];
  int nCurMon = world.ndraw;
  for (int i = 0; i < nCurMon; i++) curMon[i] = monRect(world.draw[i]);
  // Many moving monsters: one full redraw is cheaper than a rectangle each.
  if (!full && nCurMon + nLastMon > 6) full = true;
  if (full) {
    drawRegion(0, 0, VIEW_W, VIEW_H);
    drawControls(0, 0, VIEW_W, VIEW_H);
  } else {
    R dirty = unionR(hero, last.hero);
    if (!emptyR(dirty)) {
      drawRegion(dirty.x0, dirty.y0, dirty.x1, dirty.y1);
      drawControls(dirty.x0, dirty.y0, dirty.x1, dirty.y1);
    }
    for (int i = 0; i < nCurMon + nLastMon; i++) {
      const R& r = i < nCurMon ? curMon[i] : lastMon[i - nCurMon];
      drawRegion(r.x0, r.y0, r.x1, r.y1);
      drawControls(r.x0, r.y0, r.x1, r.y1);
    }
    // A control whose state changed is drawn again over the game behind it.
    bool padCh = controls.padDirs != lastPad, btnCh = controls.btnDown != lastBtn, tileCh = controls.tileDown != lastTile;
    if (padCh || btnCh || tileCh) {
      R rs[5];
      int n;
      controlRects(rs, n);
      for (int i = 0; i < n; i++) {
        bool ch = (i == 0 && padCh) || (btnCh && i > 0) || false;
        if (!ch) continue;
        drawRegion(rs[i].x0, rs[i].y0, rs[i].x1, rs[i].y1);
        drawControls(rs[i].x0, rs[i].y0, rs[i].x1, rs[i].y1);
      }
      if (tileCh && controls.keysOpen) drawControls(0, 56, VIEW_W, 62 + 60 * controls.L.tileRows);
    }
  }
  last = {world.mx, world.my, s.nx, s.ny, s.lsx, s.lsy, world.gen, hero, true};
  for (int i = 0; i < nCurMon; i++) lastMon[i] = curMon[i];
  nLastMon = nCurMon;
  lastPad = controls.padDirs;
  lastBtn = controls.btnDown;
  lastTile = controls.tileDown;
}

// ---- status strip ------------------------------------------------------------------------------

static uint32_t drawMsLast = 0, tickMsLast = 0, frames = 0, fpsT0 = 0, fps = 0, stripT = 0;

static void drawStrip() {
  tft.fillRect(0, VIEW_H, VIEW_W, 20, C_BLACK);
  tft.setTextSize(1);
  tft.setTextColor(C_WHITE, C_BLACK);
  tft.setCursor(2, VIEW_H + 6);
  char line[128];
  int n = 0;
  if (world.hitpts > 0 && world.hitpts < gm::INF_REPEAT) n += snprintf(line + n, sizeof line - n, "HP %d  ", world.hitpts);
  if (world.lives > 0 && world.lives < gm::INF_REPEAT) n += snprintf(line + n, sizeof line - n, "Lives %d  ", world.lives);
  n += snprintf(line + n, sizeof line - n, "Score %d  ", world.score);
  if (world.meter[3] > 0 && world.meter[3] < gm::INF_REPEAT) n += snprintf(line + n, sizeof line - n, "Money %d  ", world.meter[3] - 1);
  for (int i = 0; i < cfg.nctr; i++) {
    int v = world.meter[cfg.ctr[i].n];
    n += snprintf(line + n, sizeof line - n, "%s %d  ", cfg.ctr[i].label, v < 0 || v == gm::INF_REPEAT ? 0 : v);
  }
  line[n] = 0;
  tft.print(line);
  if (settings.debug) {
    snprintf(line, sizeof line, "lv%d %lufps t%lu d%lu s%d", world.level + 1, (unsigned long)fps, (unsigned long)tickMsLast, (unsigned long)drawMsLast, controls.lastSize);
    tft.setCursor(VIEW_W - 6 * (int)strlen(line) - 2, VIEW_H + 6);
    tft.print(line);
  }
}

// ---- screens -------------------------------------------------------------------------------------

enum Mode { PICKER, PLAYING, PAUSED, SETTINGS_SCREEN, DONE };
static Mode mode = PICKER;
static int page = 0;
constexpr int ROWS = 5;

static void drawPicker() {
  tft.fillScreen(C_BLACK);
  char t[48];
  int pages = (ngames + ROWS - 1) / ROWS;
  snprintf(t, sizeof t, "Pocket Player   %d games   page %d/%d", ngames, page + 1, pages ? pages : 1);
  title(t);
  for (int r = 0; r < ROWS; r++) {
    int i = page * ROWS + r;
    if (i >= ngames) break;
    char l[64];
    snprintf(l, sizeof l, "%s  (%d level%s)", games[i].title, games[i].levels, games[i].levels == 1 ? "" : "s");
    int y = 44 + r * 46;
    tft.fillRoundRect(6, y, 468, 42, 6, C_DARK);
    tft.drawRoundRect(6, y, 468, 42, 6, C_GRAY);
    tft.setTextColor(C_WHITE, C_DARK);
    tft.setTextSize(2);
    tft.setCursor(16, y + 13);
    tft.print(l);
  }
  button(6, 276, 126, 318, "< Prev");
  button(134, 276, 254, 318, "Next >");
  button(342, 276, 474, 318, "Settings");
}

static const char* const HAND[] = {"Right", "Left"};
static const char* const ONOFF[] = {"Off", "On"};
static const char* const SIZE3[] = {"Small", "Medium", "Large"};
// A short rising beep to hear the volume with (36 steps of 1/145.6 s, little endian frequencies in Hz).
static const uint8_t SAMPLE_TUNE[72] = {
    0xB8, 0x01, 0xB8, 0x01, 0xB8, 0x01, 0xB8, 0x01, 0xB8, 0x01, 0xB8, 0x01, 0xB8, 0x01, 0xB8, 0x01, 0xB8, 0x01,
    0x30, 0x02, 0x30, 0x02, 0x30, 0x02, 0x30, 0x02, 0x30, 0x02, 0x30, 0x02, 0x30, 0x02, 0x30, 0x02, 0x30, 0x02,
    0x88, 0x02, 0x88, 0x02, 0x88, 0x02, 0x88, 0x02, 0x88, 0x02, 0x88, 0x02, 0x88, 0x02, 0x88, 0x02, 0x88, 0x02,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
static const char* const VOLUME[] = {"Off", "Low", "Medium", "High"};
static const char* const PALM[] = {"Off", "Size", "Size+near"};
static void drawSettings() {
  tft.fillScreen(C_BLACK);
  title("Settings");
  struct Row { const char* name; const char* value; };
  Row rows[] = {{"Hand", HAND[settings.lefty]},          {"Stylus (taps latch)", ONOFF[settings.stylus]}, {"Pad size", SIZE3[settings.padSize]},
                {"Pad dead zone", SIZE3[settings.dead]}, {"Palm rejection", PALM[settings.palm]},         {"Status numbers", ONOFF[settings.debug]},
                {"Sound", VOLUME[settings.sound]}};
  for (int i = 0; i < 7; i++) {
    int y = 42 + i * 34;
    tft.fillRoundRect(6, y, 468, 32, 6, C_DARK);
    tft.drawRoundRect(6, y, 468, 32, 6, C_GRAY);
    tft.setTextSize(2);
    tft.setTextColor(C_WHITE, C_DARK);
    tft.setCursor(14, y + 8);
    tft.print(rows[i].name);
    tft.setTextColor(C_YELLOW, C_DARK);
    tft.setCursor(300, y + 8);
    tft.print(rows[i].value);
  }
  button(6, 288, 150, 318, "Back");
  tft.setTextSize(1);
  tft.setTextColor(C_GRAY, C_BLACK);
  tft.setCursor(160, 296);
  tft.print("touch the screen: x,y size shows here");
}
static void settingsTouchInfo() {
  tft.fillRect(160, 306, 320, 12, C_BLACK);
  tft.setTextSize(1);
  tft.setTextColor(C_WHITE, C_BLACK);
  tft.setCursor(160, 308);
  char l[64];
  if (pts.n) snprintf(l, sizeof l, "raw %d,%d  screen %d,%d  size %d", gt.rawX[0], gt.rawY[0], pts.x[0], pts.y[0], pts.size[0]);
  else snprintf(l, sizeof l, "no touch");
  tft.print(l);
}

static const char* const PAUSE_ITEMS[] = {"Resume", "Restart game", "Games", "Settings"};
static void drawPause() {
  tft.fillRect(100, 40, 280, 236, C_BLACK);
  tft.drawRect(100, 40, 280, 236, C_WHITE);
  for (int i = 0; i < 4; i++) button(112, 52 + i * 56, 368, 52 + i * 56 + 48, PAUSE_ITEMS[i]);
}

static uint32_t t0 = 0, ticksRun = 0;
static int curGame = -1;
static bool fromPause = false;

static void applyControls() {
  ctl::Need need;
  for (int i = 0; i < cfg.nkeys; i++) ctl::needAdd(need, cfg.keys[i].scan);
  if (!need.left && !need.right && !need.up && !need.down) need.left = need.right = true;  // a game that lists no keys still gets the walk keys
  if (!need.space && !need.enter && need.nextra == 0) need.space = true;
  controls.configure(settings, need);
}

static bool startGame(int g) {
  curGame = g;
  char path[48];
  snprintf(path, sizeof path, "/%s.cfg", games[g].id);
  File f = LittleFS.open(path, "r");
  if (!f) return false;
  String text = f.readString();
  assets.release();
  if (!gm::parseCfg(text.c_str(), world, cfg)) return false;
  assets.attach(world, cfg, readFile, inflateRaw);
  assets.palName[0] = 0;
  world.seed = micros() ^ (millis() << 7);  // the monsters that wander pick differently each play
  if (!world.begin()) return false;
  world.nsnd = 0;
  spk::stop();
  for (int i = 0; i < 256; i++) {
    auto v8 = [](uint8_t c) { c &= 63; return (uint8_t)((c << 2) | (c >> 4)); };
    pal[i] = panel565(v8(assets.pal[i * 3]), v8(assets.pal[i * 3 + 1]), v8(assets.pal[i * 3 + 2]));
  }
  assets.palChanged = false;
  applyControls();
  tft.fillScreen(C_BLACK);
  last.valid = false;
  drawFrame(true);
  drawStrip();
  t0 = millis();
  ticksRun = 0;
  mode = PLAYING;
  return true;
}
static void refreshPalette() {
  if (!assets.palChanged) return;
  assets.palChanged = false;
  for (int i = 0; i < 256; i++) {
    auto v8 = [](uint8_t c) { c &= 63; return (uint8_t)((c << 2) | (c >> 4)); };
    pal[i] = panel565(v8(assets.pal[i * 3]), v8(assets.pal[i * 3 + 1]), v8(assets.pal[i * 3 + 2]));
  }
}

static void enterPicker() {
  spk::stop();
  mode = PICKER;
  wasDown = true;
  drawPicker();
}

// ---- setup and loop ------------------------------------------------------------------------------

static void message(const char* a, const char* b = nullptr) {
  tft.fillScreen(C_BLACK);
  tft.setTextColor(C_WHITE, C_BLACK);
  tft.setTextSize(2);
  tft.setCursor(20, 120);
  tft.print(a);
  if (b) { tft.setCursor(20, 150); tft.print(b); }
}

// ---- serial self-test ----------------------------------------------------------------------------
// "T <index> <ticks>" or "T all <ticks>" on Serial (115200), accepted only on the game list: loads each
// game the way a tap does, runs it with no input (drawing too), prints one "ST" line, then returns to the list.

static void selfTestOne(int g, int ticks) {
  bool ok = startGame(g);
  for (int i = 0; ok && i < ticks; i++) {
    world.tick();
    world.nsnd = 0;
    if (assets.palChanged) { refreshPalette(); last.valid = false; }
    drawFrame(false);
    if ((i & 15) == 0) delay(1);  // let the watchdog and idle task breathe
  }
  Serial.printf("ST id=%s ok=%d free=%u largest=%u min=%u stack=%u\n", games[g].id, ok ? 1 : 0, (unsigned)ESP.getFreeHeap(),
                (unsigned)heap_caps_get_largest_free_block(MALLOC_CAP_8BIT), (unsigned)ESP.getMinFreeHeap(),
                (unsigned)uxTaskGetStackHighWaterMark(nullptr));
  spk::stop();
  world.releaseAll();
}

static void serialCommand(const char* cmd) {
  char what[16];
  int ticks = 0;
  if (sscanf(cmd, "T %15s %d", what, &ticks) != 2 || ticks < 0) return;
  if (!strcmp(what, "all")) {
    for (int g = 0; g < ngames; g++) selfTestOne(g, ticks);
    Serial.printf("ST done n=%d\n", ngames);
  } else {
    int g = atoi(what);
    if (g < 0 || g >= ngames) { Serial.println("ST error index"); return; }
    selfTestOne(g, ticks);
    Serial.println("ST done n=1");
  }
  enterPicker();
}

static void pollSerial() {
  static char buf[40];
  static int n = 0;
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\n' || c == '\r') {
      buf[n] = 0;
      n = 0;
      if (buf[0] == 'T') serialCommand(buf);
    } else if (n < (int)sizeof buf - 1) buf[n++] = c;
  }
}

void setup() {
  Serial.begin(115200);
  tft.init();
  tft.setRotation(1);
  tft.setBrightness(255);
  tft.setSwapBytes(false);
  message("Game-Maker Pocket Player");
  spk::begin();
  haveGT = gt.probe();
  char line[64];
  if (haveGT) snprintf(line, sizeof line, "Touch: GT911 at 0x%02X", gt.addr);
  else snprintf(line, sizeof line, "Touch: no GT911 found");
  tft.setCursor(20, 150);
  tft.print(line);
  Serial.println(line);
  if (!LittleFS.begin(false)) {
    message("LittleFS mount failed");
    for (;;) delay(1000);
  }
  loadSettings();
  spk::setVolume(settings.sound);
  loadGameList();
  if (!ngames) {
    message("No games on the board", "flash the LittleFS image");
    for (;;) delay(1000);
  }
  delay(900);
  Serial.printf("ready: %d games, heap %u, largest %u\n", ngames, (unsigned)ESP.getFreeHeap(), (unsigned)heap_caps_get_largest_free_block(MALLOC_CAP_8BIT));
  enterPicker();
}

static void applyKeys(uint32_t now) {
  ctl::Change ch[16];
  int n = controls.flush(ch, 16);
  for (int i = 0; i < n; i++) world.key(ch[i].scan, ch[i].down);
  (void)now;
}

void loop() {
  uint32_t now = millis();
  pollTouch(now);
  int tx, ty;

  if (mode == PICKER) {
    pollSerial();
    if (mode != PICKER) return;
    if (freshTap(tx, ty)) {
      int pages = (ngames + ROWS - 1) / ROWS;
      if (ty >= 276) {
        if (tx < 130 && page > 0) { page--; drawPicker(); }
        else if (tx >= 130 && tx < 260 && page + 1 < pages) { page++; drawPicker(); }
        else if (tx >= 340) { mode = SETTINGS_SCREEN; fromPause = false; drawSettings(); }
      } else if (ty >= 44) {
        int r = (ty - 44) / 46, i = page * ROWS + r;
        if (r < ROWS && i < ngames) {
          message("Loading", games[i].title);
          if (!startGame(i)) { message("Could not load", games[i].title); delay(1500); enterPicker(); }
          else wasDown = true;
        }
      }
    }
    delay(5);
    return;
  }
  if (mode == SETTINGS_SCREEN) {
    if (freshTap(tx, ty)) {
      if (ty >= 288 && tx < 160) {
        saveSettings();
        if (fromPause) { applyControls(); mode = PAUSED; tft.fillScreen(C_BLACK); last.valid = false; drawFrame(true); drawStrip(); drawPause(); }
        else enterPicker();
        return;
      }
      int row = (ty - 42) / 34;
      if (ty >= 42 && row >= 0 && row < 7) {
        switch (row) {
          case 0: settings.lefty ^= 1; break;
          case 1: settings.stylus ^= 1; break;
          case 2: settings.padSize = (settings.padSize + 1) % 3; break;
          case 3: settings.dead = (settings.dead + 1) % 3; break;
          case 4: settings.palm = (settings.palm + 1) % 3; break;
          case 5: settings.debug ^= 1; break;
          case 6:
            settings.sound = (settings.sound + 1) % 4;
            spk::setVolume(settings.sound);
            spk::play(SAMPLE_TUNE);
            break;
        }
        drawSettings();
      }
    }
    static uint32_t infoT = 0;
    if (now - infoT > 100) { infoT = now; settingsTouchInfo(); }
    delay(5);
    return;
  }
  if (mode == PAUSED) {
    if (freshTap(tx, ty)) {
      int i = (ty - 52) / 56;
      if (tx >= 112 && tx < 368 && ty >= 52 && i >= 0 && i < 4 && (ty - 52) % 56 < 48) {
        if (i == 0) {
          mode = PLAYING; world.releaseAll(); controls.reset(); last.valid = false; drawFrame(true); drawStrip();
          t0 = millis(); ticksRun = 0; wasDown = true;
        } else if (i == 1) startGame(curGame);
        else if (i == 2) enterPicker();
        else { mode = SETTINGS_SCREEN; fromPause = true; drawSettings(); }
      }
    }
    delay(5);
    return;
  }
  if (mode == DONE) {
    if (freshTap(tx, ty)) enterPicker();
    delay(5);
    return;
  }

  // PLAYING: the contacts go through the controls model; its key changes go to the game.
  controls.update(pts.id, pts.x, pts.y, pts.size, pts.n, now);
  int ev = controls.takeEvent();
  if (ev == ctl::EV_MENU) {
    spk::stop();
    world.releaseAll();
    applyKeys(now);
    controls.reset();
    mode = PAUSED;
    drawPause();
    wasDown = true;
    return;
  }
  if (ev == ctl::EV_KEYS) {
    last.valid = false;  // the key tiles come or go: draw everything again
  }
  applyKeys(now);

  // Game ticks run at 18.2 Hz; after a slow frame several run to catch up (at most 4).
  uint32_t due = (now - t0) * 182 / 10000;
  int ran = 0;
  uint32_t ts = millis();
  bool oneLevelUp = false;
  while (ticksRun < due && ran < 4) {
    int lv = world.level;
    char r = world.tick();
    if (world.nsnd && world.snd) spk::play(world.snd + world.sndQ[world.nsnd - 1] * 72);  // the effect heard is the last one started (a new one cuts the old)
    world.nsnd = 0;
    ticksRun++;
    ran++;
    if (world.level != lv) oneLevelUp = true;
    if (r == 'W') {
      world.releaseAll();
      controls.reset();
      message("You made it!", "Touch for the list");
      delay(1200);
      mode = DONE;
      wasDown = true;
      return;
    }
  }
  if (ticksRun + 4 < due) { t0 = millis(); ticksRun = 0; }  // far behind: drop the lost time
  if (ran) tickMsLast = (millis() - ts) / ran;
  if (oneLevelUp || assets.palChanged) { refreshPalette(); last.valid = false; }

  if (ran || !last.valid || controls.padDirs != lastPad || controls.btnDown != lastBtn || controls.tileDown != lastTile) {
    uint32_t ds = millis();
    drawFrame(false);
    drawMsLast = millis() - ds;
    frames++;
  }
  if (now - fpsT0 >= 1000) {
    fps = frames * 1000 / (now - fpsT0);
    frames = 0;
    fpsT0 = now;
  }
  if (now - stripT >= 300) {
    stripT = now;
    drawStrip();
  }
  delay(1);
}
