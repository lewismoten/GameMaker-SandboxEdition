// Mac test for the touch controls model (src/controls.h): scripted touch events go in, the keys it
// presses come out, and each scenario says what must happen. Prints one line per scenario; exit 1 on a
// failure. Run by web/scripts/pocketControlsCheck.ts, or: c++ -std=c++17 -I../src controlstest.cpp && ./a.out
#include <cmath>
#include <stdio.h>
#include <string>
#include <vector>
#include "controls.h"
#include "picker.h"
#include "gt911report.h"

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

// I2C stand-in: the register requests return either a complete report or an interrupted transfer.
struct ReportBus {
  std::vector<int> bytes;
  size_t pos = 0;
  int count = 1, shortBy = 0, acks = 0, failReg = 0;
  std::vector<int> tx;
  void beginTransmission(int) { tx.clear(); }
  void write(int b) { tx.push_back(b); }
  int endTransmission() {
    if (tx.size() == 3) acks++;
    return tx.size() == 2 && tx[1] == failReg ? 1 : 0;
  }
  int requestFrom(int, int n) {
    bytes = n == 1 ? std::vector<int>{0x80 | count} : std::vector<int>{2, 100, 0, 200, 0, 40, 0, 0};
    if (n > 1 && shortBy) bytes.resize(bytes.size() - shortBy);
    pos = 0; return bytes.size();
  }
  int available() { return bytes.size() - pos; }
  int read() { return bytes[pos++]; }
};

int main() {
  {
    gtr::Report r; ReportBus bus;
    check("GT911 complete contact starts a hold", r.pollReport(bus, 0x5D) == 1 && r.id[0] == 2 && r.rawX[0] == 100 && r.fresh && bus.acks == 1);
    bus.shortBy = 1;
    check("GT911 short packet preserves the held contact without acknowledgment", r.pollReport(bus, 0x5D) == 1 && r.id[0] == 2 && !r.fresh && bus.acks == 1);
    bus.shortBy = 0; bus.failReg = 0x4F;
    check("GT911 failed point register read preserves a hold", r.pollReport(bus, 0x5D) == 1 && !r.fresh && bus.acks == 1);
    bus.failReg = 0; bus.count = 0;
    check("GT911 complete lift releases the hold", r.pollReport(bus, 0x5D) == 0 && r.fresh && bus.acks == 2);
  }

  {
    char label[96];
    pk::ellipsize("Graduation: Blocks and showcase", label, sizeof label, 21);
    check("long title fits its button", strlen(label) == 21 && !strcmp(label + 18, "..."));
    check("search matches titles only, without case", pk::matches("A Fly Named Carl", "named carl") && !pk::matches("A Fly Named Carl", "2 levels"));
  }

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

  { Run r(def, platformer());  // held Up: the chip drops the contact for one report (8 ms), then it is back
    r.touch(1, cx, cy - 55); r.wait(200);
    r.up(1); r.wait(8);
    r.touch(1, cx, cy - 55); r.wait(200);
    check("a one-report dropout does not let go of a held Up", r.log == "+72 ", r.log); }

  { Run r(def, platformer());  // held Up: the chip drops the contact for 40 ms
    r.touch(1, cx, cy - 55); r.wait(200);
    r.up(1); r.wait(40);
    r.touch(1, cx, cy - 55); r.wait(200);
    check("a 40 ms dropout does not let go of a held Up", r.log == "+72 ", r.log); }

  { Run r(def, platformer());  // held Up: the same thumb comes back under a new id, the old id going in the same report
    r.touch(1, cx, cy - 55); r.wait(200);
    r.up(1); r.touch(2, cx + 4, cy - 52); r.wait(300);
    check("a thumb re-reported under a new id keeps the pad", r.log == "+72 " && r.held[72], r.log);
    r.touch(2, cx - 55, cy); r.wait(100);
    check("and the pad still steers", r.held[75] && !r.held[72], r.log);
    r.up(2); r.wait(100);
    check("and lifting lets go", !r.held[75] && !r.held[72], r.log); }

  { Run r(def, platformer());  // a real lift is let go within 80 ms of the chip's last report
    r.touch(1, cx, cy - 55); r.wait(300);
    r.up(1);
    int t = 0;
    while (r.held[72] && t < 200) { r.wait(8); t += 8; }
    check("a real lift of Up releases within 80 ms", !r.held[72] && t <= 80, std::to_string(t) + " " + r.log); }

  { Run r(def, platformer());  // a dropped Space finger is held through the gap, a real lift lets go
    r.touch(1, L.space.cx, L.space.cy); r.wait(300);
    r.up(1); r.wait(24);
    r.touch(1, L.space.cx, L.space.cy); r.wait(100);
    check("a Space press with a 24 ms dropout is one press", r.log == "+57 ", r.log);
    r.up(1); r.wait(200);
    check("and lets go after the lift", !r.held[57], r.log); }

  { Run r(def, platformer());  // no key is ever stuck: every contact gone for good releases everything
    r.touch(1, cx, cy - 55); r.touch(2, L.space.cx, L.space.cy); r.wait(200);
    r.up(1); r.up(2); r.wait(260);
    bool any = false;
    for (int i = 0; i < 128; i++) any |= r.held[i];
    check("no key is left down once every finger has lifted", !any, r.log); }

  { // Diagonal sectors: a game that binds diagonal keys gets them from the pad; one that doesn't keeps two arrows.
    auto at = [](Run& r, int deg) {   // a finger at `deg` degrees (0 right, 90 up) on the pad, 60% of its radius out
      double a = deg * 3.14159265 / 180;
      r.touch(1, r.c.L.pad.cx + (int)(r.c.L.pad.r * 0.7 * cos(a)), r.c.L.pad.cy - (int)(r.c.L.pad.r * 0.7 * sin(a)));
      r.wait(60);
    };
    Need carl = needs(true, true, true, true, false, false, {16, 18, 71, 73, 79, 81});
    needAdd(carl, 44, "Down-left"); needAdd(carl, 46, "Down-right");
    check("diagonal keys are not tiles", carl.nextra == 0 && carl.diag[0] == 71 && carl.diag[1] == 73 && carl.diag[2] == 79 && carl.diag[3] == 81, std::to_string(carl.nextra));
    Need qe = needs(true, true, true, true, true, false, {16, 18, 44});   // 44 unlabeled: a tile (Z is not a diagonal without "down")
    check("Q and E are the up diagonals, a bare Z is no diagonal", qe.diag[0] == 16 && qe.diag[1] == 18 && !qe.diag[2], std::to_string(qe.diag[2]));
    { Need z = needs(true, true, true, true, true, false); needAdd(z, 44, "Down-left"); needAdd(z, 46, "Chew");
      check("Z with a down label is the down-left diagonal, C as Chew is a tile", z.diag[2] == 44 && !z.diag[3] && z.nextra == 1, std::to_string(z.nextra)); }
    struct { int deg, scan; } cases[] = {{45, 73}, {135, 71}, {225, 79}, {315, 81}};
    for (auto& cs : cases) {
      Run r(def, carl); at(r, cs.deg);
      { std::string nm = "Carl: pad at " + std::to_string(cs.deg) + " degrees sends its numpad diagonal alone"; check(nm.c_str(), r.held[cs.scan] && !r.held[S_UP] && !r.held[S_DOWN] && !r.held[S_LEFT] && !r.held[S_RIGHT], r.log); }
    }
    { Run r(def, carl); at(r, 20); check("Carl: 20 degrees is still plain right", r.held[S_RIGHT] && !r.held[73] && !r.held[S_UP], r.log); }
    for (int deg : {45, 90, 135}) {
      Run r(def, carl); at(r, deg);
      int scan = deg == 45 ? 73 : deg == 90 ? S_UP : 71;
      std::string initial = r.log;
      r.wait(10000);
      check("Carl: ten seconds of held flight never releases or pulses the key", r.held[scan] && r.log == initial, r.log);
    }
    { Run r(def, carl); at(r, 70); check("Carl: 70 degrees is still plain up", r.held[S_UP] && !r.held[73] && !r.held[S_RIGHT], r.log); }
    { Run r(def, carl); at(r, 45); r.up(1); r.wait(30);
      check("Carl: the 60 ms grace holds the diagonal after a dropout", r.held[73], r.log);
      r.wait(200); check("Carl: the diagonal lets go after the grace", !r.held[73], r.log); }
    { Run r(def, carl); at(r, 45); at(r, 10); check("Carl: sliding from the diagonal to right swaps keys", r.held[S_RIGHT] && !r.held[73], r.log); }
    { Run r(def, platformer()); at(r, 45); check("no diagonal keys: up-right is Up and Right together", r.held[S_UP] && r.held[S_RIGHT], r.log); }
    { Need up = needs(true, true, true, true, true, false, {16, 18});   // Teddy: only up diagonals bound
      Run r(def, up); at(r, 45); check("Teddy: up-right sends Q/E diagonal (E)", r.held[18] && !r.held[S_UP], r.log);
      Run r2(def, up); at(r2, 315); check("Teddy: down-right has no diagonal, so Down and Right", r2.held[S_DOWN] && r2.held[S_RIGHT], r2.log); }
  }

  { // Layout: every size, both hands, every key set: targets at least 48 px, inside the game view, none overlapping.
    bool ok = true;
    std::string why;
    for (int lefty = 0; lefty < 2; lefty++)
      for (int ps = 0; ps < 3; ps++)
        for (int ne = 0; ne < 3; ne++) {
          Settings s; s.lefty = lefty; s.padSize = ps;
          Need n = needs(true, true, true, true, true, true);
          for (int i = 0; i < ne * 3; i++) needAdd(n, 20 + i);  // none, 3, 6 extra keys (more than six go in a second row over the pad: that menu is modal)
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
