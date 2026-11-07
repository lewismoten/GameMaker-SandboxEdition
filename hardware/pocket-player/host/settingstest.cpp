// Mac test and renders for the Settings screen (src/settingsdraw.h, through src/pressrect.h as the board taps it): every tab
// and page at both hands, the Controls preview lit by a real touch through src/controls.h, and Near pad + Raised.
// Checks: every button (Back, tabs, chips, More) is at least 32 x 32, on screen, apart from the others and found by the hit
// table; every label fits its button and every row name its column; every row of a tab is on one of its pages.
//   settingstest [out dir]      build with -lz; add -DPOCKET_CYD28 for the 320 x 240 board. PNGs: settings-<w>-<tab>-p<page>-<hand>.png
#include <stdio.h>
#include <string>
#include <vector>
namespace textdatum_t { constexpr int middle_center = 4, top_left = 0; }
#include "canvas.h"
#include "pressrect.h"
#include "settingsdraw.h"

static int failures = 0;
static void fail(const std::string& m) { printf("FAIL  %s\n", m.c_str()); failures++; }
static bool overlap(const st::Box& a, const st::Box& b) { return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1; }

static ctl::Need demoNeed() {
  ctl::Need n;
  n.left = n.right = n.up = n.down = n.space = n.enter = true;
  n.jump = true;
  return n;
}
// The preview as main.cpp drives it: the controls model gets the touch scaled up to the game view.
struct Lit { uint8_t dirs = 0, btn = 0, held = 0; };
static Lit touchPreview(const ctl::Settings& s, int gx, int gy) {
  ctl::Controls c;
  c.configure(s, demoNeed());
  int id = 1, sz = 30;
  for (uint32_t t = 1000; t < 1200; t += 8) c.update(&id, &gx, &gy, &sz, 1, t);
  ctl::Change ch[16];
  int n = c.flush(ch, 16);
  Lit l;
  l.dirs = c.padDirs;
  l.btn = c.btnDown;
  for (int i = 0; i < n; i++) {
    if (!ch[i].down) continue;
    switch (ch[i].scan) {
      case ctl::S_LEFT: l.held |= 1; break;
      case ctl::S_RIGHT: l.held |= 2; break;
      case ctl::S_UP: l.held |= 4; break;
      case ctl::S_DOWN: l.held |= 8; break;
      case ctl::S_SPACE: l.held |= 16; break;
      case ctl::S_ENTER: l.held |= 32; break;
    }
  }
  return l;
}

static void shot(const std::string& dir, const std::string& name, const st::View& v, const st::Values& vals, const Lit& lit = Lit()) {
  Canvas c(scr::W, scr::H);
  st::CardInfo card;
  card.builtIn = 30;
  snprintf(card.state, sizeof card.state, "Card: 12 games");
  snprintf(card.space, sizeof card.space, v.fromPause ? "Free space: see it from the game list" : "Card: 14.2 GB free of 14.8 GB");  // main.cpp's words
  snprintf(card.flash, sizeof card.flash, "Built-in: 380 KB free");
  card.fromPause = v.fromPause;
  ctl::Layout L = ctl::makeLayout(vals.s, demoNeed());
  st::screen(c, v, vals, card, L, demoNeed(), lit.dirs, lit.btn, lit.held);
  if (!dir.empty()) writePng(dir + "/" + name + ".png", c.W, c.H, rgbOf(c));
}

int main(int argc, char** argv) {
  std::string dir = argc > 1 ? argv[1] : "";
  const char* wn = scr::SMALL ? "320" : "480";
  int buttons = 0, shots = 0;
  // the bar
  std::vector<st::Box> bar = {st::backBox()};
  for (int t = 0; t < st::T_COUNT; t++) {
    st::Box b = st::tabBox(t);
    if ((int)(strlen(st::tabName(t)) * 6 * st::G.tabSize) > b.x1 - b.x0 - 4) fail(std::string("tab label too wide: ") + st::tabName(t));
    bar.push_back(b);
  }
  for (size_t i = 0; i < bar.size(); i++) {
    const st::Box& b = bar[i];
    if (b.x1 - b.x0 < 32 || b.y1 - b.y0 < 32 || b.x0 < 0 || b.x1 > scr::W || b.y1 > st::G.barH) fail("bar button small or off screen");
    for (size_t j = i + 1; j < bar.size(); j++) if (overlap(b, bar[j])) fail("bar buttons overlap");
  }
  for (int t = 0; t < st::T_COUNT; t++) {
    st::Item all[12];
    int n = st::tabItems((st::Tab)t, all), seen = 0;
    for (int page = 0; page < st::pages((st::Tab)t); page++) {
      for (int pause = 0; pause < 2; pause++) {
        st::View v;
        v.tab = (st::Tab)t;
        v.page = page;
        v.fromPause = pause;
        prs::Ctx ctx;
        ctx.screen = prs::SC_SETTINGS;
        ctx.W = scr::W;
        ctx.H = scr::H;
        ctx.settings = v;
        std::vector<st::Box> boxes = bar;
        if (t == st::T_CONTROLS) {
          st::Box p = st::previewBox();
          if (p.x1 > scr::W || p.y1 > st::G.moreY0) fail("preview off screen or over More");
          prs::Rect r;
          if (prs::under(ctx, (p.x0 + p.x1) / 2, (p.y0 + p.y1) / 2, r)) fail("the preview counts as a button");
          if (st::hit(v, (p.x0 + p.x1) / 2, (p.y0 + p.y1) / 2).kind != st::K_PREVIEW) fail("the preview is not found");
          boxes.push_back(p);
          if (st::pages(v.tab) > 1) boxes.push_back(st::moreBox());
        }
        st::Item it[12];
        int k = st::pageItems(v, it);
        if (!pause) seen += k;
        for (int i = 0; i < k; i++) {
          st::RowBox rb = st::rowBox(v.tab, i);
          int nameW = (int)(strlen(st::info(it[i]).name) * 6 * st::G.nameSize);
          int room = st::stacked(v.tab) ? st::colX1(v.tab) - rb.nameX : rb.chips.x0 - 4 - rb.nameX;
          if (nameW > room) fail(std::string("row name too wide: ") + st::info(it[i]).name);
          int c = st::chipCount(it[i]);
          for (int j = 0; j < c; j++) {
            st::Box b = st::chipBox(rb.chips, c, j);
            char lab[24];
            st::chipLabel(it[i], j, lab, sizeof lab);
            std::string nm = std::string(st::info(it[i]).name) + " / " + lab;
            if (b.x1 - b.x0 < 32 || b.y1 - b.y0 < 32) fail("chip under 32 x 32: " + nm);
            if (b.x0 < 0 || b.x1 > scr::W || b.y1 > scr::H) fail("chip off screen: " + nm);
            if ((int)strlen(lab) * 6 > b.x1 - b.x0 - 6) fail("chip label does not fit: " + nm);
            prs::Rect r;
            bool live = !(it[i] == st::I_RESCAN && pause);
            if (prs::under(ctx, (b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, r) != live) fail("hit table misses " + nm);
            st::Hit h = st::hit(v, (b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2);
            if (live && (h.kind != st::K_CHIP || h.item != it[i] || h.chip != j)) fail("hit finds the wrong chip for " + nm);
            for (auto& o : boxes) if (overlap(o, b)) fail("chip overlaps another button: " + nm);
            boxes.push_back(b);
            buttons++;
          }
        }
        if (pause) continue;
        for (int hand = 0; hand < 2; hand++) {
          st::Values vals;
          vals.s.lefty = hand;
          char name[64];
          snprintf(name, sizeof name, "settings-%s-%s-p%d-%s", wn, st::tabName(t), page + 1, hand ? "left" : "right");
          shot(dir, name, v, vals);
          shots++;
        }
      }
    }
    if (seen != n) fail(std::string("not every row of ") + st::tabName(t) + " is on a page");
  }
  // The Controls preview lit by a touch on the pad's upper right (Right + Jump on the 2.8 inch board's arc), the Card tab from a
  // paused game, and Near pad + Raised with the finger on Jump.
  {
    st::Values vals;
    st::View v;
    ctl::Layout L = ctl::makeLayout(vals.s, demoNeed());
    v.last = st::I_DEAD;
    shot(dir, std::string("settings-") + wn + "-Controls-hint", v, vals);
    Lit lit = touchPreview(vals.s, L.pad.cx + L.pad.r * 45 / 100, L.pad.cy - L.pad.r * 45 / 100);
    if (!lit.held) fail("a touch on the preview's pad pressed nothing");
    shot(dir, std::string("settings-") + wn + "-Controls-touch", v, vals, lit);
    vals.s.jumpNear = vals.s.raised = 1;
    v.last = st::I_JUMP;
    L = ctl::makeLayout(vals.s, demoNeed());
    Lit j = touchPreview(vals.s, L.space.cx, L.space.cy);
    if (!(j.held & 16)) fail("a touch on the preview's Jump near the pad pressed no Space");
    shot(dir, std::string("settings-") + wn + "-Controls-nearpad-raised", v, vals, j);
    v = st::View();
    v.tab = st::T_CARD;
    v.fromPause = true;
    shot(dir, std::string("settings-") + wn + "-Card-paused", v, st::Values());
    shots += 4;
  }
  printf("settingstest (%s): %s; %d buttons checked, %d renders%s%s\n", wn, failures ? "FAILURES" : "passed", buttons, shots, dir.empty() ? "" : " in ", dir.c_str());
  return failures ? 1 : 0;
}
