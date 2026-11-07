// The 2.8 inch board's RGB LED as a status light, with no board code in it (host/idletest.cpp checks the timing).
// Dim green while something loads, three red blinks after a load or card error, otherwise off. The pins are active low.
#pragma once
#include <stdint.h>
namespace sled {
constexpr uint32_t BLINK_MS = 160, BLINKS = 3;
constexpr uint8_t GREEN_DUTY = 12;  // of 255: dim
struct Led {
  bool loading = false, enabled = true, blinking = false;
  uint32_t errorAt = 0;
  void load(bool on) { loading = on; }
  void error(uint32_t now) { blinking = true; errorAt = now; }
  // Red (0 or 255) and green (0..255) brightness now.
  void at(uint32_t now, uint8_t& red, uint8_t& green) {
    red = green = 0;
    if (!enabled) return;
    if (blinking) {
      uint32_t t = now - errorAt;
      if (t < BLINK_MS * 2 * BLINKS) { red = (t / BLINK_MS) % 2 == 0 ? 255 : 0; return; }
      blinking = false;
    }
    if (loading) green = GREEN_DUTY;
  }
};
}  // namespace sled
