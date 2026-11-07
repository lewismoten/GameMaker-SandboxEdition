// Recently played and Favorites (src/favorites.h): the list rules, the 8 and 32 limits, the stored form (round trip and
// every malformed case), the virtual pages over installed games (a card game drops out of view and comes back), the
// Details and pause hit tables, and renders of the new screens at 320x240 and 480x320 into argv[2].
//   c++ -std=c++17 -I src host/favoritestest.cpp -lz -o /tmp/favoritestest && /tmp/favoritestest data <out dir>
#include "framebuffer.h"
#include "library.h"
#include "picker_draw.h"
#include "gmsmall.h"
namespace textdatum_t { constexpr int middle_center = 4, top_left = 0; }  // the names LovyanGFX has on the board
#include "pressrect.h"
#include <assert.h>
#include <fstream>
#include <string>
#include <vector>
#include <zlib.h>
static void save(const Phys& fb, const std::string& path) {
  FILE* f = fopen(path.c_str(), "wb");
  assert(f);
  fprintf(f, "P6\n%d %d\n255\n", fb.W, fb.H);
  for (int i = 0; i < fb.W * fb.H; i++) {
    uint16_t c = fb.px[i];
    unsigned char rgb[] = {(unsigned char)((c >> 11) * 255 / 31), (unsigned char)(((c >> 5) & 63) * 255 / 63), (unsigned char)((c & 31) * 255 / 31)};
    fwrite(rgb, 1, 3, f);
  }
  fclose(f);
}
static void uidOf(int i, uint8_t* u) {
  memset(u, 0, 16);
  u[0] = (uint8_t)i;
  u[1] = (uint8_t)(i >> 8);
  u[15] = 0xA5;
}
static bool readAt(FILE* f, uint32_t off, void* b, uint32_t n) { return !fseek(f, off, SEEK_SET) && fread(b, 1, n, f) == n; }

static void listRules() {
  uint8_t u[40][16];
  for (int i = 0; i < 40; i++) uidOf(i, u[i]);
  // Recently played: newest first, no repeats, eight at most, and a game already first asks for no write.
  pk::RecentList r;
  for (int i = 0; i < 10; i++) assert(pk::recentPlayed(r, u[i]));
  assert(r.n == pk::RECENT_MAX && !memcmp(r.uid[0], u[9], 16) && !memcmp(r.uid[7], u[2], 16) && !r.has(u[1]));
  assert(!pk::recentPlayed(r, u[9]) && r.n == 8);
  assert(pk::recentPlayed(r, u[5]) && r.n == 8 && !memcmp(r.uid[0], u[5], 16) && !memcmp(r.uid[1], u[9], 16));
  for (int i = 0; i < r.n; i++)
    for (int j = i + 1; j < r.n; j++) assert(memcmp(r.uid[i], r.uid[j], 16));
  // Favorites: a toggle; 32 at most, and a full list adds nothing until one is unstarred.
  pk::PinList p;
  for (int i = 0; i < pk::PINS_MAX; i++) assert(pk::togglePin(p, u[i]) == pk::PIN_ADDED);
  assert(p.n == 32 && pk::togglePin(p, u[32]) == pk::PIN_FULL && p.n == 32 && !p.has(u[32]));
  assert(pk::togglePin(p, u[3]) == pk::PIN_REMOVED && p.n == 31 && !p.has(u[3]));
  assert(pk::togglePin(p, u[32]) == pk::PIN_ADDED && p.n == 32 && !memcmp(p.uid[0], u[32], 16));
  assert(pk::togglePin(p, u[32]) == pk::PIN_REMOVED && pk::togglePin(p, u[32]) == pk::PIN_ADDED);
  // The stored form: a round trip for every count, and anything malformed reads as an empty list.
  uint8_t blob[pk::blobSize(pk::PINS_MAX)];
  for (int n = 0; n <= pk::PINS_MAX; n++) {
    pk::PinList a, b;
    for (int i = 0; i < n; i++) a.pushFront(u[i]);
    size_t len = pk::packUids(a, pk::PINS_MAGIC, blob);
    assert(len == pk::blobSize(n) && pk::unpackUids(blob, len, pk::PINS_MAGIC, b) && b.n == n && !memcmp(a.uid, b.uid, n * 16));
  }
  {
    pk::PinList a, b;
    for (int i = 0; i < 5; i++) a.pushFront(u[i]);
    size_t len = pk::packUids(a, pk::PINS_MAGIC, blob);
    assert(!memcmp(blob, "PIN1", 4) && blob[4] == 5);
    b.n = 9;
    assert(!pk::unpackUids(blob, len, pk::RECENT_MAGIC, b) && b.n == 0);  // the other list's key
    assert(!pk::unpackUids(blob, len - 1, pk::PINS_MAGIC, b) && !pk::unpackUids(blob, len + 16, pk::PINS_MAGIC, b));
    assert(!pk::unpackUids(blob, 3, pk::PINS_MAGIC, b));
    for (size_t at = 0; at < len; at++) {  // any flipped bit is caught
      blob[at] ^= 0x10;
      assert(!pk::unpackUids(blob, len, pk::PINS_MAGIC, b) && b.n == 0);
      blob[at] ^= 0x10;
    }
    assert(pk::unpackUids(blob, len, pk::PINS_MAGIC, b) && b.n == 5);
    pk::RecentList small;  // a pins blob with more games than a recent list holds is refused, not cut short
    pk::PinList big;
    for (int i = 0; i < 9; i++) big.pushFront(u[i]);
    size_t bigLen = pk::packUids(big, pk::RECENT_MAGIC, blob);
    assert(!pk::unpackUids(blob, bigLen, pk::RECENT_MAGIC, small) && small.n == 0);
    pk::RecentList full;
    for (int i = 0; i < 8; i++) full.pushFront(u[i]);
    assert(pk::packUids(full, pk::RECENT_MAGIC, blob) == 140);  // 128 bytes of uids, as the plan budgets
  }
  assert(pk::blobSize(pk::PINS_MAX) == 524 && sizeof(pk::RecentList) + sizeof(pk::PinList) <= 700);
  static_assert(sizeof(pk::Catalog) <= 48 * 1024, "menu budget");
}

// The virtual pages: the installed games of a list in list order; a game that is not installed drops out of view but
// stays in the list, and is shown again when it is back (a card pulled, then put back).
static void virtualPages() {
  std::vector<pk::Entry> games(20);
  for (int i = 0; i < 20; i++) {
    games[i] = {};
    uidOf(100 + i, games[i].uid);
    games[i].sd = i >= 12;  // 12-19: card games
  }
  pk::PinList pins;
  for (int i : {3, 15, 7, 18}) pins.pushFront(games[i].uid);
  uint16_t out[pk::MAX_GAMES];
  int n = pk::listGames(games.data(), 20, pins, out);
  assert(n == 4 && out[0] == 18 && out[1] == 7 && out[2] == 15 && out[3] == 3);
  std::vector<pk::Entry> flashOnly(games.begin(), games.begin() + 12);  // the card is out
  n = pk::listGames(flashOnly.data(), 12, pins, out);
  assert(n == 2 && out[0] == 7 && out[1] == 3 && pins.n == 4);
  pk::RecentList recent;
  recent.pushFront(games[19].uid);
  assert(pk::anyListed(games.data(), 20, recent) && !pk::anyListed(flashOnly.data(), 12, recent));
  assert(pk::listGames(flashOnly.data(), 12, recent, out) == 0);
  n = pk::listGames(games.data(), 20, pins, out);  // the card is back
  assert(n == 4 && out[0] == 18);
  pk::PinList none;
  assert(pk::listGames(games.data(), 20, none, out) == 0 && !pk::anyListed(games.data(), 0, recent));
}

// Every Details button and the pause star are at least 24 x 24 and found where they are drawn.
static void hitTables(int W, int H) {
  prs::Ctx c;
  c.W = W;
  c.H = H;
  c.screen = prs::SC_DETAILS;
  for (int b = 0; b < 3; b++) {
    int x = b * W / 3 + W / 6;
    prs::Rect r;
    assert(prs::under(c, x, H - 10, r) && pk::detailsButton(W, x) == b && r.x1 - r.x0 >= 32 && r.y1 - r.y0 >= 32);
    assert(pk::detailsButton(W, r.x0) == b && pk::detailsButton(W, r.x1 - 1) == b);
  }
  prs::Rect above;
  assert(!prs::under(c, W / 2, H - 60, above));  // nothing above the footer
}

static std::vector<uint8_t> thumbOf(FILE* f, gm::SmallPak& pak, const pk::Meta& m) {
  uint32_t off, len;
  assert(pak.find(m.thumb, &off, &len));
  std::vector<uint8_t> b(len), raw(pk::THUMB_RAW);
  assert(readAt(f, off, b.data(), len));
  z_stream z = {};
  assert(inflateInit2(&z, -15) == Z_OK);
  z.next_in = b.data() + 4;
  z.avail_in = len - 4;
  z.next_out = raw.data();
  z.avail_out = raw.size();
  assert(inflate(&z, Z_FINISH) == Z_STREAM_END);
  inflateEnd(&z);
  return raw;
}
static bool padRead(void* u, uint32_t off, void* b, uint32_t n) { return readAt((FILE*)u, off, b, n); }

int main(int argc, char** argv) {
  assert(argc == 3);
  listRules();
  virtualPages();
  std::string data = argv[1], out = argv[2];
  std::ifstream index(data + "/library.jsonl");
  std::string line;
  std::getline(index, line);
  std::vector<pk::Meta> records;
  while (std::getline(index, line)) {
    pk::Meta m;
    if (pk::metadata(line.c_str(), line.size(), m, true) && m.thumb[0]) records.push_back(m);
  }
  assert(records.size() > 8);
  FILE* f = fopen((data + "/thumbs.pak").c_str(), "rb");
  assert(f);
  gm::SmallPak pak;
  pak.user = f;
  pak.readAt = padRead;
  fseek(f, 0, SEEK_END);
  pak.size = ftell(f);
  assert(pak.begin());
  for (int W : {320, 480}) {
    static Phys fb;
    fb.W = W;
    fb.H = W == 320 ? 240 : 320;
    hitTables(W, fb.H);
    std::string w = std::to_string(W);
    // The home page: Continue, Recently played, Favorites, then Starters, Sandbox and Bizarre; page 2 the rest.
    pk::clearTiles(fb, W);
    pk::libraryFrame(fb, W, fb.H, "Pocket Player", 0, 2, nullptr, false);
    pk::continueTile(fb, W, 0, thumbOf(f, pak, records[2]).data(), 2, false);
    const char* first[] = {"Recently played", "Favorites", "Starters", "Sandbox", "Bizarre"};
    const int firstIcons[] = {19, 20, 6, 9, 10};
    for (int i = 1; i < 6; i++) pk::tileLabel(fb, W, i, first[i - 1], false, firstIcons[i - 1]);
    assert(!fb.clipped);
    save(fb, out + "/home-" + w + ".ppm");
    pk::clearTiles(fb, W);
    pk::libraryFrame(fb, W, fb.H, "Pocket Player", 1, 2, nullptr, false);
    const char* second[] = {"My games", "Imported", "CD", "Good on touch"};
    const int secondIcons[] = {11, 12, 13, 16};
    for (int i = 0; i < 4; i++) pk::tileLabel(fb, W, i, second[i], false, secondIcons[i]);
    assert(!fb.clipped);
    save(fb, out + "/home-page2-" + w + ".ppm");
    // Favorites: the starred games newest first, each with its star; the second one selected.
    pk::clearTiles(fb, W);
    pk::libraryFrame(fb, W, fb.H, "Favorites", 0, 1, "Details");
    for (int i = 0; i < 5; i++) pk::thumbnail(fb, W, i, thumbOf(f, pak, records[i * 3]).data(), records[i * 3].dos, i == 1, false, true);
    assert(!fb.clipped);
    save(fb, out + "/favorites-" + w + ".ppm");
    // Recently played: a mix of starred and plain games.
    pk::clearTiles(fb, W);
    pk::libraryFrame(fb, W, fb.H, "Recently played", 0, 1, "Details");
    for (int i = 0; i < 6; i++) pk::thumbnail(fb, W, i, thumbOf(f, pak, records[i + 1]).data(), records[i + 1].dos, false, false, i == 0 || i == 3);
    assert(!fb.clipped);
    save(fb, out + "/recent-" + w + ".ppm");
    // An empty Favorites page, and one whose games are all on a card that is out.
    for (int hidden = 0; hidden < 2; hidden++) {
      pk::clearTiles(fb, W);
      pk::libraryFrame(fb, W, fb.H, "Favorites", 0, 1, nullptr);
      pk::emptyFavorites(fb, W, hidden);
      assert(!fb.clipped);
      save(fb, out + (hidden ? "/favorites-card-out-" : "/favorites-empty-") + w + ".ppm");
    }
    // Details with the star off, on, and the full-list message.
    for (int state = 0; state < 3; state++) {
      fb.clear();
      fb.fillRect(0, 0, W, 32, pk::C_DARK);
      pk::Tile bar = {0, 0, W, 32, 0, 0};
      pk::clippedText(fb, bar, "Game details", 8, 12, 1, pk::C_WHITE);
      pk::Tile body = {8, 40, W - 16, fb.H - 90, 0, 0};
      pk::clippedText(fb, body, records[4].title, 8, 44, 1, pk::C_WHITE);
      pk::detailsFooter(fb, W, fb.H, state == 1);
      if (state == 1) pk::detailsNote(fb, W, fb.H, "In Favorites");
      if (state == 2) pk::detailsNote(fb, W, fb.H, "Favorites are full (32): unstar one first");
      assert(!fb.clipped);
      save(fb, out + "/details-" + (state == 0 ? "plain-" : state == 1 ? "favorite-" : "full-") + w + ".ppm");
    }
  }
  fclose(f);
  printf("favoritestest: passed; recent=%zu pins=%zu catalog=%zu bytes\n", sizeof(pk::RecentList), sizeof(pk::PinList), sizeof(pk::Catalog));
}
