// Details' own pages (title, story, instructions): which pages a packed game has (gmcards.h menuPagesOfFile), the page
// buttons' hit table for every mix of pages (picker.h, pressrect.h), and PNG renders at the board's size of Details and of
// every picture and text page each button shows, drawn with the board's card code (carddraw.h).
//   c++ -std=c++17 [-DPOCKET_CYD28] -I src host/storytest.cpp -lz -o /tmp/storytest
//   /tmp/storytest <data dir, or a .GMP with font.bin beside it> <out dir or -> <id> [id ...]
// web/scripts/pocketControlsCheck.ts runs it for both boards.
#include "framebuffer.h"
#include "library.h"
#include "picker_draw.h"
#include "gmsmall.h"
namespace textdatum_t { constexpr int middle_center = 4, top_left = 0; }  // the names LovyanGFX has on the board
#include "pressrect.h"
#include "carddraw.h"
#include "stdiolines.h"
#include <assert.h>
#include <string>
#include <vector>
#include <zlib.h>

// The glass with the board's pushImage: card bands hold byte-swapped RGB565 (carddraw::native), shapes take plain RGB565.
struct Glass : Phys {
  void pushImage(int x, int y, int w, int h, const uint16_t* d) {
    for (int j = 0; j < h; j++)
      for (int i = 0; i < w; i++) set(x + i, y + j, carddraw::native(d[j * w + i]));
  }
};
static Glass fb;
static std::string dir, out;

static void put32(std::vector<uint8_t>& v, uint32_t n) { for (int s = 24; s >= 0; s -= 8) v.push_back((uint8_t)(n >> s)); }
static void chunk(FILE* f, const char* type, const std::vector<uint8_t>& data) {
  std::vector<uint8_t> c;
  put32(c, (uint32_t)data.size());
  c.insert(c.end(), type, type + 4);
  c.insert(c.end(), data.begin(), data.end());
  uLong crc = crc32(0, c.data() + 4, (uInt)(c.size() - 4));
  put32(c, (uint32_t)crc);
  fwrite(c.data(), 1, c.size(), f);
}
static void savePng(const std::string& name) {
  if (out == "-") return;
  std::vector<uint8_t> raw;
  for (int y = 0; y < fb.H; y++) {
    raw.push_back(0);
    for (int x = 0; x < fb.W; x++) {
      uint16_t c = fb.px[y * fb.W + x];
      raw.push_back((uint8_t)((c >> 11) * 255 / 31));
      raw.push_back((uint8_t)(((c >> 5) & 63) * 255 / 63));
      raw.push_back((uint8_t)((c & 31) * 255 / 31));
    }
  }
  uLongf zn = compressBound((uLong)raw.size());
  std::vector<uint8_t> z(zn);
  compress2(z.data(), &zn, raw.data(), (uLong)raw.size(), 9);
  z.resize(zn);
  FILE* f = fopen((out + "/" + name + ".png").c_str(), "wb");
  assert(f);
  fwrite("\x89PNG\r\n\x1a\n", 1, 8, f);
  std::vector<uint8_t> ihdr;
  put32(ihdr, fb.W);
  put32(ihdr, fb.H);
  ihdr.insert(ihdr.end(), {8, 2, 0, 0, 0});
  chunk(f, "IHDR", ihdr);
  chunk(f, "IDAT", z);
  chunk(f, "IEND", {});
  fclose(f);
}
static std::vector<uint8_t> slurp(const std::string& path) {
  std::vector<uint8_t> v;
  FILE* f = fopen(path.c_str(), "rb");
  if (!f && pakSlurp(path, v)) return v;
  if (!f) { fprintf(stderr, "cannot open %s\n", path.c_str()); exit(2); }
  uint8_t buf[4096];
  size_t n;
  while ((n = fread(buf, 1, sizeof buf, f)) > 0) v.insert(v.end(), buf, buf + n);
  fclose(f);
  return v;
}
static bool inflateRaw(const uint8_t* src, size_t n, uint8_t* dst, size_t cap) {
  z_stream z = {};
  if (inflateInit2(&z, -15) != Z_OK) return false;
  z.next_in = (Bytef*)src; z.avail_in = (uInt)n; z.next_out = dst; z.avail_out = (uInt)cap;
  int r = inflate(&z, Z_FINISH);
  bool ok = r == Z_STREAM_END && z.total_out == cap;
  inflateEnd(&z);
  return ok;
}
static uint8_t* readRange(size_t off, size_t len) {
  static std::vector<uint8_t> pak = slurp(dir + "/cards.pak");
  if (off + len > pak.size()) return nullptr;
  uint8_t* p = (uint8_t*)malloc(len + 1);
  memcpy(p, pak.data() + off, len);
  return p;
}
// The board's panel colors for a 6 bit VGA palette (panel565 in main.cpp: byte-swapped RGB565).
static void palette(const uint8_t* vga, uint16_t* pal) {
  for (int i = 0; i < 256; i++) {
    auto v8 = [](uint8_t v) { return (uint8_t)(v << 2 | v >> 4); };
    uint8_t r = v8(vga[i * 3]), g = v8(vga[i * 3 + 1]), b = v8(vga[i * 3 + 2]);
    pal[i] = carddraw::native((uint16_t)((r >> 3) << 11 | (g >> 2) << 5 | b >> 3));
  }
}

// Every mix of pages: each shown button is found where it is drawn, at least 24 x 24, holds its label, sits between the title
// and the note line, and an absent page has no button.
static void hitTables(int W, int H) {
  for (int mask = 0; mask < 8; mask++) {
    prs::Ctx c;
    c.W = W;
    c.H = H;
    c.screen = prs::SC_DETAILS;
    c.pages = mask;
    int shown = 0;
    (void)shown;
    for (int k = 0; k < pk::DETAILS_PAGES; k++) {
      int x0, x1;
      if (!pk::detailsPageSpan(W, mask, k, x0, x1)) continue;
      shown++;
      int y = (pk::detailsPagesTop(H) + pk::detailsPagesBottom(H)) / 2;
      prs::Rect r;
      assert(prs::under(c, (x0 + x1) / 2, y, r) && r.x0 == x0 && r.x1 == x1);
      assert(pk::detailsPageAt(W, H, mask, x0, y) == k && pk::detailsPageAt(W, H, mask, x1 - 1, y) == k);
      assert(x1 - x0 >= 24 && r.y1 - r.y0 >= 24 && x0 >= 4 && x1 <= W - 4);
      assert((int)strlen(pk::detailsPageLabel(k)) * 6 * (W == 320 ? 1 : 2) + 8 <= x1 - x0);
      assert(r.y0 >= 40 + 3 * 12 && r.y1 <= H - 58);  // three title lines above, the note line below
    }
    for (int k = 0; k < pk::DETAILS_PAGES; k++) {  // the gap between buttons and the rows above and below press nothing
      int x0, x1;
      if (!pk::detailsPageSpan(W, mask, k, x0, x1)) continue;
      prs::Rect r;
      if (x1 + 2 < W - 4) assert(pk::detailsPageAt(W, H, mask, x1 + 1, pk::detailsPagesTop(H) + 4) == -1);  // the 4 pixel gap
      assert(!prs::under(c, (x0 + x1) / 2, pk::detailsPagesTop(H) - 1, r));
      assert(!prs::under(c, (x0 + x1) / 2, pk::detailsPagesBottom(H), r));
    }
    if (!mask) assert(!shown);
  }
}

static void drawDetails(const std::string& title, int mask) {
  int W = fb.W, H = fb.H, titleH = W == 320 ? 28 : 40;
  fb.clear();
  fb.fillRect(0, 0, W, titleH, 0x001F);
  pk::Tile bar = {0, 0, W, titleH, 0, 0};
  pk::clippedText(fb, bar, "Game details", 8, titleH / 2 - 4, 1, pk::C_WHITE);
  pk::Tile body = {8, 40, W - 16, pk::detailsPagesTop(H) - 44, 0, 0};
  size_t at = 0, n = title.size(), cols = (W - 16) / 6;
  for (int y = 44; at < n; y += 12, at += cols) pk::clippedText(fb, body, title.substr(at, cols).c_str(), 8, y, 1, pk::C_WHITE);
  pk::detailsPages(fb, W, H, mask);
  pk::detailsFooter(fb, W, H, false);
  assert(!fb.clipped);
}

int main(int argc, char** argv) {
  if (argc < 4) return 2;
  dir = linesDir = argv[1];
  out = argv[2];
  fb.W = scr::W;
  fb.H = scr::H;
  hitTables(fb.W, fb.H);
  std::string size = std::to_string(fb.W);
  gm::Assets assets;
  assets.inflate = inflateRaw;
  // a one-file game (.GMP) holds no font or game list: font.bin beside it, and the id for its title
  std::string base = isGmp(dir) ? (dir.rfind('/') == std::string::npos ? std::string(".") : dir.substr(0, dir.rfind('/'))) : dir;
  std::vector<uint8_t> fontv = slurp(base + "/font.bin");
  std::vector<uint16_t> band(scr::W * 30);
  std::vector<std::string> titles;
  {
    std::vector<uint8_t> g;
    if (!isGmp(dir)) g = slurp(dir + "/games.txt");
    titles.push_back(std::string(g.begin(), g.end()));
  }
  for (int a = 3; a < argc; a++) {
    std::string id = argv[a], cfg = id + ".cfg";
    int mask = gm::menuPagesOfFile(stdioLines, cfg.c_str());
    // the title from games.txt (id|title|levels)
    std::string title = id;
    size_t p = titles[0].find(id + "|");
    if (p != std::string::npos && (p == 0 || titles[0][p - 1] == '\n')) {
      size_t b = p + id.size() + 1, e = titles[0].find('|', b);
      title = titles[0].substr(b, e - b);
    }
    drawDetails(title, mask);
    savePng("details-" + id + "-" + size);
    int count[3] = {};
    for (int k = 0; k < pk::DETAILS_PAGES; k++) {
      if (!(mask >> k & 1)) continue;
      char where[2] = {pk::detailsPageWhere(k), 0};
      gm::Card cards[gm::MAX_CARDS];
      int n = gm::cardsOfFile(stdioLines, cfg.c_str(), where, cards, gm::MAX_CARDS);
      assert(n > 0);
      uint8_t* pic = nullptr;
      gm::Card picCard = {};
      bool dirty = false;
      gm::TextRect previous;
      uint16_t pal[256];
      std::string label = pk::detailsPageLabel(k);
      for (auto& ch : label) ch = (char)tolower(ch);
      auto shot = [&]() { savePng(id + "-" + label + "-" + std::to_string(++count[k]) + "-" + size); };
      for (int i = 0; i < n; i++) {
        const gm::Card& c = cards[i];
        if (c.kind == 'g' || c.kind == 'p') {
          free(pic);
          pic = gm::loadCardPicture(assets, readRange, c);
          assert(pic);
          picCard = c;
          dirty = false;
          previous = gm::TextRect();
          palette(pic, pal);
          carddraw::clear(fb, pal[0]);
          carddraw::pushPicture(fb, pic + 768, pal, band.data(), 30);
          shot();
        } else if (c.kind == 'f') {  // the animation's last frame
          size_t tn = 0;
          uint8_t* table = gm::readCard(assets, readRange, c.file, &tn);
          std::vector<uint8_t> buf(gm::PIC_BYTES);
          for (int fr = 0; table && fr < c.more; fr++) {
            size_t dn = 0;
            uint8_t* d = gm::fliFrameData(assets, readRange, table, tn, fr, &dn);
            assert(d);
            gm::fliApply(d, dn, buf.data() + 768, buf.data());
            free(d);
          }
          free(table);
          palette(buf.data(), pal);
          carddraw::clear(fb, pal[0]);
          carddraw::pushPicture(fb, buf.data() + 768, pal, band.data(), 30);
          shot();
        } else if (c.kind == 't' && pic) {
          size_t tn = 0;
          uint8_t* t = gm::readCard(assets, readRange, c.file, &tn);
          assert(t);
          int pages = gm::textPageCount(t, tn);
          for (int pg = 0; pg < pages; pg++) {
            if (dirty) { free(pic); pic = gm::loadCardPicture(assets, readRange, picCard); }
            carddraw::textPage(fb, pic + 768, pal, band.data(), 30, fontv.data(), t, tn, pg, c.color, c.more, dirty, previous);
            dirty = true;
            shot();
          }
          free(t);
        }
      }
      free(pic);
    }
    printf("storytest %s %s: pages %s%s%s, %d title, %d story, %d instructions screens\n", size.c_str(), id.c_str(), mask & 1 ? "T" : "-",
           mask & 2 ? "S" : "-", mask & 4 ? "I" : "-", count[0], count[1], count[2]);
  }
  printf("storytest %s: passed\n", size.c_str());
  return 0;
}
