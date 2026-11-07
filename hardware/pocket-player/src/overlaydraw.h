// The play overlay's drawing, moved out of main.cpp unchanged so the Mac can render it (host/playshots.cpp): the
// pad, Space and Enter discs, the MENU and KEYS chips, the key tiles, the test banner, and the pause menu.
// `Spr` is the band's sprite (LovyanGFX on the board, a small look-alike on the Mac). Text on the Mac is the 6 x 8
// bitmap font; the board's own font is a similar one.
#pragma once
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "banner.h"
#include "btnicon.h"
#include "controls.h"
#include "gmcfg.h"
#include "paddraw.h"
#include "screen.h"

namespace ovl {
constexpr uint16_t C_WHITE = 0xFFFF, C_BLACK = 0, C_YELLOW = 0xFF2A, C_DARK = 0x2104;

// A labeled rounded button on the screen (menus; the pause menu's rows).
template <class G> void button(G& tft, int x0, int y0, int x1, int y1, const char* label, bool hot, uint16_t fill, float size = 2) {
  tft.fillRoundRect(x0, y0, x1 - x0, y1 - y0, 6, hot ? C_YELLOW : fill);
  tft.drawRoundRect(x0, y0, x1 - x0, y1 - y0, 6, C_WHITE);
  tft.setTextColor(hot ? C_BLACK : C_WHITE, hot ? C_YELLOW : fill);
  tft.setTextSize(size);
  tft.setTextDatum(textdatum_t::middle_center);
  tft.drawString(label, (x0 + x1) / 2, (y0 + y1) / 2);
  tft.setTextDatum(textdatum_t::top_left);
}

// ---- the pause menu: a title line (the game and its level), then six buttons in two columns of three ----
enum { PA_RESUME, PA_RESTART_LEVEL, PA_RESTART_GAME, PA_HELP, PA_SETTINGS, PA_QUIT, PA_COUNT };
inline const char* pauseItem(int i) {
  static const char* const names[PA_COUNT] = {"Resume", "Restart level", "Restart game", "How to play", "Settings", "Quit to library"};
  return names[i];
}
struct PauseGeom { int boxX, boxY, boxW, boxH, x0, y0, colW, colGap, step, h, titleY, titleSize; float textSize; };
constexpr PauseGeom PAUSE = scr::SMALL ? PauseGeom{4, 4, 312, 232, 12, 28, 144, 8, 68, 60, 11, 1, 1.5f}
                                       : PauseGeom{16, 16, 448, 288, 28, 54, 206, 12, 80, 70, 26, 2, 2.f};
// Button i's rectangle: the left column is play (Resume, Restart level, Restart game), the right the rest.
inline void pauseCell(int i, int& x0, int& y0, int& x1, int& y1) {
  x0 = PAUSE.x0 + i / 3 * (PAUSE.colW + PAUSE.colGap);
  y0 = PAUSE.y0 + i % 3 * PAUSE.step;
  x1 = x0 + PAUSE.colW;
  y1 = y0 + PAUSE.h;
}
// The button under (x, y), or -1.
inline int pauseHit(int x, int y) {
  for (int i = 0; i < PA_COUNT; i++) {
    int x0, y0, x1, y1;
    pauseCell(i, x0, y0, x1, y1);
    if (x >= x0 && x < x1 && y >= y0 && y < y1) return i;
  }
  return -1;
}
// The menu over the paused game: `game` (its title, cut to fit) at the left of the title line and "Level n" at the right.
template <class G> void pauseMenu(G& tft, const char* game, int level) {
  const PauseGeom& p = PAUSE;
  tft.fillRect(p.boxX, p.boxY, p.boxW, p.boxH, C_BLACK);
  tft.drawRect(p.boxX, p.boxY, p.boxW, p.boxH, C_WHITE);
  char lv[16], name[48];
  snprintf(lv, sizeof lv, "Level %d", level + 1);
  int cw = 6 * p.titleSize, room = (p.boxW - 2 * (p.x0 - p.boxX)) / cw - (int)strlen(lv) - 2;
  snprintf(name, sizeof name, "%s", game ? game : "");
  if ((int)strlen(name) > room && room > 3) { name[room - 3] = 0; strcat(name, "..."); }
  else if (room <= 3) name[0] = 0;
  tft.setTextSize(p.titleSize);
  tft.setTextColor(C_WHITE, C_BLACK);
  tft.setCursor(p.x0, p.titleY);
  tft.print(name);
  tft.setTextColor(C_YELLOW, C_BLACK);
  tft.setCursor(p.boxX + p.boxW - (p.x0 - p.boxX) - (int)strlen(lv) * cw, p.titleY);
  tft.print(lv);
  for (int i = 0; i < PA_COUNT; i++) {
    int x0, y0, x1, y1;
    pauseCell(i, x0, y0, x1, y1);
    button(tft, x0, y0, x1, y1, pauseItem(i), false, C_DARK, p.textSize);
  }
}

// ---- How to play: the keys the game lists (its controls.json labels, packed as the .cfg's `key` lines) ----
// A letter the controls treat as an arrow (A for Left) is left out when the arrow is listed too. Any tap goes back.
constexpr int HELP_TOP = scr::SMALL ? 26 : 34, HELP_Y0 = scr::SMALL ? 34 : 44, HELP_BACK_Y = scr::SMALL ? 208 : 282;
inline bool helpAlias(const gm::Cfg& cfg, int i) {
  int s = cfg.keys[i].scan, as = ctl::needScan(s);
  for (int j = 0; j < cfg.nkeys && as != s; j++) if (cfg.keys[j].scan == as) return true;
  return false;
}
template <class G> void helpPage(G& tft, const gm::Cfg& cfg) {
  int n = 0;
  for (int i = 0; i < cfg.nkeys; i++) n += !helpAlias(cfg, i);
  // Big letters while they fit (up to 9 keys on the small board), else small ones.
  const int HELP_SIZE = !scr::SMALL || n * 18 <= HELP_BACK_Y - 4 - HELP_Y0 ? 2 : 1, HELP_STEP = HELP_SIZE == 2 ? (scr::SMALL ? 18 : 19) : 14;
  tft.fillRect(0, 0, scr::W, scr::H, C_BLACK);
  tft.fillRect(0, 0, scr::W, HELP_TOP, C_DARK);
  tft.setTextSize(2);
  tft.setTextColor(C_WHITE, C_DARK);
  tft.setCursor(8, scr::SMALL ? 5 : 9);
  tft.print("How to play");
  int cw = 6 * HELP_SIZE, y = HELP_Y0, shown = 0;
  tft.setTextSize(HELP_SIZE);
  for (int i = 0; i < cfg.nkeys && y + 8 * HELP_SIZE <= HELP_BACK_Y - 4; i++) {
    if (helpAlias(cfg, i)) continue;
    const char* key = ctl::scanName(cfg.keys[i].scan);
    tft.setTextColor(C_YELLOW, C_BLACK);
    tft.setCursor(8 + (5 - (int)strlen(key)) * cw, y);
    tft.print(key);
    tft.setTextColor(C_WHITE, C_BLACK);
    tft.setCursor(8 + 7 * cw, y);
    tft.print(cfg.keys[i].label[0] ? cfg.keys[i].label : "(no label)");
    y += HELP_STEP;
    shown++;
  }
  if (!shown) {
    tft.setTextColor(C_WHITE, C_BLACK);
    tft.setCursor(8, y);
    tft.print("No keys listed: walk with the pad.");
  }
  button(tft, 0, HELP_BACK_Y, scr::W, scr::H, "Back", false, C_DARK);
}

template <class Spr> struct Overlay {
  Spr& spr;
  uint16_t* band;            // the band's pixels (panel colors), the memory the sprite draws into
  const uint16_t* pal;
  const gm::Cfg& cfg;
  const ctl::Controls& controls;
  const gm::BtnIcon* icons;  // 2 + MAXEXTRA pictures
  int bandX = 0, bandY = 0, bandW = 0, bandH = 0;  // the band's corner and size on the screen
  Overlay(Spr& s, uint16_t* b, const uint16_t* p, const gm::Cfg& c, const ctl::Controls& k, const gm::BtnIcon* i) : spr(s), band(b), pal(p), cfg(c), controls(k), icons(i) {}

  const char* labelOf(int scan, const char* fallback) {
    for (int i = 0; i < cfg.nkeys; i++) if (cfg.keys[i].scan == scan) return cfg.keys[i].label;
    return fallback;
  }


  int textW(const char* s, float size) {
    spr.setTextSize(size);
    return spr.textWidth(s);
  }
  int textH(float size) { return (int)(8 * size + 0.5f); }

  // Where a label may go: a disc (the width left at a height is its chord, less the ring) or a rectangle.
  struct Box { bool round; int cx, cy, r, w; };
  int availW(const Box& b, int y0, int y1) {
    if (!b.round) return b.w - 6;
    int dy = abs(y0 - b.cy) > abs(y1 - b.cy) ? abs(y0 - b.cy) : abs(y1 - b.cy);
    int rr = b.r - 2;
    return dy >= rr ? 0 : (int)(2 * sqrtf((float)(rr * rr - dy * dy)));
  }

  // Text centered on (x, y) of the screen, with a dark edge when it sits on the game.
  void putText(const char* s, int x, int y, uint16_t fg, bool edge) {
    spr.setTextDatum(textdatum_t::middle_center);
    x -= bandX; y -= bandY;
    if (edge) {
      spr.setTextColor(C_BLACK);
      spr.drawString(s, x - 1, y); spr.drawString(s, x + 1, y); spr.drawString(s, x, y - 1); spr.drawString(s, x, y + 1);
    }
    spr.setTextColor(fg);
    spr.drawString(s, x, y);
  }

  // The key's name, as large as fits (2, 1.5, then 1), centered at (cx, yc).
  void drawName(const Box& b, const char* name, int yc, uint16_t fg, bool edge) {
    static const float sizes[3] = {2.0f, 1.5f, 1.0f};
    float sz = 1.0f;
    for (int i = 0; i < 3; i++) {
      sz = sizes[i];
      int h = textH(sz);
      if (textW(name, sz) <= availW(b, yc - h / 2, yc + h / 2)) break;
    }
    spr.setTextSize(sz);
    putText(name, b.cx, yc, fg, edge);
  }

  // The game's label, small, from topY down, at most maxH tall and never outside the box: one line, else two
  // (split at the space nearest the middle), else smaller, else cut with "...".
  void drawLabel(const Box& b, const char* label, int topY, int maxH, uint16_t fg, bool edge) {
    static const float sizes[2] = {1.0f, 0.75f};
    char l1[24], l2[24];
    int len = (int)strlen(label);
    if (len > 23) len = 23;
    for (int pass = 0; pass < 3; pass++) {
      float sz = pass < 2 ? sizes[pass] : sizes[1];
      int h = textH(sz);
      if (h > maxH) continue;
      bool cut = pass == 2;
      int nl = 1;
      memcpy(l1, label, len); l1[len] = 0; l2[0] = 0;
      if (textW(l1, sz) > availW(b, topY, topY + h) && 2 * h <= maxH) {
        int best = -1;
        for (int i = 1; i < len - 1; i++)
          if (label[i] == ' ' && (best < 0 || abs(i - len / 2) < abs(best - len / 2))) best = i;
        if (best > 0) {
          memcpy(l1, label, best); l1[best] = 0;
          memcpy(l2, label + best + 1, len - best - 1); l2[len - best - 1] = 0;
          nl = 2;
        }
      }
      bool ok = true;
      for (int k = 0; k < nl; k++) {
        char* s = k ? l2 : l1;
        int y0 = topY + k * h, aw = availW(b, y0, y0 + h);
        if (textW(s, sz) <= aw) continue;
        if (!cut) { ok = false; break; }
        int n = (int)strlen(s);
        while (n > 0) {
          s[n - 1] = 0; n--;
          char t[28];
          snprintf(t, sizeof t, "%s...", s);
          if (textW(t, sz) <= aw) { strcpy(s, t); break; }
        }
        if (n == 0) s[0] = 0;
      }
      if (!ok) continue;
      spr.setTextSize(sz);
      for (int k = 0; k < nl; k++) {
        const char* s = k ? l2 : l1;
        if (s[0]) putText(s, b.cx, topY + k * h + h / 2, fg, edge);
      }
      return;
    }
  }

  // A 20 x 20 picture (palette indices) scaled to S x S at (x0, y0) of the screen, on a dark backing, written
  // straight into the band (it holds panel colors, as `pal` does).
  void drawIcon(const uint8_t* px, int x0, int y0, int S, bool backing = true, int clipR = 0) {
    if (backing) spr.fillRect(x0 - 1 - bandX, y0 - 1 - bandY, S + 2, S + 2, C_BLACK);
    for (int dy = 0; dy < S; dy++) {
      int Y = y0 + dy - bandY;
      if (Y < 0 || Y >= bandH) continue;
      for (int dx = 0; dx < S; dx++) {
        int X = x0 + dx - bandX;
        if (X < 0 || X >= bandW) continue;
        uint8_t v = px[(dy * 20 / S) * 20 + dx * 20 / S];
        if (clipR) {  // keep to a disc around the picture's middle (the ring of a round button)
          int ex = 2 * dx - S + 1, ey = 2 * dy - S + 1;
          if (ex * ex + ey * ey > 4 * clipR * clipR) continue;
        }
        if (v != 255) band[Y * bandW + X] = pal[v];
      }
    }
  }

  // A round button: the key's name big, and under it the picture of what it throws or uses, else the game's label.
  void disc(const ctl::Disc& d, bool down, int scan, const char* fallback, const gm::BtnIcon& ic) {
    int cx = d.cx - bandX, cy = d.cy - bandY;
    if (down) spr.fillCircle(cx, cy, d.r, C_YELLOW);
    spr.drawCircle(cx, cy, d.r + 1, C_BLACK);
    spr.drawCircle(cx, cy, d.r, down ? C_BLACK : C_WHITE);
    spr.drawCircle(cx, cy, d.r - 1, down ? C_BLACK : C_WHITE);
    const char* name = ctl::scanName(scan);
    const char* label = labelOf(scan, fallback);
    bool sub = ic.px || (label[0] && strcmp(label, name));
    Box b{true, d.cx, d.cy, d.r, 0};
    uint16_t fg = down ? C_BLACK : C_WHITE;
    if (ic.px) {  // the picture fills the button (clipped to the ring), no text
      if (!down) spr.fillCircle(cx, cy, d.r - 2, C_BLACK);
      int S = (d.r - 2) * 17 / 10;
      drawIcon(ic.px, d.cx - S / 2, d.cy - S / 2, S, false, d.r - 2);
      return;
    }
    drawName(b, name, sub ? d.cy - d.r / 3 : d.cy, fg, !down);
    if (sub) {
      drawLabel(b, label, d.cy + 3, d.r - 7, fg, !down);
    }
  }
  void chip(const ctl::Rect& r, const char* label, bool down) {
    int x0 = r.x0 - bandX, y0 = r.y0 - bandY, w = r.x1 - r.x0, h = r.y1 - r.y0;
    spr.fillRect(x0, y0, w, h, C_BLACK);  // square: the game isn't shown in its corners
    spr.fillRoundRect(x0, y0, w, h, 6, down ? C_YELLOW : C_DARK);
    spr.drawRoundRect(x0, y0, w, h, 6, C_WHITE);
    spr.setTextSize(1);
    putText(label, (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, down ? C_BLACK : C_WHITE, false);
  }
  // A key tile: the key's name, then the picture or the game's label.
  void tile(const ctl::Rect& r, int scan, bool on, const gm::BtnIcon& ic) {
    int x0 = r.x0 - bandX, y0 = r.y0 - bandY, w = r.x1 - r.x0, h = r.y1 - r.y0;
    spr.fillRect(x0, y0, w, h, C_BLACK);
    spr.fillRoundRect(x0, y0, w, h, 6, on ? C_YELLOW : C_DARK);
    spr.drawRoundRect(x0, y0, w, h, 6, C_WHITE);
    uint16_t fg = on ? C_BLACK : C_WHITE;
    Box b{false, (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, 0, w};
    const char* name = ctl::scanName(scan);
    const char* label = labelOf(scan, "");
    if (ic.px) {  // the picture fills the tile, no text
      int S = h - 6;
      drawIcon(ic.px, b.cx - S / 2, r.y0 + 3, S, false);
      return;
    }
    drawName(b, name, r.y0 + 13, fg, false);
    if (label[0] && strcmp(label, name)) drawLabel(b, label, r.y0 + 25, h - 28, fg, false);
  }

  bool hitsBand(int x0, int y0, int x1, int y1) { return x0 < bandX + bandW && x1 > bandX && y0 < bandY + bandH && y1 > bandY; }
  bool hitsDisc(const ctl::Disc& d) { return hitsBand(d.cx - d.r - 2, d.cy - d.r - 2, d.cx + d.r + 3, d.cy + d.r + 3); }
  bool hitsRect(const ctl::Rect& r) { return hitsBand(r.x0, r.y0, r.x1, r.y1); }

  // The controls that overlap the current band, drawn into it.
  void drawControls() {
    const ctl::Layout& L = controls.L;
    const ctl::Need& nd = controls.need;
    const ctl::Disc& p = L.pad;
    if (hitsDisc(p)) {
      paddraw::pad(spr, L, nd, controls.padDirs, bandX, bandY);
    }
    if (nd.space && hitsDisc(L.space)) disc(L.space, controls.btnDown & 1, ctl::S_SPACE, "Space", icons[0]);
    if (nd.enter && hitsDisc(L.enter)) disc(L.enter, controls.btnDown & 2, ctl::S_ENTER, "Enter", icons[1]);
    if (hitsRect(L.menu)) chip(L.menu, "MENU", controls.btnDown & 4);
    if (nd.nextra && hitsRect(L.keys)) chip(L.keys, "KEYS", (controls.btnDown & 8) || controls.keysOpen);
    if (controls.keysOpen)
      for (int i = 0; i < nd.nextra; i++)
        if (hitsRect(L.tile[i])) tile(L.tile[i], nd.extra[i], controls.tileDown & (1 << i), icons[2 + i]);
    if (banner::hits(bandX, bandY, bandW, bandH)) banner::paint(spr, bandX, bandY);  // the test banner, on top
  }
};
}  // namespace ovl
