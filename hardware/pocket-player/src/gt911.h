// GT911 capacitive touch over I2C: probe the address, read up to 5 points at once (so Left and Jump
// can be held together). Native coordinates are portrait (x 0..319, y 0..479); toScreen() turns them
// into the landscape 480 x 320 screen (rotation 1, a guess from the spike: change it here if a
// finger lands mirrored or swapped).
#pragma once
#include <Arduino.h>
#include <Wire.h>
#include "board.h"

struct GT911 {
  uint8_t addr = 0;
  int n = 0;  // points in the last report
  int rawX[5], rawY[5];

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
  // Reads a new report if the chip has one; otherwise keeps the last. Returns the point count.
  int poll() {
    Wire.beginTransmission(addr);
    Wire.write(0x81);
    Wire.write(0x4E);
    if (Wire.endTransmission() != 0) return n;
    Wire.requestFrom((int)addr, 1);
    if (!Wire.available()) return n;
    uint8_t st = Wire.read();
    if (!(st & 0x80)) return n;
    int cnt = st & 0x0F;
    if (cnt > 5) cnt = 5;
    n = 0;
    if (cnt > 0) {
      Wire.beginTransmission(addr);
      Wire.write(0x81);
      Wire.write(0x4F);  // point i: id, x lo, x hi, y lo, y hi, size lo, size hi, reserved
      Wire.endTransmission();
      Wire.requestFrom((int)addr, cnt * 8);
      for (int i = 0; i < cnt && Wire.available() >= 8; i++) {
        uint8_t b[8];
        for (auto& v : b) v = Wire.read();
        rawX[n] = b[1] | (b[2] << 8);
        rawY[n] = b[3] | (b[4] << 8);
        n++;
      }
    }
    Wire.beginTransmission(addr);
    Wire.write(0x81);
    Wire.write(0x4E);
    Wire.write(0);
    Wire.endTransmission();
    return n;
  }
  static void toScreen(int rx, int ry, int& x, int& y) {
    x = ry;
    y = 319 - rx;
  }
};
