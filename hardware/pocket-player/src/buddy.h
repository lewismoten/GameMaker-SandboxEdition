// The small character on the "Try the controls" screen (the first run's playground): it stands in the middle of the field and
// moves as the controls are pressed. Left and Right walk it (two walking frames), Up and Down turn it away or toward you and
// step it a little, Jump (Space) hops it. It stays inside a small play area and drifts back to the center once nothing is pressed.
// The figure is an original 16 x 16 drawing (teal beanie, orange hoodie, blue trousers) made of unit squares, so there is no
// bitmap to store and it scales with the screen. Host-testable: no hardware calls, `G` is any LovyanGFX-like canvas.
#pragma once
#include <stdint.h>
#include "screen.h"

namespace bd {
constexpr int S = scr::SMALL ? 2 : 3;                     // one drawing square is S x S pixels, so the figure is 16 S wide
constexpr int RX = scr::SMALL ? 32 : 48, RY = scr::SMALL ? 8 : 12;  // how far it may wander from the center (pixels)
constexpr int HOP = 7 * S;                                // the hop's height (pixels)
constexpr uint16_t HAT = 0x0575, HAT_D = 0x0410, SKIN = 0xE5B1, HOOD = 0xFBE0, HOOD_D = 0xC380, PANTS = 0x2A8F, EYE = 0x0000, SHOE = 0x2104,
                   SHADOW = 0x3186;
enum Face : uint8_t { DOWN, LEFT, RIGHT, UP };  // which way the figure looks
// The held bits are st::heldText's: 1 Left, 2 Right, 4 Up, 8 Down, 16 Jump.
struct Box { int x0, y0, x1, y1; };
struct Buddy {
  int x = 0, y = 0;      // pixels away from the center
  Face face = DOWN;
  uint8_t frame = 0;     // the walking frame, 0 or 1
  uint32_t last = 0;     // the last tick's time (ms)
  uint32_t stepAt = 0;   // when the frame last flipped
  uint32_t idleAt = 0;   // when the last key was released
  int32_t hopMs = -1;    // time into the hop, or -1 when on the ground
  uint8_t prevHeld = 0;
  Box drawn = {0, 0, -1, -1};  // what the last paint covered (cleared by the next one)
  // Step to time `now` with the keys `held`. True when anything visible changed.
  bool tick(uint8_t held, uint32_t now) {
    if (last == 0) { last = now; idleAt = now; }
    uint32_t dt = now - last;
    if (dt > 100) dt = 100;
    last = now;
    int px = x, py = y, pHop = hopMs, pf = frame;
    Face pface = face;
    int dx = (held & 2 ? 1 : 0) - (held & 1 ? 1 : 0), dy = (held & 8 ? 1 : 0) - (held & 4 ? 1 : 0);
    int step = (int)(dt * 14 * S / 100);  // 0.14 S pixels a millisecond: about 8 S pixels in 60 ms
    if (dx || dy) {
      if (dx) face = dx < 0 ? LEFT : RIGHT;
      else face = dy < 0 ? UP : DOWN;
      x += dx * step;
      y += dy * (step / 2);
      if (x < -RX) x = -RX;
      if (x > RX) x = RX;
      if (y < -RY) y = -RY;
      if (y > RY) y = RY;
      if (now - stepAt >= 150) { frame ^= 1; stepAt = now; }
      idleAt = now;
    } else {
      frame = 0;
      if (now - idleAt > 700) {  // no arrow for a moment: drift back to the center
        int back = step / 2 > 0 ? step / 2 : 1;
        if (x != 0) x += x > 0 ? (x > back ? -back : -x) : (x < -back ? back : -x);
        if (y != 0) y += y > 0 ? (y > back ? -back : -y) : (y < -back ? back : -y);
      }
    }
    if ((held & 16) && !(prevHeld & 16) && hopMs < 0) hopMs = 0;
    else if (hopMs >= 0) {
      hopMs += (int32_t)dt;
      if (hopMs >= 420) hopMs = (held & 16) ? 0 : -1;  // holding Jump keeps hopping
    }
    prevHeld = held;
    return px != x || py != y || pHop != hopMs || pf != frame || pface != face;
  }
  int lift() const {  // pixels above the ground, a parabola over the hop
    if (hopMs < 0) return 0;
    int t = hopMs * 100 / 420;  // 0..100
    return HOP * 4 * t * (100 - t) / 10000;
  }
};
// Where the figure's top left corner sits: the middle of the field, a little below the hint text.
inline int originX() { return scr::W / 2 - 8 * S; }
inline int originY() { return scr::VIEW_H * 6 / 10 - 8 * S; }

// One figure, drawn as unit squares. (gx, gy) is its top left corner in the 16 x 16 drawing.
template <class G> void figure(G& g, int ox, int oy, Face f, uint8_t frame) {
  auto cell = [&](int cx, int cy, int w, int h, uint16_t c, bool flip) {
    int x0 = flip ? 16 - cx - w : cx;
    g.fillRect(ox + x0 * S, oy + cy * S, w * S, h * S, c);
  };
  const bool flip = f == LEFT;  // the side view is drawn facing right
  if (f == DOWN || f == UP) {
    const bool front = f == DOWN;
    cell(4, 1, 8, 3, HAT, false);       // the beanie
    cell(4, 4, 8, 1, HAT_D, false);     // the folded edge
    cell(4, 5, 8, 3, front ? SKIN : HAT, false);  // the face (from behind: the back of the beanie)
    if (!front) cell(5, 7, 6, 1, SKIN, false);    // the neck
    if (front) { cell(6, 6, 1, 1, EYE, false); cell(9, 6, 1, 1, EYE, false); }
    cell(4, 8, 8, 5, HOOD, false);      // the hoodie
    cell(3, 8, 1, 4, HOOD_D, false);    // the arms
    cell(12, 8, 1, 4, HOOD_D, false);
    cell(3, 12, 1, 1, SKIN, false);     // the hands
    cell(12, 12, 1, 1, SKIN, false);
    if (frame == 0) { cell(5, 13, 2, 3, PANTS, false); cell(9, 13, 2, 3, PANTS, false); cell(5, 15, 2, 1, SHOE, false); cell(9, 15, 2, 1, SHOE, false); }
    else { cell(5, 13, 2, 2, PANTS, false); cell(9, 13, 2, 3, PANTS, false); cell(5, 14, 2, 1, SHOE, false); cell(9, 15, 2, 1, SHOE, false); }
    return;
  }
  cell(4, 1, 8, 3, HAT, flip);          // side view: the beanie, the face turned to the right
  cell(4, 4, 8, 1, HAT_D, flip);
  cell(4, 5, 8, 3, HAT, flip);          // the back of the head under the beanie
  cell(8, 5, 4, 3, SKIN, flip);         // the face
  cell(10, 6, 1, 1, EYE, flip);
  cell(5, 8, 6, 5, HOOD, flip);         // the hoodie
  cell(6, 9, 3, 3, HOOD_D, flip);       // the near arm
  cell(8, 11, 1, 1, SKIN, flip);
  if (frame == 0) { cell(5, 13, 2, 3, PANTS, flip); cell(9, 13, 2, 3, PANTS, flip); cell(5, 15, 3, 1, SHOE, flip); cell(9, 15, 3, 1, SHOE, flip); }
  else { cell(7, 13, 2, 3, PANTS, flip); cell(7, 15, 3, 1, SHOE, flip); }
}
// Clear where it was, then draw it (shadow first). `field` is the field's color under it.
template <class G> void paint(G& g, Buddy& b, uint16_t field) {
  if (b.drawn.x1 >= b.drawn.x0) g.fillRect(b.drawn.x0, b.drawn.y0, b.drawn.x1 - b.drawn.x0 + 1, b.drawn.y1 - b.drawn.y0 + 1, field);
  int ox = originX() + b.x, oy = originY() + b.y, up = b.lift();
  g.fillRect(ox + 3 * S, oy + 16 * S, 10 * S, S, SHADOW);  // the shadow stays on the ground while the figure hops
  figure(g, ox, oy - up, b.face, b.frame);
  b.drawn = {ox - 1, oy - up - 1, ox + 16 * S, oy + 17 * S};
}
inline Box area() {  // everything the figure can cover
  return {originX() - RX - 1, originY() - RY - HOP - 1, originX() + RX + 16 * S, originY() + RY + 17 * S};
}
}  // namespace bd
