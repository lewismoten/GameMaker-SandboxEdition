// Draws the four setup steps (src/setupdraw.h, the code the board runs, through the board's own SoftGfx) into a PHYSICAL
// 240 x 320 frame buffer that flips like the glass (MADCTL's mirror bits) and can show a color fault, and writes montages
// as PPM files: setupshots OUTDIR. Text uses src/softfont.h's glyphs (the board's own font is a similar 6 x 8).
// Also checks that steps 1, 2 and 4 stay inside the 240 square, that step 3 fits the panel exactly in both quarter turns,
// that every one of the 8 glass states shows each step with its sample in view, and that pushImage lands transposed.
#include <algorithm>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <string>
#include <vector>
#include "setupdraw.h"
#include "softgfx.h"

struct Phys {  // the glass: 240 x 320, stored as it is seen
  uint16_t px[240 * 320];
  int tc = 0xFFFF, bgc = 0, ts = 1, cx = 0, cy = 0;
  bool hasBg = false;
  int fx = 0, fy = 0;   // MADCTL mirror bits
  int clipped = 0;      // writes of a non-black pixel outside the panel
  int outside = 0;      // lit pixels outside the logical square (set by the caller's region test)
  Phys() { clear(); }
  void clear() { memset(px, 0, sizeof px); clipped = 0; }
  void set(int x, int y, uint16_t c) {
    if (x < 0 || y < 0 || x >= 240 || y >= 320) { if (c) clipped++; return; }
    if (fx) x = 239 - x;
    if (fy) y = 319 - y;
    px[y * 240 + x] = c;
  }
  uint16_t color565(int r, int g, int b) { return (uint16_t)((r >> 3) << 11 | (g >> 2) << 5 | b >> 3); }
  void fillScreen(uint16_t c) { for (int y = 0; y < 320; y++) for (int x = 0; x < 240; x++) set(x, y, c); }
  void fillRect(int x, int y, int w, int h, uint16_t c) { for (int j = 0; j < h; j++) for (int i = 0; i < w; i++) set(x + i, y + j, c); }
  void drawRect(int x, int y, int w, int h, uint16_t c) { fillRect(x, y, w, 1, c); fillRect(x, y + h - 1, w, 1, c); fillRect(x, y, 1, h, c); fillRect(x + w - 1, y, 1, h, c); }
  void fillRoundRect(int x, int y, int w, int h, int, uint16_t c) { fillRect(x, y, w, h, c); }
  void drawRoundRect(int x, int y, int w, int h, int, uint16_t c) { drawRect(x, y, w, h, c); }
  void fillCircle(int x, int y, int r, uint16_t c) { for (int j = -r; j <= r; j++) for (int i = -r; i <= r; i++) if (i * i + j * j <= r * r) set(x + i, y + j, c); }
  void drawCircle(int x, int y, int r, uint16_t c) { for (int j = -r; j <= r; j++) for (int i = -r; i <= r; i++) { int d = i * i + j * j; if (d <= r * r && d > (r - 1) * (r - 1)) set(x + i, y + j, c); } }
  void drawLine(int, int, int, int, uint16_t) {}
  void fillTriangle(int x0, int y0, int x1, int y1, int x2, int y2, uint16_t c) {
    int minx = std::min({x0, x1, x2}), maxx = std::max({x0, x1, x2}), miny = std::min({y0, y1, y2}), maxy = std::max({y0, y1, y2});
    auto e = [](int ax, int ay, int bx, int by, int x, int y) { return (long)(bx - ax) * (y - ay) - (long)(by - ay) * (x - ax); };
    for (int y = miny; y <= maxy; y++) for (int x = minx; x <= maxx; x++) {
      long a = e(x0, y0, x1, y1, x, y), b = e(x1, y1, x2, y2, x, y), d = e(x2, y2, x0, y0, x, y);
      if ((a >= 0 && b >= 0 && d >= 0) || (a <= 0 && b <= 0 && d <= 0)) set(x, y, c);
    }
  }
  void pushImage(int x, int y, int w, int h, const uint16_t* d) { for (int j = 0; j < h; j++) for (int i = 0; i < w; i++) set(x + i, y + j, d[j * w + i]); }
  void setTextSize(int s) { ts = s; }
  void setTextColor(uint16_t f) { tc = f; hasBg = false; }
  void setTextColor(uint16_t f, uint16_t g) { tc = f; bgc = g; hasBg = true; }
  void setCursor(int x, int y) { cx = x; cy = y; }
  void setTextDatum(int) {}
  void drawString(const char*, int, int) {}
  void print(const char* t) {
    for (; *t; t++, cx += 6 * ts) {
      if (hasBg) fillRect(cx, cy, 6 * ts, 8 * ts, (uint16_t)bgc);
      for (int j = 0; j < 8; j++) for (int i = 0; i < 6; i++) if (sg::glyphOn(*t, i, j)) fillRect(cx + i * ts, cy + j * ts, ts, ts, (uint16_t)tc);
    }
  }
};

static int fails = 0;
#define CHECK(c, ...) do { if (!(c)) { fails++; printf("FAIL: " __VA_ARGS__); printf("\n"); } } while (0)

static void rgb(uint16_t p, int fault, int want, unsigned char out[3]) {
  uint32_t c = (uint32_t)((p >> 11 & 31) * 255 / 31) << 16 | (uint32_t)((p >> 5 & 63) * 255 / 63) << 8 | (uint32_t)((p & 31) * 255 / 31);
  c = sf::shownColor(c, fault, want);
  out[0] = (unsigned char)(c >> 16); out[1] = (unsigned char)(c >> 8); out[2] = (unsigned char)c;
}

struct Montage {
  int cols, rows;
  std::vector<unsigned char> img;
  Montage(int c, int r) : cols(c), rows(r), img((size_t)c * 248 * r * 328 * 3, 40) {}
  void put(int col, int row, const Phys& f, int fault = 0, int want = 0) {
    for (int y = 0; y < 320; y++) for (int x = 0; x < 240; x++) {
      unsigned char c[3];
      rgb(f.px[y * 240 + x], fault, want, c);
      size_t o = ((size_t)(row * 328 + 4 + y) * (cols * 248) + col * 248 + 4 + x) * 3;
      memcpy(&img[o], c, 3);
    }
  }
  void save(const std::string& path) {
    FILE* f = fopen(path.c_str(), "wb");
    fprintf(f, "P6\n%d %d\n255\n", cols * 248, rows * 328);
    fwrite(img.data(), 1, img.size(), f);
    fclose(f);
  }
};

// Draws a step the way the board does: panel turn u (mirror bits), software mode m.
static void render(Phys& fb, sg::SoftGfx<Phys>& g, int step, int u, int mode) {
  fb.fx = u & 1; fb.fy = u >> 1 & 1;
  g.setMode(mode);
  fb.clear();
  sf::drawStep(g, step);
}
static int litOutside(const Phys& fb, int step, int mode, int u) {
  // lit pixels (panel pixels back to logical) outside the 240 square for steps 1, 2 and 4
  sg::Xf xf; xf.mode = (uint8_t)mode;
  int n = 0;
  for (int y = 0; y < 320; y++) for (int x = 0; x < 240; x++) {
    if (!fb.px[y * 240 + x]) continue;
    int px = (u & 1) ? 239 - x : x, py = (u >> 1 & 1) ? 319 - y : y, lx, ly;
    xf.inv(px, py, lx, ly);
    if (step == sf::ORIENT ? (lx < 0 || ly < 0 || lx >= 320 || ly >= 240) : (lx >= 240 || ly >= 240)) n++;
  }
  return n;
}

int main(int argc, char** argv) {
  std::string out = argc > 1 ? argv[1] : ".";
  static Phys fb;
  sg::SoftGfx<Phys> g(fb);
  const char* names[4] = {"step1-flip", "step2-rotate", "step3-orient", "step4-colors"};
  for (int step = 0; step < 4; step++) {
    int modes = step == sf::ORIENT ? 2 : 1;
    Montage m(4, modes);
    for (int mi = 0; mi < modes; mi++) {
      int mode = step == sf::ORIENT ? 1 + mi : (step == sf::COLORS ? 1 : 0);
      for (int u = 0; u < 4; u++) {
        render(fb, g, step, u, mode);
        CHECK(fb.clipped == 0, "%s u=%d mode=%d draws %d pixels off the panel", names[step], u, mode, fb.clipped);
        CHECK(litOutside(fb, step, mode, u) == 0, "%s u=%d mode=%d lights pixels outside its area", names[step], u, mode);
        int lit = 0;
        for (auto p : fb.px) lit += p != 0;
        CHECK(lit > 3000, "%s u=%d mode=%d lit only %d pixels", names[step], u, mode, lit);
        m.put(u, mi, fb);
      }
    }
    m.save(out + "/" + names[step] + ".ppm");
  }
  // step 4 on a glass whose colors are off: what each of the four modes shows when the glass is inverted and swapped (mode 3)
  {
    Montage m(4, 1);
    for (int want = 0; want < 4; want++) { render(fb, g, sf::COLORS, 0, 1); m.put(want, 0, fb, 3, want); }
    m.save(out + "/step4-fault3.ppm");
  }
  // a game band pushed in each mode lands transposed: a 4 x 3 band with a marked corner (its top left pixel)
  {
    uint16_t band[12], t[12];
    for (int i = 0; i < 12; i++) band[i] = 0x1111;
    band[0] = 0xF800;
    for (int mode = 1; mode <= 2; mode++) {
      sg::SoftGfx<Phys> g2(fb);
      g2.setMode(mode);
      g2.setBandBuffer(t);
      fb.clear();
      g2.pushImage(10, 20, 4, 3, band);
      int rx = -1, ry = -1, n = 0;
      for (int y = 0; y < 320; y++) for (int x = 0; x < 240; x++) { if (fb.px[y * 240 + x]) n++; if (fb.px[y * 240 + x] == 0xF800) { rx = x; ry = y; } }
      sg::Xf xf; xf.mode = (uint8_t)mode;
      int ex, ey;
      xf.pt(10, 20, ex, ey);
      CHECK(n == 12 && rx == ex && ry == ey, "mode %d band: 12 pixels with the marked one at %d,%d, got %d at %d,%d", mode, ex, ey, n, rx, ry);
    }
  }
  // an on-panel point round-trips through the map
  for (int mode = 0; mode <= 2; mode++) {
    sg::Xf xf; xf.mode = (uint8_t)mode;
    for (int y = 0; y < (mode ? 240 : 320); y += 7) for (int x = 0; x < (mode ? 320 : 240); x += 5) {
      int px, py, bx, by;
      xf.pt(x, y, px, py);
      xf.inv(px, py, bx, by);
      CHECK(bx == x && by == y && px >= 0 && px < 240 && py >= 0 && py < 320, "mode %d point %d,%d", mode, x, y);
    }
  }
  printf("setupshots: %d failures\n", fails);
  return fails ? 1 : 0;
}
