// The screen the firmware draws for: the ESP32-3248S035's 480x320 (default), or with -DPOCKET_CYD28 the
// ESP32-2432S028's 320x240. The game view is always the 320x200 game picture, 1.5x on the big screen and 1x on the
// small one (so the small screen's status strip is 40 px, the big one's 20). No board code in it (the Mac tests read it).
#pragma once
namespace scr {
#ifdef POCKET_CYD28
constexpr int W = 320, H = 240, VIEW_H = 200, GN = 1, GD = 1;
constexpr bool SMALL = true;
#else
constexpr int W = 480, H = 320, VIEW_H = 300, GN = 3, GD = 2;
constexpr bool SMALL = false;
#endif
constexpr int STRIP_H = H - VIEW_H;
// game pixel -> screen pixel, and back (the same expressions the 3248S035 build always used: * 3 / 2 and * 2 / 3)
constexpr int up(int g) { return g * GN / GD; }
constexpr int down(int s) { return s * GD / GN; }
// Play-only viewport; controls and cards keep their full-screen coordinates.
struct Picture {
  int screenW, screenH;
  bool smaller, leftHand;
  int padInset;  // distance from the pad-side edge past the pad and its touch slop
  int width() const {
    int inset = padInset > screenW / 4 ? padInset : screenW / 4;
    return smaller ? screenW - inset : screenW;
  }
  int height() const { return screenH * width() / screenW; }
  int x() const { return smaller && !leftHand ? screenW - width() : 0; }
  int toX(int gx) const { return x() + gx * width() / 320; }
  int toY(int gy) const { return gy * height() / 200; }
  bool contains(int sx, int sy) const { return sx >= x() && sx < x() + width() && sy >= 0 && sy < height(); }
  int fromX(int sx) const { return (sx - x()) * 320 / width(); }
  int fromY(int sy) const { return sy * 200 / height(); }
};
}  // namespace scr
