// XPT2046 resistive touch of the ESP32-2432S028, read by bit-banging its own pins (CLK 25, MOSI 32, MISO 39, CS 33,
// IRQ 36 in board.h: not the display's bus and not the card's, so nothing shares a SPI host). One finger. Same
// interface as gt911.h (n, rawX, rawY, id, size, poll, toScreen); `size` is the pressure (1..99, bigger = harder).
//
// Idle reads clean: a touch needs the chip's IRQ line low and a pressure of at least Z_MIN on two polls in a row; it
// ends after two polls without one. controls.h then keeps a lifted finger pressing for GRACE_MS (60 ms) on top of
// that, so a resistive screen's flicker under a held thumb does not let go of a key.
// Calibration (touchcal.h) is kept in NVS (Preferences, namespace "pocket", key "cal").
#pragma once
#include <Arduino.h>
#include <Preferences.h>
#include "board.h"
#include "screen.h"
#include "touchcal.h"

struct XPT2046 {
  int n = 0;
  int rawX[5], rawY[5], id[5], size[5];
  bool fresh = false;
  uint8_t addr = 0;  // (unused here; gt911.h has the chip address)
  static constexpr int Z_MIN = 350;  // z = z1 + 4095 - z2 (0 idle, about 2000 firm, 700 light finger); idle read 5 on both boards

  static tc::Cal& cal() { static tc::Cal c; return c; }
  static bool calibrated() { return cal().valid; }
  static void setCal(const tc::Cal& c) {
    cal() = c;
    Preferences p;
    if (p.begin("pocket", false)) { p.putBytes("cal", &c, sizeof c); p.end(); }
  }
  static void toScreen(int rx, int ry, int& x, int& y) { tc::toScreen(cal(), rx, ry, scr::W, scr::H, x, y); }

  static uint16_t xfer(uint8_t cmd) {  // one conversion: 8 command bits out, 12 bits (and 4 more) back
    digitalWrite(PIN_XCS, LOW);
    for (int i = 7; i >= 0; i--) {
      digitalWrite(PIN_XMOSI, (cmd >> i) & 1);
      digitalWrite(PIN_XCLK, HIGH);
      digitalWrite(PIN_XCLK, LOW);
    }
    uint16_t v = 0;
    for (int i = 0; i < 16; i++) {
      digitalWrite(PIN_XCLK, HIGH);
      digitalWrite(PIN_XCLK, LOW);
      v = (v << 1) | digitalRead(PIN_XMISO);
    }
    digitalWrite(PIN_XCS, HIGH);
    return v >> 4;
  }
  // PD bits 00: the pen-down interrupt stays armed between conversions.
  static constexpr uint8_t C_Z1 = 0xB0, C_Z2 = 0xC0, C_X = 0xD0, C_Y = 0x90;

  bool probe() {  // the chip has no ID; an idle chip answers z1 near 0 and z2 near 4095 (a missing one reads all 0 or all 1)
    pinMode(PIN_XCLK, OUTPUT);
    pinMode(PIN_XMOSI, OUTPUT);
    pinMode(PIN_XCS, OUTPUT);
    pinMode(PIN_XMISO, INPUT);
    pinMode(PIN_XIRQ, INPUT);
    digitalWrite(PIN_XCS, HIGH);
    digitalWrite(PIN_XCLK, LOW);
    xfer(C_Y);
    uint16_t z1 = xfer(C_Z1), z2 = xfer(C_Z2);
    Preferences p;
    if (p.begin("pocket", true)) {
      tc::Cal c;
      if (p.getBytes("cal", &c, sizeof c) == sizeof c && c.valid) cal() = c;
      p.end();
    }
    return z1 < 2000 && z2 > 2000;
  }
  static int cmp(const void* a, const void* b) { return *(const int*)a - *(const int*)b; }
  // One sample if the pen is down: median of three x,y pairs, and the pressure. Returns false when no touch.
  bool sample(int& x, int& y, int& z) {
    if (digitalRead(PIN_XIRQ)) return false;
    int xs[3], ys[3];
    xfer(C_X);
    for (int i = 0; i < 3; i++) { xs[i] = xfer(C_X); ys[i] = xfer(C_Y); }
    int z1 = xfer(C_Z1), z2 = xfer(C_Z2);
    xfer(C_Y);  // a last conversion with PD 00 re-arms the interrupt
    qsort(xs, 3, sizeof(int), cmp);
    qsort(ys, 3, sizeof(int), cmp);
    x = xs[1];
    y = ys[1];
    z = z1 + 4095 - z2;
    return z >= Z_MIN && x > 0 && x < 4095 && y > 0 && y < 4095;
  }
  int downRun = 0, upRun = 0;
  bool isDown = false;
  int poll() {
    fresh = false;
    int x, y, z;
    bool d = sample(x, y, z);
    if (d) { downRun++; upRun = 0; } else { upRun++; downRun = 0; }
    if (!isDown && downRun >= 2) isDown = true;
    if (isDown && upRun >= 2) { isDown = false; n = 0; fresh = true; }
    if (isDown && d) {
      n = 1;
      rawX[0] = x;
      rawY[0] = y;
      id[0] = 0;
      int s = z / 40;
      size[0] = s < 1 ? 1 : s > 99 ? 99 : s;
      fresh = true;
    }
    return n;
  }
};
