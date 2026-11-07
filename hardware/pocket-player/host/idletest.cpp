// Mac test for src/idle.h, src/statusled.h and src/pressrect.h: the idle timer on a fake clock (dim at 60 s, off at 3 minutes,
// wake, the swallowed first touch, serial and BOOT as activity, auto-pause in a game), the status LED's timing, the press state
// machine (acts on release, sliding off cancels, a finger already down presses nothing) and the hit tables (every button is at
// least 32 x 32 and every library, settings and pause button is found). Built twice (add -DPOCKET_CYD28 for the 2.8 inch board).
#include <assert.h>
#include <stdio.h>
#include <initializer_list>
namespace textdatum_t { constexpr int middle_center = 4, top_left = 0; }
#include "idle.h"
#include "pressrect.h"
#include "statusled.h"

int main() {
  using namespace idle;
  const uint32_t S = 1000;
  {  // library or paused: dim at 60 s, off at 3 minutes
    Machine m;
    m.bump(0);
    assert(m.update(59 * S, false, false, false) == NONE && m.state == AWAKE);
    assert(m.update(60 * S, false, false, false) == DIM_NOW && m.state == DIM);
    assert(m.update(179 * S, false, false, false) == NONE && m.state == DIM);
    assert(m.update(180 * S, false, false, false) == OFF_NOW && m.state == OFF);
    assert(m.update(900 * S, false, false, false) == NONE && m.state == OFF);
    // a touch wakes it, is swallowed until the finger lifts, and the next touch is a real one
    assert(m.update(901 * S, true, false, false) == WAKE_NOW && m.state == AWAKE);
    assert(m.swallow(true) && m.swallow(true));
    assert(!m.swallow(false));
    assert(m.update(902 * S, true, false, false) == NONE && !m.swallow(true));
    // a touch while dimmed also only wakes
    m.update(903 * S, false, false, false);
    assert(m.update(963 * S, false, false, false) == DIM_NOW);
    assert(m.update(964 * S, true, false, false) == WAKE_NOW && m.swallow(true));
    assert(!m.swallow(false));
  }
  {  // serial traffic and BOOT count as activity and wake without swallowing anything
    Machine m;
    m.bump(0);
    m.update(60 * S, false, false, false);
    m.update(180 * S, false, false, false);
    assert(m.state == OFF);
    assert(m.update(181 * S, false, true, false) == WAKE_NOW && !m.swallow(false) && m.state == AWAKE);
    // steady serial traffic keeps the screen lit
    uint32_t t = 182;
    for (; t < 600; t += 20) assert(m.update(t * S, false, true, false) == NONE && m.state == AWAKE);
    t -= 20;  // the last byte
    assert(m.update((t + 59) * S, false, false, false) == NONE);
    assert(m.update((t + 60) * S, false, false, false) == DIM_NOW);
  }
  {  // a game: never dims, pauses after 3 minutes untouched, a held finger counts
    Machine m;
    m.bump(0);
    assert(m.update(179 * S, false, false, true) == NONE && m.state == AWAKE);
    assert(m.update(180 * S, false, false, true) == AUTOPAUSE);
    // the pause starts its own clock: dim 60 s later, off at 3 minutes
    assert(m.update(239 * S, false, false, false) == NONE);
    assert(m.update(240 * S, false, false, false) == DIM_NOW);
    assert(m.update(360 * S, false, false, false) == OFF_NOW);
    Machine g;
    g.bump(0);
    for (uint32_t t = 0; t < 1000; t += 5) assert(g.update(t * S, true, false, true) == NONE);  // a thumb held on the pad
    assert(g.update(1004 * S, false, false, true) == NONE);
    assert(g.update((995 + 180) * S, false, false, true) == AUTOPAUSE);
  }
  {  // the clock wraps (millis() rolls over after 49 days)
    Machine m;
    m.bump(0xFFFFFFFFu - 30 * S);
    assert(m.update(30 * S, false, false, false) == DIM_NOW);
  }
  assert(level(3) == 255 && level(0) == 64 && level(9) == 255 && level(-1) == 64);
  assert(forState(AWAKE, 1) == 128 && forState(OFF, 3) == 0 && forState(DIM, 3) == DIM_LEVEL && forState(DIM, 0) == DIM_LEVEL);
  {  // the status LED
    sled::Led l;
    uint8_t r, g;
    l.at(0, r, g);
    assert(!r && !g);
    l.load(true);
    l.at(5, r, g);
    assert(!r && g == sled::GREEN_DUTY);
    l.error(1000);
    int flips = 0;
    bool prev = false;
    for (uint32_t t = 1000; t < 1000 + 900; t += 10) {
      l.at(t, r, g);
      assert(r == 0 || r == 255);
      if ((r != 0) != prev) flips++;
      prev = r != 0;
      if (r) assert(g == 0);
    }
    assert(flips == 6);  // three blinks: on and off three times
    l.at(5000, r, g);
    assert(!r && g == sled::GREEN_DUTY);  // back to the loading glow
    l.enabled = false;
    l.error(6000);
    l.at(6001, r, g);
    assert(!r && !g);
  }
  {  // the press state machine: acts on release, on the same button
    prs::Ctx c;
    prs::Press p;
    auto look = [&](int x, int y, prs::Rect& r) { return prs::under(c, x, y, r); };
    c.screen = prs::SC_SETTINGS;
    c.W = scr::W;
    c.H = scr::H;
    c.stY0 = scr::SMALL ? 30 : 42;
    c.stStep = 34;
    c.stPerPage = scr::SMALL ? 5 : 7;
    c.stFootY = scr::SMALL ? 200 : 288;
    c.stRows = 12;
    c.pages = 2;
    c.smallBoard = scr::SMALL;
    int y = c.stY0 + 5;
    assert(p.update(0, true, 100, y, look) == prs::PRESS);
    assert(p.update(10, true, 101, y, look) == prs::NONE);
    assert(p.showLeft(20) == prs::MIN_SHOW_MS - 20 && p.showLeft(500) == 0);
    assert(p.update(30, false, 0, 0, look) == prs::ACT && p.dx == 100 && p.dy == y);
    assert(p.update(40, false, 0, 0, look) == prs::NONE);
    // slide off the row: cancels once, and lifting does nothing
    assert(p.update(100, true, 100, y, look) == prs::PRESS);
    assert(p.update(110, true, 100, y + 60, look) == prs::CANCEL);
    assert(p.update(120, true, 100, y + 60, look) == prs::NONE);
    assert(p.update(130, true, 100, y, look) == prs::NONE);  // sliding back in does not press again
    assert(p.update(140, false, 0, 0, look) == prs::NONE);
    // a small drift stays on the button
    assert(p.update(230, true, 100, y, look) == prs::PRESS);
    assert(p.update(240, true, 100, c.stY0 + 32 + 4, look) == prs::NONE);  // inside the 8 pixel slack
    assert(p.update(250, false, 0, 0, look) == prs::ACT);
    // touching a dead spot presses nothing
    assert(p.update(300, true, 3, c.stY0 + 33, look) == prs::NONE);
    assert(p.update(310, false, 0, 0, look) == prs::NONE);
    // a finger already down when a screen opens presses nothing, even if it drags over a button
    p.screenChanged(true);
    assert(p.update(400, true, 100, y, look) == prs::NONE);
    assert(p.update(410, false, 0, 0, look) == prs::NONE);
    assert(p.update(420, true, 100, y, look) == prs::PRESS);
  }
  {  // hit tables: every button found, none smaller than 32 x 32
    int found = 0;
    for (int W : {320, 480}) {
      prs::Ctx c;
      c.W = W;
      c.H = W == 320 ? 240 : 320;
      c.back = c.prev = c.next = c.action = true;
      c.tiles = 6;
      auto check = [&](int x, int y) {
        prs::Rect r;
        if (!prs::under(c, x, y, r)) return false;
        assert(r.has(x, y) && r.x1 - r.x0 >= 32 && r.y1 - r.y0 >= 32);
        assert(r.x0 >= 0 && r.y0 >= 0 && r.x1 <= c.W && r.y1 <= c.H);
        found++;
        return true;
      };
      assert(check(5, 5) && check(c.W - 40, 5) && check(c.W - 5, 5));                // back, search, settings
      assert(check(20, c.H - 5) && check(70, c.H - 5) && check(c.W - 20, c.H - 5));  // previous, next, action
      for (int i = 0; i < 6; i++) {
        prs::Rect t = prs::tileRect(W, i);
        assert(check(t.x0 + 1, t.y0 + 1) && check(t.x1 - 1, t.y1 - 1));
      }
      assert(!check(c.W / 2, c.H - 5));  // the page counter does nothing
      c.screen = prs::SC_DETAILS;
      assert(check(10, c.H - 5) && check(c.W - 10, c.H - 5) && !check(10, 100));
    }
    prs::Ctx c;
    c.W = scr::W;
    c.H = scr::H;
    c.screen = prs::SC_PAUSE;
    for (int i = 0; i < ovl::PA_COUNT; i++) {
      int x0, y0, x1, y1;
      ovl::pauseCell(i, x0, y0, x1, y1);
      prs::Rect r;
      assert(x1 - x0 >= 32 && y1 - y0 >= 32);
      assert(prs::under(c, (x0 + x1) / 2, (y0 + y1) / 2, r) && r.x0 == x0 && r.y1 == y1);
      found++;
    }
    c.screen = prs::SC_SETTINGS;
    c.stY0 = scr::SMALL ? 30 : 42;
    c.stStep = 34;
    c.stPerPage = scr::SMALL ? 5 : 7;
    c.stFootY = scr::SMALL ? 200 : 288;
    c.stRows = scr::SMALL ? 14 : 12;
    c.pages = (c.stRows + c.stPerPage - 1) / c.stPerPage;
    c.smallBoard = scr::SMALL;
    for (int page = 0; page < c.pages; page++) {
      c.setPage = page;
      for (int k = 0; k < c.stPerPage; k++) {
        prs::Rect r;
        bool want = page * c.stPerPage + k < c.stRows;
        assert(prs::under(c, 50, c.stY0 + k * c.stStep + 10, r) == want);
        if (want) {
          assert(r.y1 - r.y0 >= 32 && r.x1 - r.x0 > 200);
          found++;
        }
      }
    }
    prs::Rect r;
    assert(prs::under(c, 20, c.stFootY + 10, r) && r.y1 - r.y0 >= 30 && r.x1 - r.x0 >= 90);  // Back
    assert(prs::under(c, c.smallBoard ? 150 : 200, c.stFootY + 10, r));                       // More
    c.pages = 1;
    assert(!prs::under(c, c.smallBoard ? 150 : 200, c.stFootY + 10, r));  // no More with one page
    c.screen = prs::SC_DISPLAY;
    c.titleH = scr::SMALL ? 28 : 40;
    assert(prs::under(c, 50, c.titleH + 20, r) && prs::under(c, 20, c.H - 10, r) && !prs::under(c, 50, c.titleH + 70, r));
    c.displayRows = 2;
    assert(prs::under(c, 50, c.titleH + 70, r));
    printf("idletest (%s): passed; %d buttons in the hit tables\n", scr::SMALL ? "320" : "480", found);
  }
  return 0;
}
