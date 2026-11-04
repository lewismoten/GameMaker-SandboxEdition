// Game-Maker Pocket Player: plays First Steps (both levels) on the ESP32-3248S035 from the game's real
// DOS files in LittleFS. The play rules are gmcore.h (also built and tested on the Mac); this file is
// the board: files, touch buttons, drawing 320x200 at 1.5x, and the debug strip. No sound.
#include <Arduino.h>
#include <LittleFS.h>
#include <esp_heap_caps.h>
#include "board.h"
#include "gmcfg.h"
#include "gt911.h"
#include "pocketui.h"

static LGFX tft;
static GT911 gt;
static bool haveGT = false;
static gm::World world;
static gm::Cfg cfg;
static uint16_t pal[256], palDim[256];  // panel byte order (high byte first)

constexpr int VIEW_W = 480, VIEW_H = 300, BAND = 30;
static uint16_t band[VIEW_W * BAND];
static uint8_t rowIdx[gm::SIZEX];

// Pushing RGB565 with pushImage sends each value low byte first; the ST7796 wants the high byte
// first, so every color is stored byte-swapped (see the colors fix in README.md).
static uint16_t panel565(uint8_t r, uint8_t g, uint8_t b) {
  uint16_t v = (uint16_t)(((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3));
  return (uint16_t)((v << 8) | (v >> 8));
}

static uint8_t* slurp(const char* path, size_t want) {
  File f = LittleFS.open(path, "r");
  if (!f || f.size() < want) return nullptr;
  uint8_t* p = (uint8_t*)malloc(f.size());
  if (!p) return nullptr;
  f.read(p, f.size());
  return p;
}

static bool loadMap(void*, int level, uint8_t* blocks) {
  char path[24];
  snprintf(path, sizeof path, "/%s", cfg.map[level]);
  File f = LittleFS.open(path, "r");
  if (!f) return false;
  uint8_t buf[400];
  for (int i = 0; i < gm::MLEN * gm::MWID; i += 200) {
    if (f.read(buf, 400) != 400) return false;
    for (int k = 0; k < 200; k++) blocks[i + k] = buf[k * 2];
  }
  return true;
}

static bool loadAll(const char** why) {
  uint8_t* bbl = slurp("/steps.bbl", 63000);
  uint8_t* cbl = slurp("/hero.cbl", 21000);
  uint8_t* chr = slurp("/hero.chr", 3784);
  File cf = LittleFS.open("/steps.cfg", "r");
  File pf = LittleFS.open("/steps.pal", "r");
  if (!bbl || !cbl || !chr || !cf || !pf) { *why = "game files missing"; return false; }
  String text = cf.readString();
  if (!gm::parseCfg(text.c_str(), world, cfg)) { *why = "steps.cfg unreadable"; return false; }
  uint8_t rgb[768];
  if (pf.read(rgb, 768) != 768) { *why = "palette unreadable"; return false; }
  for (int i = 0; i < 256; i++) {
    auto v8 = [](uint8_t c) { c &= 63; return (uint8_t)((c << 2) | (c >> 4)); };
    uint8_t r = v8(rgb[i * 3]), g = v8(rgb[i * 3 + 1]), b = v8(rgb[i * 3 + 2]);
    pal[i] = panel565(r, g, b);
    palDim[i] = panel565(r >> 1, g >> 1, b >> 1);
  }
  world.bbl = bbl;
  world.cbl = cbl;
  world.chr = chr;
  world.loadMap = loadMap;
  return true;
}

// ---- drawing -----------------------------------------------------------------------------------

static uint16_t cWhite, cGray, cYellow;
static uint8_t btnDown = 0;  // bit per ui::Btn

// Draws screen rectangle [X0,X1) x [Y0,Y1) of the 480x300 view: game rows at 1.5x plus the buttons.
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
      int Y = Ys + r;
      int gy = Y * 2 / 3;
      if (gy != rowGy) { world.renderRow(gy, rowIdx); rowGy = gy; }
      uint16_t* o = band + r * w;
      if (!ui::rowHasButtons(Y)) {
        for (int X = X0; X < X1; X++) *o++ = pal[rowIdx[X * 2 / 3]];
        continue;
      }
      for (int X = X0; X < X1; X++) {
        uint8_t idx = rowIdx[X * 2 / 3];
        uint16_t c = pal[idx];
        for (int b = 0; b < ui::NBTN; b++) {
          int p = ui::pixel(b, X, Y);
          if (!p) continue;
          bool on = btnDown & (1 << b);
          c = p == 1 ? palDim[idx] : p == 2 ? cGray : (on ? cYellow : cWhite);
          break;
        }
        *o++ = c;
      }
    }
    tft.pushImage(X0, Ys, w, rows, band);
  }
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

// Frame state of the last full draw: a different scroll or map means everything is drawn again.
static struct { int mx, my, nx, ny, lsx, lsy; uint32_t gen; R hero; bool valid; } last;

static void drawFrame(bool forceFull, uint8_t changedBtns) {
  const auto& s = world.sc;
  bool full = forceFull || !last.valid || last.mx != world.mx || last.my != world.my || last.nx != s.nx || last.ny != s.ny ||
              last.lsx != s.lsx || last.lsy != s.lsy || last.gen != world.gen;
  R hero = heroRect();
  if (full) {
    drawRegion(0, 0, VIEW_W, VIEW_H);
  } else {
    R dirty = unionR(hero, last.hero);
    if (!emptyR(dirty)) drawRegion(dirty.x0, dirty.y0, dirty.x1, dirty.y1);
    for (int b = 0; b < ui::NBTN; b++)
      if (changedBtns & (1 << b)) drawRegion(ui::rects[b].x0, ui::rects[b].y0, ui::rects[b].x1, ui::rects[b].y1);
  }
  last = {world.mx, world.my, s.nx, s.ny, s.lsx, s.lsy, world.gen, hero, true};
}

// ---- debug strip ------------------------------------------------------------------------------

static bool showDebug = true;
static uint32_t drawMsLast = 0, tickMsLast = 0, frames = 0, fpsT0 = 0, fps = 0, stripT = 0;
static int lastRawX = -1, lastRawY = -1, lastSx = -1, lastSy = -1;

static void drawStrip() {
  tft.fillRect(0, VIEW_H, VIEW_W, 20, TFT_BLACK);
  tft.setTextSize(1);
  if (!showDebug) {
    tft.setTextColor(0x4208, TFT_BLACK);
    tft.setCursor(VIEW_W - 90, VIEW_H + 6);
    tft.print("tap: debug");
    return;
  }
  char line[96];
  snprintf(line, sizeof line, "heap %u  draw %lu ms  tick %lu ms  %lu fps  lv %d  score %d  touch %d,%d>%d,%d", (unsigned)ESP.getFreeHeap(),
           (unsigned long)drawMsLast, (unsigned long)tickMsLast, (unsigned long)fps, world.level + 1, world.score, lastRawX, lastRawY, lastSx, lastSy);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setCursor(2, VIEW_H + 6);
  tft.print(line);
}

static uint32_t t0 = 0, ticksRun = 0, lastPoll = 0;
static bool stripHeld = false;

// ---- setup and loop -----------------------------------------------------------------------------

static void message(const char* a, const char* b = nullptr) {
  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextSize(2);
  tft.setCursor(20, 120);
  tft.print(a);
  if (b) { tft.setCursor(20, 150); tft.print(b); }
}

void setup() {
  Serial.begin(115200);
  tft.init();
  tft.setRotation(1);
  tft.setBrightness(255);
  tft.setSwapBytes(false);
  cWhite = panel565(255, 255, 255);
  cGray = panel565(190, 190, 190);
  cYellow = panel565(255, 230, 80);
  message("Game-Maker Pocket Player");
  haveGT = gt.probe();
  char line[64];
  if (haveGT) snprintf(line, sizeof line, "Touch: GT911 at 0x%02X", gt.addr);
  else snprintf(line, sizeof line, "Touch: no GT911 found");
  tft.setCursor(20, 150);
  tft.print(line);
  Serial.println(line);
  bool fs = LittleFS.begin(false);
  const char* why = "LittleFS mount failed";
  if (!fs || !loadAll(&why) || !world.begin()) {
    message(why);
    Serial.println(why);
    for (;;) delay(1000);
  }
  delay(1200);
  tft.fillScreen(TFT_BLACK);
  drawFrame(true, 0);
  drawStrip();
  t0 = millis();
  Serial.printf("ready: heap %u, largest %u\n", (unsigned)ESP.getFreeHeap(), (unsigned)heap_caps_get_largest_free_block(MALLOC_CAP_8BIT));
}

void loop() {
  uint32_t now = millis();
  // Touch: which buttons are down, and the debug strip toggle (on a fresh press, not while held).
  uint8_t down = 0;
  bool stripTouch = false;
  if (haveGT && now - lastPoll >= 8) {
    lastPoll = now;
    gt.poll();
  }
  for (int i = 0; haveGT && i < gt.n; i++) {
    int x, y;
    GT911::toScreen(gt.rawX[i], gt.rawY[i], x, y);
    lastRawX = gt.rawX[i];
    lastRawY = gt.rawY[i];
    lastSx = x;
    lastSy = y;
    if (y >= VIEW_H) stripTouch = true;
    for (int b = 0; b < ui::NBTN; b++)
      if (ui::hit(b, x, y)) down |= 1 << b;
  }
  if (stripTouch && !stripHeld) { showDebug = !showDebug; drawStrip(); }
  stripHeld = stripTouch;
  uint8_t changed = down ^ btnDown;
  if (changed) {
    for (int b = 0; b < ui::NBTN; b++)
      if (changed & (1 << b)) world.key(ui::scans[b], down & (1 << b));
    btnDown = down;
  }

  // Game ticks run at 18.2 Hz; after a slow frame several run to catch up (at most 4).
  uint32_t due = (now - t0) * 182 / 10000;
  int ran = 0;
  uint32_t ts = millis();
  while (ticksRun < due && ran < 4) {
    char r = world.tick();
    ticksRun++;
    ran++;
    if (r == 'W') {
      world.releaseAll();
      message("You made it!", "Touch to play again");
      delay(1500);
      while (!(haveGT && gt.poll() > 0)) delay(20);
      world.begin();
      tft.fillScreen(TFT_BLACK);
      last.valid = false;
      stripHeld = true;
      t0 = millis();
      ticksRun = 0;
      drawStrip();
      break;
    }
  }
  if (ticksRun + 4 < due) { t0 = millis(); ticksRun = 0; }  // far behind: drop the lost time
  if (ran) tickMsLast = (millis() - ts) / ran;

  if (ran || changed || !last.valid) {
    uint32_t ds = millis();
    drawFrame(false, changed);
    drawMsLast = millis() - ds;
    frames++;
  }
  if (now - fpsT0 >= 1000) {
    fps = frames * 1000 / (now - fpsT0);
    frames = 0;
    fpsT0 = now;
  }
  if (showDebug && now - stripT >= 500) {
    stripT = now;
    drawStrip();
  }
  delay(1);
}
