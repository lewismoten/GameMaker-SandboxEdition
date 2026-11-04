// Game-Maker Pocket Player spike: boot text, touch probe, First Steps level 1's first screen.
// No sound. Pins and touch chips are in board.h.
#include <Arduino.h>
#include <LittleFS.h>
#include <Wire.h>
#include <esp_heap_caps.h>
#include "board.h"
#include "level.h"

static LGFX tft;
enum Touch { NONE, GT911, XPT };
static Touch touchKind = NONE;
static uint8_t gtAddr = 0;

static bool i2cPing(uint8_t a) {
  Wire.beginTransmission(a);
  return Wire.endTransmission() == 0;
}

// The GT911 picks its address from INT while RST rises: INT low gives 0x14, INT high gives 0x5D.
static uint8_t probeGT911() {
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
    if (i2cPing(0x5D)) return 0x5D;
    if (i2cPing(0x14)) return 0x14;
  }
  return 0;
}

// Reads one GT911 point (native panel coordinates). Returns true while touched.
static bool gtRead(int& x, int& y) {
  Wire.beginTransmission(gtAddr);
  Wire.write(0x81);
  Wire.write(0x4E);
  if (Wire.endTransmission() != 0) return false;
  Wire.requestFrom((int)gtAddr, 1);
  if (!Wire.available()) return false;
  uint8_t st = Wire.read();
  bool ok = false;
  if ((st & 0x80) && (st & 0x0F)) {
    Wire.beginTransmission(gtAddr);
    Wire.write(0x81);
    Wire.write(0x50);
    Wire.endTransmission();
    Wire.requestFrom((int)gtAddr, 4);
    if (Wire.available() >= 4) {
      uint8_t b[4];
      for (auto& v : b) v = Wire.read();
      x = b[0] | (b[1] << 8);
      y = b[2] | (b[3] << 8);
      ok = true;
    }
  }
  if (st & 0x80) {
    Wire.beginTransmission(gtAddr);
    Wire.write(0x81);
    Wire.write(0x4E);
    Wire.write(0);
    Wire.endTransmission();
  }
  return ok;
}

static void strip(const char* msg) {
  tft.fillRect(0, 300, 288, 20, TFT_BLACK);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextSize(1);
  tft.setCursor(2, 306);
  tft.print(msg);
}

void setup() {
  Serial.begin(115200);
  tft.init();
  tft.setRotation(1);  // landscape 480x320
  tft.setBrightness(255);
  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextSize(3);
  tft.setCursor(30, 120);
  tft.print("Game-Maker Pocket Player");
  tft.setTextSize(2);
  tft.setCursor(30, 170);

  uint8_t a = probeGT911();
  char line[64];
  if (a) {
    touchKind = GT911;
    gtAddr = a;
    snprintf(line, sizeof line, "Touch: GT911 at 0x%02X", a);
  } else {
    Wire.end();
    tft.attachResistive();
    touchKind = XPT;
    snprintf(line, sizeof line, "Touch: no GT911, trying XPT2046");
  }
  Serial.println(line);
  tft.print(line);
  delay(2500);

  bool fs = LittleFS.begin(false);
  int ms = fs ? drawFirstScreen(tft, "/walk.map", "/steps.bbl", "/steps.pal", 11, 12) : -1;
  if (ms < 0) {
    tft.fillScreen(TFT_BLACK);
    tft.setTextSize(2);
    tft.setCursor(10, 100);
    tft.print(fs ? "Level files not readable" : "LittleFS mount failed");
    Serial.println(fs ? "level read failed" : "LittleFS mount failed");
    return;
  }
  snprintf(line, sizeof line, "heap %u  block %u  draw %d ms  %s", (unsigned)ESP.getFreeHeap(),
           (unsigned)heap_caps_get_largest_free_block(MALLOC_CAP_8BIT), ms, touchKind == GT911 ? "GT911" : "XPT2046");
  Serial.println(line);
  strip(line);
  drawSwatches(tft);
}

void loop() {
  int x = 0, y = 0;
  bool hit = false;
  if (touchKind == GT911) {
    int rx, ry;
    if (gtRead(rx, ry)) {
      // Native GT911 coordinates are portrait (x 0..319, y 0..479); landscape rotation 1 guess:
      x = ry;
      y = 319 - rx;
      hit = true;
      Serial.printf("raw %d,%d\n", rx, ry);
    }
  } else if (touchKind == XPT) {
    hit = tft.getTouch(&x, &y);
    if (hit) Serial.printf("xpt %d,%d\n", x, y);
  }
  if (hit && x >= 0 && x < 480 && y >= 0 && y < 320) tft.fillCircle(x, y, 5, TFT_RED);
  delay(10);
}
