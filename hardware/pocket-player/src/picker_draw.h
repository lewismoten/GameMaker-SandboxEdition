// Picker rows, icons and title-search keyboard, rendered by both firmware and host/setupshots.cpp.
#pragma once
#include <stdint.h>
#include "picker.h"
namespace pk {
constexpr uint16_t C_WHITE = 0xFFFF, C_BLACK = 0, C_YELLOW = 0xFF2A, C_GRAY = 0x7BEF, C_DARK = 0x2104;
template <class G> void drawButton(G& g, int x0, int y0, int x1, int y1, const char* label) {
  g.fillRoundRect(x0, y0, x1 - x0, y1 - y0, 6, C_DARK);
  g.drawRoundRect(x0, y0, x1 - x0, y1 - y0, 6, C_WHITE);
  g.setTextSize(2); g.setTextColor(C_WHITE, C_DARK);
  g.setCursor((x0 + x1) / 2 - (int)strlen(label) * 6, (y0 + y1) / 2 - 8); g.print(label);
}
// Icon buttons are 44 pixels wide or larger on both boards.
template <class G> void drawIcon(G& tft, int slot, int W, int H, int footer) {
  int x0 = 6 + slot * (W / 4), x1 = x0 + W / 4 - 12;
  int cy = (footer + H) / 2, cx = (x0 + x1) / 2;
  drawButton(tft, x0, footer + 2, x1, H - 2, "");
  if (slot < 2) {
    int d = slot ? 1 : -1;
    tft.fillRect(cx - 12, cy - 2, 24, 4, C_WHITE);
    tft.fillTriangle(cx + d * 14, cy, cx, cy - 10, cx, cy + 10, C_WHITE);
  } else if (slot == 2) {
    tft.drawCircle(cx - 4, cy - 4, 9, C_WHITE);
    tft.drawCircle(cx - 4, cy - 4, 8, C_WHITE);
    tft.fillRect(cx + 4, cy + 4, 4, 9, C_WHITE);
  } else {
    for (int i = -1; i <= 1; i += 2) {
      tft.fillRect(cx - 3, cy + i * 10 - 3, 6, 6, C_WHITE);
      tft.fillRect(cx + i * 10 - 3, cy - 3, 6, 6, C_WHITE);
      for (int j = -1; j <= 1; j += 2) tft.fillRect(cx + i * 7 - 2, cy + j * 7 - 2, 4, 4, C_WHITE);
    }
    tft.fillCircle(cx, cy, 10, C_WHITE); tft.fillCircle(cx, cy, 4, C_DARK);
  }
}
template <class G> void drawRow(G& tft, const char* text, bool sd, int W, int y, int height) {
    char l[96];
    pk::ellipsize(text, l, sizeof l, (W - 32 - (sd ? 36 : 0)) / 12);
    tft.fillRoundRect(6, y, W - 12, height, 6, C_DARK);
    tft.drawRoundRect(6, y, W - 12, height, 6, C_GRAY);
    tft.setTextColor(C_WHITE, C_DARK); tft.setTextSize(2);
    tft.setCursor(16, y + (height - 16) / 2); tft.print(l);
    if (sd) {
      tft.setTextColor(C_YELLOW, C_DARK);
      tft.setCursor(W - 40, y + (height - 16) / 2); tft.print("SD");
    }
}
// Preserve the common prefix and erase only the edited suffix and old caret. The keyboard
// and title are painted once on entry; even Clear never clears beyond this 16-pixel line.
template <class G> void drawSearchText(G& tft, int titleH, const char* text, const char* previous = nullptr) {
  if (previous && !strcmp(text, previous)) return;
  const char* shown = text[0] ? text : "Type a title";
  const char* old = previous && previous[0] ? previous : "Type a title";
  size_t prefix = 0;
  if (previous && text[0] && previous[0])
    while (text[prefix] && text[prefix] == previous[prefix]) prefix++;
  size_t width = strlen(shown), oldWidth = strlen(old);
  if (oldWidth > width) width = oldWidth;
  tft.fillRect(8 + prefix * 12, titleH + 4, (width - prefix) * 12 + 2, 16, C_BLACK);
  tft.setTextSize(2); tft.setTextColor(C_WHITE, C_BLACK);
  tft.setCursor(8 + prefix * 12, titleH + 4); tft.print(shown + prefix);
  tft.fillRect(8 + strlen(shown) * 12, titleH + 4, 2, 16, C_WHITE);
}
template <class G> void drawKeyboard(G& tft, int W, int H, int titleH, const char* text) {
  drawSearchText(tft, titleH, text);
  const char* keys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  int top = titleH + 26, step = (H - top - 38) / 4;
  for (int i = 0; i < 36; i++) {
    char label[2] = {keys[i], 0};
    drawButton(tft, i % 9 * W / 9 + 2, top + i / 9 * step, (i % 9 + 1) * W / 9 - 2, top + (i / 9 + 1) * step - 2, label);
  }
  for (int i = 0; i < 4; i++) drawButton(tft, i * W / 4 + 2, H - 36, (i + 1) * W / 4 - 2, H - 2, i == 0 ? "Space" : i == 1 ? "Del" : i == 2 ? "Clear" : "Done");
}
}  // namespace pk
