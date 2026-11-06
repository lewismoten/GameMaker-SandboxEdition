// Display setup of the 2.8 inch board, with no board code in it (host/setuptest.cpp checks it on the Mac).
// What the steps show and how a tap is read is in setupflow.h. This file holds the saved record (text, kept in NVS and on
// the card at /pocket/boards/<chip id>.cfg), the chip id and file name, and the rules for the display mode and for when the
// card's record is used.
#pragma once
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "touchcal.h"

namespace ds {

constexpr int PANELS = 8, TURNS = 4;
// Display modes (panel bits): 1 ST7789 driver (else ILI9341), 2 colors inverted, 4 red and blue swapped.
// The steps of the first-boot setup (setupflow.h), kept in NVS so a restart in the middle resumes at the right one.
// The four steps (setupflow.h: flip, rotate, orient, colors) are 0..3, then the calibration.
enum Step { STEP_FLIP = 0, STEP_ROTATE = 1, STEP_ORIENT = 2, STEP_COLORS = 3, STEP_CALIBRATE = 4 };
// The BOOT button held on the setup screen steps the driver only (the one fault a picture can't show its way out of): the other
// color bits are cleared so the colors step starts fresh.
inline uint8_t nextDriver(uint8_t panel) { return (uint8_t)((panel ^ 1) & 1); }
// At start: is the chip's file on the microSD card read? Only when this chip has never been set up (no "setup" key in NVS, so
// a reflashed-and-erased board finds its own file). A setup that was begun and not finished (state 1) must NOT be replaced by
// the card's older record: that sent every restart in the middle of a setup (a color change, the driver) back to the old turn
// and straight out of the setup, so the turn seemed stuck.
inline bool useCardRecord(bool nvsHasSetup) { return !nvsHasSetup; }

// ---- the saved record -------------------------------------------------------------------------------------------
// state: 0 never set up, 1 set up begun (a display change restarted the board, or it was never finished), 3 saved.
// soft: 0 an old setup (turn = one of the glass's own landscape turns), 1 and 2 the picture turned in software on the panel's
// portrait turn (softgfx.h), turn then being its mirror bits (setupflow.h PORTRAIT_ROT); 3 the glass run 320 x 240 with no turn.
struct Record {
  uint8_t panel = 0, turn = 0, soft = 0;
  tc::Cal cal;
  uint8_t full = 0;  // 1 when the 3-tap calibration was done after the last display change
};
inline bool valid(const Record& r) {
  auto in = [](int v) { return v >= 0 && v <= 4095; };
  return r.panel < PANELS && r.turn < TURNS && r.soft <= 3 && r.cal.swap <= 1 && in(r.cal.u0) && in(r.cal.u1) && in(r.cal.v0) && in(r.cal.v1);
}
inline int format(const Record& r, char* out, int n) {
  return snprintf(out, n, "pocket-board 1\npanel=%d\nturn=%d\nswap=%d\nu0=%d\nu1=%d\nv0=%d\nv1=%d\nfull=%d\nsoft=%d\n", r.panel, r.turn, r.cal.swap,
                  r.cal.u0, r.cal.u1, r.cal.v0, r.cal.v1, r.full, r.soft);
}
// Parses a record; false for anything that is not one of ours or has values out of range.
inline bool parse(const char* text, Record& out) {
  if (strncmp(text, "pocket-board 1", 14) != 0) return false;
  Record r;
  int seen = 0;
  const char* p = text;
  while (*p) {
    const char* e = strchr(p, '\n');
    int len = e ? (int)(e - p) : (int)strlen(p);
    char line[40];
    if (len > 0 && len < (int)sizeof line) {
      memcpy(line, p, len);
      line[len] = 0;
      char* eq = strchr(line, '=');
      if (eq) {
        *eq = 0;
        int v = atoi(eq + 1);
        if (!strcmp(line, "panel")) { r.panel = (uint8_t)v; seen |= 1; }
        else if (!strcmp(line, "turn")) { r.turn = (uint8_t)v; seen |= 2; }
        else if (!strcmp(line, "swap")) { r.cal.swap = (uint8_t)v; seen |= 4; }
        else if (!strcmp(line, "u0")) { r.cal.u0 = (int16_t)v; seen |= 8; }
        else if (!strcmp(line, "u1")) { r.cal.u1 = (int16_t)v; seen |= 16; }
        else if (!strcmp(line, "v0")) { r.cal.v0 = (int16_t)v; seen |= 32; }
        else if (!strcmp(line, "v1")) { r.cal.v1 = (int16_t)v; seen |= 64; }
        else if (!strcmp(line, "full")) r.full = v ? 1 : 0;
        else if (!strcmp(line, "soft")) r.soft = (uint8_t)v;  // optional: old files have none (soft 0)
      }
    }
    if (!e) break;
    p = e + 1;
  }
  r.cal.valid = 1;
  if (seen != 127 || !valid(r)) return false;
  out = r;
  return true;
}
// The chip's id (the ESP32's 48-bit efuse MAC) as 12 hex digits, and the card file for it.
inline void chipHex(uint64_t mac, char* out) { snprintf(out, 13, "%012llX", (unsigned long long)(mac & 0xFFFFFFFFFFFFULL)); }
inline void cardPath(const char* chip, char* out, int n) { snprintf(out, n, "/pocket/boards/%s.cfg", chip); }

}  // namespace ds
