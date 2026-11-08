// First run with no board code in it, so the Mac renders and checks it (host/firstruntest.cpp): after the display setup (2.8
// inch) or at the first start (3.5 inch), one How to hold it card (the board held in two hands, the pad, Jump and MENU named),
// then Pick your hand (two big buttons: pad on the left or on the right), then the touch playground: the real pad and Jump over
// a gray field, each key lit and named as it is pressed, and Done in a fixed place at the top, between the pad's and Jump's
// sides. Settings, Controls, Try the controls opens the playground alone. main.cpp keeps "firstrun" in NVS (namespace pocket)
// once Done is tapped, so it never comes back unless that key is erased (serial "FIRST reset").
#pragma once
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include "buddy.h"
#include "controls.h"
#include "handdraw.h"
#include "overlaydraw.h"
#include "paddraw.h"
#include "screen.h"
#include "settingsdraw.h"
namespace fr {
constexpr uint16_t C_WHITE = 0xFFFF, C_BLACK = 0, C_YELLOW = 0xFF2A, C_GRAY = 0x7BEF, C_DARK = 0x2104, C_BLUE = 0x3A9C, C_FIELD = 0x4208,
                   C_SCREEN = 0x10A6, C_SKIN = 0xE5B1, C_NAIL = 0xF6D7, C_EDGE = 0x8A65;
constexpr int W = scr::W, H = scr::H;

// ---- the flow ------------------------------------------------------------------------------------------------------
enum Step : uint8_t { HOWTO, HAND, PLAY, FINISHED };
enum Tap : uint8_t { T_NONE, T_NEXT, T_PAD_LEFT, T_PAD_RIGHT, T_DONE };
struct Flow {
  Step step = HOWTO;
  bool fromSettings = false;  // the playground alone, from Settings: Done goes back there and nothing is marked
  bool chose = false;         // a hand was picked
  uint8_t lefty = 0;          // the hand picked (ctl::Settings::lefty: 1 puts the pad on the right)
  void start(bool settings) { fromSettings = settings; step = settings ? PLAY : HOWTO; chose = false; }
  // A tap on the step showing; true when the step changed. FINISHED: main.cpp saves (first run only) and leaves.
  bool apply(Tap t) {
    switch (step) {
      case HOWTO: if (t == T_NEXT) { step = HAND; return true; } break;
      case HAND:
        if (t == T_PAD_LEFT || t == T_PAD_RIGHT) { lefty = t == T_PAD_RIGHT; chose = true; step = PLAY; return true; }
        break;
      case PLAY: if (t == T_DONE) { step = FINISHED; return true; } break;
      default: break;
    }
    return false;
  }
  bool marksDone() const { return step == FINISHED && !fromSettings; }  // write NVS "firstrun" now
};

// ---- geometry ------------------------------------------------------------------------------------------------------
struct Box { int x0, y0, x1, y1; bool has(int x, int y) const { return x >= x0 && x < x1 && y >= y0 && y < y1; } };
constexpr float TEXT = scr::SMALL ? 1.0f : 1.5f, TITLE = 2.0f;
inline Box nextBox() { return scr::SMALL ? Box{W - 108, H - 46, W - 6, H - 6} : Box{W - 156, H - 64, W - 8, H - 8}; }
inline Box handBox(int k) {  // 0: pad on the left (right-handed), 1: pad on the right
  const int m = scr::SMALL ? 8 : 12, gap = scr::SMALL ? 8 : 12, y0 = scr::SMALL ? 44 : 60, y1 = H - m;
  int w = (W - 2 * m - gap) / 2, x0 = m + k * (w + gap);
  return {x0, y0, x0 + w, y1};
}
// Done sits at the top between the floating pad's zones (the middle fifth of the width), away from the pad and Jump.
inline Box doneBox() { return scr::SMALL ? Box{W / 2 - 32, 4, W / 2 + 32, 40} : Box{W / 2 - 48, 6, W / 2 + 48, 58}; }
inline Tap hit(Step s, int x, int y) {
  switch (s) {
    case HOWTO: return nextBox().has(x, y) ? T_NEXT : T_NONE;
    case HAND: return handBox(0).has(x, y) ? T_PAD_LEFT : handBox(1).has(x, y) ? T_PAD_RIGHT : T_NONE;
    case PLAY: return doneBox().has(x, y) ? T_DONE : T_NONE;
    default: return T_NONE;
  }
}
// What the playground offers: every arrow, Jump (Space, with the 2.8 inch board's jump arcs), no Enter, no key menu.
inline ctl::Need playNeed() {
  ctl::Need n;
  n.left = n.right = n.up = n.down = true;
  ctl::needAdd(n, ctl::S_SPACE, "Jump");
  return n;
}

// ---- drawing -------------------------------------------------------------------------------------------------------
// A hand holding the board's lower corner on `side` (-1 left, +1 mirrored right): the maintainer's SVG hand (handdraw.h), its index
// finger's flat top on the board's bottom edge and its thumbnail on column `tx`, which is the pad's (left) or Jump's (right) column.
template <class G> void hand(G& g, const Box& b, int side, int tx, float scale) {
  const int bw = b.x1 - b.x0, bh = b.y1 - b.y0, sx0 = b.x0 + bw / 12, sy0 = b.y0 + bh / 10, sx1 = b.x1 - bw / 12, sy1 = b.y1 - bh / 10;
  const float bcx = (b.x0 + b.x1) * 0.5f, bcy = (b.y0 + b.y1) * 0.5f, bhw = bw * 0.5f, bhh = bh * 0.5f, br = 8;
  auto boardDist = [&](float px, float py) {  // signed distance to the board's rounded edge, in pixels
    float qx = __builtin_fabsf(px - bcx) - (bhw - br), qy = __builtin_fabsf(py - bcy) - (bhh - br);
    float ox = qx > 0 ? qx : 0, oy = qy > 0 ? qy : 0, m = qx > qy ? qx : qy;
    return __builtin_sqrtf(ox * ox + oy * oy) + (m < 0 ? m : 0) - br;
  };
  auto bg = [&](int x, int y) -> uint16_t {
    float bd = boardDist(x + 0.5f, y + 0.5f);
    return bd > 0 ? C_BLACK : bd > -1 ? C_GRAY : (x >= sx0 && x < sx1 && y >= sy0 && y < sy1) ? C_SCREEN : C_DARK;
  };
  auto behind = [&](int x, int y) { float bd = boardDist(x + 0.5f, y + 0.5f); return bd < 0 ? 0.0f : bd > 1 ? 1.0f : bd; };
  hd::draw(g, hd::fit(side, tx, side < 0 ? b.x0 : b.x1, b.y1, scale), bg, behind);
}
// A small board: the screen with the pad at one side, Jump at the other, MENU top left, and two thumbs on them.
template <class G> void board(G& g, const Box& b, bool padRight, bool thumbs, bool labels) {
  int w = b.x1 - b.x0, h = b.y1 - b.y0;
  g.fillRoundRect(b.x0, b.y0, w, h, 8, C_DARK);
  g.drawRoundRect(b.x0, b.y0, w, h, 8, C_GRAY);
  int sx0 = b.x0 + w / 12, sy0 = b.y0 + h / 10, sx1 = b.x1 - w / 12, sy1 = b.y1 - h / 10;
  g.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0, C_SCREEN);
  int sw = sx1 - sx0, sh = sy1 - sy0, pr = sh * 26 / 100, jr = sh * 13 / 100;
  int pcx = padRight ? sx1 - pr - sw / 20 : sx0 + pr + sw / 20, pcy = sy1 - pr - sh / 14;
  int jcx = padRight ? sx0 + jr + sw / 14 : sx1 - jr - sw / 14, jcy = sy1 - jr - sh / 10;
  g.drawCircle(pcx, pcy, pr, C_WHITE);
  g.drawCircle(pcx, pcy, pr / 3, C_WHITE);
  int a = pr * 2 / 3, s = pr / 5 + 2;
  struct Pen { G& g; void drawTriangle(int p, int q, int r, int t, int u, int v, uint16_t k) { g.drawLine(p, q, r, t, k); g.drawLine(r, t, u, v, k); g.drawLine(u, v, p, q, k); }
               void fillTriangle(int p, int q, int r, int t, int u, int v, uint16_t k) { g.fillTriangle(p, q, r, t, u, v, k); } } pen{g};
  paddraw::arrow(pen, pcx - a, pcy, 0, s, false);
  paddraw::arrow(pen, pcx + a, pcy, 1, s, false);
  paddraw::arrow(pen, pcx, pcy - a, 2, s, false);
  paddraw::arrow(pen, pcx, pcy + a, 3, s, false);
  g.fillCircle(jcx, jcy, jr, C_DARK);
  g.drawCircle(jcx, jcy, jr, C_WHITE);
  int mw = sw / 7 > 28 ? sw / 7 : 28, mh = sh / 7 > 12 ? sh / 7 : 12;  // wide enough for "MENU" in the 6 x 8 font
  g.fillRoundRect(sx0 + 3, sy0 + 3, mw, mh, 3, C_DARK);
  g.drawRoundRect(sx0 + 3, sy0 + 3, mw, mh, 3, C_WHITE);
  if (thumbs) {  // each hand holds the board's lower corner on its side; its thumb rests on the pad or on Jump
    // the pad's hand sets the size (its fingers flush with the board's edge); Jump is nearer its edge, so its hand is a tenth smaller and
    // turned a little, the thumbnail on the inner half of Jump
    const float sp = hd::flushScale((float)(padRight ? b.x1 - pcx : pcx - b.x0));
    hand(g, b, padRight ? 1 : -1, pcx, sp);
    hand(g, b, padRight ? -1 : 1, padRight ? jcx + jr / 2 : jcx - jr / 2, sp * 0.9f);
  }
  if (labels) {
    g.setTextSize(1);
    g.setTextColor(C_WHITE, C_DARK);
    g.setTextDatum(textdatum_t::middle_center);
    g.drawString("MENU", sx0 + 3 + mw / 2, sy0 + 3 + mh / 2);
    g.setTextDatum(textdatum_t::top_left);
  }
}
template <class G> void title(G& g, const char* t) {
  g.setTextSize(TITLE);
  g.setTextColor(C_WHITE, C_BLACK);
  g.setCursor(scr::SMALL ? 8 : 12, scr::SMALL ? 10 : 16);
  g.print(t);
  g.fillRect(0, scr::SMALL ? 32 : 46, W, 2, C_BLUE);
}
// Card 1: How to hold it.
template <class G> void howTo(G& g) {
  g.fillScreen(C_BLACK);
  title(g, "How to hold it");
  Box pic = scr::SMALL ? Box{18, 42, 158, 128} : Box{26, 60, 236, 190};
  const int hm = scr::SMALL ? 22 : 32;  // room beside the board for the two hands
  board(g, {pic.x0 + hm, pic.y0, pic.x1 - hm, pic.y1 - (scr::SMALL ? 12 : 20)}, false, true, true);
  int tx = pic.x1 + (scr::SMALL ? 10 : 16), cols = (int)((W - tx - 6) / (6 * TEXT)), y = pic.y0;
  struct L { const char* t; uint16_t c; } lines[] = {
      {"Left thumb on the pad: slide it to walk, climb and duck.", C_WHITE},
      {"Right thumb on Jump.", C_WHITE},
      {"MENU pauses: Resume, How to play and Settings.", C_WHITE},
  };
  for (auto& l : lines) {
    st::wrapped(g, tx, y, l.t, cols, 4, TEXT, l.c);
    int n = (int)strlen(l.t), rows = (n + cols - 1) / cols;
    y += rows * ((int)(8 * TEXT) + 3) + (scr::SMALL ? 8 : 12);
  }
  st::wrapped(g, 8, pic.y1 + (scr::SMALL ? 34 : 50), "Left-handed? The next page puts the pad on the right.", scr::SMALL ? 32 : 30, 2, TEXT, C_GRAY);
  Box n = nextBox();
  ovl::button(g, n.x0, n.y0, n.x1, n.y1, "Next", false, C_BLUE, 2);
}
// Card 2: Pick your hand. `sel` lights a button (-1 none).
template <class G> void pickHand(G& g, int sel = -1) {
  g.fillScreen(C_BLACK);
  title(g, "Pick your hand");
  for (int k = 0; k < 2; k++) {
    Box b = handBox(k);
    bool on = sel == k;
    g.fillRoundRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, 8, on ? C_YELLOW : C_DARK);
    g.drawRoundRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, 8, C_WHITE);
    int m = scr::SMALL ? 10 : 16, ph = (b.x1 - b.x0 - 2 * m) * 2 / 3;
    board(g, {b.x0 + m, b.y0 + m, b.x1 - m, b.y0 + m + ph}, k == 1, false, false);
    uint16_t fg = on ? C_BLACK : C_WHITE, bg = on ? C_YELLOW : C_DARK;
    g.setTextDatum(textdatum_t::middle_center);
    g.setTextSize(2);
    g.setTextColor(fg, bg);
    int ty = b.y0 + m + ph + (b.y1 - (b.y0 + m + ph)) / 3;
    g.drawString(k ? "Pad right" : "Pad left", (b.x0 + b.x1) / 2, ty);
    g.setTextSize(scr::SMALL ? 1.0f : 1.5f);
    g.setTextColor(on ? C_BLACK : C_GRAY, bg);
    g.drawString(k ? "left-handed" : "right-handed", (b.x0 + b.x1) / 2, ty + (scr::SMALL ? 18 : 26));
    g.setTextDatum(textdatum_t::top_left);
  }
}
// Card 3: the playground. `L` is the controls model's layout (its pad where the thumb is), `look` its ctl::Look, `held` the keys
// pressed (st::heldText's bits). `full` paints the whole screen; otherwise only the old pad's square `old` is cleared first.
template <class G> void playground(G& g, const ctl::Layout& L, const ctl::Need& nd, uint8_t dirs, uint8_t btn, uint8_t held, int look, bool floatPad,
                                   bool full, const ctl::Disc& old, bd::Buddy* buddy = nullptr) {
  if (full) {
    g.fillScreen(C_BLACK);
    g.fillRect(0, 0, W, scr::VIEW_H, C_FIELD);
  } else g.fillRect(old.cx - old.r - 2, old.cy - old.r - 2, 2 * old.r + 5, 2 * old.r + 5, C_FIELD);
  g.fillRect(0, scr::VIEW_H, W, H - scr::VIEW_H, C_BLACK);  // the strip below the field: what is pressed
  g.setTextSize(TEXT);
  g.setTextColor(C_WHITE, C_FIELD);
  const int cw = (int)(6 * TEXT), lh = (int)(8 * TEXT) + 4;
  int tx = L.zone.x0 == 0 ? W - cw * 20 - 6 : 6;  // the hint sits over Jump's side, clear of the pad
  g.setCursor(tx, scr::SMALL ? 50 : 76);
  g.print("Try the controls:");
  g.setCursor(tx, (scr::SMALL ? 50 : 76) + lh);
  g.print("each key lights up.");
  if (floatPad && look == ctl::LOOK_OFF) {  // the floating pad: where a thumb may land
    const ctl::Rect& z = L.zone;
    for (int x = z.x0 + 3; x < z.x1 - 3; x += 4) { g.drawPixel(x, z.y0 + 3, C_GRAY); g.drawPixel(x, z.y1 - 4, C_GRAY); }
    for (int y = z.y0 + 3; y < z.y1 - 3; y += 4) { g.drawPixel(z.x0 + 3, y, C_GRAY); g.drawPixel(z.x1 - 4, y, C_GRAY); }
    g.setTextDatum(textdatum_t::middle_center);
    g.setTextColor(C_WHITE, C_FIELD);
    g.drawString("Thumb here", (z.x0 + z.x1) / 2, (z.y0 + z.y1) / 2);
    g.setTextDatum(textdatum_t::top_left);
  } else {
    struct Pen {
      G& g;
      void drawCircle(int x, int y, int r, uint16_t c) { g.drawCircle(x, y, r, c); }
      void drawPixel(int x, int y, uint16_t c) { g.drawPixel(x, y, c); }
      void fillTriangle(int a, int b, int c, int d, int e, int f, uint16_t k) { g.fillTriangle(a, b, c, d, e, f, k); }
      void drawTriangle(int a, int b, int c, int d, int e, int f, uint16_t k) { g.drawLine(a, b, c, d, k); g.drawLine(c, d, e, f, k); g.drawLine(e, f, a, b, k); }
    } pen{g};
    paddraw::pad(pen, L, nd, dirs);
  }
  {  // Jump
    const ctl::Disc& d = L.space;
    bool lit = btn & 1;
    g.fillCircle(d.cx, d.cy, d.r, lit ? C_YELLOW : C_DARK);
    g.drawCircle(d.cx, d.cy, d.r + 1, C_BLACK);
    g.drawCircle(d.cx, d.cy, d.r, C_WHITE);
    g.setTextDatum(textdatum_t::middle_center);
    g.setTextSize(scr::SMALL ? 1.0f : 1.5f);
    g.setTextColor(lit ? C_BLACK : C_WHITE, lit ? C_YELLOW : C_DARK);
    g.drawString("Jump", d.cx, d.cy);
    g.setTextDatum(textdatum_t::top_left);
  }
  Box dn = doneBox();
  ovl::button(g, dn.x0, dn.y0, dn.x1, dn.y1, "Done", false, C_BLUE, 2);
  char t[48];
  if (held) {
    char k[40];
    st::heldText(held, k, sizeof k);
    snprintf(t, sizeof t, "%s", k);
  } else snprintf(t, sizeof t, floatPad ? "Put a thumb down on the pad's side" : "Touch the pad or Jump");
  g.setTextSize(scr::SMALL && held ? 2.0f : TEXT);
  g.setTextColor(held ? C_YELLOW : C_GRAY, C_BLACK);
  g.setTextDatum(textdatum_t::middle_center);
  g.drawString(t, W / 2, scr::VIEW_H + (H - scr::VIEW_H) / 2);
  if (buddy && full) { buddy->drawn = {0, 0, -1, -1}; bd::paint(g, *buddy, C_FIELD); }
  g.setTextDatum(textdatum_t::top_left);
}
}  // namespace fr
