// A level followed by text/picture cards must replace every pixel and leave palette-0 margins on both boards.
#include <assert.h>
#include <stdio.h>
#include <vector>
#include <string>
#include "carddraw.h"
#include "gmcards.h"

struct Panel {
  std::vector<uint16_t> pixels = std::vector<uint16_t>(scr::W * scr::H, 0x7777);
  int clears = 0, writes = 0;
  void fillScreen(uint16_t c) { clears++; for (auto& p : pixels) p = c; }
  void fillRect(int x, int y, int w, int h, uint16_t c) {
    assert(x >= 0 && y >= 0 && x + w <= scr::W && y + h <= scr::H);
    for (int r = y; r < y + h; r++) for (int col = x; col < x + w; col++) pixels[r * scr::W + col] = c;
  }
  void pushImage(int x, int y, int w, int h, const uint16_t* data) {
    writes += w * h;
    assert(y + h <= scr::VIEW_H);  // no final band may read or draw beyond the 320x200 card
    for (int r = 0; r < h; r++) for (int col = 0; col < w; col++) pixels[(y + r) * scr::W + x + col] = carddraw::native(data[r * w + col]);
  }
};

int main() {
  Panel panel;
  std::vector<uint8_t> px(gm::PIC_PIXELS);
  std::vector<uint16_t> band(scr::W * 30);
  uint8_t font[95 * 8];
  memset(font, 0x55, sizeof font);
  uint16_t pal[256] = {};
  // Nonblack palette 0 catches confusing an index with literal black, and swapped bytes.
  for (uint16_t zero : {uint16_t(0), uint16_t(0x1234)}) {
    pal[0] = zero;
    pal[1] = 0xABCD;
    panel.fillScreen(0x7777);  // previous level's sky, controls and status strip
    carddraw::clear(panel, pal[0]);
    for (auto p : panel.pixels) assert(p == carddraw::native(zero));
    for (int page = 0; page < 2; page++) {
      memset(px.data(), 0, px.size());
      const uint8_t text[] = "ALL DONE";
      gm::drawTextPage(px.data(), font, text, sizeof text - 1, 0, 1, 1);
      carddraw::pushPicture(panel, px.data(), pal, band.data(), 30);
      for (int y = 0; y < scr::H; y++) for (int x = 0; x < scr::W; x++) {
        int idx = y < scr::VIEW_H ? px[scr::down(y) * 320 + scr::down(x)] : 0;
        assert(panel.pixels[y * scr::W + x] == carddraw::native(pal[idx]));
      }
      // A following picture/fade must also repaint the margins for its new palette.
      panel.fillRect(0, scr::VIEW_H, scr::W, scr::STRIP_H, 0x7777);
    }
    carddraw::clear(panel, pal[0]);
    for (auto p : panel.pixels) assert(p == carddraw::native(zero));
  }
  // Patterned backgrounds catch stale text; compare full and incremental renders byte for byte.
  Panel partial, full;
  std::vector<uint8_t> background(gm::PIC_PIXELS);
  for (int i = 0; i < gm::PIC_PIXELS; i++) background[i] = (i * 13 + i / 320) % 256;
  for (int i = 0; i < 256; i++) pal[i] = i * 233 + 0x1234;
  gm::TextRect old, unused;
  std::vector<std::string> texts = {"ALL DONE\nA longer first page", std::string(18, '\n') + "Second page", "short", "", std::string(70, 'X')};
  carddraw::clear(partial, pal[0]);
  carddraw::pushPicture(partial, background.data(), pal, band.data(), 30);
  bool reuse = true;
  for (const auto& text : texts) for (int page = 0; page < gm::textPageCount((const uint8_t*)text.data(), text.size()); page++) {
    auto a = background, b = background;
    partial.writes = 0;
    int clears = partial.clears;
    carddraw::textPage(partial, a.data(), pal, band.data(), 30, font, (const uint8_t*)text.data(), text.size(), page, 1, 2, reuse, old);
    carddraw::textPage(full, b.data(), pal, band.data(), 30, font, (const uint8_t*)text.data(), text.size(), page, 1, 2, false, unused);
    assert(partial.pixels == full.pixels);
    assert(a == b);
    if (reuse) { assert(partial.clears == clears); assert(partial.writes < scr::W * scr::VIEW_H); }
    reuse = true;
  }
  pal[0] = 0x6543;
  auto changed = background;
  int clears = partial.clears;
  carddraw::textPage(partial, changed.data(), pal, band.data(), 30, font, (const uint8_t*)"New", 3, 0, 1, 2, false, old);
  assert(partial.clears == clears + 1);
  assert(partial.pixels.back() == carddraw::native(pal[0]));
  printf("card framebuffer %dx%d: text after level, picture margins, palette 0 and final band ok\n", scr::W, scr::H);
}
