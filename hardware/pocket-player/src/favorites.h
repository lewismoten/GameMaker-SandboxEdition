// Recently played and Favorites: two small lists of game uids (the 16-byte hash each library Entry carries), kept in
// NVS (namespace "pocket", keys "recent" and "pins") and shown as the home page's virtual categories. They are the
// seed of the library journal (README "Recently played and Favorites"): the stored form below is what it imports.
// Stored form, little endian: magic (4: "RCT1" or "PIN1"), count (1), 3 zero bytes, count x 16-byte uid (newest
// first), CRC-32 of everything before it (4). A game that is not installed (a card game with the card out) stays in
// the list and is only left out of the page. No board code: host/favoritestest.cpp runs all of it on the Mac.
#pragma once
#include <stdint.h>
#include <stddef.h>
#include <string.h>
namespace pk {
inline uint32_t crc32(const void* data, size_t n);  // defined in library.h, which includes this file
constexpr int RECENT_MAX = 8, PINS_MAX = 32;
constexpr uint32_t RECENT_MAGIC = 0x31544352, PINS_MAGIC = 0x314E4950;  // "RCT1", "PIN1"
template <int N> struct UidList {
  uint8_t n = 0;
  uint8_t uid[N][16];
  static constexpr int CAP = N;
  int find(const uint8_t* u) const {
    for (int i = 0; i < n; i++)
      if (!memcmp(uid[i], u, 16)) return i;
    return -1;
  }
  bool has(const uint8_t* u) const { return find(u) >= 0; }
  void removeAt(int i) {
    memmove(uid[i], uid[i + 1], (size_t)(n - i - 1) * 16);
    n--;
  }
  // Put u first (moving it if it is already there; the oldest falls off a full list).
  void pushFront(const uint8_t* u) {
    int at = find(u);
    if (at >= 0) removeAt(at);
    else if (n == N) n--;
    memmove(uid[1], uid[0], (size_t)n * 16);
    memcpy(uid[0], u, 16);
    n++;
  }
};
using RecentList = UidList<RECENT_MAX>;
using PinList = UidList<PINS_MAX>;
constexpr size_t blobSize(int count) { return 8 + (size_t)count * 16 + 4; }
// The stored bytes of a list (out must hold blobSize(N)); returns their length.
template <int N> size_t packUids(const UidList<N>& l, uint32_t magic, uint8_t* out) {
  memset(out, 0, 8);
  for (int i = 0; i < 4; i++) out[i] = (uint8_t)(magic >> (8 * i));
  out[4] = l.n;
  memcpy(out + 8, l.uid, (size_t)l.n * 16);
  size_t at = 8 + (size_t)l.n * 16;
  uint32_t c = crc32(out, at);
  for (int i = 0; i < 4; i++) out[at + i] = (uint8_t)(c >> (8 * i));
  return at + 4;
}
// Reads stored bytes back; anything malformed (size, magic, count over the limit, checksum) leaves an empty list.
template <int N> bool unpackUids(const uint8_t* in, size_t len, uint32_t magic, UidList<N>& l) {
  l.n = 0;
  if (len < blobSize(0)) return false;
  uint32_t m = in[0] | in[1] << 8 | in[2] << 16 | (uint32_t)in[3] << 24;
  int count = in[4];
  if (m != magic || count > N || in[5] || in[6] || in[7] || len != blobSize(count)) return false;
  size_t at = 8 + (size_t)count * 16;
  uint32_t c = in[at] | in[at + 1] << 8 | in[at + 2] << 16 | (uint32_t)in[at + 3] << 24;
  if (c != crc32(in, at)) return false;
  memcpy(l.uid, in + 8, (size_t)count * 16);
  l.n = (uint8_t)count;
  return true;
}
// Recently played: true when the list changed (a game already first needs no NVS write).
inline bool recentPlayed(RecentList& l, const uint8_t* u) {
  if (l.n && !memcmp(l.uid[0], u, 16)) return false;
  l.pushFront(u);
  return true;
}
enum PinResult : uint8_t { PIN_ADDED, PIN_REMOVED, PIN_FULL };
// Star or unstar a game. A full list (32, counting games not in right now) adds nothing: the player unstars one first.
inline PinResult togglePin(PinList& l, const uint8_t* u) {
  int at = l.find(u);
  if (at >= 0) {
    l.removeAt(at);
    return PIN_REMOVED;
  }
  if (l.n >= PINS_MAX) return PIN_FULL;
  l.pushFront(u);
  return PIN_ADDED;
}
// A virtual category's page: the installed games of the list, in list order (newest first). `games` is anything with a
// `uid[16]` member; returns how many indices went into `out`.
template <class E, int N> int listGames(const E* games, int count, const UidList<N>& l, uint16_t* out) {
  int k = 0;
  for (int i = 0; i < l.n; i++)
    for (int g = 0; g < count; g++)
      if (!memcmp(games[g].uid, l.uid[i], 16)) {
        out[k++] = (uint16_t)g;
        break;
      }
  return k;
}
// Whether any game of the list is installed (the home page shows Recently played only then).
template <class E, int N> bool anyListed(const E* games, int count, const UidList<N>& l) {
  for (int i = 0; i < l.n; i++)
    for (int g = 0; g < count; g++)
      if (!memcmp(games[g].uid, l.uid[i], 16)) return true;
  return false;
}
// A five-pointed star (point up) of outer radius r centered on (cx, cy), filled with `color`; `outline` leaves a
// 2-pixel ring with the inside in `inner`. Drawn as row spans with fillRect only, so the host frame buffer and the
// board's display both draw it.
template <class G> void drawStar(G& g, int cx, int cy, int r, uint16_t color, bool outline = false, uint16_t inner = 0) {
  // The ten corners at r and 0.4 r: sin and cos of 36-degree steps, times 1000.
  static const int16_t S[10] = {0, 588, 951, 951, 588, 0, -588, -951, -951, -588};
  static const int16_t C[10] = {-1000, -809, -309, 309, 809, 1000, 809, 309, -309, -809};
  auto span = [&](int rad, uint16_t col) {
    long px[10], py[10];
    for (int i = 0; i < 10; i++) {
      long rr = i & 1 ? rad * 400L : rad * 1000L;  // radius times 1000
      px[i] = S[i] * rr / 1000;                     // times 1000, relative to the center
      py[i] = C[i] * rr / 1000;
    }
    for (int y = -rad; y <= rad; y++) {
      long yy = y * 1000L;
      long xs[10];
      int nx = 0;
      for (int i = 0; i < 10; i++) {
        int j = (i + 1) % 10;
        if ((py[i] <= yy && py[j] > yy) || (py[j] <= yy && py[i] > yy)) xs[nx++] = px[i] + (yy - py[i]) * (px[j] - px[i]) / (py[j] - py[i]);
      }
      for (int a = 1; a < nx; a++)
        for (int b = a; b > 0 && xs[b - 1] > xs[b]; b--) {
          long t = xs[b];
          xs[b] = xs[b - 1];
          xs[b - 1] = t;
        }
      for (int a = 0; a + 1 < nx; a += 2) {
        int x0 = (int)((xs[a] + 500) / 1000), x1 = (int)((xs[a + 1] + 499) / 1000);
        if (x1 >= x0) g.fillRect(cx + x0, cy + y, x1 - x0 + 1, 1, col);
      }
    }
  };
  span(r, color);
  if (outline && r > 5) span(r - 3, inner);
}
}  // namespace pk
