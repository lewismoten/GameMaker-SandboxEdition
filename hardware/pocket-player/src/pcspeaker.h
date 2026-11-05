// The PC speaker tune player, with no board code in it (so the Mac test runs the same file).
// An effect is 36 frequencies in Hz (little endian u16, 0 = silence) played one per 1/145.6 s, as
// PLAYGAME's DoSound steps them (the web engine's audio/engine.ts playSpeaker does the same). A new
// effect cuts the one playing. Borland's sound() could not make a tone below about 20 Hz, so those are silent.
#pragma once
#include <stdint.h>
#include <string.h>

namespace gm {

constexpr int NUMFREQ = 36;
constexpr uint32_t TICK_RATE_X10 = 1456;  // timer ticks per second times ten (145.6)

struct Speaker {
  uint8_t data[NUMFREQ * 2];
  bool on = false;
  uint32_t t0 = 0;
  int lastStep = -1;

  // Starts an effect (36 little endian u16) at time nowUs (microseconds, any origin).
  void start(const uint8_t* tune, uint32_t nowUs) {
    memcpy(data, tune, sizeof data);
    on = true;
    t0 = nowUs;
    lastStep = -1;
  }
  void stop() { on = false; }
  // The step at nowUs. True when the output changed (f is the new frequency, 0 = off).
  bool update(uint32_t nowUs, int& f) {
    if (!on) return false;
    int step = (int)((uint64_t)(uint32_t)(nowUs - t0) * TICK_RATE_X10 / 10000000ull);
    if (step == lastStep) return false;
    lastStep = step;
    if (step >= NUMFREQ) {
      on = false;
      f = 0;
      return true;
    }
    f = data[step * 2] | (data[step * 2 + 1] << 8);
    f = f < 20 ? 0 : f > 20000 ? 20000 : f;
    return true;
  }
};

}  // namespace gm
