// Picture tuning for the 2.8 inch board, with no board code in it (host/picturetest.cpp renders and checks it on the Mac).
// Two glasses of the same board can show the same colors differently (one washed out, pale yellows, gray-white light chips),
// so Settings, Display, Panel, Picture lets each board pick its own gamma curve and panel tuning while a test card shows the
// result live. Saved per board with the panel setup (NVS "pgam"/"ptun" and the card's /pocket/boards/<chip>.cfg).
// Gamma is the controller's GAMSET (26h: 1, 2, 4, 8 select curves 1 to 4, on both the ILI9341 and the ST7789). A tuning is a
// set of voltage and gamma-table writes (E0h/E1h positive and negative gamma) for the running driver:
//   ST7789  Std: LovyanGFX's init values (VCOMS 28h, VRHS 10h, VDV 20h, its tables), what every board starts with.
//           Alt 1: TFT_eSPI's ST7789 init (VCOMS 2Bh, VRHS 11h and its tables), the driver many CYD "2 USB" sketches use.
//           Alt 2: Std voltages with the Sitronix reference tables found in many ST7789 module examples.
//           Alt 3: Std tables with the chip's own power-on voltages (VCOMS 20h, VRHS 0Bh).
//   ILI9341 Std: LovyanGFX's init values. Alt 1: an alternate table (lower top end). Alt 2: Std tables with the chip's
//           own VCOM offset (C7h C0h). Alt 3: both.
// Gamma 1 with Std is exactly what the driver's init wrote, so nothing is sent at start for it: existing boards are unchanged.
// Table values from LovyanGFX (lovyan03, FreeBSD license) and TFT_eSPI (Bodmer, FreeBSD license); see NOTICE.md.
#pragma once
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include "overlaydraw.h"
#include "screen.h"

namespace pt {

constexpr int GAMMAS = 4, TUNES = 4;
constexpr uint16_t C_WHITE = 0xFFFF, C_BLACK = 0, C_YELLOW = 0xFF2A, C_GRAY = 0x7BEF, C_DARK = 0x2104, C_BLUE = 0x3A9C;

// ---- the panel commands (cmd, length, bytes..., 0xFF at the end) ----
// ST7789
#define PT_ST_STD_GAM 0xE0, 14, 0xD0, 0x00, 0x02, 0x07, 0x0A, 0x28, 0x32, 0x44, 0x42, 0x06, 0x0E, 0x12, 0x14, 0x17, \
                      0xE1, 14, 0xD0, 0x00, 0x02, 0x07, 0x0A, 0x28, 0x31, 0x54, 0x47, 0x0E, 0x1C, 0x17, 0x1B, 0x1E
#define PT_ST_STD_PWR 0xBB, 1, 0x28, 0xC3, 1, 0x10, 0xC4, 1, 0x20
inline const uint8_t* stTune(int k) {
  static const uint8_t std_[] = {PT_ST_STD_PWR, PT_ST_STD_GAM, 0xFF};
  static const uint8_t alt1[] = {0xBB, 1, 0x2B, 0xC3, 1, 0x11, 0xC4, 1, 0x20,
                                 0xE0, 14, 0xD0, 0x00, 0x05, 0x0E, 0x15, 0x0D, 0x37, 0x43, 0x47, 0x09, 0x15, 0x12, 0x16, 0x19,
                                 0xE1, 14, 0xD0, 0x00, 0x05, 0x0D, 0x0C, 0x06, 0x2D, 0x44, 0x40, 0x0E, 0x1C, 0x18, 0x16, 0x19, 0xFF};
  static const uint8_t alt2[] = {PT_ST_STD_PWR,
                                 0xE0, 14, 0xD0, 0x04, 0x0D, 0x11, 0x13, 0x2B, 0x3F, 0x54, 0x4C, 0x18, 0x0D, 0x0B, 0x1F, 0x23,
                                 0xE1, 14, 0xD0, 0x04, 0x0C, 0x11, 0x13, 0x2C, 0x3F, 0x44, 0x51, 0x2F, 0x1F, 0x1F, 0x20, 0x23, 0xFF};
  static const uint8_t alt3[] = {0xBB, 1, 0x20, 0xC3, 1, 0x0B, 0xC4, 1, 0x20, PT_ST_STD_GAM, 0xFF};
  static const uint8_t* const t[TUNES] = {std_, alt1, alt2, alt3};
  return t[k & 3];
}
// ILI9341
#define PT_ILI_STD_GAM 0xE0, 15, 0x0F, 0x31, 0x2B, 0x0C, 0x0E, 0x08, 0x4E, 0xF1, 0x37, 0x07, 0x10, 0x03, 0x0E, 0x09, 0x00, \
                       0xE1, 15, 0x00, 0x0E, 0x14, 0x03, 0x11, 0x07, 0x31, 0xC1, 0x48, 0x08, 0x0F, 0x0C, 0x31, 0x36, 0x0F
#define PT_ILI_ALT_GAM 0xE0, 15, 0x0F, 0x26, 0x24, 0x0B, 0x0E, 0x09, 0x54, 0xA8, 0x46, 0x0C, 0x17, 0x09, 0x0F, 0x07, 0x00, \
                       0xE1, 15, 0x00, 0x19, 0x1B, 0x04, 0x10, 0x07, 0x2A, 0x47, 0x39, 0x03, 0x06, 0x06, 0x30, 0x38, 0x0F
inline const uint8_t* iliTune(int k) {
  static const uint8_t std_[] = {0xC5, 2, 0x3E, 0x28, 0xC7, 1, 0x86, PT_ILI_STD_GAM, 0xFF};
  static const uint8_t alt1[] = {0xC5, 2, 0x3E, 0x28, 0xC7, 1, 0x86, PT_ILI_ALT_GAM, 0xFF};
  static const uint8_t alt2[] = {0xC5, 2, 0x3E, 0x28, 0xC7, 1, 0xC0, PT_ILI_STD_GAM, 0xFF};
  static const uint8_t alt3[] = {0xC5, 2, 0x3E, 0x28, 0xC7, 1, 0xC0, PT_ILI_ALT_GAM, 0xFF};
  static const uint8_t* const t[TUNES] = {std_, alt1, alt2, alt3};
  return t[k & 3];
}
// Everything to send for a choice: the tuning, then the gamma curve. `st`: the ST7789 driver is running (else ILI9341).
// `out` needs 80 bytes. Returns the length used (0xFF included).
inline int commands(bool st, int gamma, int tune, uint8_t* out) {
  const uint8_t* l = st ? stTune(tune) : iliTune(tune);
  int n = 0;
  while (*l != 0xFF) { int len = 2 + l[1]; memcpy(out + n, l, len); n += len; l += len; }
  out[n++] = 0x26; out[n++] = 1;
  out[n++] = (uint8_t)(1 << (gamma & 3));
  out[n++] = 0xFF;
  return n;
}
// Is this the driver's own start (nothing to send at boot)?
inline bool isDefault(int gamma, int tune) { return gamma == 0 && tune == 0; }
inline bool valid(int gamma, int tune) { return gamma >= 0 && gamma < GAMMAS && tune >= 0 && tune < TUNES; }

// ---- the screen ----
// A bar (Back, "Picture", the driver), the test card (the chips' own colors, a gray, a yellow and a blue ramp) and two rows of
// chips: Gamma 1 to 4 and Tuning Std, Alt 1, Alt 2, Alt 3. Every choice is sent to the glass at once.
struct Box { int x0, y0, x1, y1; bool has(int x, int y) const { return x >= x0 && x < x1 && y >= y0 && y < y1; } };
constexpr int BAR_H = scr::SMALL ? 34 : 44, ROW_H = scr::SMALL ? 36 : 48, GAP = 4;
inline Box backBox() { return {2, 0, 2 + (scr::SMALL ? 34 : 56), BAR_H - 2}; }
inline int rowY(int r) { return scr::H - 2 * (ROW_H + GAP) + r * (ROW_H + GAP); }  // 0 Gamma, 1 Tuning
inline Box chipBox(int r, int k) {
  int x0 = scr::W * 30 / 100, w = (scr::W - 4 - x0 - 3 * 3) / 4;
  return {x0 + k * (w + 3), rowY(r), x0 + k * (w + 3) + w, rowY(r) + ROW_H};
}
inline Box cardBox() { return {4, BAR_H + 4, scr::W - 4, rowY(0) - 6}; }
enum Kind : uint8_t { K_NONE, K_BACK, K_GAMMA, K_TUNE };
struct Hit { Kind kind = K_NONE; int k = 0; Box box = {0, 0, 0, 0}; };
inline Hit hit(int x, int y) {
  Hit h;
  if (backBox().has(x, y)) { h.kind = K_BACK; h.box = backBox(); return h; }
  for (int r = 0; r < 2; r++)
    for (int k = 0; k < 4; k++)
      if (chipBox(r, k).has(x, y)) { h.kind = r ? K_TUNE : K_GAMMA; h.k = k; h.box = chipBox(r, k); return h; }
  return h;
}
inline uint16_t rgb(int r, int g, int b) { return (uint16_t)(((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3)); }

template <class G_> void label(G_& g, int x, int y, const char* s, uint16_t fg, uint16_t bg) {
  g.setTextSize(1);
  g.setTextColor(fg, bg);
  g.setCursor(x, y);
  g.print(s);
}
// The test card: chips as Settings draws them (selected yellow, plain dark, blue), white and black; then three ramps.
template <class G_> void testCard(G_& g) {
  Box c = cardBox();
  g.fillRect(c.x0, c.y0, c.x1 - c.x0, c.y1 - c.y0, C_BLACK);
  int w = c.x1 - c.x0, h = c.y1 - c.y0, top = (h - 4) * 2 / 5, rampH = (h - top - 4 * 3) / 3;
  int cw = (w - 3 * 3) / 4;
  ovl::button(g, c.x0, c.y0, c.x0 + cw, c.y0 + top, "Yellow", true, C_DARK, 1);
  ovl::button(g, c.x0 + (cw + 3), c.y0, c.x0 + (cw + 3) + cw, c.y0 + top, "Dark", false, C_DARK, 1);
  ovl::button(g, c.x0 + 2 * (cw + 3), c.y0, c.x0 + 2 * (cw + 3) + cw, c.y0 + top, "Blue", false, C_BLUE, 1);
  int wx = c.x0 + 3 * (cw + 3);
  g.fillRect(wx, c.y0, (c.x1 - wx) / 2, top, C_WHITE);
  g.fillRect(wx + (c.x1 - wx) / 2, c.y0, c.x1 - wx - (c.x1 - wx) / 2, top, C_BLACK);
  g.drawRect(wx, c.y0, c.x1 - wx, top, C_GRAY);
  const int STEPS = 16;
  for (int r = 0; r < 3; r++) {
    int y = c.y0 + top + 4 + r * (rampH + 4);
    for (int i = 0; i < STEPS; i++) {
      int v = i * 255 / (STEPS - 1);
      uint16_t col = r == 0 ? rgb(v, v, v) : r == 1 ? rgb(v, v, v * 42 / 255) : rgb(v * 58 / 255, v * 83 / 255, v * 230 / 255);
      int x0 = c.x0 + i * w / STEPS, x1 = c.x0 + (i + 1) * w / STEPS;
      g.fillRect(x0, y, x1 - x0, rampH, col);
    }
  }
}
template <class G_> void rows(G_& g, int gamma, int tune) {
  static const char* const tl[TUNES] = {"Std", "Alt 1", "Alt 2", "Alt 3"};
  for (int r = 0; r < 2; r++) {
    g.fillRect(0, rowY(r), scr::W, ROW_H, C_BLACK);
    label(g, 6, rowY(r) + (ROW_H - 8) / 2, r ? "Tuning" : "Gamma", C_WHITE, C_BLACK);
    for (int k = 0; k < 4; k++) {
      Box b = chipBox(r, k);
      char t[8];
      if (r) snprintf(t, sizeof t, "%s", tl[k]); else snprintf(t, sizeof t, "%d", k + 1);
      ovl::button(g, b.x0, b.y0, b.x1, b.y1, t, k == (r ? tune : gamma), C_DARK, scr::SMALL ? 1 : 2);
    }
  }
}
// `driver`: "ST7789" or "ILI9341", shown at the right of the bar.
template <class G_> void screen(G_& g, int gamma, int tune, const char* driver) {
  g.fillScreen(C_BLACK);
  Box b = backBox();
  ovl::button(g, b.x0, b.y0, b.x1, b.y1, "<", false, C_DARK, scr::SMALL ? 1 : 2);
  g.setTextSize(scr::SMALL ? 2 : 2);
  g.setTextColor(C_WHITE, C_BLACK);
  g.setCursor(b.x1 + 8, (BAR_H - 16) / 2);
  g.print("Picture");
  label(g, scr::W - 6 * (int)strlen(driver) - 6, (BAR_H - 8) / 2, driver, C_GRAY, C_BLACK);
  g.fillRect(0, BAR_H - 2, scr::W, 2, C_BLUE);
  testCard(g);
  rows(g, gamma, tune);
}

}  // namespace pt
