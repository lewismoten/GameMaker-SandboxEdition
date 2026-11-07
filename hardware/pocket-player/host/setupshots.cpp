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
#include "picker_draw.h"

struct Phys {  // the glass: 240 x 320 (W, H), or 320 x 240 for the wide way (sf::WIDE), stored as it is seen
  uint16_t px[480 * 320];
  int W = 240, H = 320;
  int tc = 0xFFFF, bgc = 0, ts = 1, cx = 0, cy = 0;
  bool hasBg = false;
  int fx = 0, fy = 0;   // MADCTL mirror bits
  int clipped = 0;      // writes of a non-black pixel outside the panel
  int outside = 0;      // lit pixels outside the logical square (set by the caller's region test)
  int rowY = -1, rowH = 0, rowOutside = 0, rowBlack = 0;
  int searchY = -1, searchOutside = 0, writes = 0;  // count every write, including black clears
  Phys() { clear(); }
  void clear() { memset(px, 0, sizeof px); clipped = 0; }
  void set(int x, int y, uint16_t c) {
    writes++;
    if (rowY >= 0) {
      if (x < 6 || x >= W - 6 || y < rowY || y >= rowY + rowH) rowOutside++;
      if (!c) rowBlack++;
    }
    if (searchY >= 0 && (x < 8 || x >= 298 || y < searchY || y >= searchY + 16)) searchOutside++;
    if (x < 0 || y < 0 || x >= W || y >= H) { if (c) clipped++; return; }
    if (fx) x = W - 1 - x;
    if (fy) y = H - 1 - y;
    px[y * W + x] = c;
  }
  uint16_t color565(int r, int g, int b) { return (uint16_t)((r >> 3) << 11 | (g >> 2) << 5 | b >> 3); }
  void fillScreen(uint16_t c) { for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) set(x, y, c); }
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
  Montage(int c, int r) : cols(c), rows(r), img((size_t)c * 328 * r * 328 * 3, 40) {}
  void put(int col, int row, const Phys& f, int fault = 0, int want = 0) {
    for (int y = 0; y < f.H; y++) for (int x = 0; x < f.W; x++) {
      unsigned char c[3];
      rgb(f.px[y * f.W + x], fault, want, c);
      size_t o = ((size_t)(row * 328 + 4 + y) * (cols * 328) + col * 328 + 4 + x) * 3;
      memcpy(&img[o], c, 3);
    }
  }
  void save(const std::string& path) {
    FILE* f = fopen(path.c_str(), "wb");
    fprintf(f, "P6\n%d %d\n255\n", cols * 328, rows * 328);
    fwrite(img.data(), 1, img.size(), f);
    fclose(f);
  }
};

// Draws a step the way the board does: panel turn u (mirror bits), software mode m.
static void render(Phys& fb, sg::SoftGfx<Phys>& g, int step, int u, int mode, bool wide = false) {
  fb.W = wide ? 320 : 240; fb.H = wide ? 240 : 320;
  fb.fx = u & 1; fb.fy = u >> 1 & 1;
  g.setMode(mode);
  fb.clear();
  sf::drawStep(g, step, "C fw 4d8759e");
}
static int litOutside(const Phys& fb, int step, int mode, int u) {
  // lit pixels (panel pixels back to logical) outside the 240 square for steps 1, 2 and 4
  sg::Xf xf; xf.mode = (uint8_t)mode;
  int n = 0;
  for (int y = 0; y < fb.H; y++) for (int x = 0; x < fb.W; x++) {
    if (!fb.px[y * fb.W + x]) continue;
    int px = (u & 1) ? fb.W - 1 - x : x, py = (u >> 1 & 1) ? fb.H - 1 - y : y, lx, ly;
    xf.inv(px, py, lx, ly);
    if (step == sf::ORIENT ? (lx < 0 || ly < 0 || lx >= 320 || ly >= 240) : (lx >= 240 || ly >= 240)) n++;
  }
  return n;
}

int main(int argc, char** argv) {
  std::string out = argc > 1 ? argv[1] : ".";
  static Phys fb;
  sg::SoftGfx<Phys> g(fb);
  const char* names[sf::STEPS] = {"step1-flip", "step2-orient", "step3-colors"};
  for (int step = 0; step < sf::STEPS; step++) {
    int modes = step == sf::ORIENT ? 3 : 1;
    Montage m(4, modes);
    for (int mi = 0; mi < modes; mi++) {
      bool wide = step == sf::ORIENT && mi == 2;
      int mode = step == sf::ORIENT ? (wide ? 0 : 1 + mi) : (step == sf::COLORS ? 1 : 0);
      for (int u = 0; u < 4; u++) {
        render(fb, g, step, u, mode, wide);
        CHECK(fb.clipped == 0, "%s u=%d mode=%d draws %d pixels off the panel", names[step], u, mode, fb.clipped);
        CHECK(litOutside(fb, step, mode, u) == 0, "%s u=%d mode=%d lights pixels outside its area", names[step], u, mode);
        int lit = 0;
        for (int i = 0; i < fb.W * fb.H; i++) lit += fb.px[i] != 0;
        CHECK(lit > 3000, "%s u=%d mode=%d lit only %d pixels", names[step], u, mode, lit);
        if (step == sf::ORIENT) {  // the frame on the picture's edge reaches all four edges of the glass, in every turn and way
          CHECK(fb.px[fb.H / 2 * fb.W] && fb.px[fb.H / 2 * fb.W + fb.W - 1] && fb.px[fb.W / 2] && fb.px[(fb.H - 1) * fb.W + fb.W / 2],
                "step 3 u=%d mode=%d wide=%d: the frame does not reach the glass's edges", u, mode, (int)wide);
        }
        m.put(u, mi, fb);
      }
    }
    m.save(out + "/" + names[step] + ".ppm");
  }
  // The picker and keyboard use the firmware's own drawing routines at both board sizes.
  for (int w : {320, 480}) for (int keyboard : {0, 1}) {
    fb.W = w; fb.H = w == 320 ? 240 : 320; fb.fx = fb.fy = 0; fb.clear();
    int titleH = w == 320 ? 28 : 40;
    if (keyboard) pk::drawKeyboard(fb, w, fb.H, titleH, "CARL");
    else {
      int top = w == 320 ? 30 : 44, step = w == 320 ? 42 : 46, height = w == 320 ? 38 : 42, footer = w == 320 ? 200 : 276;
      for (int i = 0; i < (w == 320 ? 4 : 5); i++)
        pk::drawRow(fb, i ? "A Fly Named Carl" : "Graduation: Blocks and showcase beyond the edge", i % 2, w, top + i * step, height);
      for (int i = 0; i < 4; i++) pk::drawIcon(fb, i, w, fb.H, footer);
    }
    CHECK(fb.clipped == 0, "picker/keyboard at %d clips %d pixels", w, fb.clipped);
    std::string path = out + (keyboard ? "/keyboard-" : "/picker-") + std::to_string(w) + ".ppm";
    FILE* f = fopen(path.c_str(), "wb");
    fprintf(f, "P6\n%d %d\n255\n", fb.W, fb.H);
    for (int i = 0; i < fb.W * fb.H; i++) { unsigned char c[3]; rgb(fb.px[i], 0, 0, c); fwrite(c, 1, 3, f); }
    fclose(f);
  }
  // Paging must remove old rows, including a short/empty page and return to a full page.
  for (int w : {320, 480}) {
    static Phys paged, fresh;
    paged.W = fresh.W = w; paged.H = fresh.H = w == 320 ? 240 : 320;
    int top = w == 320 ? 30 : 44, step = w == 320 ? 42 : 46, height = w == 320 ? 38 : 42, rows = w == 320 ? 4 : 5;
    paged.clear(); fresh.clear();
    for (int count : {rows, 1, rows, 0, rows}) {
      fresh.clear();
      for (int r = 0; r < rows; r++) {
        const char* text = r < count ? "Next page" : nullptr;
        paged.rowY = top + r * step; paged.rowH = height;
        paged.rowOutside = paged.rowBlack = 0;
        pk::drawPageRow(paged, text, false, w, top + r * step, height);
        CHECK(!paged.rowOutside, "paging at %d writes outside row %d", w, r);
        if (text) CHECK(!paged.rowBlack, "paging at %d blanks a populated row", w);
        paged.rowY = -1;
        pk::drawPageRow(fresh, text, false, w, top + r * step, height);
      }
      CHECK(!memcmp(paged.px, fresh.px, w * paged.H * sizeof(uint16_t)), "paging at %d leaves old rows", w);
    }
  }
  // Every edit must match a fresh render, without touching the keyboard/title even with black.
  for (int w : {320, 480}) {
    static Phys edited, fresh;
    edited.W = fresh.W = w; edited.H = fresh.H = w == 320 ? 240 : 320;
    edited.searchY = -1; edited.clear(); fresh.clear();
    int titleH = w == 320 ? 28 : 40;
    pk::drawKeyboard(edited, w, edited.H, titleH, "");
    std::string previous;
    std::vector<std::string> edits = {"", "C", "CA", "CAR", "CARL", "CAR", "CA", "C", "", "", "A", "A ", "A FLY", "", "012345678901234567890123", "01234567890123456789012", "", "Z"};
    for (const auto& text : edits) {
      edited.searchY = titleH + 4; edited.searchOutside = edited.writes = 0;
      pk::drawSearchText(edited, titleH, text.c_str(), previous.c_str());
      CHECK(edited.searchOutside == 0, "search edit at %d writes outside its field", w);
      if (text == previous) CHECK(edited.writes == 0, "unchanged search at %d repaints", w);
      if (!previous.empty() && text.size() == previous.size() + 1 && text.compare(0, previous.size(), previous) == 0)
        CHECK(edited.writes < 700, "search append at %d repaints the prefix (%d writes)", w, edited.writes);
      fresh.clear(); pk::drawKeyboard(fresh, w, fresh.H, titleH, text.c_str());
      CHECK(!memcmp(edited.px, fresh.px, w * edited.H * sizeof(uint16_t)), "incremental search at %d differs for '%s'", w, text.c_str());
      CHECK(edited.clipped == 0, "search edit at %d clips", w);
      previous = text;
    }
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
      fb.W = 240; fb.H = 320;
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
