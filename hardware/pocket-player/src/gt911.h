// GT911 capacitive touch over I2C: probe the address, read up to 5 points at once (so Left and Jump
// can be held together). Native coordinates are portrait (x 0..319, y 0..479); toScreen() turns them
// into the landscape 480 x 320 screen (rotation 1, a guess from the spike: change it here if a
// finger lands mirrored or swapped).
#pragma once
#include <Arduino.h>
#include <Wire.h>
#include "board.h"
#include "gt911report.h"

struct GT911 : gtr::Report {
  uint8_t addr = 0;
  bool ping(uint8_t a) {
    Wire.beginTransmission(a);
    return Wire.endTransmission() == 0;
  }
  // The chip picks its address from INT while RST rises: INT low gives 0x14, INT high gives 0x5D.
  bool probe() {
    Wire.begin(PIN_SDA, PIN_SCL, 400000);
    for (int hi = 0; hi < 2; hi++) {
      pinMode(PIN_TRST, OUTPUT);
      pinMode(PIN_TINT, OUTPUT);
      digitalWrite(PIN_TRST, LOW);
      digitalWrite(PIN_TINT, hi ? HIGH : LOW);
      delay(10);
      digitalWrite(PIN_TRST, HIGH);
      delay(6);
      pinMode(PIN_TINT, INPUT);
      delay(60);
      if (ping(0x5D)) { addr = 0x5D; return true; }
      if (ping(0x14)) { addr = 0x14; return true; }
    }
    return false;
  }
  int poll() { return pollReport(Wire, addr); }
  static void toScreen(int rx, int ry, int& x, int& y) {
    x = ry;
    y = 319 - rx;
  }
};
