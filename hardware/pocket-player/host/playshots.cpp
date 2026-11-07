// Real play frames with the touch overlay, drawn on the Mac: a Starter's real level through gmcore.h's renderRow
// (the picture the board shows), with src/overlaydraw.h (the code the board runs) drawing the pad, Space/Enter, the
// MENU and KEYS chips on top, and the pause menu. Cells: both hands, the three pad sizes, Smaller picture off and on.
//   playshots <data dir> <out dir> [game id ...]      build with -lz; add -DPOCKET_CYD28 for the 320 x 240 board
// Writes <out>/play-<w>-<id>-<smaller|full>.png (a montage: right hand pad 0, 1, 2 over left hand pad 0, 1, 2) and
// <out>/pause-<w>-<id>.png and <out>/help-<w>-<id>.png (How to play), and prints "SHOT <name> <hash>" per cell for web/scripts/pocketControlsCheck.ts to compare.
// Text is the 6 x 8 bitmap font (softgfx.h's glyphs, scaled), so words differ a little from the board's font.
#include <algorithm>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <string>
#include <vector>
#include <zlib.h>
namespace textdatum_t { constexpr int middle_center = 4, top_left = 0; }  // the names LovyanGFX has on the board
#include "gmcfg.h"
#include "overlaydraw.h"
#include "pressrect.h"
#include "softgfx.h"
#include "stdiolines.h"

using namespace gm;

// A buffer the overlay draws into, standing in for the board's sprite and screen (plain RGB565).
struct Canvas {
  int W, H;
  std::vector<uint16_t> px;
  uint16_t tc = 0xFFFF;
  float ts = 1;
  Canvas(int w, int h) : W(w), H(h), px((size_t)w * h, 0) {}
  void put(int x, int y, uint16_t c) { if (x >= 0 && y >= 0 && x < W && y < H) px[(size_t)y * W + x] = c; }
  void fillRect(int x, int y, int w, int h, uint16_t c) { for (int j = 0; j < h; j++) for (int i = 0; i < w; i++) put(x + i, y + j, c); }
  void drawRect(int x, int y, int w, int h, uint16_t c) { fillRect(x, y, w, 1, c); fillRect(x, y + h - 1, w, 1, c); fillRect(x, y, 1, h, c); fillRect(x + w - 1, y, 1, h, c); }
  void fillRoundRect(int x, int y, int w, int h, int r, uint16_t c) {
    for (int j = 0; j < h; j++) for (int i = 0; i < w; i++) {
      int dx = i < r ? r - i : i >= w - r ? i - (w - r - 1) : 0, dy = j < r ? r - j : j >= h - r ? j - (h - r - 1) : 0;
      if (dx * dx + dy * dy <= r * r) put(x + i, y + j, c);
    }
  }
  void drawRoundRect(int x, int y, int w, int h, int r, uint16_t c) {
    for (int j = 0; j < h; j++) for (int i = 0; i < w; i++) {
      int dx = i < r ? r - i : i >= w - r ? i - (w - r - 1) : 0, dy = j < r ? r - j : j >= h - r ? j - (h - r - 1) : 0;
      int d = dx * dx + dy * dy;
      bool edge = (i == 0 || j == 0 || i == w - 1 || j == h - 1) && d <= r * r;
      if (edge || (d <= r * r && d > (r - 1) * (r - 1) && (dx || dy))) put(x + i, y + j, c);
    }
  }
  void fillCircle(int x, int y, int r, uint16_t c) { for (int j = -r; j <= r; j++) for (int i = -r; i <= r; i++) if (i * i + j * j <= r * r) put(x + i, y + j, c); }
  void drawCircle(int x, int y, int r, uint16_t c) { for (int j = -r; j <= r; j++) for (int i = -r; i <= r; i++) { int d = i * i + j * j; if (d <= r * r && d > (r - 1) * (r - 1)) put(x + i, y + j, c); } }
  void drawLine(int x, int y, int x1, int y1, uint16_t c) {
    int dx = abs(x1 - x), sx = x < x1 ? 1 : -1, dy = -abs(y1 - y), sy = y < y1 ? 1 : -1, e = dx + dy;
    for (;;) { put(x, y, c); if (x == x1 && y == y1) break; int e2 = 2 * e; if (e2 >= dy) { e += dy; x += sx; } if (e2 <= dx) { e += dx; y += sy; } }
  }
  void drawTriangle(int a, int b, int c, int d, int e, int f, uint16_t col) { drawLine(a, b, c, d, col); drawLine(c, d, e, f, col); drawLine(e, f, a, b, col); }
  void fillTriangle(int a, int b, int c, int d, int e, int f, uint16_t col) {
    auto cross = [](int x, int y, int u, int v, int p, int q) { return (u - x) * (q - y) - (v - y) * (p - x); };
    for (int y = std::min({b, d, f}); y <= std::max({b, d, f}); y++) for (int x = std::min({a, c, e}); x <= std::max({a, c, e}); x++) {
      int s = cross(a, b, c, d, x, y), t = cross(c, d, e, f, x, y), u = cross(e, f, a, b, x, y);
      if ((s >= 0 && t >= 0 && u >= 0) || (s <= 0 && t <= 0 && u <= 0)) put(x, y, col);
    }
  }
  void drawPixel(int x, int y, uint16_t c) { put(x, y, c); }
  void setTextSize(float s) { ts = s; }
  void setTextColor(uint16_t f) { tc = f; }
  void setTextColor(uint16_t f, uint16_t) { tc = f; }
  void setTextDatum(int) {}
  int cx = 0, cy = 0;
  void setCursor(int x, int y) { cx = x; cy = y; }
  void print(const char* s) { for (; *s; s++, cx += 6 * (int)ts) for (int j = 0; j < 8; j++) for (int i = 0; i < 6; i++) if (sg::glyphOn(*s, i, j)) fillRect(cx + i * (int)ts, cy + j * (int)ts, (int)ts, (int)ts, tc); }
  int textWidth(const char* s) { return (int)(6 * strlen(s) * ts); }
  void drawString(const char* s, int x, int y) {  // middle_center
    int n = (int)strlen(s), w = (int)(6 * n * ts), h = (int)(8 * ts + 0.5f);
    int x0 = x - w / 2, y0 = y - h / 2;
    for (int k = 0; k < n; k++) for (int j = 0; j < 8; j++) for (int i = 0; i < 6; i++) {
      if (!sg::glyphOn(s[k], i, j)) continue;
      int ax = x0 + (int)((k * 6 + i) * ts), bx = x0 + (int)((k * 6 + i + 1) * ts), ay = y0 + (int)(j * ts), by = y0 + (int)((j + 1) * ts);
      fillRect(ax, ay, bx > ax ? bx - ax : 1, by > ay ? by - ay : 1, tc);
    }
  }
};

static std::string dir;
static Cfg cfg;
static Assets assets;

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
static uint8_t* readFile(const char* name, size_t* n) {
  std::vector<uint8_t> v = slurp(dir + "/" + name);
  uint8_t* p = (uint8_t*)malloc(v.size() + 1);
  memcpy(p, v.data(), v.size());
  *n = v.size();
  return p;
}

static void writePng(const std::string& path, int w, int h, const std::vector<uint8_t>& rgb) {
  std::vector<uint8_t> raw;
  for (int y = 0; y < h; y++) { raw.push_back(0); raw.insert(raw.end(), rgb.begin() + (size_t)y * w * 3, rgb.begin() + (size_t)(y + 1) * w * 3); }
  uLongf cl = compressBound((uLong)raw.size());
  std::vector<uint8_t> comp(cl);
  compress2(comp.data(), &cl, raw.data(), (uLong)raw.size(), 9);
  FILE* f = fopen(path.c_str(), "wb");
  if (!f) { fprintf(stderr, "cannot write %s\n", path.c_str()); exit(2); }
  auto chunk = [&](const char* t, const uint8_t* d, uint32_t n) {
    uint8_t len[4] = {(uint8_t)(n >> 24), (uint8_t)(n >> 16), (uint8_t)(n >> 8), (uint8_t)n};
    fwrite(len, 1, 4, f);
    fwrite(t, 1, 4, f);
    if (n) fwrite(d, 1, n, f);
    uLong c = crc32(0, (const Bytef*)t, 4);
    if (n) c = crc32(c, d, n);
    uint8_t cr[4] = {(uint8_t)(c >> 24), (uint8_t)(c >> 16), (uint8_t)(c >> 8), (uint8_t)c};
    fwrite(cr, 1, 4, f);
  };
  fwrite("\x89PNG\r\n\x1a\n", 1, 8, f);
  uint8_t ih[13] = {(uint8_t)(w >> 24), (uint8_t)(w >> 16), (uint8_t)(w >> 8), (uint8_t)w, (uint8_t)(h >> 24), (uint8_t)(h >> 16), (uint8_t)(h >> 8), (uint8_t)h, 8, 2, 0, 0, 0};
  chunk("IHDR", ih, 13);
  chunk("IDAT", comp.data(), (uint32_t)cl);
  chunk("IEND", nullptr, 0);
  fclose(f);
}

static uint32_t hashOf(const Canvas& c) {
  uint32_t h = 2166136261u;
  for (uint16_t p : c.px) { h = (h ^ (p & 255)) * 16777619u; h = (h ^ (p >> 8)) * 16777619u; }
  return h;
}

constexpr int VIEW_W = scr::W, VIEW_H = scr::VIEW_H;

// The play screen as drawFrame(true) draws it: the game's rows through the picture, the overlay on top.
static Canvas playScreen(World& w, const ctl::Need& need, const ctl::Settings& st, bool smaller, bool pause) {
  ctl::Controls controls;
  controls.configure(st, need);
  uint16_t pal[256];
  for (int i = 0; i < 256; i++) {
    auto v8 = [](uint8_t c) { c &= 63; return (uint8_t)((c << 2) | (c >> 4)); };
    pal[i] = (uint16_t)(((v8(assets.pal[i * 3]) & 0xF8) << 8) | ((v8(assets.pal[i * 3 + 1]) & 0xFC) << 3) | (v8(assets.pal[i * 3 + 2]) >> 3));
  }
  const auto& pad = controls.L.pad;
  int edge = st.lefty ? VIEW_W - pad.cx + pad.r : pad.cx + pad.r;
  scr::Picture view{VIEW_W, VIEW_H, smaller, st.lefty != 0, edge + 14};
  Canvas screen(scr::W, scr::H);
  std::vector<uint16_t> band((size_t)VIEW_W * VIEW_H, 0);
  uint8_t row[SIZEX];
  int rowGy = -1;
  for (int Y = 0; Y < VIEW_H; Y++) {
    int gy = view.fromY(Y);
    if (gy < SIZEY && gy != rowGy) { w.renderRow(gy, row); rowGy = gy; }
    for (int X = 0; X < VIEW_W; X++) band[(size_t)Y * VIEW_W + X] = view.contains(X, Y) ? pal[row[view.fromX(X)]] : 0;
  }
  Canvas spr(VIEW_W, VIEW_H);
  spr.px = band;
  BtnIcon icons[2 + ctl::MAXEXTRA];
  icons[0] = need.space ? iconForKey(w, ctl::S_SPACE) : BtnIcon();
  icons[1] = need.enter ? iconForKey(w, ctl::S_ENTER) : BtnIcon();
  for (int i = 0; i < ctl::MAXEXTRA; i++) icons[2 + i] = i < need.nextra ? iconForKey(w, need.extra[i]) : BtnIcon();
  ovl::Overlay<Canvas> ov(spr, spr.px.data(), pal, cfg, controls, icons);
  ov.bandX = 0; ov.bandY = 0; ov.bandW = VIEW_W; ov.bandH = VIEW_H;
  ov.drawControls();
  for (int Y = 0; Y < VIEW_H; Y++) for (int X = 0; X < VIEW_W; X++) screen.px[(size_t)Y * scr::W + X] = spr.px[(size_t)Y * VIEW_W + X];
  if (pause) ovl::pauseMenu(screen, cfg.title, w.level, 1);  // with the Favorite star filled
  return screen;
}

static void blit(std::vector<uint8_t>& img, int imgW, int ox, int oy, const Canvas& c) {
  for (int y = 0; y < c.H; y++) for (int x = 0; x < c.W; x++) {
    uint16_t p = c.px[(size_t)y * c.W + x];
    uint8_t* o = &img[((size_t)(oy + y) * imgW + ox + x) * 3];
    o[0] = (uint8_t)((p >> 11 & 31) * 255 / 31); o[1] = (uint8_t)((p >> 5 & 63) * 255 / 63); o[2] = (uint8_t)((p & 31) * 255 / 31);
  }
}

int main(int argc, char** argv) {
  if (argc < 3) return 2;
  dir = argv[1];
  std::string out = argv[2];
  std::vector<std::string> ids;
  for (int i = 3; i < argc; i++) ids.push_back(argv[i]);
  if (ids.empty()) ids = {"first-steps", "around-the-room", "jump-boots"};
  const char* wname = scr::SMALL ? "320" : "480";
  int fails = 0;
  for (const std::string& id : ids) {
    static World w;
    w = World();
    cfg = Cfg();
    assets = Assets();
    std::vector<uint8_t> cfgText = slurp(dir + "/" + id + ".cfg");
    cfgText.push_back(0);
    if (!parseCfg((const char*)cfgText.data(), w, cfg)) { printf("FAIL: cannot parse %s\n", id.c_str()); fails++; continue; }
    assets.attach(w, cfg, readFile, inflateRaw);
    linesDir = dir;
    assets.lines = &stdioLines;
    snprintf(assets.cfgName, sizeof assets.cfgName, "%s.cfg", id.c_str());
    w.begin();
    for (int t = 0; t < 90; t++) { w.key(ctl::S_RIGHT, t < 60); w.tick(); }  // walk right a little so the frame is a level in play
    ctl::Need need;
    for (int i = 0; i < cfg.nkeys; i++) ctl::needAdd(need, cfg.keys[i].scan, cfg.keys[i].label);
    if (!need.left && !need.right && !need.up && !need.down && !need.anyDiag()) need.left = need.right = true;
    if (!need.space && !need.enter && need.nextra == 0) need.space = true;
    for (int smaller = 0; smaller < 2; smaller++) {
      const int cw = scr::W + 8, ch = scr::H + 8;
      std::vector<uint8_t> img((size_t)3 * cw * 2 * ch * 3, 40);
      for (int hand = 0; hand < 2; hand++) for (int size = 0; size < 3; size++) {
        ctl::Settings st;
        st.lefty = (uint8_t)hand; st.padSize = (uint8_t)size; st.debug = 0;
        Canvas c = playScreen(w, need, st, smaller, false);
        blit(img, 3 * cw, size * cw + 4, hand * ch + 4, c);
        printf("SHOT play-%s-%s-%s-%s-pad%d %08x\n", wname, id.c_str(), smaller ? "smaller" : "full", hand ? "left" : "right", size, hashOf(c));
      }
      writePng(out + "/play-" + wname + "-" + id + (smaller ? "-smaller" : "-full") + ".png", 3 * cw, 2 * ch, img);
    }
    ctl::Settings st;
    Canvas c = playScreen(w, need, st, false, true);
    std::vector<uint8_t> img((size_t)scr::W * scr::H * 3);
    blit(img, scr::W, 0, 0, c);
    writePng(out + "/pause-" + wname + "-" + id + ".png", scr::W, scr::H, img);
    printf("SHOT pause-%s-%s %08x\n", wname, id.c_str(), hashOf(c));
    {  // the pause menu with "Restart level" held down (the frame sits inside the button)
      Canvas pc = c;
      prs::drawPausePressed(pc, ovl::PA_RESTART_LEVEL);
      blit(img, scr::W, 0, 0, pc);
      writePng(out + "/pause-pressed-" + wname + "-" + id + ".png", scr::W, scr::H, img);
      printf("SHOT pause-pressed-%s-%s %08x\n", wname, id.c_str(), hashOf(pc));
    }
    Canvas h(scr::W, scr::H);
    ovl::helpPage(h, cfg);
    blit(img, scr::W, 0, 0, h);
    writePng(out + "/help-" + wname + "-" + id + ".png", scr::W, scr::H, img);
    printf("SHOT help-%s-%s %08x\n", wname, id.c_str(), hashOf(h));
  }
  return fails ? 1 : 0;
}
