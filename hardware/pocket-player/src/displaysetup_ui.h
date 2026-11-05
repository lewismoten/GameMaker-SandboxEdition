// The 2.8 inch board's display setup and its saving (the pure parts are in displaysetup.h and setupflow.h). Included by
// main.cpp, inside its POCKET_CYD28 block, so it uses main.cpp's tft, touch and settings statics (not stand-alone).
//   Four steps (setupflow.h), each with two controls that need no touch map: the BOOT button does the step's action (flip,
//   rotate, orient, cycle the colors) and a tap anywhere on the glass is OK; then the 3-tap calibration. BOOT held 1.5 s
//   steps the driver and restarts into step 1 (for a picture that is garbage).
//   Saved per chip: NVS (namespace "pocket": panel, turn, cal, setup, sstep, full, swapk) and, when a card is in, the file
//   /pocket/boards/<chip id>.cfg, so a card moved between boards carries every board's setup. The card is read only when
//   NVS has never held a setup for this chip.
//   Serial (115200), for testing without seeing the screen: S st | S tap RX RY | S boot | S skip | S open | S forget nvs |
//   S forget card.
#pragma once
#include <math.h>
#include "displaysetup.h"
#include "setupdraw.h"
#include "softgfx.h"

static bool runCalibration();

static char dsChip[16] = "";
static uint8_t dsState = 0;  // 0 never set up, 1 begun (a display change is not finished), 3 saved
static bool dsFull = false;  // the 3-tap calibration was done after the last display change
static uint8_t dsStep = 0;  // the step a restart resumes at (displaysetup.h Step)
static bool dsSwapKnown = false;
static sf::Flow dsLive;  // the setup in progress (S st prints it)
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
  r.soft = softIdx;
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
  p.putUChar("soft", r.soft);
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
      softIdx = pf.getUChar("soft", 0);
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
      softIdx = r.soft;
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
  if (softIdx > 2) softIdx = 0;
  if (dsStep != ds::STEP_CALIBRATE) dsStep = 0;  // only the calibration resumes; the four steps start again
}
// A display change that is not yet confirmed with OK: the next start comes back to setup. `geometry`: the touch no longer
// matches the picture (a turn or another driver), so the calibration is marked not valid (its axes' order is kept).
static void dsMarkBegun(bool geometry) {
  dsState = 1;
  Preferences p;
  if (p.begin("pocket", false)) { p.putUChar("setup", 1); p.putUChar("panel", panelType); p.putUChar("turn", turnIdx); p.putUChar("soft", softIdx); p.end(); }
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
  Serial.printf("SETUP chip=%s state=%d step=%d live=%d,%d,%d,%d soft=%d panel=%d turn=%d swap=%d u=%d..%d v=%d..%d valid=%d full=%d swapk=%d nvs=%d,%d,%d card=%s", dsChip, dsState, dsStep, dsLive.step + 1, dsLive.u, dsLive.soft, dsLive.color, softIdx, panelType,
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
    if (p.begin("pocket", false)) { for (const char* k : {"setup", "sstep", "full", "swapk", "panel", "turn", "soft", "cal"}) p.remove(k); p.end(); }
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


// ---- drawing: setupdraw.h (the same code the host shots use) ----
// What the panel does for the saved setup: the rotation (old setups: the glass's landscape turns; new ones: a portrait turn,
// and the picture is turned in software, softgfx.h) and the software mode.
static void applyDisplay() {
  tftHw.setRotation(sf::rotationFor(turnIdx, softIdx));
  tft.setMode(softIdx);
}
// Clears the panel's whole memory (any turn), then leaves the saved setup in place: a target or a step's picture is never
// left behind where two turns don't overlap. The calibration screens call this first.
static void clearAll() {
  tft.setMode(0);
  tftHw.setRotation(0);
  tftHw.fillScreen(C_BLACK);
  applyDisplay();
}
// One step of the setup drawn for the flow's turn: the portrait turn of its mirror bits, the software mode from step 3 on.
static void dsDraw(const sf::Flow& f) {
  tftHw.setRotation(f.rotation());
  tft.setMode(f.softMode());
  sf::drawStep(tft, f.step);
}

// ---- the flow ----
enum { EV_TAP, EV_BOOT, EV_MODE, EV_SKIP };
// Waits for a tap anywhere (OK; its median raw reading), the BOOT button (short: the step's action, held 1.5 s: the driver) or
// a serial command.
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
    if (dsBootReq) { dsBootReq = false; return EV_BOOT; }
    if (digitalRead(0) == LOW) {
      if (!bootT) bootT = now ? now : 1;
      if (now - bootT >= 1500) return EV_MODE;
    } else if (bootT) {
      bool real = now - bootT > 30;
      bootT = 0;
      if (real) return EV_BOOT;
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
  dsSetStep(ds::STEP_FLIP);
  dsMarkBegun(true);
  saveSettings();
  Serial.printf("setup: driver -> panel %d, restarting into step 1\n", panelType);
  message("Restarting", "(driver)");
  delay(700);
  ESP.restart();
}
// The four steps. Returns false when the setup was ended (S skip); true when the user said OK on step 4 and the display
// settings (turn, software turn, color mode) are applied and marked begun, ready for the calibration.
static bool dsFourSteps() {
  sf::Flow f;
  if (softIdx) { f.u = turnIdx & 3; f.soft = softIdx; }  // a setup made with this flow: start from it
  f.color = (panelType >> 1) & 3;
  for (;;) {
    dsLive = f;
    if (f.step == sf::COLORS) tftHw.applyColors(f.panelBits(panelType), f.rotation());  // live, no restart
    dsDraw(f);
    Serial.printf("setup: step %d (turn %d, soft %d, colors %d)\n", f.step + 1, f.u, f.soft, f.color);
    tc::Raw r = {0, 0};
    int ev = dsWait(r);
    if (ev == EV_MODE) dsDriverRestart();
    if (ev == EV_SKIP) return false;
    if (ev == EV_BOOT) { f.boot(); continue; }
    Serial.printf("setup: OK on step %d (tap raw %d,%d)\n", f.step + 1, r.x, r.y);
    if (!f.ok()) break;
  }
  panelType = (uint8_t)f.panelBits(panelType);
  turnIdx = f.u & 3;
  softIdx = f.soft;
  dsLive = f;
  dsSetStep(ds::STEP_CALIBRATE);
  dsMarkBegun(true);
  applyDisplay();
  Serial.printf("setup: display panel %d turn %d soft %d\n", panelType, turnIdx, softIdx);
  return true;
}
// Runs the setup; returns when it ended (the 3-tap calibration and saving are done). The caller redraws.
static void runDisplaySetup() {
  Serial.printf("setup: open (chip %s, step %d)\n", dsChip, dsStep + 1);
  if (dsStep != ds::STEP_CALIBRATE && !dsFourSteps()) { applyDisplay(); dsSave(); return; }
  if (runCalibration()) dsCalDone();
  dsSave();
  applyDisplay();
}
