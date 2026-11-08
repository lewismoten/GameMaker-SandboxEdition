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

static void layoutCheck() {
  { // Layout: every size, both hands, pad low or raised, Space in the corner or near the pad, every key set: targets at least
    // 48 px (32 on the 2.8 inch board's 2/3 layout), inside the game view, none overlapping, and the pad and Space apart by more than their touch slop.
    const int MIN = scr::SMALL ? 32 : 48;  // the 2.8 inch layout is the big one at 2/3
    bool ok = true;
    std::string why;
    for (int opt = 0; opt < 4; opt++)
    for (int lefty = 0; lefty < 2; lefty++)
      for (int ps = 0; ps < 3; ps++)
        for (int ne = 0; ne < 3; ne++) {
          Settings s; s.lefty = lefty; s.padSize = ps; s.raised = opt & 1; s.jumpNear = opt >> 1;
          Need n = needs(true, true, true, true, true, true);
          for (int i = 0; i < ne * 3; i++) needAdd(n, 20 + i);  // none, 3, 6 extra keys (more than six go in a second row over the pad: that menu is modal)
          Layout l = makeLayout(s, n);
          struct D { Disc d; const char* nm; } ds[] = {{l.pad, "pad"}, {l.space, "space"}, {l.enter, "enter"}};
          for (auto& a : ds) {
            if (a.d.r * 2 < MIN || a.d.cx - a.d.r < 0 || a.d.cx + a.d.r > W || a.d.cy - a.d.r < 0 || a.d.cy + a.d.r > scr::VIEW_H) { ok = false; why += std::string(a.nm) + " out of bounds or small; "; }
          }
          for (int i = 0; i < 3; i++) for (int j = i + 1; j < 3; j++) {
            int dx = ds[i].d.cx - ds[j].d.cx, dy = ds[i].d.cy - ds[j].d.cy, rr = ds[i].d.r + ds[j].d.r;
            if (i == 0 && j == 1) rr += 8;  // Space's 8 px slop must not reach the pad
            if (dx * dx + dy * dy < rr * rr) { ok = false; why += std::string(ds[i].nm) + " overlaps " + ds[j].nm + "; "; }
          }
          Rect chips[] = {l.menu, l.keys};
          for (auto& c : chips) {
            if (c.x1 - c.x0 < MIN || c.y1 - c.y0 < MIN) { ok = false; why += "chip small; "; }
            for (auto& a : ds) if (inDisc(a.d, (c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2) || inDisc(a.d, c.x0, c.y1, 0)) { ok = false; why += "chip over a control; "; }
          }
          for (int t = 0; t < n.nextra; t++) {
            Rect r = l.tile[t];
            if (r.x1 - r.x0 < MIN || r.y1 - r.y0 < MIN || r.x0 < 0 || r.x1 > W) { ok = false; why += "tile small or off screen; "; }
            for (auto& a : ds)  // a raised pad or Space near it may sit under the Keys menu's tiles: they open on demand and take the touch first
              if (!(s.raised || s.jumpNear) && inDisc(a.d, (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2)) { ok = false; why += "tile over a control; "; }
          }
        }
    check((std::string("layout: targets ") + (scr::SMALL ? "32" : "48") + " px or more, on screen, not overlapping (both hands, three pad sizes, low or raised, Space in the corner or near)").c_str(), ok, why);
  }

}

// Floating pad (Pad position: Float): the pad centers where a thumb lands in its zone, so the same slides press the same keys
// wherever it lands; it stays put while it shows (held, latched, fading), and the fixed pad is unchanged with it off.
static void floatingCheck() {
  for (int lefty : {0, 1}) {
    const char* hand = lefty ? " (left hand)" : " (right hand)";
    auto nm = [&](const char* s) { return std::string(s) + hand; };
    Settings fs; fs.lefty = lefty; fs.floatPad = 1;
    Settings fixed; fixed.lefty = lefty;
    Need n = platformer(); needAdd(n, S_SPACE, "Jump");
    Layout L0 = makeLayout(fs, n);
    const int zw = L0.zone.x1 - L0.zone.x0;
    check(nm("float: the zone is the outer 40 % of the view on the pad's side").c_str(),
          zw == W * 40 / 100 && (lefty ? L0.zone.x1 == W : L0.zone.x0 == 0) && L0.zone.y1 == scr::VIEW_H);
    // The same relative slides from several landing points give the keys the fixed pad gives from its own center.
    struct Mv { int dx, dy; } moves[] = {{30, 0}, {-30, 0}, {0, -30}, {0, 30}, {4, 3}, {22, 22}};
    int lands[][2] = {{zw / 2, scr::VIEW_H / 2}, {zw / 3, scr::VIEW_H * 3 / 4}, {zw * 3 / 4, scr::VIEW_H / 3}, {zw / 2, scr::VIEW_H - 40}};
    bool same = true, center = true;
    std::string why;
    for (auto& ld : lands) {
      int lx = lefty ? W - 1 - ld[0] : ld[0], ly = ld[1];
      for (auto& m : moves) {
        Run f(fs, n);
        f.touch(1, lx, ly); f.wait(80);
        if (f.c.L.pad.cx != lx || f.c.L.pad.cy != ly) center = false;
        f.touch(1, lx + m.dx, ly + m.dy); f.wait(200);
        Run x(fixed, n);
        const Disc h = x.c.L.pad;
        x.touch(1, h.cx, h.cy); x.wait(80);
        x.touch(1, h.cx + m.dx, h.cy + m.dy); x.wait(200);
        for (int sc : {S_LEFT, S_RIGHT, S_UP, S_DOWN, S_SPACE})
          if (f.held[sc] != x.held[sc]) { same = false; why += "at " + std::to_string(lx) + "," + std::to_string(ly) + " move " + std::to_string(m.dx) + "," + std::to_string(m.dy) + ": " + f.log + "vs " + x.log + "; "; break; }
      }
    }
    check(nm("float: the pad centers where the thumb lands").c_str(), center);
    check(nm("float: the same slides from anywhere in the zone press what the fixed pad presses").c_str(), same, why);
    { Run f(fs, n); f.touch(1, lefty ? W - 2 : 1, scr::VIEW_H - 1); f.wait(80);
      const Disc p = f.c.L.pad;
      bool reach = p.cx - f.c.L.deadR > 0 && p.cx + f.c.L.deadR < W - 1 && p.cy + f.c.L.deadR < scr::VIEW_H - 1 && p.cy - f.c.L.deadR > 0;
      check(nm("float: a thumb at the corner keeps the center inside, every direction in reach").c_str(), reach, std::to_string(p.cx) + "," + std::to_string(p.cy)); }
    { Run f(fs, n); f.touch(1, W / 2, scr::VIEW_H / 3); f.wait(200);
      check(nm("float: a touch outside the zone presses nothing and shows no pad").c_str(), f.log.empty() && f.c.padLook(f.now) == LOOK_OFF, f.log); }
    { Run x(fixed, n); const Disc h = x.c.L.pad; int tx = lefty ? W - 1 - 10 : 10;
      x.touch(1, tx, 50); x.wait(200);
      check(nm("fixed (default): a touch in the zone off the pad does nothing; the pad always shows").c_str(), x.log.empty() && x.c.padLook(x.now) == LOOK_FULL && x.c.L.pad.cx == h.cx, x.log); }
    { Run f(fs, n); f.touch(1, f.c.L.space.cx, f.c.L.space.cy); f.wait(200);
      check(nm("float: Space is still Space").c_str(), f.held[S_SPACE] && f.c.padLook(f.now) == LOOK_OFF, f.log); }
    { Run f(fs, n); int mx = (f.c.L.menu.x0 + f.c.L.menu.x1) / 2, my = (f.c.L.menu.y0 + f.c.L.menu.y1) / 2;
      f.touch(1, mx, my); f.wait(80); f.up(1); f.wait(40);
      check(nm("float: MENU still opens the menu, the pad stays away").c_str(), f.c.takeEvent() == EV_MENU && f.log.empty()); }
    // Looks: faint while held, dim for half a second after the lift, then gone.
    { Run f(fs, n); int lx = lefty ? W - 60 : 60, ly = scr::VIEW_H / 2;
      bool off0 = f.c.padLook(f.now) == LOOK_OFF;
      f.touch(1, lx, ly); f.wait(80);
      bool faint = f.c.padLook(f.now) == LOOK_FAINT;
      f.up(1); f.wait(120);
      bool dim = f.c.padLook(f.now) == LOOK_DIM;
      f.wait(500);
      check(nm("float: hidden, faint while held, dim while it fades, then hidden").c_str(), off0 && faint && dim && f.c.padLook(f.now) == LOOK_OFF); }
    // The first readings settle: a thumb drifting inside the dead zone for its first 50 ms carries the center, and the slide after it is relative.
    { Run f(fs, n); int lx = lefty ? W - 60 : 60, ly = scr::VIEW_H / 2;
      f.touch(1, lx, ly); f.wait(16);
      f.touch(1, lx + 6, ly + 5); f.wait(16);
      bool moved = f.c.L.pad.cx == lx + 6 && f.c.L.pad.cy == ly + 5;
      f.wait(80);
      f.touch(1, lx + 6 + 9, ly + 5); f.wait(80);  // later drift inside the dead zone no longer moves it
      bool kept = f.c.L.pad.cx == lx + 6;
      f.touch(1, lx + 6 + 30, ly + 5); f.wait(200);
      check(nm("float: the first 50 ms of drift settle the center, then it holds").c_str(), moved && kept && f.held[S_RIGHT] && !f.held[S_UP] && !f.held[S_DOWN], f.log); }
    // A noisy contact: a one-poll dropout and a new id beside it keep the held direction and the center (the 60 ms grace adopts it).
    { Run f(fs, n); int lx = lefty ? W - 60 : 60, ly = scr::VIEW_H / 2;
      f.touch(1, lx, ly); f.wait(80);
      f.touch(1, lx + 30, ly); f.wait(200);
      int cx = f.c.L.pad.cx, cy = f.c.L.pad.cy;
      f.up(1); f.wait(8);
      f.touch(2, lx + 33, ly + 2); f.wait(80);
      check(nm("float: a dropout and a new id beside it keep Right and the center").c_str(), f.held[S_RIGHT] && f.c.L.pad.cx == cx && f.c.L.pad.cy == cy && f.log == "+77 ", f.log); }
    // A touch inside the ring that still shows keeps its center; one elsewhere in the zone moves it.
    { Run f(fs, n); int lx = lefty ? W - 60 : 60, ly = scr::VIEW_H / 2;
      f.touch(1, lx, ly); f.wait(80); f.up(1); f.wait(100);
      f.touch(2, lx + 30, ly); f.wait(120);
      bool kept = f.c.L.pad.cx == lx && f.held[S_RIGHT];
      f.up(2); f.wait(700);
      f.touch(3, lx + 30, ly + 40); f.wait(120);
      check(nm("float: back inside the fading ring keeps its center (Right); after it fades a touch re-centers").c_str(),
            kept && f.c.L.pad.cy == ly + 40 && !f.held[S_RIGHT] && !f.held[S_DOWN], f.log); }
    // Sticky direction: tap a side of the ring while it shows; it stays shown (dim) while walking; a tap in the middle stops.
    { Settings ss = fs; ss.sticky = 1; Run f(ss, n); int lx = lefty ? W - 60 : 60, ly = scr::VIEW_H / 2;
      f.touch(1, lx, ly); f.wait(60); f.up(1); f.wait(100);
      f.touch(2, lx + 30, ly); f.wait(60); f.up(2); f.wait(240);
      bool walking = f.held[S_RIGHT] && f.c.padLook(f.now) == LOOK_DIM;
      f.wait(1000);
      bool still = f.held[S_RIGHT] && f.c.padLook(f.now) == LOOK_DIM;
      f.touch(3, lx, ly); f.wait(60); f.up(3); f.wait(240);
      check(nm("float + sticky: a tap on the ring's side walks, the ring stays while walking, a tap in its middle stops").c_str(), walking && still && !f.held[S_RIGHT] && f.c.latch == 0, f.log); }
#ifndef POCKET_CYD28
    // The GT911 reports two fingers: a thumb held on the floating pad keeps steering while the other finger taps Jump, again and again.
    { Run f(fs, n); int lx = lefty ? W - 60 : 60, ly = scr::VIEW_H / 2 + 20;
      f.touch(1, lx, ly); f.wait(80);
      f.touch(1, lx + f.c.L.pad.r / 2, ly); f.wait(120);
      bool ok = f.held[S_RIGHT] && !f.held[S_SPACE];
      for (int tap = 0; tap < 3; tap++) {
        f.touch(2, f.c.L.space.cx, f.c.L.space.cy); f.wait(80); ok = ok && f.held[S_RIGHT] && f.held[S_SPACE];
        f.up(2); f.wait(300); ok = ok && f.held[S_RIGHT] && !f.held[S_SPACE];
      }
      check(nm("float, two fingers: pad held while Jump taps three times, Right never lets go").c_str(), ok && f.log.find("-77") == std::string::npos, f.log); }
#endif
#ifdef POCKET_CYD28
    // One resistive contact: the jump arcs work from wherever the pad landed.
    { Run f(fs, n); int lx = lefty ? W - 60 : 60, ly = scr::VIEW_H / 2 + 20;
      f.touch(1, lx, ly); f.wait(80);
      int r = f.c.L.pad.r;
      f.touch(1, lx + r / 2, ly); f.wait(200);
      f.touch(1, lx + r / 2, ly - r / 2); f.wait(200);
      check(nm("float: the upper-right wedge still holds Right + Jump").c_str(), f.held[S_RIGHT] && f.held[S_SPACE] && !f.held[S_UP], f.log); }
#endif
    { Run f(fs, n); f.touch(1, lefty ? W - 60 : 60, 100); f.wait(80); f.c.reset();
      check(nm("float: leaving play puts the pad back home, hidden").c_str(), f.c.L.pad.cx == f.c.L.home.cx && f.c.padLook(f.now) == LOOK_OFF); }
  }
}


// Touch comfort, second pass: jump arcs as a setting, the wedge widths, the dead strip at the glass edge.
static void comfortCheck() {
  Need jn = platformer(); needAdd(jn, S_SPACE, "Jump");
  // The keys held by a thumb that lands `deg` degrees above level, at 3/4 of the pad's radius, on the Right (side 1) or Left (-1).
  auto keysAt = [&](Settings s, int deg, int side) {
    Run r(s, jn); auto p = r.c.L.pad;
    int rad = p.r * 3 / 4;
    r.touch(1, p.cx + side * (int)std::lround(rad * std::cos(deg * M_PI / 180)), p.cy - (int)std::lround(rad * std::sin(deg * M_PI / 180)));
    r.wait(200);
    std::string k = r.held[side > 0 ? S_RIGHT : S_LEFT] ? "H" : "";
    if (r.held[S_SPACE]) k += "J";
    if (r.held[S_UP]) k += "U";
    return k;
  };
  const int degs[] = {15, 25, 33, 45, 50, 60, 65, 75};
  const char* want[3][8] = {
      {"H", "H", "H", "HJ", "HJ", "U", "U", "U"},      // Narrow: level to 35 degrees, upright from 55
      {"H", "H", "HJ", "HJ", "HJ", "HJ", "U", "U"},    // Normal: 27 and 63 (today's)
      {"H", "HJ", "HJ", "HJ", "HJ", "HJ", "HJ", "U"}}; // Wide: 20 and 70
  for (int w = 0; w < 3; w++) for (int side : {-1, 1}) {
    Settings s; s.arcs = 1; s.wedge = w; s.lefty = side < 0;
    std::string got, exp;
    for (int i = 0; i < 8; i++) { got += keysAt(s, degs[i], side) + " "; exp += std::string(want[w][i]) + " "; }
    char name[96];
    snprintf(name, sizeof name, "jump wedge %s, %s side: 15 25 33 45 50 60 65 75 degrees", w == 0 ? "Narrow" : w == 1 ? "Normal" : "Wide", side < 0 ? "left" : "right");
    check(name, got == exp, "got " + got + "want " + exp);
  }
  {  // The setting: off, the upper corner is Right + Up; on, Right + Jump. Both boards, whichever the default.
    Settings off; off.arcs = 0; Settings on; on.arcs = 1;
    check("jump arcs off: upper corner presses the arrow and Up", keysAt(off, 45, 1) == "HU", keysAt(off, 45, 1));
    check("jump arcs on: upper corner presses the arrow and Jump", keysAt(on, 45, 1) == "HJ", keysAt(on, 45, 1));
    Run r(on, jn); check("layout shows the arcs only when the game jumps and the setting is on", r.c.L.arcs && !Run(off, jn).c.L.arcs && !Run(on, platformer()).c.L.arcs);
    Settings dflt;
#ifdef POCKET_CYD28
    check("jump arcs default: on for the 2.8 inch board", dflt.arcs == 1);
#else
    check("jump arcs default: off for the 3.5 inch board", dflt.arcs == 0);
#endif
    check("jump wedge default is Normal", dflt.wedge == 1);
    Settings wide = on; wide.wedge = 2; Need walk = needs(true, true, true, true, false, false);
    Run noJump(wide, walk); auto p = noJump.c.L.pad;
    noJump.touch(1, p.cx + p.r * 3 / 4 * 7 / 10, p.cy - p.r * 3 / 4 * 7 / 10); noJump.wait(200);
    check("a game with no Jump label keeps two arrows at the corner, whatever the wedge", noJump.held[S_RIGHT] && noJump.held[S_UP] && !noJump.held[S_SPACE], noJump.log);
  }
#ifdef POCKET_CYD28
  {  // The glass edge: a new touch in the outer 4 px is a drifting reading and presses nothing; a held finger is kept inside.
    Settings s; Run r(s, jn); auto p = r.c.L.pad;
    r.touch(1, 2, p.cy); r.wait(200);
    check("a new touch at the glass edge presses nothing", !r.held[S_LEFT] && !r.held[S_RIGHT] && r.log.empty(), r.log);
    r.up(1); r.wait(100);
    r.touch(1, p.cx - p.r + 4, p.cy); r.wait(200);
    check("a touch just inside the strip still works", r.held[S_LEFT], r.log);
    r.touch(1, 1, p.cy); r.wait(200);
    check("a held finger that drifts into the strip stays held", r.held[S_LEFT], r.log);
    r.up(1); r.wait(300);
    Run m(s, jn); m.touch(1, 3, 3); m.wait(100); m.up(1); m.wait(100);
    check("a tap in the corner strip is not MENU", m.c.takeEvent() == EV_NONE);
    m.touch(1, 12, 12); m.wait(100); m.up(1); m.wait(100);
    check("a tap on MENU just inside the strip is MENU", m.c.takeEvent() == EV_MENU);
    Run b(s, jn); b.touch(1, 160, H - 2); b.wait(100);
    check("a new touch at the bottom edge is ignored", b.log.empty() && b.c.takeEvent() == EV_NONE, b.log);
  }
#else
  { // The 3.5 inch panel is capacitive: no strip, a touch at the edge still counts (Menu is at 4,4).
    Settings s; Run m(s, jn); m.touch(1, 4, 4); m.wait(100); m.up(1); m.wait(100);
    check("the 3.5 inch board has no dead strip", m.c.takeEvent() == EV_MENU);
  }
#endif
}

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

  // Both board geometries: one-contact jump wedges and saved sticky direction behavior.
  for (int lefty : {0, 1}) {
    Settings s; s.lefty = lefty;
    Need n = platformer(); needAdd(n, S_SPACE, "Jump");
    Run r(s, n); auto p = r.c.L.pad;
    int x = p.cx + p.r / 2, y = p.cy - p.r / 2;
    r.touch(1, x, p.cy); r.wait(200);
    r.touch(1, x, y); r.wait(200);
#ifdef POCKET_CYD28
    check("resistive upper-right wedge holds Right + Jump, without Up", r.held[S_RIGHT] && r.held[S_SPACE] && !r.held[S_UP], r.log);
    r.touch(1, x, p.cy); r.wait(200);
    check("slide back to Right releases Jump without lifting", r.held[S_RIGHT] && !r.held[S_SPACE], r.log);
    r.touch(1, p.cx - p.r / 2, y); r.wait(200);
    check("resistive upper-left wedge holds Left + Jump", r.held[S_LEFT] && r.held[S_SPACE] && !r.held[S_RIGHT], r.log);
#else
    check("capacitive diagonal retains Up + Right", r.held[S_RIGHT] && r.held[S_UP] && !r.held[S_SPACE], r.log);
#endif
#ifdef POCKET_CYD28
    for (int direction : {-1, 1}) {
      Run slide(s, n);
      int arrowX = p.cx + direction * p.r / 2;
      slide.touch(1, arrowX, p.cy); slide.wait(200);
      slide.touch(1, slide.c.L.space.cx, slide.c.L.space.cy); slide.wait(200);
      int scan = direction < 0 ? S_LEFT : S_RIGHT;
      check("same resistive contact slides arrow to Space and keeps direction", slide.held[scan] && slide.held[S_SPACE] && !slide.held[direction < 0 ? S_RIGHT : S_LEFT], slide.log);
      auto space = slide.c.L.space;
      slide.touch(1, space.cx + space.r + 11, space.cy); slide.wait(200);
      check("Space exit hysteresis keeps Jump near its edge", slide.held[scan] && slide.held[S_SPACE], slide.log);
      slide.touch(1, arrowX, p.cy); slide.wait(200);
      check("same contact slides Space back to arrow and releases Jump", slide.held[scan] && !slide.held[S_SPACE], slide.log);
      slide.touch(1, arrowX, p.cy - p.r / 2); slide.wait(200);
      check("same contact slides arrow to jump wedge", slide.held[scan] && slide.held[S_SPACE], slide.log);
      slide.touch(1, arrowX, p.cy - p.r * 3 / 10); slide.wait(200);
      check("jump wedge hysteresis resists sector-edge noise", slide.held[scan] && slide.held[S_SPACE], slide.log);
      slide.touch(1, p.cx - direction * p.r / 2, p.cy); slide.wait(8);
      check("held resistive contact changes arrow sector every poll", slide.held[direction < 0 ? S_RIGHT : S_LEFT] && !slide.held[scan], slide.log);
      slide.up(1); slide.wait(300);
      check("lifting after slide releases direction and Jump", !slide.held[scan] && !slide.held[S_SPACE], slide.log);
      Run button(s, n);
      button.touch(1, space.cx, space.cy); button.wait(200);
      button.touch(1, arrowX, p.cy); button.wait(200);
      check("contact beginning on Space can slide onto pad", button.held[scan] && !button.held[S_SPACE], button.log);
    }
#else
    Run slide(s, n);
    slide.touch(1, x, p.cy); slide.wait(200);
    slide.touch(1, slide.c.L.space.cx, slide.c.L.space.cy); slide.wait(200);
    check("GT911 pad contact retains pad ownership over Space", !slide.held[S_SPACE], slide.log);
#endif
    r.c.reset(); r.n = 0; memset(r.held, 0, sizeof r.held);
    r.touch(1, x, p.cy); r.wait(200);
    r.touch(2, r.c.L.space.cx, r.c.L.space.cy); r.wait(200);
    r.up(2); r.wait(300);
    check("Jump finger releases while direction stays held", r.held[S_RIGHT] && !r.held[S_SPACE], r.log);
    s.sticky = 1; Run sticky(s, n);
    auto tap = [&](int tx) { sticky.touch(1, tx, p.cy); sticky.wait(80); sticky.up(1); sticky.wait(240); };
    tap(x);
    check("sticky tap keeps walking after lift", sticky.held[S_RIGHT], sticky.log);
    sticky.touch(2, sticky.c.L.space.cx, sticky.c.L.space.cy); sticky.wait(80); sticky.up(2); sticky.wait(240);
    check("sticky walking survives a Jump tap", sticky.held[S_RIGHT] && !sticky.held[S_SPACE], sticky.log);
    tap(x);
    check("same sticky direction tap stops walking", !sticky.held[S_RIGHT] && !sticky.held[S_LEFT], sticky.log);
    tap(x); tap(p.cx - p.r / 2);
    check("opposite sticky direction replaces walking direction", sticky.held[S_LEFT] && !sticky.held[S_RIGHT], sticky.log);
    sticky.c.reset(); sticky.wait(240);
    check("reset clears sticky direction", sticky.c.latch == 0 && sticky.c.padDirs == 0, sticky.log);
    Need native = n; needAdd(native, 73, "Up-right");
    Run diagonal(s, native);
    diagonal.touch(1, x, y); diagonal.wait(200);
    check("native diagonal binding takes priority over Jump wedge", diagonal.held[73] && !diagonal.held[S_SPACE], diagonal.log);
#ifdef POCKET_CYD28
    diagonal.touch(1, diagonal.c.L.space.cx, diagonal.c.L.space.cy); diagonal.wait(200);
    check("sliding a native diagonal onto Space preserves its binding", diagonal.held[73] && diagonal.held[S_SPACE] && !diagonal.held[S_UP], diagonal.log);
#endif
    Need horizontal = needs(true, true, false, false, false, false); needAdd(horizontal, S_SPACE, "Hop");
    Run hop(s, horizontal); hop.touch(1, x, y); hop.wait(200);
#ifdef POCKET_CYD28
    check("jump wedge works without a game's Up binding", hop.held[S_RIGHT] && hop.held[S_SPACE], hop.log);
#endif
    Need action = platformer(); needAdd(action, S_SPACE, "Fire");
    check("only Jump or Hop labels enable jump wedges", n.jump && !action.jump);
  }

  layoutCheck();
  comfortCheck();
  { // Near pad and Raised: a thumb held on Right rocks up onto Space (Jump) and back, Right staying held throughout
    Settings s; s.jumpNear = 1; s.raised = 1;
    for (int lefty = 0; lefty < 2; lefty++) {
      s.lefty = lefty;
      Need n = needs(true, true, true, true, true, true);
      Layout l = makeLayout(s, n);
#ifdef POCKET_CYD28  // one resistive contact slides; the GT911 keeps a finger that began on the pad on the pad
      Run r(s, n);
      int side = lefty ? -1 : 1, scan = lefty ? S_LEFT : S_RIGHT;
      int x0 = l.pad.cx + side * l.pad.r * 2 / 3, y0 = l.pad.cy;
      r.touch(1, x0, y0); r.wait(100);
      for (int k = 1; k <= 8; k++) { r.touch(1, x0 + (l.space.cx - x0) * k / 8, y0 + (l.space.cy - y0) * k / 8); r.wait(24); }
      r.wait(100);
      check(lefty ? "near pad (left hand): slide from Left onto Jump keeps Left and adds Jump" : "near pad: slide from Right onto Jump keeps Right and adds Jump",
            r.held[scan] && r.held[S_SPACE], r.log);
      r.up(1); r.wait(300);
      check("near pad: lifting releases both", !r.held[scan] && !r.held[S_SPACE], r.log);
#endif
      Run t(s, n);
      t.touch(2, l.space.cx, l.space.cy); t.wait(60); t.up(2); t.wait(300);
      check("near pad: a tap on Jump presses Space only", t.log.find("+57") != std::string::npos && t.log.find("+75") == std::string::npos && t.log.find("+77") == std::string::npos, t.log);
    }
  }
#ifdef POCKET_CYD28
  floatingCheck();
  printf("resistive controls model: %s\n", failures ? "FAILURES" : "all passed");
  return failures ? 1 : 0;
#endif
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

  floatingCheck();
  printf("%s\n", failures ? "controls model: FAILURES" : "controls model: all scenarios pass");
  return failures ? 1 : 0;
}
