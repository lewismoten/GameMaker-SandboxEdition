// The board's speaker: the amplifier on GPIO 26 (SPEAK=26 in rzeldent's platformio-espressif32-sunton
// esp32-3248S035C.json, "Speaker: JST1.25 2p"; GPIO 26 is the ESP32's DAC2). It is driven with a LEDC
// square wave, one frequency per 1/145.6 s, by a small task on core 0 so a slow picture frame doesn't
// stretch a tune. The tune logic is pcspeaker.h; this file only moves its answers to the pin.
#pragma once
#include <Arduino.h>
#include "pcspeaker.h"

namespace spk {

constexpr int PIN = 26, CHANNEL = 4;
// Volume 0 off, 1 low, 2 medium, 3 high: the duty of the 8 bit square wave (128 is the loudest, half on).
constexpr uint8_t DUTY[] = {0, 10, 40, 128};

static gm::Speaker player;
static portMUX_TYPE lock = portMUX_INITIALIZER_UNLOCKED;
static volatile uint8_t volume = 2;

static void out(int f) {
  if (f > 0 && volume > 0) {
    ledcWriteTone(CHANNEL, f);
    ledcWrite(CHANNEL, DUTY[volume]);  // ledcWriteTone sets 50 %; this sets the volume
  } else ledcWrite(CHANNEL, 0);
}

static void task(void*) {
  for (;;) {
    int f = 0;
    bool changed;
    portENTER_CRITICAL(&lock);
    changed = player.update(micros(), f);
    portEXIT_CRITICAL(&lock);
    if (changed) out(f);
    vTaskDelay(1);
  }
}

inline void stop() {
  portENTER_CRITICAL(&lock);
  player.stop();
  portEXIT_CRITICAL(&lock);
  out(0);
}
inline void begin() {
  ledcSetup(CHANNEL, 2000, 8);
  ledcAttachPin(PIN, CHANNEL);
  ledcWrite(CHANNEL, 0);
  xTaskCreatePinnedToCore(task, "spk", 2048, nullptr, 1, nullptr, 0);
}
inline void setVolume(int v) {
  volume = v < 0 ? 0 : v > 3 ? 3 : v;
  if (!volume) stop();
}
inline void play(const uint8_t* tune) {
  if (!volume) return;
  portENTER_CRITICAL(&lock);
  player.start(tune, micros());
  portEXIT_CRITICAL(&lock);
}

}  // namespace spk
