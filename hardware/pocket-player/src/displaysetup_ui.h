// The 2.8 inch board's display setup screen and its saving (the pure parts are in displaysetup.h). Included by main.cpp,
// inside its POCKET_CYD28 block, so it uses main.cpp's tft, touch and settings statics (it is not a stand-alone header).
//   The screen: a 200 x 200 square of six buttons at logical (0,0), which lands whole in a corner in every turn, and
//   information outside it (a color bar, the mode, the chip id). First start, or the list's BOOT button, or a tap on the
//   list's title bar: touch the corner dot (twice the first time), press the buttons until the picture is upright, not
//   mirrored, and R G B read red, green, blue; OK then runs the 3-tap calibration and saves.
//   Saved per chip: NVS (namespace "pocket": panel, turn, cal, setup, full, swapk) and, when a card is in, the file
//   /pocket/boards/<chip id>.cfg, so a card moved between boards carries every board's setup. NVS wins at start; the card
//   is read only when NVS has no finished setup.
//   Serial (115200), for testing without seeing the screen: S st | S tap RX RY | S btn rot|mir|rb|inv|drv|ok | S boot |
//   S skip | S open | S forget nvs | S forget card.
#pragma once
#include <math.h>
#include "displaysetup.h"

static bool runCalibration();
static void nextPanel();

static char dsChip[16] = "";
static uint8_t dsState = 0;  // 0 never set up, 1 begun (a display change is not finished), 3 saved
static bool dsFull = false;  // the 3-tap calibration was done after the last display change
static bool dsSwapKnown = false;
static bool dsInjOn = false, dsBootReq = false, dsSkipReq = false, dsOpenReq = false;
static tc::Raw dsInjPt = {0, 0};
static int dsBtnReq = -1;

static void dsNvsU8(const char* key, uint8_t v) {
  Preferences p;
  if (p.begin("pocket", false)) { p.putUChar(key, v); p.end(); }
}
static ds::Record dsRecord() {
  ds::Record r;
  r.panel = panelType;
  r.turn = turnIdx;
  r.cal = XPT2046::cal();
  r.full = dsFull ? 1 : 0;
  return r;
}
// ---- the card file ----
static bool dsCardRead(ds::Record& r) {
  bool wasUp = sdUp, ok = false;
  if (!mountSD()) return false;
  char path[48], text[200];
  ds::cardPath(dsChip, path, sizeof path);
  File f = SD.open(path, "r");
  if (f) {
    int n = f.read((uint8_t*)text, sizeof text - 1);
    f.close();
    if (n > 0) { text[n] = 0; ok = ds::parse(text, r); }
  }
  if (!wasUp) unmountSD();
  return ok;
}
static bool dsCardWrite(const ds::Record& r) {
  bool wasUp = sdUp, ok = false;
  if (!mountSD()) return false;
  SD.mkdir("/pocket");
  SD.mkdir("/pocket/boards");
  char path[48], text[200];
  ds::cardPath(dsChip, path, sizeof path);
  int n = ds::format(r, text, sizeof text);
  SD.remove(path);  // our own file only
  File f = SD.open(path, FILE_WRITE);
  if (f) { ok = f.write((const uint8_t*)text, n) == (size_t)n; f.close(); }
  if (!wasUp) unmountSD();
  return ok;
}
static bool dsCardHas() {
  bool wasUp = sdUp, has = false;
  if (!mountSD()) return false;
  char path[48];
  ds::cardPath(dsChip, path, sizeof path);
  has = SD.exists(path);
  if (!wasUp) unmountSD();
  return has;
}
static void dsCardForget() {
  bool wasUp = sdUp;
  if (!mountSD()) return;
  char path[48];
  ds::cardPath(dsChip, path, sizeof path);
  SD.remove(path);
  if (!wasUp) unmountSD();
}

// ---- NVS ----
static void dsNvsWrite(const ds::Record& r, uint8_t state) {
  Preferences p;
  if (!p.begin("pocket", false)) return;
  p.putUChar("panel", r.panel);
  p.putUChar("turn", r.turn);
  p.putBytes("cal", &r.cal, sizeof r.cal);
  p.putUChar("setup", state);
  p.putUChar("full", r.full);
  if (state == 3) p.putUChar("swapk", 1);
  p.end();
}
// First thing at start (before the panel starts): who this chip is, what NVS holds, and, when NVS has no finished setup,
// whether the card has this chip's file (then it is used and copied into NVS).
static void dsBoot() {
  ds::chipHex(ESP.getEfuseMac(), dsChip);
  {
    Preferences pf;
    if (pf.begin("pocket", true)) {
      panelType = pf.getUChar("panel", PANEL_ILI9341);
      turnIdx = pf.getUChar("turn", 0);
      dsState = pf.getUChar("setup", 0);
      dsFull = pf.getUChar("full", 0) != 0;
      dsSwapKnown = pf.getUChar("swapk", 0) != 0;
      pf.end();
    }
  }
  if (dsState != 3) {
    ds::Record r;
    if (dsCardRead(r)) {
      panelType = r.panel;
      turnIdx = r.turn;
      dsState = 3;
      dsFull = r.full != 0;
      dsSwapKnown = true;
      dsNvsWrite(r, 3);
      Serial.printf("setup: loaded from the card (/pocket/boards/%s.cfg)\n", dsChip);
    }
  }
  if (panelType >= PANEL_TYPES) panelType = PANEL_ILI9341;
  if (turnIdx >= TURNS) turnIdx = 0;
}
// A display change that is not yet confirmed with OK: the next start comes back to setup. `geometry`: the touch no longer
// matches the picture (a turn or another driver), so the calibration is marked not valid (its axes' order is kept).
static void dsMarkBegun(bool geometry) {
  dsState = 1;
  Preferences p;
  if (p.begin("pocket", false)) { p.putUChar("setup", 1); p.putUChar("panel", panelType); p.putUChar("turn", turnIdx); p.end(); }
  if (geometry) {
    tc::Cal c = XPT2046::cal();
    c.valid = 0;
    XPT2046::setCal(c);
    dsFull = false;
    dsNvsU8("full", 0);
  }
}
static void dsCalDone() {
  dsFull = true;
  dsSwapKnown = true;
  dsNvsU8("full", 1);
  dsNvsU8("swapk", 1);
}
static void dsSave() {
  ds::Record r = dsRecord();
  dsState = 3;
  dsNvsWrite(r, 3);
  bool card = dsCardWrite(r);
  Serial.printf("SETUP saved chip=%s panel=%d turn=%d full=%d card=%s\n", dsChip, r.panel, r.turn, r.full, card ? "written" : "none");
}

// ---- serial ----
static void dsPrintState() {
  tc::Cal c = XPT2046::cal();
  Preferences p;
  int np = -1, nt = -1, ns = -1;
  if (p.begin("pocket", true)) { np = p.getUChar("panel", 255); nt = p.getUChar("turn", 255); ns = p.getUChar("setup", 255); p.end(); }
  ds::Record r;
  bool wasUp = sdUp;
  bool has = dsCardHas(), good = has && dsCardRead(r);
  (void)wasUp;
  Serial.printf("SETUP chip=%s state=%d panel=%d turn=%d swap=%d u=%d..%d v=%d..%d valid=%d full=%d swapk=%d nvs=%d,%d,%d card=%s", dsChip, dsState, panelType,
                turnIdx, c.swap, c.u0, c.u1, c.v0, c.v1, c.valid, dsFull, dsSwapKnown, np, nt, ns, !has ? "none" : good ? "ok" : "bad");
  if (good) Serial.printf(" card_panel=%d card_turn=%d card_swap=%d card_u=%d..%d card_v=%d..%d card_full=%d", r.panel, r.turn, r.cal.swap, r.cal.u0, r.cal.u1, r.cal.v0, r.cal.v1, r.full);
  Serial.println();
}
static void dsSerial(const char* line) {  // "S ..."
  if (!strncmp(line, "S st", 4)) dsPrintState();
  else if (!strncmp(line, "S tap ", 6)) {
    int x = 0, y = 0;
    if (sscanf(line + 6, "%d %d", &x, &y) == 2) { dsInjPt = {x, y}; dsInjOn = true; }
  } else if (!strncmp(line, "S btn ", 6)) {
    static const char* const names[] = {"rot", "mir", "rb", "inv", "drv", "ok"};
    for (int b = 0; b < ds::NBTN; b++) if (!strcmp(line + 6, names[b])) dsBtnReq = b;
  } else if (!strncmp(line, "S boot", 6)) dsBootReq = true;
  else if (!strncmp(line, "S skip", 6)) dsSkipReq = true;
  else if (!strncmp(line, "S open", 6)) dsOpenReq = true;
  else if (!strncmp(line, "S forget nvs", 12)) {
    Preferences p;
    if (p.begin("pocket", false)) { p.remove("setup"); p.remove("full"); p.remove("swapk"); p.end(); }
    Serial.println("SETUP nvs forgotten (restart to see the first start)");
  } else if (!strncmp(line, "S forget card", 13)) { dsCardForget(); Serial.println("SETUP card file removed"); }
}
static void dsSerialPoll() {
  static char buf[40];
  static int n = 0;
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\n' || c == '\r') {
      buf[n] = 0;
      n = 0;
      if (buf[0] == 'S') dsSerial(buf);
    } else if (n < (int)sizeof buf - 1) buf[n++] = c;
  }
}
static bool dsInjTake(tc::Raw& out) {
  dsSerialPoll();
  if (!dsInjOn) return false;
  dsInjOn = false;
  out = dsInjPt;
  return true;
}

// ---- drawing ----
static void dsSymbol(int b, int cx, int cy) {
  const uint16_t W_ = C_WHITE, RED = 0xF800, BLU = 0x001F;
  switch (b) {
    case ds::ROT: {  // a circular arrow
      tft.fillArc(cx, cy, 11, 17, 40, 320, W_);
      float a = 320 * 3.14159265f / 180, r = 14;
      float px = cx + r * cosf(a), py = cy + r * sinf(a), tx = -sinf(a), ty = cosf(a), nx = cosf(a), ny = sinf(a);
      tft.fillTriangle((int)(px + 11 * tx), (int)(py + 11 * ty), (int)(px + 9 * nx), (int)(py + 9 * ny), (int)(px - 9 * nx), (int)(py - 9 * ny), W_);
      break;
    }
    case ds::MIR:  // a solid wedge, a dashed line, its outlined twin
      tft.fillTriangle(cx - 8, cy - 16, cx - 8, cy + 16, cx - 32, cy + 16, W_);
      for (int y = cy - 18; y < cy + 18; y += 6) tft.drawFastVLine(cx, y, 3, C_GRAY);
      tft.drawTriangle(cx + 8, cy - 16, cx + 8, cy + 16, cx + 32, cy + 16, W_);
      break;
    case ds::RB:  // a red and a blue swatch with arrows both ways
      tft.fillRect(cx - 38, cy - 13, 26, 26, RED);
      tft.fillRect(cx + 12, cy - 13, 26, 26, BLU);
      tft.drawFastHLine(cx - 8, cy, 16, W_);
      tft.fillTriangle(cx - 10, cy, cx - 3, cy - 5, cx - 3, cy + 5, W_);
      tft.fillTriangle(cx + 10, cy, cx + 3, cy - 5, cx + 3, cy + 5, W_);
      break;
    case ds::INV:  // half and half
      tft.fillCircle(cx, cy, 17, W_);
      tft.fillArc(cx, cy, 0, 16, 90, 270, C_BLACK);
      break;
    case ds::DRV: {
      tft.setTextColor(W_, C_DARK);
      tft.setTextSize(3);
      tft.setTextDatum(textdatum_t::middle_center);
      tft.drawString((panelType & 1) ? "ST" : "ILI", cx, cy);
      tft.setTextDatum(textdatum_t::top_left);
      break;
    }
    case ds::OK:
      for (int o = -1; o <= 1; o++) {
        tft.drawLine(cx - 18, cy + o, cx - 6, cy + 12 + o, 0x07E0);
        tft.drawLine(cx - 6, cy + 12 + o, cx + 18, cy - 14 + o, 0x07E0);
      }
      break;
  }
}
static void dsDrawButtons() {
  for (int b = 0; b < ds::NBTN; b++) {
    ds::Rect r = ds::rect(b);
    tft.fillRoundRect(r.x0 + 2, r.y0 + 2, r.x1 - r.x0 - 4, r.y1 - r.y0 - 4, 8, b == ds::OK ? 0x0320 : C_DARK);
    tft.drawRoundRect(r.x0 + 2, r.y0 + 2, r.x1 - r.x0 - 4, r.y1 - r.y0 - 4, 8, C_WHITE);
    dsSymbol(b, (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2);
  }
}
// The picture outside the square: what rotation does not change (colors and words).
static void dsDrawInfo(const char* l1, const char* l2, const char* l3) {
  const int X0 = ds::SQ + 6, BW = scr::W - X0 - 4;
  struct Bar { uint16_t c; const char* n; uint16_t t; };
  const Bar bars[] = {{0xF800, "R", C_WHITE}, {0x07E0, "G", C_BLACK}, {0x001F, "B", C_WHITE}, {0xFFFF, "W", C_BLACK}, {0x0000, "K", C_WHITE}};
  for (int i = 0; i < 5; i++) {
    int y = 4 + i * 28;
    tft.fillRect(X0, y, BW, 26, bars[i].c);
    if (i == 4) tft.drawRect(X0, y, BW, 26, C_WHITE);
    tft.setTextColor(bars[i].t, bars[i].c);
    tft.setTextSize(2);
    tft.setCursor(X0 + 8, y + 5);
    tft.print(bars[i].n);
  }
  char nb[16];
  tft.setTextSize(1);
  tft.setTextColor(C_YELLOW, C_BLACK);
  tft.setCursor(X0, 148);
  tft.print(panelName(nb));
  tft.setCursor(X0, 160);
  tft.printf("turn %d of %d", turnIdx + 1, TURNS);
  tft.setTextColor(C_WHITE, C_BLACK);
  tft.setCursor(X0, 178);
  tft.print(l1);
  tft.setCursor(X0, 190);
  tft.print(l2);
  tft.setCursor(X0, 202);
  tft.print(l3);
  tft.setTextColor(C_GRAY, C_BLACK);
  tft.setCursor(4, 206);
  tft.printf("chip %s", dsChip);
  tft.setCursor(4, 222);
  tft.print("BOOT: turn  hold: driver");
}
// phase 0: the first corner dot, 1: the second, 2: the buttons
static void dsDraw(int phase) {
  tft.fillScreen(C_BLACK);
  tft.drawRect(0, 0, ds::SQ, ds::SQ, C_GRAY);
  if (phase == 2) {
    dsDrawButtons();
    dsDrawInfo("R G B: red green", "blue? upright?", "OK when right");
  } else {
    int x = phase == 0 ? ds::DOT_A : ds::DOT_B;
    tft.fillCircle(x, ds::DOT_Y, 14, C_YELLOW);
    tft.drawCircle(x, ds::DOT_Y, 20, C_YELLOW);
    tft.drawCircle(x, ds::DOT_Y, 26, C_GRAY);
    tft.setTextColor(C_WHITE, C_BLACK);
    tft.setTextSize(2);
    tft.setCursor(8, 70);
    tft.print(phase == 0 ? "Touch the dot" : "Now this dot");
    tft.setTextSize(1);
    tft.setCursor(8, 94);
    tft.print(phase == 0 ? "in the top-left corner" : "along the top edge");
    dsDrawInfo(phase == 0 ? "Touch the top-" : "Touch the next", phase == 0 ? "left corner dot" : "dot (on top)", "");
  }
}

// ---- the flow ----
enum { EV_TAP, EV_TURN, EV_MODE, EV_BTN, EV_SKIP };
// Waits for a tap (its median raw reading), the BOOT button (short: next turn, held 1.5 s: next driver mode) or a serial command.
static int dsWait(tc::Raw& out, int& btn) {
  int xs[40], ys[40], n = 0;
  uint32_t bootT = 0, liftBy = millis() + 800;
  wasDown = true;
  for (;;) {  // a finger still down from before does not count (wait at most 0.8 s for it to lift)
    pollTouch(millis());
    if (pts.n == 0 || (int32_t)(millis() - liftBy) >= 0) break;
    delay(4);
  }
  for (;;) {
    uint32_t now = millis();
    if (dsInjTake(out)) return EV_TAP;
    if (dsBtnReq >= 0) { btn = dsBtnReq; dsBtnReq = -1; return EV_BTN; }
    if (dsSkipReq) { dsSkipReq = false; return EV_SKIP; }
    if (dsBootReq) { dsBootReq = false; return EV_TURN; }
    if (digitalRead(0) == LOW) {
      if (!bootT) bootT = now ? now : 1;
      if (now - bootT >= 1500) return EV_MODE;
    } else if (bootT) {
      bool real = now - bootT > 30;
      bootT = 0;
      if (real) return EV_TURN;
    }
    pollTouch(now);
    if (pts.n > 0 && n < 40 && gt.fresh) { xs[n] = gt.rawX[0]; ys[n] = gt.rawY[0]; n++; }
    if (pts.n == 0 && n > 0) {
      if (n < 4) { n = 0; continue; }  // a brush, not a tap
      auto med = [](int* a, int m) {
        for (int i = 1; i < m; i++) for (int j = i; j > 0 && a[j - 1] > a[j]; j--) { int t = a[j]; a[j] = a[j - 1]; a[j - 1] = t; }
        return a[m / 2];
      };
      out = {med(xs, n), med(ys, n)};
      return EV_TAP;
    }
    delay(4);
  }
}
static void dsSaveCal(const tc::Cal& c) { XPT2046::setCal(c); }

// Runs the setup screen; returns when OK was pressed (and the calibration and saving are done). The caller redraws.
static void runDisplaySetup() {
  int phase = (XPT2046::calibrated() && dsState != 0) ? 2 : 0;  // the first start always asks for the corner
  tc::Raw first = {0, 0};
  tft.setRotation(turnRotation(turnIdx));
  Serial.printf("setup: screen open (chip %s, phase %d)\n", dsChip, phase);
  for (;;) {
    dsDraw(phase);
    tc::Raw r = {0, 0};
    int btn = -1;
    int ev = dsWait(r, btn);
    if (ev == EV_MODE) { nextPanel(); return; }  // restarts
    if (ev == EV_TURN) {
      turnIdx = (turnIdx + 1) % TURNS;
      tft.setRotation(turnRotation(turnIdx));
      dsMarkBegun(true);
      phase = 0;
      continue;
    }
    if (ev == EV_SKIP) { dsSave(); return; }
    if (phase < 2) {
      if (ev != EV_TAP) continue;
      tc::Cal c;
      if (phase == 0 && dsSwapKnown) {
        if (ds::fromOne(r, XPT2046::cal(), scr::W, scr::H, c)) { dsSaveCal(c); phase = 2; Serial.printf("setup: corner tap raw %d,%d -> swap=%d\n", r.x, r.y, c.swap); }
      } else if (phase == 0) { first = r; phase = 1; }
      else {
        if (ds::fromTwo(first, r, scr::W, scr::H, c)) {
          dsSaveCal(c);
          dsSwapKnown = true;
          dsNvsU8("swapk", 1);
          phase = 2;
          Serial.printf("setup: corner taps raw %d,%d and %d,%d -> swap=%d\n", first.x, first.y, r.x, r.y, c.swap);
        } else phase = 0;
      }
      continue;
    }
    if (ev == EV_TAP) {
      int x, y;
      XPT2046::toScreen(r.x, r.y, x, y);
      btn = ds::hit(x, y);
    }
    if (btn < 0) continue;
    if (btn == ds::OK) {
      if (!dsFull && runCalibration()) dsCalDone();
      dsSave();
      return;
    }
    ds::press(btn, panelType, turnIdx);
    Serial.printf("setup: button %d -> panel %d turn %d\n", btn, panelType, turnIdx);
    bool geometry = btn == ds::ROT || btn == ds::MIR || btn == ds::DRV;
    dsMarkBegun(geometry);
    if (ds::needsRestart(btn)) {
      message("Restarting", "(display change)");
      delay(700);
      ESP.restart();
    }
    tft.setRotation(turnRotation(turnIdx));
    phase = geometry ? 0 : 2;
  }
}
