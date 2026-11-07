// Which button a touch is on, and the press state machine behind "act on release", with no board code in it
// (host/librarytest.cpp checks both). A button shows a yellow frame on touch-down and acts when the finger lifts
// on the same button; sliding off cancels, so a brush or a drag never presses anything.
#pragma once
#include <stdint.h>
#include "overlaydraw.h"
namespace prs {
struct Rect {
  int x0, y0, x1, y1;  // x1 and y1 are one past the last pixel
  Rect(int a = 0, int b = 0, int c = 0, int d = 0) : x0(a), y0(b), x1(c), y1(d) {}
  bool has(int x, int y, int slack = 0) const { return x >= x0 - slack && x < x1 + slack && y >= y0 - slack && y < y1 + slack; }
};
enum Screen : uint8_t { SC_PICKER, SC_DETAILS, SC_DISPLAY, SC_SETTINGS, SC_PAUSE };
// What the screen shows right now (the board's main.cpp fills it in).
struct Ctx {
  Screen screen = SC_PICKER;
  int W = 480, H = 320, titleH = 40;
  bool back = true, prev = false, next = false, action = false;  // library: which controls are live
  int tiles = 0;                                                // library: tiles on this page
  int stY0 = 42, stStep = 34, stPerPage = 7, stFootY = 288, stRows = 10, setPage = 0, pages = 1;  // settings
  bool smallBoard = false;
  int displayRows = 1;  // display options: 1 or 2 buttons
};
inline Rect tileRect(int W, int i) {
  bool s = W == 320;
  Rect r;
  r.x0 = (s ? 12 : 16) + i % 3 * (s ? 100 : 152);
  r.y0 = (s ? 36 : 40) + i / 3 * (s ? 84 : 120);
  r.x1 = r.x0 + (s ? 96 : 144);
  r.y1 = r.y0 + (s ? 80 : 112);
  return r;
}
// The button under (x, y), or false. Only live controls count.
inline bool under(const Ctx& c, int x, int y, Rect& r) {
  const int W = c.W, H = c.H;
  switch (c.screen) {
    case SC_PICKER: {
      int f = W == 320 ? 208 : 280;
      if (y < 32) {
        if (x >= W - 32) r = {W - 32, 0, W, 32};
        else if (x >= W - 64) r = {W - 64, 0, W - 32, 32};
        else if (x < 32 && c.back) r = {0, 0, 32, 32};
        else return false;
      } else if (y >= f) {
        if (x < 48 && c.prev) r = {0, f, 48, H};
        else if (x >= 50 && x < 98 && c.next) r = {50, f, 98, H};
        else if (x >= W - 100 && c.action) r = {W - 100, f, W, H};
        else return false;
      } else {
        for (int i = 0; i < c.tiles; i++) {
          r = tileRect(W, i);
          if (r.has(x, y)) return true;
        }
        return false;
      }
      return r.has(x, y);
    }
    case SC_DETAILS:
      if (y < H - 38) return false;
      r = x < W / 2 ? Rect{0, H - 38, W / 2 - 2, H} : Rect{W / 2, H - 38, W, H};
      return r.has(x, y);
    case SC_DISPLAY:
      if (y >= H - 38) r = {6, H - 38, 100, H - 2};
      else if (y >= c.titleH + 12 && y < c.titleH + 52) r = {6, c.titleH + 12, W - 6, c.titleH + 52};
      else if (c.displayRows > 1 && y >= c.titleH + 60 && y < c.titleH + 100) r = {6, c.titleH + 60, W - 6, c.titleH + 100};
      else return false;
      return r.has(x, y);
    case SC_SETTINGS: {
      if (y >= c.stFootY) {
        if (c.smallBoard) {
          if (x < 104) r = {6, c.stFootY + 2, 100, H - 2};
          else if (x < 208 && c.pages > 1) r = {108, c.stFootY + 2, 202, H - 2};
          else return false;
        } else {
          if (x < 160) r = {6, 288, 150, 318};
          else if (x < 280 && c.pages > 1) r = {160, 288, 280, 318};
          else return false;
        }
        return r.has(x, y);
      }
      int row = (y - c.stY0) / c.stStep;
      if (y < c.stY0 || row >= c.stPerPage || c.setPage * c.stPerPage + row >= c.stRows) return false;
      r = {6, c.stY0 + row * c.stStep, W - 6, c.stY0 + row * c.stStep + 32};
      return r.has(x, y);
    }
    case SC_PAUSE: {
      int i = ovl::pauseHit(x, y);
      if (i < 0) return false;
      ovl::pauseCell(i, r.x0, r.y0, r.x1, r.y1);
      return true;
    }
  }
  return false;
}
// ---- the press itself ----
enum Ev : uint8_t { NONE, PRESS, CANCEL, ACT };
constexpr uint32_t MIN_SHOW_MS = 80;  // a pressed button stays drawn at least this long, however short the tap
constexpr int SLACK = 8;              // the finger may drift this far outside the button
struct Press {
  bool down = false, shown = false, ignore = false;
  Rect r;
  int dx = 0, dy = 0;
  uint32_t at = 0;
  // A finger already down when a screen opens (the one that opened it) presses nothing: call this then.
  void screenChanged(bool touching) { shown = false; down = touching; ignore = touching; }
  // `lookup(x, y, Rect&)` finds the button under a new touch. Call once per loop with the current touch.
  template <class F> Ev update(uint32_t now, bool touching, int x, int y, F lookup) {
    if (!touching) {
      bool act = down && shown;
      down = shown = ignore = false;
      return act ? ACT : NONE;
    }
    if (!down) {
      down = true;
      dx = x;
      dy = y;
      at = now;
      shown = lookup(x, y, r);
      return shown ? PRESS : NONE;
    }
    if (shown && !r.has(x, y, SLACK)) {
      shown = false;
      return CANCEL;
    }
    return NONE;
  }
  uint32_t showLeft(uint32_t now) const { uint32_t t = now - at; return t < MIN_SHOW_MS ? MIN_SHOW_MS - t : 0; }
};
// The pressed look: a thick yellow frame inside the button.
template <class G> void drawPressed(G& g, const Rect& r) {
  const uint16_t Y = 0xFF2A;
  int w = r.x1 - r.x0, h = r.y1 - r.y0;
  for (int i = 0; i < 3; i++) g.drawRoundRect(r.x0 + i, r.y0 + i, w - 2 * i, h - 2 * i, 6, Y);
  g.drawRect(r.x0 + 3, r.y0 + 3, w - 6, h - 6, 0);
}
}  // namespace prs
