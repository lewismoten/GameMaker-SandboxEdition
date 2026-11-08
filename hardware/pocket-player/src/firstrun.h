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
// A hand holding the board's side, seen from the front, as a smooth pictogram: the thumb (the hero) curves over the glass to
// (tx, ty) with a small nail; the palm and the curl of the index finger show at the board's edge; a plain cuff below. `side` -1 is
// the left hand (beside the board's left edge), +1 the right, a mirror image. Every shape is a distance field (capsules), drawn
// per pixel: an even dark-brown outline, a flat skin fill with one darker shade on the side away from the light, two small
// highlights, and edges blended against what is behind them (the table, the bezel or the screen) so they are smooth.
namespace hands {
struct Seg { float ax, ay, bx, by, ra, rb; };
inline float segDist(const Seg& s, float px, float py) {  // distance to a tapered capsule (negative inside)
  float vx = s.bx - s.ax, vy = s.by - s.ay, wx = px - s.ax, wy = py - s.ay, l2 = vx * vx + vy * vy;
  float t = l2 > 0 ? (wx * vx + wy * vy) / l2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  float dx = wx - vx * t, dy = wy - vy * t;
  return __builtin_sqrtf(dx * dx + dy * dy) - (s.ra + (s.rb - s.ra) * t);
}
inline float fieldDist(const Seg* s, int n, float px, float py) {
  float d = 1e9f;
  for (int i = 0; i < n; i++) { float e = segDist(s[i], px, py); if (e < d) d = e; }
  return d;
}
inline float cover(float d) { float c = 0.5f - d; return c < 0 ? 0 : c > 1 ? 1 : c; }  // pixel coverage from a signed distance
inline uint16_t mix(uint16_t a, uint16_t b, float t) {  // RGB565 blend, t of b
  int ar = a >> 11, ag = (a >> 5) & 63, ab = a & 31, br = b >> 11, bg = (b >> 5) & 63, bb = b & 31;
  int r = ar + (int)((br - ar) * t + (br > ar ? 0.5f : -0.5f)), gg = ag + (int)((bg - ag) * t + (bg > ag ? 0.5f : -0.5f)),
      bl = ab + (int)((bb - ab) * t + (bb > ab ? 0.5f : -0.5f));
  return (uint16_t)((r << 11) | (gg << 5) | bl);
}
constexpr uint16_t LINE = 0x5163, SKIN = 0xE5B1, SHADE = 0xCCAD, LIGHT = 0xFF18, NAIL = 0xF6D7, CUFF = 0x3A9C, CUFF_D = 0x2A14;
}  // namespace hands
template <class G> void hand(G& g, const Box& b, int side, int tx, int ty, int wid) {
  using namespace hands;
  const float u = (float)wid, ow = scr::SMALL ? 1.4f : 2.0f;
  const float in = (float)-side;  // +1 toward the board's inside
  const float xe = (float)(side < 0 ? b.x0 : b.x1), y1 = (float)b.y1;
  auto X = [&](float lx) { return xe + in * lx * u; };  // local (toward the board, down from its bottom edge) in units of u
  auto Y = [&](float ly) { return y1 + ly * u; };
  // The grip: the side of the hand and the curl of the fingers are ONE shape wrapping the board's side edge (the board covers the
  // part behind it), narrower at the top (the fingers) and wider at the palm; two short creases mark the fingers. The wrist runs
  // down and outward from it. The thumb is one smooth taper from the palm to a rounded tip, with a gentle bend.
  Seg body[3], thumb[9];
  body[0] = {X(-0.1f), Y(-1.8f), X(-0.35f), Y(-0.4f), u * 0.5f, u * 0.7f};  // the fingers' curl and the side of the hand
  body[1] = {X(-0.35f), Y(-0.4f), X(-0.8f), Y(0.7f), u * 0.7f, u * 0.82f};     // widening into the palm
  body[2] = {X(-0.8f), Y(0.7f), X(-1.2f), Y(1.6f), u * 0.76f, u * 0.7f};       // the wrist, down and outward
  float p0x = X(-0.3f), p0y = Y(0.1f), p2x = (float)tx, p2y = (float)ty;
  float cx = p2x - p0x, cy = p2y - p0y, cl = __builtin_sqrtf(cx * cx + cy * cy);
  float nx = -cy / cl, ny = cx / cl;
  if (ny > 0) { nx = -nx; ny = -ny; }  // the thumb arches up, a gentle bend
  float p1x = (p0x + p2x) / 2 + nx * cl * 0.1f, p1y = (p0y + p2y) / 2 + ny * cl * 0.1f;
  float prx = p0x, pry = p0y;
  const int nThumb = 8;
  for (int i = 1; i <= nThumb; i++) {
    float t = (float)i / nThumb, a = (1 - t) * (1 - t), bq = 2 * (1 - t) * t, c = t * t;
    float qx = a * p0x + bq * p1x + c * p2x, qy = a * p0y + bq * p1y + c * p2y;
    float r0 = 0.82f - 0.34f * (i - 1) / nThumb, r1 = 0.82f - 0.34f * i / nThumb;  // one even taper to a rounded tip
    thumb[i - 1] = {prx, pry, qx, qy, u * r0, u * r1};
    prx = qx; pry = qy;
  }
  thumb[8] = {p2x, p2y, p2x, p2y, u * 0.48f, u * 0.48f};
  const int nT = 9;
  // the cuff: a plain band across the wrist's end, turned to follow it
  float wcx = X(-1.2f), wcy = Y(1.6f), wvx = X(-1.2f) - X(-0.8f), wvy = Y(1.6f) - Y(0.7f), wl = __builtin_sqrtf(wvx * wvx + wvy * wvy);
  wvx /= wl; wvy /= wl;
  const float ccx = wcx + wvx * u * 0.45f, ccy = wcy + wvy * u * 0.45f, chw = u * 0.88f, chh = u * 0.45f;
  float tdx = p2x - p1x, tdy = p2y - p1y, tdl = __builtin_sqrtf(tdx * tdx + tdy * tdy);
  const float ux = tdx / tdl, uy = tdy / tdl;
  const float lx = in * -0.45f, ly = -0.89f;  // toward the light (above, and toward the board)
  const float sd = u * 0.32f;
  const float nxc = p2x - ux * u * 0.3f, nyc = p2y - uy * u * 0.3f;
  auto covered = [&](float px, float py) { return px >= b.x0 && px < b.x1 && py >= b.y0 && py < b.y1; };
  auto field = [&](float px, float py) {  // the whole hand: the thumb on top; the rest only where the board does not cover it
    float d = fieldDist(thumb, nT, px, py);
    if (!covered(px, py)) { float e = fieldDist(body, 3, px, py); d = d < e ? d : e; }
    return d;
  };
  float x0 = 1e9f, x1 = -1e9f, y0 = 1e9f, y2 = -1e9f;
  auto grow = [&](const Seg& q) {
    float r = (q.ra > q.rb ? q.ra : q.rb) + ow + 2;
    float lo = (q.ax < q.bx ? q.ax : q.bx) - r, hi = (q.ax < q.bx ? q.bx : q.ax) + r, to = (q.ay < q.by ? q.ay : q.by) - r, bo = (q.ay < q.by ? q.by : q.ay) + r;
    if (lo < x0) x0 = lo;
    if (hi > x1) x1 = hi;
    if (to < y0) y0 = to;
    if (bo > y2) y2 = bo;
  };
  for (const Seg& q : body) grow(q);
  for (const Seg& q : thumb) grow(q);
  { float r = chw + chh + ow + 2;
    if (ccx - r < x0) x0 = ccx - r;
    if (ccx + r > x1) x1 = ccx + r;
    if (ccy + r > y2) y2 = ccy + r; }
  const int bw = b.x1 - b.x0, bh = b.y1 - b.y0, sx0 = b.x0 + bw / 12, sy0 = b.y0 + bh / 10, sx1 = b.x1 - bw / 12, sy1 = b.y1 - bh / 10;
  for (int y = (int)y0; y <= (int)y2; y++)
    for (int x = (int)x0; x <= (int)x1; x++) {
      float px = x + 0.5f, py = y + 0.5f;
      uint16_t col = (x >= sx0 && x < sx1 && y >= sy0 && y < sy1) ? C_SCREEN : (x >= b.x0 && x < b.x1 && y >= b.y0 && y < b.y1) ? C_DARK : C_BLACK;
      bool any = false;
      float rx = px - ccx, ry = py - ccy, ca = rx * wvx + ry * wvy, cb = -rx * wvy + ry * wvx;  // the cuff's own axes
      float ax0 = __builtin_fabsf(cb) - chw, ay0 = __builtin_fabsf(ca) - chh, dc = ax0 > ay0 ? ax0 : ay0;
      if (dc < ow + 1 && !covered(px, py)) {
        col = mix(col, LINE, cover(dc - ow));
        col = mix(col, CUFF, cover(dc));
        any = true;
      }
      float d = field(px, py);
      if (d < ow + 1) {
        col = mix(col, LINE, cover(d - ow));
        float sh = field(px - lx * sd, py - ly * sd);
        uint16_t fill = SKIN;
        if (d < 0 && sh > -0.5f) fill = mix(SKIN, SHADE, cover(sh));
        bool onThumb = fieldDist(thumb, nT, px, py) < 0.5f;
        col = mix(col, fill, cover(d));
        if (d < -ow * 0.5f && onThumb) {
          float hx = px - (p1x - ux * u * 0.1f + lx * u * 0.25f), hy = py - (p1y - uy * u * 0.1f + ly * u * 0.25f);
          col = mix(col, LIGHT, cover(__builtin_sqrtf(hx * hx + hy * hy) - u * 0.12f) * 0.9f);
          // the nail: a small pale oval just behind the tip, rimmed in the outline color
          float nx2 = px - nxc, ny2 = py - nyc, na = nx2 * ux + ny2 * uy, nb = -nx2 * uy + ny2 * ux;
          float nd = (__builtin_sqrtf(na * na / (u * 0.26f * u * 0.26f) + nb * nb / (u * 0.3f * u * 0.3f)) - 1.0f) * u * 0.27f;
          col = mix(col, LINE, cover(nd - 0.9f) * 0.85f);
          col = mix(col, NAIL, cover(nd));
        } else if (d < -ow * 0.5f && !onThumb) {
          // two short finger creases running in from the side edge, and a highlight on the curl
          for (int k = 0; k < 2; k++) {
            float cyk = Y(-1.35f + 0.7f * k), dxk = (px - X(-0.7f)) * in;  // inward distance from the outer side
            if (dxk > 0 && dxk < u * 0.55f) col = mix(col, LINE, cover(__builtin_fabsf(py - cyk) - 0.4f) * 0.7f);
          }
          float kx = px - X(-0.45f), ky = py - Y(-1.55f);
          col = mix(col, LIGHT, cover(__builtin_sqrtf(kx * kx + ky * ky * 0.6f) - u * 0.1f) * 0.8f);
        }
        any = true;
      }
      if (any) g.drawPixel(x, y, col);
    }
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
    int wid = sh * 22 / 100;
    hand(g, b, padRight ? 1 : -1, pcx, pcy + pr / 8, wid);
    hand(g, b, padRight ? -1 : 1, jcx, jcy + jr / 3, wid);
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
