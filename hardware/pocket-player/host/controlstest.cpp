// Mac test for the touch controls model (src/controls.h): scripted touch events go in, the keys it
// presses come out, and each scenario says what must happen. Prints one line per scenario; exit 1 on a
// failure. Run by web/scripts/pocketControlsCheck.ts, or: c++ -std=c++17 -I../src controlstest.cpp && ./a.out
#include <stdio.h>
#include <string>
#include <vector>
#include "controls.h"

using namespace ctl;

struct Fail { std::string msg; };
static int failures = 0;

// A scripted touch session: contacts at times, keys seen as a log "+75 -75 ..." (+ press, - release).
struct Run {
  Controls c;
  uint32_t now = 1000;
  std::string log;
  bool held[128] = {};
  int ids[5], xs[5], ys[5], sz[5], n = 0;
  Run(const Settings& s, const Need& need) { c.configure(s, need); }
  void touch(int id, int x, int y, int size = 40) {
    for (int i = 0; i < n; i++) if (ids[i] == id) { xs[i] = x; ys[i] = y; sz[i] = size; return; }
    ids[n] = id; xs[n] = x; ys[n] = y; sz[n] = size; n++;
  }
  void up(int id) {
    for (int i = 0; i < n; i++) if (ids[i] == id) { for (int j = i; j + 1 < n; j++) { ids[j] = ids[j + 1]; xs[j] = xs[j + 1]; ys[j] = ys[j + 1]; sz[j] = sz[j + 1]; } n--; return; }
  }
  void wait(int ms) {  // polls every 8 ms, like the board
    for (int t = 0; t < ms; t += 8) { now += 8; poll(); }
  }
  void poll() {
    c.update(ids, xs, ys, sz, n, now);
    Change ch[16];
    int k = c.flush(ch, 16);
    for (int i = 0; i < k; i++) {
      held[ch[i].scan] = ch[i].down;
      log += (ch[i].down ? "+" : "-") + std::to_string(ch[i].scan) + " ";
    }
  }
};

static void check(const char* name, bool ok, const std::string& detail = "") {
  printf("%s  %s%s%s\n", ok ? "ok  " : "FAIL", name, ok ? "" : ": ", ok ? "" : detail.c_str());
  if (!ok) failures++;
}
static Need needs(bool l, bool r, bool u, bool d, bool sp, bool en, std::vector<int> extra = {}) {
  Need n;
  n.left = l; n.right = r; n.up = u; n.down = d; n.space = sp; n.enter = en;
  for (int e : extra) needAdd(n, e);
  return n;
}
static Need platformer() { return needs(true, true, true, true, true, false); }

int main() {
  Settings def;
  Layout L = makeLayout(def, platformer());
  int cx = L.pad.cx, cy = L.pad.cy;

  { Run r(def, platformer());  // sliding a held finger from the left side to the right side
    r.touch(1, cx - 50, cy); r.wait(100);
    for (int x = cx - 50; x <= cx + 50; x += 10) { r.touch(1, x, cy); r.wait(24); }
    r.wait(50);
    bool order = r.log.find("+75 ") != std::string::npos && r.log.find("-75 ") != std::string::npos && r.log.find("+77 ") != std::string::npos &&
                 r.log.find("-75 ") < r.log.find("+77 ");
    check("slide left to right: left is released before right is pressed", order, r.log);
    r.up(1); r.wait(400);
    check("lifting the finger releases right", !r.held[77], r.log); }

  { Run r(def, platformer());  // the dead zone
    r.touch(1, cx + 8, cy - 6); r.wait(200);
    check("a touch in the middle presses nothing", r.log.empty(), r.log); }

  { Run r(def, platformer());  // dead zone size: just outside
    r.touch(1, cx + def.dead * 0 + 30, cy); r.wait(100);
    check("just past the dead zone presses right", r.held[77], r.log); }

  { Run r(def, platformer());  // diagonal
    r.touch(1, cx + 44, cy - 44); r.wait(100);
    check("up and to the right holds both", r.held[77] && r.held[72], r.log); }

  { Run r(def, platformer());  // mostly level with a little up: only right
    r.touch(1, cx + 50, cy - 12); r.wait(100);
    check("a thumb slightly above level still only walks", r.held[77] && !r.held[72], r.log); }

  { Run r(def, platformer());  // hysteresis: jitter around the boundary doesn't flicker
    r.touch(1, cx + 50, cy - 18); r.wait(100);  // 20 degrees: level
    r.touch(1, cx + 50, cy - 29); r.wait(100);  // 30 degrees: inside the widened band, still level
    check("jitter near the diagonal boundary keeps the held sector", r.held[77] && !r.held[72], r.log); }

  { Run r(def, platformer());  // a held finger that slides off the pad keeps steering
    r.touch(1, cx + 40, cy); r.wait(60);
    r.touch(1, cx + 140, cy - 100); r.wait(60);
    check("a finger that began on the pad stays on it when it slides away", r.held[77], r.log); }

  { Run r(def, platformer());  // two fingers: run and jump
    r.touch(1, cx + 50, cy); r.wait(50);
    r.touch(2, L.space.cx, L.space.cy); r.wait(50);
    check("two fingers: run right and jump", r.held[77] && r.held[57], r.log);
    r.up(2); r.wait(300);
    check("lifting the jump finger keeps running", r.held[77] && !r.held[57], r.log); }

  { Run r(def, platformer());  // a quick tap
    r.touch(1, L.space.cx, L.space.cy); r.wait(24); r.up(1); r.wait(16);
    bool still = r.held[57];
    r.wait(300);
    check("a 24 ms tap on Space is held for three game ticks", still && !r.held[57], r.log); }

  { Run r(def, platformer());  // a finger on the edge of Space
    r.touch(1, L.space.cx + L.space.r + 5, L.space.cy); r.wait(50);
    check("Space takes a touch a little outside it", r.held[57], r.log); }

  { Run r(def, platformer());  // no Enter in this game
    r.touch(1, L.enter.cx, L.enter.cy); r.wait(100);
    check("a game without Enter has no Enter button", !r.held[28] && r.log.empty(), r.log); }

  { Run r(def, needs(true, true, false, false, true, true));  // Space and Enter together
    Layout l2 = makeLayout(def, needs(true, true, false, false, true, true));
    r.touch(1, l2.space.cx, l2.space.cy); r.touch(2, l2.enter.cx, l2.enter.cy); r.wait(60);
    check("Space and Enter at once", r.held[57] && r.held[28], r.log); }

  { Run r(def, needs(true, true, false, false, true, false));  // a game with only left and right
    r.touch(1, cx + 30, cy - 70); r.wait(100);
    check("a game without ladders: any touch on the right half is right", r.held[77] && !r.held[72], r.log); }

  { Settings s = def; s.lefty = 1;
    Run r(s, platformer()); Layout l = makeLayout(s, platformer());
    r.touch(1, l.pad.cx - 50, l.pad.cy); r.touch(2, l.space.cx, l.space.cy); r.wait(60);
    check("left-handed: pad on the right, Space on the left", l.pad.cx > 240 && l.space.cx < 240 && r.held[75] && r.held[57], r.log); }

  { Settings s = def; s.stylus = 1;
    Run r(s, platformer());
    r.touch(1, cx + 50, cy); r.wait(80); r.up(1); r.wait(400);
    check("stylus: a tap on the right of the pad keeps walking right", r.held[77], r.log);
    r.touch(2, L.space.cx, L.space.cy); r.wait(40); r.up(2); r.wait(40);
    check("stylus: tapping Space while latched keeps walking and jumps", r.held[77] && r.held[57], r.log);
    r.wait(300);
    r.touch(3, cx, cy); r.wait(40); r.up(3); r.wait(300);
    check("stylus: a tap in the middle of the pad stops", !r.held[77], r.log); }

  { Settings s = def; s.stylus = 1;
    Run r(s, platformer());  // a drag is not a tap
    r.touch(1, cx + 50, cy); r.wait(100);
    for (int i = 0; i < 6; i++) { r.touch(1, cx + 50 - i * 12, cy); r.wait(80); }
    r.up(1); r.wait(400);
    check("stylus: a drag on the pad does not latch", !r.held[77] && !r.held[75], r.log); }

  { Settings s = def; s.stylus = 1;
    Run r(s, platformer());  // tap up
    r.touch(1, cx, cy - 55); r.wait(40); r.up(1); r.wait(40);
    bool held = r.held[72];
    r.wait(300);
    check("stylus: a tap above the middle is a short Up press", held && !r.held[72], r.log); }

  { Settings s = def; s.palm = 1;
    Run r(s, platformer());
    r.touch(1, cx + 50, cy, 400); r.wait(100);
    check("palm (size): a huge contact is ignored", r.log.empty(), r.log);
    r.touch(2, L.space.cx, L.space.cy, 40); r.wait(60);
    check("palm (size): a finger beside it still works", r.held[57], r.log); }

  { Settings s = def; s.palm = 2;
    Run r(s, platformer());
    r.touch(1, cx + 50, cy, 40); r.wait(60);
    r.touch(2, cx + 40, cy + 40, 40); r.wait(60);  // the heel of the hand, 50 px away
    r.up(1); r.wait(300);
    check("palm (size + near): a contact landing beside a held one is ignored", !r.held[77], r.log); }

  { Run r(def, platformer());  // the chips
    r.touch(1, (L.menu.x0 + L.menu.x1) / 2, (L.menu.y0 + L.menu.y1) / 2); r.wait(40); r.up(1); r.wait(40);
    check("tapping Menu raises the menu event", r.c.takeEvent() == EV_MENU, r.log); }

  { Need n = needs(true, true, false, false, true, false, {30 + 0 /* A is the left arrow */, 29, 56, 45});
    check("A beside the arrows is the arrow, Ctrl, Alt and X are extra keys", n.nextra == 3 && n.left, std::to_string(n.nextra));
    Run r(def, n);
    r.touch(1, (r.c.L.keys.x0 + r.c.L.keys.x1) / 2, (r.c.L.keys.y0 + r.c.L.keys.y1) / 2); r.wait(40); r.up(1); r.wait(40);
    check("tapping Keys opens the key tiles", r.c.keysOpen && r.c.takeEvent() == EV_KEYS, r.log);
    Rect t = r.c.L.tile[1];
    r.touch(2, (t.x0 + t.x1) / 2, (t.y0 + t.y1) / 2); r.wait(60);
    check("a key tile holds its key (Alt)", r.held[56], r.log);
    r.up(2); r.wait(300);
    check("lifting the tile releases it", !r.held[56], r.log); }

  { Need n = needs(true, true, false, false, true, false, {29});
    Run r(def, n);
    Rect t = r.c.L.tile[0];
    r.touch(1, (t.x0 + t.x1) / 2, (t.y0 + t.y1) / 2); r.wait(60);
    check("key tiles do nothing while Keys is closed", r.log.empty(), r.log); }

  { Run r(def, platformer());  // sliding right then left quickly does not press both
    r.touch(1, cx + 50, cy); r.wait(24);
    r.touch(1, cx - 50, cy); r.wait(24);
    check("a quick swipe never holds left and right together", !(r.held[75] && r.held[77]), r.log); }

  { // Layout: every size, both hands, every key set: targets at least 48 px, inside the game view, none overlapping.
    bool ok = true;
    std::string why;
    for (int lefty = 0; lefty < 2; lefty++)
      for (int ps = 0; ps < 3; ps++)
        for (int ne = 0; ne < 3; ne++) {
          Settings s; s.lefty = lefty; s.padSize = ps;
          Need n = needs(true, true, true, true, true, true);
          for (int i = 0; i < ne * 3; i++) needAdd(n, 16 + i);  // none, 3, 6 extra keys (more than six go in a second row over the pad: that menu is modal)
          Layout l = makeLayout(s, n);
          struct D { Disc d; const char* nm; } ds[] = {{l.pad, "pad"}, {l.space, "space"}, {l.enter, "enter"}};
          for (auto& a : ds) {
            if (a.d.r * 2 < 48 || a.d.cx - a.d.r < 0 || a.d.cx + a.d.r > W || a.d.cy - a.d.r < 0 || a.d.cy + a.d.r > 300) { ok = false; why += std::string(a.nm) + " out of bounds or small; "; }
          }
          for (int i = 0; i < 3; i++) for (int j = i + 1; j < 3; j++) {
            int dx = ds[i].d.cx - ds[j].d.cx, dy = ds[i].d.cy - ds[j].d.cy, rr = ds[i].d.r + ds[j].d.r;
            if (dx * dx + dy * dy < rr * rr) { ok = false; why += std::string(ds[i].nm) + " overlaps " + ds[j].nm + "; "; }
          }
          Rect chips[] = {l.menu, l.keys};
          for (auto& c : chips) {
            if (c.x1 - c.x0 < 48 || c.y1 - c.y0 < 48) { ok = false; why += "chip small; "; }
            for (auto& a : ds) if (inDisc(a.d, (c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2) || inDisc(a.d, c.x0, c.y1, 0)) { ok = false; why += "chip over a control; "; }
          }
          for (int t = 0; t < n.nextra; t++) {
            Rect r = l.tile[t];
            if (r.x1 - r.x0 < 48 || r.y1 - r.y0 < 48 || r.x0 < 0 || r.x1 > W) { ok = false; why += "tile small or off screen; "; }
            for (auto& a : ds) if (inDisc(a.d, (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2)) { ok = false; why += "tile over a control; "; }
          }
        }
    check("layout: targets 48 px or more, on screen, not overlapping (both hands, three pad sizes)", ok, why);
  }

  printf("%s\n", failures ? "controls model: FAILURES" : "controls model: all scenarios pass");
  return failures ? 1 : 0;
}
