// Draws setup steps 1 and 2 (src/setupdraw.h, the code the board runs) into a 320 x 240 frame buffer and writes PPM files:
// setupshots OUTDIR. Text uses data/font.bin's 8 x 8 glyphs (the board's own font is a similar 6 x 8), so letters are close, not exact.
// Also checks that the four boxes of every round hold four different flips of the word and that nothing is drawn outside its box.
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <string>
#include <vector>
#include "setupdraw.h"

struct FB {
  uint16_t px[320 * 240];
  int tc = 0xFFFF, cx = 0, cy = 0, ts = 1;
  uint8_t font[95][8];
  FB() { memset(px, 0, sizeof px); FILE* f = fopen("data/font.bin", "rb"); if (f) { fread(font, 1, sizeof font, f); fclose(f); } else memset(font, 0, sizeof font); }
  void set(int x, int y, uint16_t c) { if (x >= 0 && y >= 0 && x < 320 && y < 240) px[y * 320 + x] = c; }
  uint16_t color565(int r, int g, int b) { return (uint16_t)((r >> 3) << 11 | (g >> 2) << 5 | b >> 3); }
  void fillScreen(uint16_t c) { for (auto& p : px) p = c; }
  void fillRect(int x, int y, int w, int h, uint16_t c) { for (int j = 0; j < h; j++) for (int i = 0; i < w; i++) set(x + i, y + j, c); }
  void drawRect(int x, int y, int w, int h, uint16_t c) { fillRect(x, y, w, 1, c); fillRect(x, y + h - 1, w, 1, c); fillRect(x, y, 1, h, c); fillRect(x + w - 1, y, 1, h, c); }
  void fillCircle(int x, int y, int r, uint16_t c) { for (int j = -r; j <= r; j++) for (int i = -r; i <= r; i++) if (i * i + j * j <= r * r) set(x + i, y + j, c); }
  void drawCircle(int x, int y, int r, uint16_t c) { for (int j = -r; j <= r; j++) for (int i = -r; i <= r; i++) { int d = i * i + j * j; if (d <= r * r && d > (r - 1) * (r - 1)) set(x + i, y + j, c); } }
  void setTextSize(int s) { ts = s; }
  void setTextColor(uint16_t c) { tc = c; }
  void setCursor(int x, int y) { cx = x; cy = y; }
  void print(const char* t) {
    for (; *t; t++, cx += 6 * ts) {
      int g = *t - 32;
      if (g < 0 || g >= 95) continue;
      for (int j = 0; j < 8; j++) for (int i = 0; i < 6; i++) if (font[g][j] >> i & 1) fillRect(cx + i * ts, cy + j * ts, ts, ts, (uint16_t)tc);
    }
  }
  void save(const std::string& path) {
    FILE* f = fopen(path.c_str(), "wb");
    fprintf(f, "P6\n320 240\n255\n");
    for (auto p : px) { unsigned char c[3] = {(unsigned char)((p >> 11 & 31) * 255 / 31), (unsigned char)((p >> 5 & 63) * 255 / 63), (unsigned char)((p & 31) * 255 / 31)}; fwrite(c, 1, 3, f); }
    fclose(f);
  }
};

static int fails = 0;
#define CHECK(c, ...) do { if (!(c)) { fails++; printf("FAIL: " __VA_ARGS__); printf("\n"); } } while (0)

int main(int argc, char** argv) {
  std::string out = argc > 1 ? argv[1] : ".";
  static FB fb;
  for (int r = 0; r < sf::ROUNDS; r++) {
    sf::drawOrient(fb, r, r + 1);
    fb.save(out + "/step1-round" + std::to_string(r + 1) + ".ppm");
    // every box's lit pixels stay inside the box with a 12 px margin, and the four boxes differ pairwise
    std::vector<std::vector<uint8_t>> boxes(4);
    for (int q = 0; q < 4; q++) {
      int x0 = (q & 1) * 120, y0 = (q >> 1) * 120;
      int minx = 999, maxx = -1, miny = 999, maxy = -1;
      for (int y = y0 + 6; y < y0 + 114; y++) for (int x = x0 + 6; x < x0 + 114; x++) {
        bool on = fb.px[y * 320 + x] == 0xFFFF;
        boxes[q].push_back(on);
        if (on) { if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
      }
      CHECK(minx - x0 >= 12 && x0 + 120 - 1 - maxx >= 12 && miny - y0 >= 12 && y0 + 120 - 1 - maxy >= 12, "round %d box %d word at %d..%d x %d..%d is too near its box edge", r + 1, q, minx - x0, maxx - x0, miny - y0, maxy - y0);
    }
    for (int a = 0; a < 4; a++) for (int b = a + 1; b < 4; b++) CHECK(boxes[a] != boxes[b], "round %d boxes %d and %d are alike", r + 1, a, b);
  }
  // nothing of step 1 lies outside the 240 x 240 square, in any round
  for (int r = 0; r < sf::ROUNDS; r++) {
    sf::drawOrient(fb, r, 3);
    for (int y = 0; y < 240; y++) for (int x = 240; x < 320; x++) CHECK(fb.px[y * 320 + x] == 0, "round %d draws outside the square at %d,%d", r + 1, x, y);
  }
  sf::drawColors(fb);
  fb.save(out + "/step2-colors.ppm");
  printf("setupshots: %d failures\n", fails);
  return fails ? 1 : 0;
}
