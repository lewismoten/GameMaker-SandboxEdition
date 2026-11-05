// Mac test for src/setupflow.h and src/displaysetup.h: three taps on "the one that reads right" settle the picture's flip and
// the touch wiring over all 4 x 8 pairs, the rough calibration reads every quadrant, the color sets work out, and the saved
// record round-trips.
#include <stdio.h>
#include <stdlib.h>
#include "displaysetup.h"
#include "setupflow.h"

static int fails = 0;
#define CHECK(c, ...) do { if (!(c)) { fails++; printf("FAIL: " __VA_ARGS__); printf("\n"); } } while (0)

// Where a user whose picture is flipped by h and whose touch is wired as `wiring` taps on a glass quadrant, as a raw reading.
static void rawAt(int quad, int wiring, int& rx, int& ry) {
  int rq = sf::rawQuadOf(quad, wiring);
  rx = rq & 1 ? 3300 : 700;
  ry = rq & 2 ? 3300 : 700;
}

int main() {
  // ---- step 1: three taps tell all 32 (flip, wiring) pairs apart ----
  int solved = 0;
  for (int h = 0; h < sf::FLIPS; h++)
    for (int m = 0; m < sf::WIRINGS; m++) {
      sf::Solver sv;
      for (int r = 0; r < sf::ROUNDS; r++) {
        int rx, ry;
        rawAt(sf::glassQuad(r, h), m, rx, ry);
        sv.tap(r, sf::rawQuad(rx, ry));
      }
      CHECK(sv.count() == 1 && sv.flip() == h && sv.wiring() == m, "flip %d wiring %d -> %d left, flip %d wiring %d", h, m, sv.count(), sv.flip(), sv.wiring());
      solved++;
    }
  // each round's layout is a shuffle (every flip shown once), the copy that reads right is never off the glass
  for (int r = 0; r < sf::ROUNDS; r++) {
    int seen = 0;
    for (int q = 0; q < 4; q++) seen |= 1 << sf::LAYOUT[r][q];
    CHECK(seen == 15, "round %d shows every flip once", r);
  }
  // a tap that fits no pair (a stray one) leaves nothing, so the screen starts again
  { sf::Solver sv; sv.tap(0, 0); sv.tap(0, 1); CHECK(sv.count() == 0, "two taps that disagree in one round leave nothing"); }
  // the flips: applying the turn the solver says leaves no flip, for every start turn and flip (turns are xor, as labels)
  for (int t = 0; t < 4; t++)
    for (int h = 0; h < 4; h++) {
      int nt = sf::turnFor(t, h), delta = nt ^ t;
      CHECK(sf::TURN_OF_LABEL[h] == delta, "turn %d flip %d", t, h);
    }
  CHECK(sf::TURN_OF_LABEL[3] == 1 && sf::TURN_OF_LABEL[1] == 3 && sf::TURN_OF_LABEL[2] == 2, "both flips is the half turn (turn 1)");
  // the word reads differently in all four flips, each cell target is big, the arrow marks the bottom
  for (int a = 0; a < 4; a++)
    for (int b = a + 1; b < 4; b++) {
      int diff = 0;
      for (int y = 0; y < sf::WORD_H; y++) for (int x = 0; x < sf::WORD_W; x++) diff += sf::wordCell(a, x, y) != sf::wordCell(b, x, y);
      CHECK(diff >= 20, "flips %d and %d of the word differ in %d cells", a, b, diff);
    }
  CHECK(sf::CELL_W >= 60 && sf::CELL_H >= 60 && sf::SET_W >= 60 && sf::SET_H >= 60, "targets of 60 pixels");
  CHECK(sf::WORD_W * sf::WORD_SCALE <= sf::CELL_W && sf::WORD_H * sf::WORD_SCALE <= sf::CELL_H, "the word fits its quadrant");
  // ---- the rough calibration reads every quadrant / set center in all 8 wirings (what step 2 and the first tap of step 3 rely on) ----
  for (int m = 0; m < sf::WIRINGS; m++) {
    tc::Cal c = sf::roughCal(m);
    for (int q = 0; q < 4; q++) {
      int rx, ry, x, y;
      rawAt(q, m, rx, ry);
      tc::toScreen(c, rx, ry, sf::W, sf::H, x, y);
      CHECK((x >= sf::CELL_W) == (q & 1) && (y >= sf::CELL_H) == (q >> 1), "wiring %d quadrant %d read at %d,%d", m, q, x, y);
    }
    for (int k = 0; k < 4; k++) {  // step 2's sets: a tap at a set's center, from the raw reading of that screen point
      int cx = (k & 1) * sf::SET_W + sf::SET_W / 2, cy = sf::HEADER_H + (k >> 1) * sf::SET_H + sf::SET_H / 2;
      int p = (cx >= sf::CELL_W ? 1 : 0) | (cy >= sf::CELL_H ? 2 : 0), rx, ry, x, y;
      rawAt(p, m, rx, ry);
      tc::toScreen(c, rx, ry, sf::W, sf::H, x, y);
      CHECK(sf::setAt(x, y) == k, "wiring %d set %d read as %d (at %d,%d)", m, k, sf::setAt(x, y), x, y);
    }
  }
  // ---- step 2: the set that reads right is the one whose fault matches the panel's; applying its bits clears the fault ----
  for (int fault = 0; fault < 4; fault++) {
    int right = -1;
    for (int k = 0; k < 4; k++) {
      bool ok = true;
      for (int bar = 0; bar < sf::BARS; bar++) {
        uint8_t a[3], b[3];
        sf::faulted(k, bar, a);       // what the program draws for set k
        sf::faulted(fault, 0, b);     // (the panel's fault, applied on top below)
        uint8_t c[3] = {a[0], a[1], a[2]};
        if (fault & 1) for (int i = 0; i < 3; i++) c[i] = 255 - c[i];
        if (fault & 2) { uint8_t t = c[0]; c[0] = c[2]; c[2] = t; }
        for (int i = 0; i < 3; i++) ok = ok && c[i] == sf::BAR_RGB[bar][i];
      }
      if (ok) { CHECK(right < 0, "two sets read right"); right = k; }
    }
    CHECK(right == fault, "fault %d: the right set is %d", fault, right);
    CHECK(sf::panelBitsFor(right) == ((fault & 1 ? 2 : 0) | (fault & 2 ? 4 : 0)), "bits for fault %d", fault);
  }
  // ---- the driver and the card ----
  CHECK(ds::nextDriver(0) == 1 && ds::nextDriver(1) == 0 && ds::nextDriver(7) == 0 && ds::nextDriver(6) == 1, "the driver steps alone and clears the color bits");
  CHECK(!ds::useCardRecord(true) && ds::useCardRecord(false), "a setup begun in NVS is never replaced by the card's older record");
  int cases = solved;
  // the record
  ds::Record r, back;
  r.panel = 5;
  r.turn = 2;
  r.cal.swap = 1; r.cal.u0 = 3650; r.cal.u1 = 310; r.cal.v0 = 280; r.cal.v1 = 3720; r.cal.valid = 1;
  r.full = 1;
  char buf[200];
  ds::format(r, buf, sizeof buf);
  CHECK(ds::parse(buf, back) && back.panel == 5 && back.turn == 2 && back.cal.swap == 1 && back.cal.u0 == 3650 && back.cal.u1 == 310 &&
            back.cal.v0 == 280 && back.cal.v1 == 3720 && back.full == 1 && back.cal.valid == 1, "record round trip");
  CHECK(!ds::parse("hello", back), "foreign file refused");
  CHECK(!ds::parse("pocket-board 1\npanel=9\nturn=0\nswap=0\nu0=1\nu1=2\nv0=3\nv1=4\n", back), "panel 9 refused");
  CHECK(!ds::parse("pocket-board 1\npanel=1\nturn=0\n", back), "a short record refused");
  CHECK(!ds::parse("pocket-board 1\npanel=1\nturn=4\nswap=0\nu0=1\nu1=2\nv0=3\nv1=4\n", back), "turn 4 refused");
  char chip[16], path[48];
  ds::chipHex(0x24A1B2C3D4E5ULL, chip);
  ds::cardPath(chip, path, sizeof path);
  CHECK(!strcmp(chip, "24A1B2C3D4E5") && !strcmp(path, "/pocket/boards/24A1B2C3D4E5.cfg"), "chip path %s", path);
  printf("setup flow: %d (flip, wiring) pairs, %d failures\n", cases, fails);
  return fails ? 1 : 0;
}
