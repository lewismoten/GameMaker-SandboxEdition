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
  uint32_t now = 1000;
  Play(const ctl::Settings& s) { c.configure(s, fr::playNeed()); }
  void touch(int x, int y, int ms) {
    int id = 1, sz = 30;
    for (int t = 0; t < ms; t += 8) { now += 8; c.update(&id, &x, &y, &sz, 1, now); flush(); }
  }
  void lift(int ms) { for (int t = 0; t < ms; t += 8) { now += 8; c.update(nullptr, nullptr, nullptr, nullptr, 0, now); flush(); } }
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
    fr::playground(g, c.L, c.need, c.padDirs, c.btnDown, held, c.padLook(now), c.set.floatPad, true, c.L.pad);
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
  // Renders.
  {
    Canvas c(scr::W, scr::H);
    fr::howTo(c);
    save(dir, "1-howto", c);
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
  printf("firstruntest (%s): %s; %d checks\n", scr::SMALL ? "320" : "480", failures ? "FAILURES" : "passed", checks);
  return failures ? 1 : 0;
}
