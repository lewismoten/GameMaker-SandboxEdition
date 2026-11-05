// The 2.8 inch board's display setup and its saving (the pure parts are in displaysetup.h and setupflow.h). Included by
// main.cpp, inside its POCKET_CYD28 block, so it uses main.cpp's tft, touch and settings statics (not stand-alone).
//   Three steps, no reading: (1) the word TAP three times, each copy flipped differently, tap the one that reads right (that
//   settles the picture's flip and the touch wiring); (2) four bar sets, tap the one that goes red green blue white black;
//   (3) the 3-tap calibration. BOOT held 1.5 s steps the driver and restarts into step 1 (for a picture that is garbage);
//   a short BOOT turns the picture to the next hardware turn (a way through with no touch).
//   Saved per chip: NVS (namespace "pocket": panel, turn, cal, setup, sstep, full, swapk) and, when a card is in, the file
//   /pocket/boards/<chip id>.cfg, so a card moved between boards carries every board's setup. The card is read only when
//   NVS has never held a setup for this chip.
//   Serial (115200), for testing without seeing the screen: S st | S tap RX RY | S boot | S skip | S open | S forget nvs |
//   S forget card.
#pragma once
#include <math.h>
#include "displaysetup.h"
#include "setupflow.h"

static bool runCalibration();

static char dsChip[16] = "";
static uint8_t dsState = 0;  // 0 never set up, 1 begun (a display change is not finished), 3 saved
static bool dsFull = false;  // the 3-tap calibration was done after the last display change
static uint8_t dsStep = 0;  // the step a restart resumes at (displaysetup.h Step)
static bool dsSwapKnown = false;
static bool dsInjOn = false, dsBootReq = false, dsSkipReq = false, dsOpenReq = false;
static tc::Raw dsInjPt = {0, 0};

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
  if (state == 3) { p.putUChar("swapk", 1); p.putUChar("sstep", 0); }
  p.end();
}
// First thing at start (before the panel starts): who this chip is, what NVS holds, and, when NVS has no finished setup,
// whether the card has this chip's file (then it is used and copied into NVS).
static void dsBoot() {
  ds::chipHex(ESP.getEfuseMac(), dsChip);
  bool hasSetup = false;
  {
    Preferences pf;
    if (pf.begin("pocket", true)) {
      panelType = pf.getUChar("panel", PANEL_ILI9341);
      turnIdx = pf.getUChar("turn", 0);
      dsState = pf.getUChar("setup", 0);
      hasSetup = pf.isKey("setup");
      dsStep = pf.getUChar("sstep", 0);
      dsFull = pf.getUChar("full", 0) != 0;
      dsSwapKnown = pf.getUChar("swapk", 0) != 0;
      pf.end();
    }
  }
  if (dsState != 3 && ds::useCardRecord(hasSetup)) {
    ds::Record r;
    if (dsCardRead(r)) {
      panelType = r.panel;
      turnIdx = r.turn;
      dsState = 3;
      dsFull = r.full != 0;
      dsSwapKnown = true;
      dsStep = 0;
      dsNvsWrite(r, 3);
      Serial.printf("setup: loaded from the card (/pocket/boards/%s.cfg)\n", dsChip);
    }
  }
  if (panelType >= PANEL_TYPES) panelType = PANEL_ILI9341;
  if (turnIdx >= TURNS) turnIdx = 0;
  if (dsStep > ds::STEP_CALIBRATE) dsStep = 0;
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
static void dsSetStep(uint8_t st) {
  dsStep = st;
  dsNvsU8("sstep", st);
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
  dsStep = 0;
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
  Serial.printf("SETUP chip=%s state=%d step=%d panel=%d turn=%d swap=%d u=%d..%d v=%d..%d valid=%d full=%d swapk=%d nvs=%d,%d,%d card=%s", dsChip, dsState, dsStep, panelType,
                turnIdx, c.swap, c.u0, c.u1, c.v0, c.v1, c.valid, dsFull, dsSwapKnown, np, nt, ns, !has ? "none" : good ? "ok" : "bad");
  if (good) Serial.printf(" card_panel=%d card_turn=%d card_swap=%d card_u=%d..%d card_v=%d..%d card_full=%d", r.panel, r.turn, r.cal.swap, r.cal.u0, r.cal.u1, r.cal.v0, r.cal.v1, r.full);
  Serial.println();
}
static void dsSerial(const char* line) {  // "S ..."
  if (!strncmp(line, "S st", 4)) dsPrintState();
  else if (!strncmp(line, "S tap ", 6)) {
    int x = 0, y = 0;
    if (sscanf(line + 6, "%d %d", &x, &y) == 2) { dsInjPt = {x, y}; dsInjOn = true; }
  } else if (!strncmp(line, "S boot", 6)) dsBootReq = true;
  else if (!strncmp(line, "S skip", 6)) dsSkipReq = true;
  else if (!strncmp(line, "S open", 6)) dsOpenReq = true;
  else if (!strncmp(line, "S forget nvs", 12)) {
    Preferences p;
    if (p.begin("pocket", false)) { for (const char* k : {"setup", "sstep", "full", "swapk", "panel", "turn", "cal"}) p.remove(k); p.end(); }
    Serial.println("SETUP nvs forgotten (restart to see the first start: step 1, ILI driver, first turn)");
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
// Step 1: the word in each quadrant flipped by its label (setupflow.h), and one pip per round at the screen's center.
static void dsDrawOrient(int round) {
  tft.fillScreen(C_BLACK);
  const int S = sf::WORD_SCALE, ox = (sf::CELL_W - sf::WORD_W * S) / 2, oy = (sf::CELL_H - sf::WORD_H * S) / 2;
  for (int q = 0; q < 4; q++) {
    int s = sf::LAYOUT[round][q], cx = (q & 1) * sf::CELL_W, cy = (q >> 1) * sf::CELL_H;
    tft.drawRect(cx + 3, cy + 3, sf::CELL_W - 6, sf::CELL_H - 6, C_GRAY);
    for (int y = 0; y < sf::WORD_H; y++)
      for (int x = 0; x < sf::WORD_W; x++)
        if (sf::wordCell(s, x, y)) tft.fillRect(cx + ox + x * S, cy + oy + y * S, S - 1, S - 1, C_WHITE);
  }
  for (int i = 0; i < sf::ROUNDS; i++) {
    int x = sf::W / 2 - 16 + i * 16, y = sf::H / 2;
    tft.fillCircle(x, y, 6, C_BLACK);
    if (i <= round) tft.fillCircle(x, y, 5, C_YELLOW); else tft.drawCircle(x, y, 5, C_YELLOW);
  }
}
// Step 2: four sets of the five bars, each colored as one of the four faults would show them.
static void dsDrawColors() {
  tft.fillScreen(C_BLACK);
  tft.setTextSize(1);
  tft.setTextColor(C_WHITE, C_BLACK);
  tft.setCursor(8, 8);
  tft.print("Tap the set that goes: red green blue white black");
  const int BW = sf::SET_W / sf::BARS;
  for (int k = 0; k < 4; k++) {
    int x0 = (k & 1) * sf::SET_W, y0 = sf::HEADER_H + (k >> 1) * sf::SET_H;
    for (int b = 0; b < sf::BARS; b++) {
      uint8_t c[3];
      sf::faulted(k, b, c);
      tft.fillRect(x0 + 4 + b * (BW - 1), y0 + 4, BW - 2, sf::SET_H - 8, tft.color565(c[0], c[1], c[2]));
    }
    tft.drawRect(x0 + 2, y0 + 2, sf::SET_W - 4, sf::SET_H - 4, C_GRAY);
  }
}

// ---- the flow ----
enum { EV_TAP, EV_TURN, EV_MODE, EV_SKIP };
// Waits for a tap (its median raw reading), the BOOT button (short: next turn, held 1.5 s: the driver) or a serial command.
static int dsWait(tc::Raw& out) {
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
// BOOT held: the other driver, then a restart into step 1 (the picture may be garbage, so nothing on it is needed).
static void dsDriverRestart() {
  panelType = ds::nextDriver(panelType);
  dsSetStep(ds::STEP_ORIENT);
  dsMarkBegun(true);
  saveSettings();
  Serial.printf("setup: driver -> panel %d, restarting into step 1\n", panelType);
  message("Restarting", "(driver)");
  delay(700);
  ESP.restart();
}
// A short BOOT: the next hardware turn (a way through with no touch); the rounds start again.
static void dsTurnNext() {
  turnIdx = (turnIdx + 1) % TURNS;
  tft.setRotation(turnRotation(turnIdx));
  dsMarkBegun(true);
}
// Step 1. Returns false when the setup was ended (S skip), true when the flip and the touch wiring are settled.
static bool dsOrientStep() {
  sf::Solver sv;
  int round = 0;
  for (;;) {
    dsDrawOrient(round);
    tc::Raw r = {0, 0};
    int ev = dsWait(r);
    if (ev == EV_MODE) dsDriverRestart();
    if (ev == EV_SKIP) return false;
    if (ev == EV_TURN) { dsTurnNext(); sv.reset(); round = 0; continue; }
    int quad = sf::rawQuad(r.x, r.y);
    sv.tap(round, quad);
    Serial.printf("setup: step 1 round %d raw %d,%d quarter %d, %d pairs left\n", round + 1, r.x, r.y, quad, sv.count());
    if (sv.count() == 0) { sv.reset(); round = 0; continue; }  // taps that fit no wiring: start again
    if (++round < sf::ROUNDS) continue;
    int flip = sv.flip(), wiring = sv.wiring();
    turnIdx = (uint8_t)sf::turnFor(turnIdx, flip);
    tft.setRotation(turnRotation(turnIdx));
    dsMarkBegun(false);
    dsSwapKnown = true;
    dsNvsU8("swapk", 1);
    XPT2046::setCal(sf::roughCal(wiring));
    dsFull = false;
    dsNvsU8("full", 0);
    dsSetStep(ds::STEP_COLORS);
    Serial.printf("setup: orientation flip=%d wiring=%d -> turn %d\n", flip, wiring, turnIdx);
    return true;
  }
}
// Step 2. Returns false when the setup was ended; a changed color mode restarts the board into step 3 and does not return.
static bool dsColorStep() {
  for (;;) {
    dsDrawColors();
    tc::Raw r = {0, 0};
    int ev = dsWait(r);
    if (ev == EV_MODE) dsDriverRestart();
    if (ev == EV_SKIP) return false;
    if (ev != EV_TAP) continue;
    int x, y;
    XPT2046::toScreen(r.x, r.y, x, y);
    int k = sf::setAt(x, y);
    Serial.printf("setup: step 2 tap %d,%d -> set %d\n", x, y, k);
    if (k < 0) continue;
    uint8_t bits = sf::panelBitsFor(k);
    panelType ^= bits;
    dsSetStep(ds::STEP_CALIBRATE);
    dsMarkBegun(false);
    if (bits) {  // inversion and the color order are chosen before the panel starts
      Serial.printf("setup: colors -> panel %d, restarting into step 3\n", panelType);
      message("Restarting", "(colors)");
      delay(700);
      ESP.restart();
    }
    return true;
  }
}
// Runs the setup; returns when it ended (the 3-tap calibration and saving are done). The caller redraws.
static void runDisplaySetup() {
  int step = dsStep;
  tft.setRotation(turnRotation(turnIdx));
  Serial.printf("setup: open (chip %s, step %d)\n", dsChip, step + 1);
  if (step == ds::STEP_ORIENT) {
    if (!dsOrientStep()) { dsSave(); return; }
    step = ds::STEP_COLORS;
  }
  if (step == ds::STEP_COLORS && !dsColorStep()) { dsSave(); return; }
  if (runCalibration()) dsCalDone();
  dsSave();
}
