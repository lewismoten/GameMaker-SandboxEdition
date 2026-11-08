// Mac test and renders for the first run (src/firstrun.h): the flow (How to hold it, Pick your hand, the playground, Done; and
// the playground alone from Settings), its buttons (at least 32 x 32 on the 2.8 inch board and 44 x 44 on the 3.5 inch, on
// screen, found by the hit table, Done clear of the pad, its floating zones and Jump for both hands), and renders of every card
// and the playground fixed and floating, idle and touched, through the real controls model (src/controls.h).
//   firstruntest [out dir]      build with -lz; add -DPOCKET_CYD28 for the 320 x 240 board. PNGs: firstrun-<w>-<name>.png
#include <stdio.h>
#include <string>
#include <vector>
namespace textdatum_t { constexpr int middle_center = 4, top_left = 0; }
#include "canvas.h"
#include "firstrun.h"

static int failures = 0, checks = 0;
static void expect(bool ok, const std::string& m) { checks++; if (!ok) { printf("FAIL  %s\n", m.c_str()); failures++; } }
static void save(const std::string& dir, const std::string& name, const Canvas& c) {
  if (!dir.empty()) writePng(dir + "/firstrun-" + (scr::SMALL ? "320" : "480") + "-" + name + ".png", c.W, c.H, rgbOf(c));
}
static int cxOf(const fr::Box& b) { return (b.x0 + b.x1) / 2; }
static int cyOf(const fr::Box& b) { return (b.y0 + b.y1) / 2; }

// The playground as main.cpp drives it: touches through the controls model, the keys it sends named.
struct Play {
  ctl::Controls c;
  uint8_t held = 0;
  bd::Buddy buddy;
  uint32_t now = 1000;
  Play(const ctl::Settings& s) { c.configure(s, fr::playNeed()); }
  void touch(int x, int y, int ms) {
    int id = 1, sz = 30;
    for (int t = 0; t < ms; t += 8) { now += 8; c.update(&id, &x, &y, &sz, 1, now); flush(); buddy.tick(held, now); }
  }
  void lift(int ms) { for (int t = 0; t < ms; t += 8) { now += 8; c.update(nullptr, nullptr, nullptr, nullptr, 0, now); flush(); buddy.tick(held, now); } }
  void flush() {
    ctl::Change ch[16];
    int n = c.flush(ch, 16);
    for (int i = 0; i < n; i++) {
      int s = ch[i].scan;
      uint8_t bit = s == ctl::S_LEFT ? 1 : s == ctl::S_RIGHT ? 2 : s == ctl::S_UP ? 4 : s == ctl::S_DOWN ? 8 : s == ctl::S_SPACE ? 16 : 0;
      if (ch[i].down) held |= bit; else held &= ~bit;
    }
  }
  Canvas draw() {
    Canvas g(scr::W, scr::H);
    fr::playground(g, c.L, c.need, c.padDirs, c.btnDown, held, c.padLook(now), c.set.floatPad, true, c.L.pad, &buddy);
    return g;
  }
};

int main(int argc, char** argv) {
  std::string dir = argc > 1 ? argv[1] : "";
  const int MIN = scr::SMALL ? 32 : 44;
  // The flow.
  {
    fr::Flow f;
    f.start(false);
    expect(f.step == fr::HOWTO, "a first run opens on How to hold it");
    expect(!f.apply(fr::T_DONE) && f.step == fr::HOWTO, "How to hold it ignores taps off Next");
    expect(f.apply(fr::hit(f.step, cxOf(fr::nextBox()), cyOf(fr::nextBox()))) && f.step == fr::HAND, "Next opens Pick your hand");
    expect(!f.apply(fr::hit(f.step, 2, 2)) && f.step == fr::HAND, "Pick your hand waits for a hand");
    expect(f.apply(fr::hit(f.step, cxOf(fr::handBox(1)), cyOf(fr::handBox(1)))) && f.step == fr::PLAY && f.lefty == 1 && f.chose,
           "Pad right picks left-handed and opens the playground");
    expect(!f.marksDone(), "nothing is marked before Done");
    expect(f.apply(fr::hit(f.step, cxOf(fr::doneBox()), cyOf(fr::doneBox()))) && f.step == fr::FINISHED && f.marksDone(), "Done finishes and marks the first run");
    fr::Flow g;
    g.start(false);
    g.apply(fr::T_NEXT);
    g.apply(fr::hit(g.step, cxOf(fr::handBox(0)), cyOf(fr::handBox(0))));
    expect(g.step == fr::PLAY && g.lefty == 0, "Pad left picks right-handed");
    fr::Flow s;
    s.start(true);
    expect(s.step == fr::PLAY && !s.chose, "from Settings the playground opens alone");
    s.apply(fr::T_DONE);
    expect(s.step == fr::FINISHED && !s.marksDone(), "Done from Settings goes back without marking the first run");
  }
  // The buttons: big enough, on screen, apart; Done clear of the pad (home and floating zone) and Jump for both hands.
  {
    std::vector<fr::Box> all = {fr::nextBox(), fr::handBox(0), fr::handBox(1), fr::doneBox()};
    for (auto& b : all) {
      expect(b.x1 - b.x0 >= MIN && b.y1 - b.y0 >= MIN, "a first-run button is under the minimum size");
      expect(b.x0 >= 0 && b.y0 >= 0 && b.x1 <= scr::W && b.y1 <= scr::H, "a first-run button is off screen");
    }
    expect(fr::handBox(0).x1 <= fr::handBox(1).x0, "the two hand buttons overlap");
    for (int lefty : {0, 1}) {
      ctl::Settings s;
      s.lefty = (uint8_t)lefty;
      ctl::Layout L = ctl::makeLayout(s, fr::playNeed());
      fr::Box d = fr::doneBox();
      auto clearOf = [&](const ctl::Disc& c, int slop) {
        int nx = c.cx < d.x0 ? d.x0 : c.cx >= d.x1 ? d.x1 - 1 : c.cx, ny = c.cy < d.y0 ? d.y0 : c.cy >= d.y1 ? d.y1 - 1 : c.cy;
        int dx = nx - c.cx, dy = ny - c.cy, r = c.r + slop;
        return dx * dx + dy * dy > r * r;
      };
      expect(clearOf(L.home, 14) && clearOf(L.space, 8), "Done is under the pad or Jump");
      expect(d.x1 <= L.zone.x0 || d.x0 >= L.zone.x1, "Done is in the floating pad's zone");
      expect(fr::hit(fr::PLAY, L.home.cx, L.home.cy) == fr::T_NONE, "the pad's middle is taken as Done");
    }
  }
  // The SVG hand (src/handshape.h from art/hand-left.svg): its shapes in draw order, the thumbnail on the pad and on Jump, a mirror.
  {
    expect(hs::SHAPES == 11 && hs::shapes[0].role == hs::CUFF && hs::shapes[hs::SHAPES - 1].role == hs::HIGHLIGHT, "the hand's shapes: cuff first, highlight last");
    bool order = true;
    int fingers = 0;
    for (int i = 0; i < hs::SHAPES; i++) {
      if (hs::shapes[i].behind) fingers++;
      if (hs::shapes[i].behind && i > 0 && !hs::shapes[i - 1].behind && i != 1) order = false;  // the fingers are one run after the cuff
      if (hs::shapes[i].role == hs::SKIN && !hs::shapes[i].behind) order = order && i > 4;       // the palm and thumb come after them
    }
    expect(order && fingers == 5, "the curled fingers draw first, the palm and thumb over them");
    expect(hs::shapes[9].role == hs::NAIL && hs::shapes[9].stroke == 2 && hs::shapes[8].role == hs::CREASE, "the creases, then the nail with its own stroke");
    bool inRange = hs::POINTS > 300 && hs::POINTS < 700;
    for (int i = 0; i < hs::POINTS; i++) inRange = inRange && hs::pts[2 * i] >= 0 && hs::pts[2 * i] < 1024 && hs::pts[2 * i + 1] >= 0 && hs::pts[2 * i + 1] < 1024;
    expect(inRange, "the hand's points are a few hundred, inside the 1024 square");
    // measured on the render: the palm's vertical outline (where each hand goes behind the device) sits just outside the board's gray
    // border line, covering none of it, for the right-handed and left-handed layouts
    const fr::Box pic = scr::SMALL ? fr::Box{40, 42, 136, 116} : fr::Box{58, 60, 204, 170};
    for (bool padRight : {false, true}) {
      Canvas c(scr::W, scr::H), plain(scr::W, scr::H);
      c.fillScreen(0);
      plain.fillScreen(0);
      fr::board(c, pic, padRight, true, false);
      fr::board(plain, pic, padRight, false, false);
      const int w = pic.x1 - pic.x0, h = pic.y1 - pic.y0, sx0 = pic.x0 + w / 12, sy1 = pic.y1 - h / 10, sy0 = pic.y0 + h / 10;
      const int sw = (pic.x1 - w / 12) - sx0, shh = sy1 - sy0, pr = shh * 26 / 100;
      const int pcx = padRight ? pic.x1 - w / 12 - pr - sw / 20 : sx0 + pr + sw / 20, D = padRight ? pic.x1 - pcx : pcx - pic.x0;
      const float sp = hd::flushScale((float)D);
      printf("hands %s layout:", padRight ? "left-handed" : "right-handed");
      for (int side : {-1, 1}) {
        hd::Place p = hd::fit(side, side < 0 ? pic.x0 + D : pic.x1 - D, pic.y1, sp);
        const int bx = side < 0 ? pic.x0 : pic.x1 - 1, y0 = (int)hd::segTop(p) + 2, y1 = (int)hd::segBottom(p) - 2;
        int dark = side < 0 ? -9999 : 9999;  // the segment's dark pixel nearest the border
        bool intact = true;
        for (int y = y0; y <= y1; y++) {
          intact = intact && c.px[y * scr::W + bx] == plain.px[y * scr::W + bx];  // the gray border pixel is untouched
          for (int x = bx - 15; x <= bx + 15; x++)
            if (c.px[y * scr::W + x] == hd::LINE && (side < 0 ? x < bx && x > dark : x > bx && x < dark)) dark = x;
        }
        printf(" %s border x %d, outline's nearest dark pixel x %d (rows %d-%d);", side < 0 ? "left" : "right", bx, dark, y0, y1);
        expect(intact, "the hand covers none of the board's border along the palm outline");
        expect(side < 0 ? dark == bx - 1 : dark == bx + 1, "the palm outline sits just outside the border, no gap and no overlap");
      }
      printf("\n");
      // the thumbnails (their nails) rest on the glass, one on each half of the picture
      Canvas d(scr::W, scr::H);
      d.fillScreen(0);
      fr::board(d, pic, padRight, true, false);
      const int sx1 = pic.x1 - (pic.x1 - pic.x0) / 12, mid = (pic.x0 + pic.x1) / 2;
      int nl = 0, nr = 0;
      for (int y = sy0; y < sy1; y++)
        for (int x = sx0; x < sx1; x++)
          if (d.px[y * scr::W + x] == hd::NAIL) (x < mid ? nl : nr)++;
      expect(nl > 8 && nr > 8, "a thumbnail rests on the glass on each side of the picture");
    }
    // the hands keep clear of the caption and of Next (their bounding boxes, measured on the render), in both layouts, and all on screen
    for (bool padRight : {false, true}) {
      Canvas c(scr::W, scr::H);
      c.fillScreen(0);
      fr::board(c, fr::howToBoard(), padRight, true, false);
      int x0 = 9999, y0 = 9999, x1 = -1, y1 = -1;
      for (int y = 0; y < scr::H; y++)
        for (int x = 0; x < scr::W; x++)
          if (c.px[y * scr::W + x]) { x0 = x < x0 ? x : x0; x1 = x > x1 ? x : x1; y0 = y < y0 ? y : y0; y1 = y > y1 ? y : y1; }
      auto hit = [&](const fr::Box& b) { return !(x1 < b.x0 || x0 >= b.x1 || y1 < b.y0 || y0 >= b.y1); };
      printf("hands bbox (%s layout) y %d..%d; caption y %d..%d\n", padRight ? "left-handed" : "right-handed", y0, y1, fr::captionBox().y0, fr::captionBox().y1);
      expect(!hit(fr::captionBox()) && !hit(fr::nextBox()), "the hands touch neither the caption nor Next");
      expect(fr::captionBox().y1 <= scr::H && fr::captionBox().x1 <= fr::nextBox().x0 + 1, "the caption is on screen and clear of Next");
    }
    // the mirror: the same hand drawn for the right is the left one flipped about the thumbnail's column
    Canvas l(scr::W, scr::H), r(scr::W, scr::H);
    l.fillScreen(0);
    r.fillScreen(0);
    auto none = [](int, int) -> uint16_t { return 0; };
    auto all = [](int, int) { return 1.0f; };
    const int cx = scr::W / 2;
    hd::draw(l, hd::fit(-1, cx, pic.y1, hd::flushScale(50)), none, all);
    hd::draw(r, hd::fit(1, cx, pic.y1, hd::flushScale(50)), none, all);
    int diff = 0, lit = 0;
    for (int y = 0; y < scr::H; y++)
      for (int x = 0; x < scr::W; x++) {
        int mx = 2 * cx - 1 - x;
        if (mx < 0 || mx >= scr::W) continue;
        if (l.px[y * scr::W + x] != 0) lit++;
        if ((l.px[y * scr::W + x] != 0) != (r.px[y * scr::W + mx] != 0)) diff++;
      }
    expect(lit > 2000 && diff < lit / 50, "the right hand is the left one mirrored");
  }
  // Renders.
  {
    Canvas c(scr::W, scr::H);
    fr::howTo(c);
    save(dir, "1-howto", c);
    Canvas lh(scr::W, scr::H);  // the left-handed layout of the how-to picture (pad on the right): the hands mirror
    lh.fillScreen(fr::C_BLACK);
    fr::board(lh, scr::SMALL ? fr::Box{40, 42, 136, 116} : fr::Box{58, 60, 204, 170}, true, true, true);
    save(dir, "1-howto-lefty-board", lh);
    Canvas h(scr::W, scr::H);
    fr::pickHand(h);
    save(dir, "2-hand", h);
    Canvas hs(scr::W, scr::H);
    fr::pickHand(hs, 1);
    save(dir, "2-hand-picked", hs);
    for (int lefty : {0, 1}) {
      const char* nm = lefty ? "left" : "right";
      ctl::Settings s;
      s.lefty = (uint8_t)lefty;
      Play idle(s);
      save(dir, std::string("3-play-") + nm, idle.draw());
      Play p(s);
      const ctl::Disc pad = p.c.L.pad;
      p.touch(pad.cx, pad.cy, 40);
      p.touch(pad.cx + pad.r / 2, pad.cy - pad.r / 2, 200);
      expect(p.held != 0, "a slide on the playground's pad pressed nothing");
      save(dir, std::string("3-play-") + nm + "-touch", p.draw());
      ctl::Settings fs = s;
      fs.floatPad = 1;
      Play fi(fs);
      save(dir, std::string("4-float-") + nm, fi.draw());
      Play fp(fs);
      int zx = (fp.c.L.zone.x0 + fp.c.L.zone.x1) / 2, zy = scr::VIEW_H / 2;
      fp.touch(zx, zy, 40);
      fp.touch(zx - fp.c.L.pad.r / 2, zy, 200);
      expect((fp.held & 1) && fp.c.L.pad.cx == zx, "the floating pad on the playground did not center on the thumb or press Left");
      save(dir, std::string("4-float-") + nm + "-touch", fp.draw());
    }
  }
  // The small character (src/buddy.h): state, then renders.
  {
    auto run = [](bd::Buddy& b, uint8_t held, int ms, uint32_t& now) { for (int t = 0; t < ms; t += 16) { now += 16; b.tick(held, now); } };
    uint32_t now = 1000;
    bd::Buddy b;
    run(b, 0, 2000, now);
    expect(b.x == 0 && b.y == 0 && b.face == bd::DOWN && b.lift() == 0, "an idle character stands in the center facing you");
    bool flipped = false;
    uint8_t f0 = b.frame;
    for (int t = 0; t < 600; t += 16) { now += 16; b.tick(2, now); if (b.frame != f0) flipped = true; }
    expect(b.x > 0 && b.face == bd::RIGHT && flipped, "Right walks the character right on two frames");
    run(b, 2, 3000, now);
    expect(b.x == bd::RX, "the character stops at the right edge of its play area");
    run(b, 1, 6000, now);
    expect(b.x == -bd::RX && b.face == bd::LEFT, "Left walks it to the left edge, facing left");
    run(b, 4, 2000, now);
    expect(b.y == -bd::RY && b.face == bd::UP, "Up turns it away and steps it up, within its area");
    run(b, 8, 2000, now);
    expect(b.y == bd::RY && b.face == bd::DOWN, "Down turns it toward you and steps it down, within its area");
    run(b, 0, 300, now);
    expect(b.x != 0, "the character waits a moment before going home");
    run(b, 0, 2500, now);
    expect(b.x == 0 && b.y == 0 && b.face == bd::DOWN && b.frame == 0, "the character returns to the center when idle");
    run(b, 16, 16, now);
    expect(b.hopMs >= 0, "Jump starts a hop");
    run(b, 16, 190, now);
    int peak = b.lift();
    expect(peak >= bd::HOP * 9 / 10 && peak <= bd::HOP, "the hop reaches its height mid-way");
    run(b, 0, 600, now);
    expect(b.hopMs < 0 && b.lift() == 0, "the hop ends on the ground");
    // Everything it can draw stays in the field, clear of the hint, the pad, Jump and Done, for both hands.
    const int lh = (int)(8 * fr::TEXT) + 4, hintBottom = (scr::SMALL ? 50 : 76) + 2 * lh;
    bd::Box a = bd::area();
    expect(a.x0 >= 0 && a.x1 < scr::W && a.y0 >= hintBottom && a.y1 < scr::VIEW_H, "the character's play area is off the field or over the hint");
    for (int lefty : {0, 1}) {
      ctl::Settings s;
      s.lefty = (uint8_t)lefty;
      ctl::Layout L = ctl::makeLayout(s, fr::playNeed());
      auto clear = [&](const ctl::Disc& d) {
        int nx = d.cx < a.x0 ? a.x0 : d.cx > a.x1 ? a.x1 : d.cx, ny = d.cy < a.y0 ? a.y0 : d.cy > a.y1 ? a.y1 : d.cy;
        return (nx - d.cx) * (nx - d.cx) + (ny - d.cy) * (ny - d.cy) > d.r * d.r;
      };
      expect(clear(L.pad) && clear(L.home) && clear(L.space), "the character's play area overlaps the pad or Jump");
      fr::Box dn = fr::doneBox();
      expect(a.x1 < dn.x0 || a.x0 > dn.x1 || a.y1 < dn.y0 || a.y0 > dn.y1, "the character's play area overlaps Done");
      // paint at the corners: the drawing stays inside the area
      for (int cx : {-bd::RX, bd::RX}) for (int cy : {-bd::RY, bd::RY}) {
        Canvas g(scr::W, scr::H);
        bd::Buddy c;
        c.x = cx; c.y = cy; c.hopMs = 210;
        bd::paint(g, c, fr::C_FIELD);
        expect(c.drawn.x0 >= a.x0 && c.drawn.x1 <= a.x1 && c.drawn.y0 >= a.y0 && c.drawn.y1 <= a.y1, "a painted character left its play area");
      }
    }
    // Renders: the center, then each key, at both hands' layout (right-handed here).
    struct Shot { const char* name; uint8_t held; int ms; };
    for (Shot sh : {Shot{"idle", 0, 0}, Shot{"right", 2, 330}, Shot{"right2", 2, 480}, Shot{"left", 1, 330}, Shot{"up", 4, 330}, Shot{"down", 8, 330}, Shot{"hop", 16, 210}}) {
      ctl::Settings s;
      Play p(s);
      uint32_t t = 1000;
      p.buddy.tick(0, t);
      for (int ms = 0; ms < sh.ms; ms += 16) { t += 16; p.buddy.tick(sh.held, t); }
      p.held = sh.held == 16 ? 16 : sh.held;
      save(dir, std::string("5-buddy-") + sh.name, p.draw());
    }
  }
  printf("firstruntest (%s): %s; %d checks\n", scr::SMALL ? "320" : "480", failures ? "FAILURES" : "passed", checks);
  return failures ? 1 : 0;
}
