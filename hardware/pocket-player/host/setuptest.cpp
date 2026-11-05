// Mac test for src/setupflow.h, src/softgfx.h's map and src/displaysetup.h: the four steps and what BOOT and OK do in each,
// the turn each combination gives, the software quarter turns, and the saved record.
#include <stdio.h>
#include <stdlib.h>
#include "displaysetup.h"
#include "setupflow.h"
#include "softgfx.h"

static int fails = 0;
#define CHECK(c, ...) do { if (!(c)) { fails++; printf("FAIL: " __VA_ARGS__); printf("\n"); } } while (0)

int main() {
  // ---- BOOT does the step's action, OK moves on ----
  {
    sf::Flow f;
    CHECK(f.step == sf::FLIP && f.u == 0 && f.softMode() == 0, "starts at step 1, portrait turn 0");
    f.boot(); CHECK(f.u == 1, "step 1 mirrors left to right");
    f.boot(); CHECK(f.u == 0, "step 1 twice is back");
    f.boot();
    CHECK(f.ok() && f.step == sf::ROTATE, "OK on step 1 goes to step 2");
    f.boot(); CHECK(f.u == (1 ^ 3), "step 2 turns half a turn (both mirror bits)");
    f.boot(); CHECK(f.u == 1, "step 2 twice is back");
    CHECK(f.softMode() == 0, "steps 1 and 2 draw in the portrait turn");
    CHECK(f.ok() && f.step == sf::ORIENT && f.soft == 1 && f.softMode() == 1, "step 3 starts as the first quarter turn");
    f.boot(); CHECK(f.soft == 2 && f.softMode() == 2, "step 3 BOOT is the other quarter turn");
    f.boot(); CHECK(f.soft == 1, "and back");
    CHECK(f.ok() && f.step == sf::COLORS && f.softMode() == 1, "step 4 keeps the chosen quarter turn");
    for (int i = 1; i <= 4; i++) { f.boot(); CHECK(f.color == (i & 3), "step 4 cycles four color modes (%d)", f.color); }
    CHECK(f.panelBits(1) == 1 && (f.panelBits(0) & 1) == 0, "the driver bit is kept");
    f.color = 3;
    CHECK(f.panelBits(1) == 7 && f.panelBits(0) == 6, "colors 3 = inverted and swapped (panel bits 2 and 4)");
    CHECK(!f.ok(), "OK on the last step ends the four steps");
  }
  // the four mirror states map to four distinct portrait rotations that never use the row/column exchange (odd rotations)
  {
    int seen = 0;
    for (int u = 0; u < 4; u++) { int r = sf::rotationFor(u, 1); CHECK((r & 1) == 0, "rotation %d is even (no exchange)", r); seen |= 1 << r; }
    CHECK(seen == (1 | 1 << 2 | 1 << 4 | 1 << 6), "four different even rotations");
    for (int u = 0; u < 4; u++) CHECK(sf::rotationFor(u, 0) == 1 + 2 * u && (sf::rotationFor(u, 0) & 1), "an old setup keeps the odd rotation");
  }
  // ---- the software quarter turns: every landscape point lands on the portrait panel once, the two modes are half a turn apart ----
  for (int mode = 1; mode <= 2; mode++) {
    static uint8_t hit[240 * 320];
    for (auto& h : hit) h = 0;
    sg::Xf xf; xf.mode = (uint8_t)mode;
    for (int y = 0; y < 240; y++) for (int x = 0; x < 320; x++) {
      int px, py;
      xf.pt(x, y, px, py);
      CHECK(px >= 0 && px < 240 && py >= 0 && py < 320, "mode %d point %d,%d off the panel", mode, x, y);
      hit[py * 240 + px]++;
    }
    int bad = 0;
    for (auto h : hit) bad += h != 1;
    CHECK(bad == 0, "mode %d covers the panel exactly once (%d off)", mode, bad);
  }
  {
    sg::Xf a, b; a.mode = 1; b.mode = 2;
    for (int y = 0; y < 240; y += 13) for (int x = 0; x < 320; x += 11) {
      int ax, ay, bx, by;
      a.pt(x, y, ax, ay); b.pt(x, y, bx, by);
      CHECK(ax + bx == 239 && ay + by == 319, "modes 1 and 2 are half a turn apart at %d,%d", x, y);
    }
    // a rect's map is the map of its corners
    sg::Xf r; r.mode = 1;
    int px, py, pw, ph, c0x, c0y, c1x, c1y;
    r.rect(10, 20, 50, 30, px, py, pw, ph);
    r.pt(10, 20, c0x, c0y); r.pt(59, 49, c1x, c1y);
    CHECK(px == (c0x < c1x ? c0x : c1x) && py == (c0y < c1y ? c0y : c1y) && pw == 30 && ph == 50, "rect map, mode 1");
  }
  // ---- the colors step: only the mode that matches the glass shows white, black and the words in their own colors ----
  for (int glass = 0; glass < 4; glass++) {
    int right = -1;
    for (int mode = 0; mode < 4; mode++)
      if (sf::shownColor(0xFF0000, glass, mode) == 0xFF0000 && sf::shownColor(0x00FF00, glass, mode) == 0x00FF00 && sf::shownColor(0x0000FF, glass, mode) == 0x0000FF &&
          sf::shownColor(0xFFFFFF, glass, mode) == 0xFFFFFF && sf::shownColor(0, glass, mode) == 0) {
        CHECK(right < 0, "two color modes read right");
        right = mode;
      }
    CHECK(right == glass, "glass fault %d: the mode that reads right is %d", glass, right);
  }
  // ---- the driver and the card ----
  CHECK(ds::nextDriver(0) == 1 && ds::nextDriver(1) == 0 && ds::nextDriver(7) == 0 && ds::nextDriver(6) == 1, "the driver steps alone and clears the color bits");
  CHECK(!ds::useCardRecord(true) && ds::useCardRecord(false), "a setup begun in NVS is never replaced by the card's older record");
  // the record, with and without the new soft field
  ds::Record r, back;
  r.panel = 5; r.turn = 2; r.soft = 2;
  r.cal.swap = 1; r.cal.u0 = 3650; r.cal.u1 = 310; r.cal.v0 = 280; r.cal.v1 = 3720; r.cal.valid = 1;
  r.full = 1;
  char buf[240];
  ds::format(r, buf, sizeof buf);
  CHECK(ds::parse(buf, back) && back.panel == 5 && back.turn == 2 && back.soft == 2 && back.cal.swap == 1 && back.cal.u0 == 3650 && back.cal.u1 == 310 &&
            back.cal.v0 == 280 && back.cal.v1 == 3720 && back.full == 1 && back.cal.valid == 1, "record round trip");
  CHECK(ds::parse("pocket-board 1\npanel=1\nturn=3\nswap=0\nu0=1\nu1=2\nv0=3\nv1=4\nfull=1\n", back) && back.soft == 0 && back.turn == 3, "an old record (no soft line) reads as soft 0");
  CHECK(!ds::parse("pocket-board 1\npanel=1\nturn=0\nswap=0\nu0=1\nu1=2\nv0=3\nv1=4\nsoft=3\n", back), "soft 3 refused");
  CHECK(!ds::parse("hello", back), "foreign file refused");
  CHECK(!ds::parse("pocket-board 1\npanel=9\nturn=0\nswap=0\nu0=1\nu1=2\nv0=3\nv1=4\n", back), "panel 9 refused");
  CHECK(!ds::parse("pocket-board 1\npanel=1\nturn=0\n", back), "a short record refused");
  CHECK(!ds::parse("pocket-board 1\npanel=1\nturn=4\nswap=0\nu0=1\nu1=2\nv0=3\nv1=4\n", back), "turn 4 refused");
  char chip[16], path[48];
  ds::chipHex(0x24A1B2C3D4E5ULL, chip);
  ds::cardPath(chip, path, sizeof path);
  CHECK(!strcmp(chip, "24A1B2C3D4E5") && !strcmp(path, "/pocket/boards/24A1B2C3D4E5.cfg"), "chip path %s", path);
  printf("setup flow: %d failures\n", fails);
  return fails ? 1 : 0;
}
