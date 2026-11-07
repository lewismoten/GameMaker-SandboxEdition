// The idle timer, with no board code in it (host/idletest.cpp runs it on the Mac with a fake clock).
// In the library or paused: dim after 60 s with no touch, backlight off after 3 minutes. In a game: pause after 3 minutes
// with no touch (the pause then starts its own dim and off timers). Any touch, a serial byte or the BOOT button is
// activity. The touch that wakes the screen only wakes it: swallow() hides it until the finger lifts.
#pragma once
#include <stdint.h>
namespace idle {
enum State : uint8_t { AWAKE, DIM, OFF };
enum Act : uint8_t { NONE, DIM_NOW, OFF_NOW, WAKE_NOW, AUTOPAUSE };
constexpr uint32_t DIM_MS = 60000, OFF_MS = 180000, PAUSE_MS = 180000;
struct Machine {
  State state = AWAKE;
  uint32_t last = 0;
  bool swallowing = false;
  void bump(uint32_t now) { last = now; }  // a screen change (a game loaded, a card closed): the clock starts again
  // `touching`: a finger is down. `other`: a serial byte arrived or BOOT is held. `playing`: a game is running.
  Act update(uint32_t now, bool touching, bool other, bool playing) {
    if (touching || other) {
      last = now;
      if (state != AWAKE) {
        state = AWAKE;
        if (touching) swallowing = true;
        return WAKE_NOW;
      }
      return NONE;
    }
    uint32_t idleMs = now - last;
    if (playing) {
      if (idleMs >= PAUSE_MS) { last = now; return AUTOPAUSE; }
      return NONE;
    }
    if (state == AWAKE && idleMs >= DIM_MS) { state = DIM; return DIM_NOW; }
    if (state == DIM && idleMs >= OFF_MS) { state = OFF; return OFF_NOW; }
    return NONE;
  }
  // True while the touch that woke the screen is still down; it ends when the finger lifts.
  bool swallow(bool touching) {
    if (!swallowing) return false;
    if (touching) return true;
    swallowing = false;
    return false;
  }
};
// Brightness steps (Settings, Display): 25, 50, 75, 100 percent of the backlight; dim is 15 percent.
constexpr uint8_t LEVEL[4] = {64, 128, 191, 255};
constexpr uint8_t DIM_LEVEL = 38;
inline uint8_t level(int step) { return LEVEL[step < 0 ? 0 : step > 3 ? 3 : step]; }
inline uint8_t forState(State s, int step) { return s == OFF ? 0 : s == DIM ? (DIM_LEVEL < level(step) ? DIM_LEVEL : level(step)) : level(step); }
}  // namespace idle
