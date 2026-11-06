// The Pocket Player's touch controls as a model with no board code in it: touches in, key presses out,
// so host/controlstest.cpp replays touch events on the Mac and checks the keys (web/scripts/
// pocketControlsCheck.ts runs it). main.cpp feeds it the GT911's contacts and draws what it reports.
//
// Screen 480 x 320 (about 6.5 px per mm). Right-handed layout (left-handed is the mirror image):
//   [Menu]                                   [Keys]       chips, top corners; Keys only if the game needs more keys
//   (tiles: one per extra key, in rows under the chips while Keys is open)
//        (^)                               (Enter)
//     (<) (.) (>)                              (Space)       pad on the left thumb, two buttons on the right
//        (v)
// - The pad is a round zone, not four buttons: the direction comes from where the finger is, so a
//   held finger can slide from left to right and the keys change over (the old one is released first).
//   A dead zone in the middle presses nothing. Left and right win inside 27 degrees of level, up and
//   down inside 27 degrees of straight, and in between both keys are held (a diagonal). A direction
//   already held stays held out to about 35 degrees (hysteresis), so a thumb doesn't flicker.
// - A finger that began on the pad stays on the pad until it lifts, wherever it slides (the GT911
//   gives each finger an id), so two fingers work: pad and a button, or two buttons.
// - A finger the chip stops reporting (a dropped frame, or the same thumb under a new id) keeps pressing for 60 ms; a new contact
//   within 70 px of it takes its place, so a held Up is not let go and a re-id'd thumb keeps the pad. After 60 ms it lifts.
// - Every key stays down at least 3 game ticks, so a quick tap of a stylus or a finger still registers.
// - Stylus mode: a short tap on the pad (under 300 ms, moved under 10 px) latches the direction it was
//   on, so the hero keeps walking while the one hand taps Space; a tap in the middle (or on the other
//   side) stops him. Holding or dragging on the pad works as usual and stops when it lifts.
// - Palm rejection (off by default): "size" drops contacts the chip reports bigger than a fingertip;
//   "size + near" also drops a new contact that lands within 70 px of a contact already held (the heel
//   of the hand resting beside a thumb). A rejected contact stays rejected until it lifts.
#pragma once
#include <stdint.h>
#include <string.h>
#include <strings.h>
#include "screen.h"

namespace ctl {

constexpr int W = scr::W, H = scr::H;
constexpr int MAXCONTACT = 5, MAXEXTRA = 12;
constexpr int HOLD_MS = 165;       // three game ticks at 18.2 Hz
constexpr int TAP_MS = 300, TAP_PX = 10;
constexpr int NEAR_PX = 70;
constexpr int GRACE_MS = 60;       // a held finger the chip stops reporting keeps pressing this long (about one tick)
constexpr int ADOPT_PX = 70;       // a new id this near a ghost is the same finger

enum Scan { S_ENTER = 28, S_SPACE = 57, S_UP = 72, S_LEFT = 75, S_RIGHT = 77, S_DOWN = 80 };

struct Settings {
  uint8_t sticky = 0;    // tap a horizontal direction to toggle walking (saved in NVS)
  uint8_t lefty = 0;     // 0 right-handed, 1 left-handed
  uint8_t stylus = 0;    // 0 off, 1 on (taps latch)
  uint8_t padSize = 1;   // 0 small (radius 64), 1 medium (76), 2 large (90)
  uint8_t dead = 1;      // 0 small (18 px), 1 medium (26), 2 large (36)
  uint8_t palm = 0;      // 0 off, 1 size, 2 size + near
  uint8_t debug = 1;     // the numbers in the status strip
  uint8_t sound = 2;     // PC speaker volume: 0 off, 1 low, 2 medium, 3 high
};

// Which controls a game needs (from its controls.json): the arrows, Space, Enter, and any other keys.
struct Need {
  bool left = false, right = false, up = false, down = false, space = false, enter = false;
  bool jump = false;  // Space is labeled Jump or Hop; resistive pads can combine it with direction
  int nextra = 0;
  int extra[MAXEXTRA];
  // The key the pad's diagonal sectors send, per corner: 0 up-left, 1 up-right, 2 down-left, 3 down-right (0 = the game has none).
  int diag[4] = {0, 0, 0, 0};
  uint8_t diagPri[4] = {0, 0, 0, 0};
  bool anyDiag() const { return diag[0] || diag[1] || diag[2] || diag[3]; }
};

// A diagonal key: the number pad's 7 9 1 3 (Home, PgUp, End, PgDn) first, else Q E Z C. Z and C only count when the label
// says "down" (Plasma Lance, Kazoo and the like sit on them). Returns the corner, or -1.
inline int diagCorner(int scan, const char* label, int* pri) {
  switch (scan) {
    case 71: *pri = 2; return 0;
    case 73: *pri = 2; return 1;
    case 79: *pri = 2; return 2;
    case 81: *pri = 2; return 3;
    case 16: *pri = 1; return 0;
    case 18: *pri = 1; return 1;
    case 44: case 46: {
      bool down = false;
      for (const char* c = label; c && *c; c++)
        if ((c[0] | 32) == 'd' && (c[1] | 32) == 'o' && (c[2] | 32) == 'w' && (c[3] | 32) == 'n') down = true;
      if (!down) return -1;
      *pri = 1;
      return scan == 44 ? 2 : 3;
    }
  }
  return -1;
}

inline void needAdd(Need& n, int scan, const char* label = "") {
  int pri = 0, corner = diagCorner(scan, label, &pri);
  if (corner >= 0) {   // the pad sends it; no tile
    if (pri > n.diagPri[corner]) { n.diag[corner] = scan; n.diagPri[corner] = pri; }
    return;
  }
  switch (scan) {
    case S_LEFT: case 30: n.left = true; return;     // 30, 32, 17, 31: A, D, W, S are listed beside the arrows
    case S_RIGHT: case 32: n.right = true; return;
    case S_UP: case 17: n.up = true; return;
    case S_DOWN: case 31: n.down = true; return;
    case S_SPACE:
      n.space = true;
      for (const char* c = label; c && *c; c++)
        if (!strncasecmp(c, "jump", 4) || !strncasecmp(c, "hop", 3)) n.jump = true;
      return;
    case S_ENTER: n.enter = true; return;
  }
  for (int i = 0; i < n.nextra; i++) if (n.extra[i] == scan) return;
  if (n.nextra < MAXEXTRA) n.extra[n.nextra++] = scan;
}
// The key a control sends: the letters listed beside the arrows are the arrows themselves.
inline int needScan(int scan) {
  switch (scan) { case 30: return S_LEFT; case 32: return S_RIGHT; case 17: return S_UP; case 31: return S_DOWN; }
  return scan;
}

inline const char* scanName(int s) {
  static const char* top = "QWERTYUIOP", *mid = "ASDFGHJKL", *bot = "ZXCVBNM";
  static char one[2] = {0, 0};
  if (s >= 16 && s <= 25) { one[0] = top[s - 16]; return one; }
  if (s >= 30 && s <= 38) { one[0] = mid[s - 30]; return one; }
  if (s >= 44 && s <= 50) { one[0] = bot[s - 44]; return one; }
  static const char* digits[] = {"1", "2", "3", "4", "5", "6", "7", "8", "9", "0"};
  if (s >= 2 && s <= 11) return digits[s - 2];
  static const char* fn[] = {"F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10"};
  if (s >= 59 && s <= 68) return fn[s - 59];
  switch (s) {
    case 1: return "Esc"; case 14: return "Bksp"; case 15: return "Tab"; case 28: return "Enter"; case 29: return "Ctrl";
    case 42: return "Shift"; case 54: return "Shift"; case 56: return "Alt"; case 57: return "Space";
    case 72: return "Up"; case 75: return "Left"; case 77: return "Right"; case 80: return "Down";
    case 71: return "Home"; case 79: return "End"; case 73: return "PgUp"; case 81: return "PgDn"; case 82: return "Ins"; case 83: return "Del";
  }
  return "?";
}

struct Rect { int x0, y0, x1, y1; };
struct Disc { int cx, cy, r; };
inline bool inRect(const Rect& r, int x, int y, int slop = 0) { return x >= r.x0 - slop && x < r.x1 + slop && y >= r.y0 - slop && y < r.y1 + slop; }
inline bool inDisc(const Disc& d, int x, int y, int slop = 0) {
  int dx = x - d.cx, dy = y - d.cy, r = d.r + slop;
  return dx * dx + dy * dy <= r * r;
}

struct Layout {
  Disc pad, space, enter;
  Rect menu, keys;
  Rect tile[MAXEXTRA];
  int deadR;
  int tileRows;
};

// Where the chips end and the extra-key tiles begin and step (main.cpp redraws that strip when a tile changes).
#ifdef POCKET_CYD28
constexpr int CHIP_BOTTOM = 38, TILE_Y0 = 42, TILE_STEP = 40, TILE_H = 36, TILE_W = 50, TILE_PITCH = 52;
#else
constexpr int CHIP_BOTTOM = 56, TILE_Y0 = 62, TILE_STEP = 60, TILE_H = 56, TILE_W = 72, TILE_PITCH = 76;
#endif

inline Layout makeLayout(const Settings& s, const Need& need) {
  Layout L;
#ifdef POCKET_CYD28  // 320 x 200 game view with the controls over it (the big layout at about 2/3, 5.6 px per mm)
  static const int padR[3] = {42, 50, 58}, dead[3] = {12, 17, 24};
  const int B = scr::VIEW_H - 4;  // controls stay inside the game view
  int R = padR[s.padSize > 2 ? 1 : s.padSize];
  L.deadR = dead[s.dead > 2 ? 1 : s.dead];
  L.pad = {R + 6, B - R - 2, R};
  L.space = {W - 8 - 24, B - 24 - 4, 24};
  L.enter = {W - 8 - 24 - 24 - 21 - 8, B - 21 - 6, 21};
  L.menu = {2, 2, 46, 36};
  L.keys = {W - 46, 2, W - 2, 36};
#else
  static const int padR[3] = {64, 76, 90}, dead[3] = {18, 26, 36};
  int R = padR[s.padSize > 2 ? 1 : s.padSize];
  L.deadR = dead[s.dead > 2 ? 1 : s.dead];
  L.pad = {R + 10, 296 - R - 4, R};
  L.space = {W - 12 - 34, 296 - 34 - 6, 34};
  L.enter = {W - 12 - 34 - 34 - 30 - 12, 296 - 30 - 8, 30};
  L.menu = {4, 4, 64, 56};
  L.keys = {W - 68, 4, W - 4, 56};
#endif
  if (s.lefty) {
    L.pad.cx = W - L.pad.cx;
    L.space.cx = W - L.space.cx;
    L.enter.cx = W - L.enter.cx;
  }
  L.tileRows = (need.nextra + 5) / 6;
  for (int i = 0; i < MAXEXTRA; i++) {
    int row = i / 6, col = i % 6;
    int inRow = need.nextra - row * 6;
    if (inRow > 6) inRow = 6;
    int total = inRow * TILE_PITCH - 4;
    int x0 = (W - total) / 2 + col * TILE_PITCH;
    L.tile[i] = {x0, TILE_Y0 + row * TILE_STEP, x0 + TILE_W, TILE_Y0 + row * TILE_STEP + TILE_H};
  }
  return L;
}

enum Event { EV_NONE = 0, EV_MENU = 1, EV_KEYS = 2 };
struct Change { int scan; bool down; };

class Controls {
 public:
  Settings set;
  Need need;
  Layout L;
  bool keysOpen = false;
  int padDiag = 0;       // the diagonal key the pad is sending (0 none)
  uint8_t padDirs = 0;   // bit 0 left, 1 right, 2 up, 3 down: what the pad is pressing now (for drawing)
  uint8_t btnDown = 0;   // bit 0 space, 1 enter, 2 menu chip, 3 keys chip (for drawing)
  uint16_t tileDown = 0; // bit per extra-key tile
  int latch = 0;         // stylus mode: -1 walking left, 1 walking right, 0 none
  int lastSize = 0, lastId = -1, lastX = -1, lastY = -1;  // for the debug strip
  int palmDropped = 0;

  void configure(const Settings& s, const Need& n) {
    set = s;
    need = n;
    L = makeLayout(s, n);
    reset();
  }
  void reset() {
    for (auto& c : slot) c.id = -1;
    memset(want, 0, sizeof want);
    memset(sent, 0, sizeof sent);
    memset(holdUntil, 0, sizeof holdUntil);
    padDirs = 0; padDiag = 0; btnDown = 0; tileDown = 0; latch = 0; keysOpen = false;
    ev = EV_NONE; horiz = vert = false; diagHeld = -1;
  }

  // One poll: the contacts now on the glass (screen coordinates). `now` in ms.
  void update(const int* ids, const int* xs, const int* ys, const int* sizes, int n, uint32_t now) {
    bool seen[MAXCONTACT] = {};
    int match[MAXCONTACT];  // the slot each contact belongs to
    // 1. Contacts the chip still reports under the same id (a ghost that comes back under its id is a held finger again).
    for (int i = 0; i < n; i++) {
      match[i] = find(ids[i]);
      if (match[i] >= 0) { seen[match[i]] = true; slot[match[i]].ghost = false; }
    }
    // 2. A finger the chip stopped reporting becomes a ghost: it keeps pressing for GRACE_MS. (Buttons and the pad only: a
    //    one-frame dropout or a swapped id must not let go of a held Up; Menu and Keys act on lift at once.)
    for (int k = 0; k < MAXCONTACT; k++) {
      Slot& s = slot[k];
      if (s.id < 0 || seen[k] || s.ghost) continue;
      if (s.role == PAD || s.role == SPACE || s.role == ENTER || s.role == TILE) { s.ghost = true; s.lostAt = now; }
      else { lift(k, now); seen[k] = true; }
    }
    // 3. A new id: it takes over a ghost lost a moment ago within ADOPT_PX (the chip gave the same thumb a new id), else it is a new finger.
    for (int i = 0; i < n; i++) {
      if (match[i] >= 0) continue;
      int g = -1, best = ADOPT_PX * ADOPT_PX + 1;
      for (int k = 0; k < MAXCONTACT; k++) {
        if (slot[k].id < 0 || !slot[k].ghost) continue;
        int dx = xs[i] - slot[k].x, dy = ys[i] - slot[k].y, d = dx * dx + dy * dy;
        if (d < best) { best = d; g = k; }
      }
      if (g >= 0) { slot[g].id = ids[i]; slot[g].ghost = false; match[i] = g; seen[g] = true; }
      else { match[i] = open(ids[i], xs[i], ys[i], sizes[i], now); if (match[i] >= 0) seen[match[i]] = true; }
    }
    for (int i = 0; i < n; i++) {
      int k = match[i];
      if (k < 0) continue;
      slot[k].x = xs[i];
      slot[k].y = ys[i];
      if ((xs[i] - slot[k].x0) * (xs[i] - slot[k].x0) + (ys[i] - slot[k].y0) * (ys[i] - slot[k].y0) > TAP_PX * TAP_PX) slot[k].moved = true;
      lastSize = sizes[i]; lastId = ids[i]; lastX = xs[i]; lastY = ys[i];
    }
    // 4. Ghosts whose grace is over really lifted (the lift is dated when the chip stopped reporting).
    for (int k = 0; k < MAXCONTACT; k++)
      if (slot[k].id >= 0 && slot[k].ghost && now - slot[k].lostAt >= (uint32_t)GRACE_MS) lift(k, slot[k].lostAt);
    compute(now);
  }
  // Keys that changed since the last call: releases first, then presses. Returns how many.
  int flush(Change* out, int max) {
    int n = 0;
    for (int s = 0; s < 128 && n < max; s++) if (sent[s] && !want[s]) { out[n++] = {s, false}; sent[s] = false; }
    for (int s = 0; s < 128 && n < max; s++) if (want[s] && !sent[s]) { out[n++] = {s, true}; sent[s] = true; }
    return n;
  }
  int takeEvent() { int e = ev; ev = EV_NONE; return e; }
  // Tick the time forward with no new contacts (a key's minimum hold ending).
  void idle(uint32_t now) { update(nullptr, nullptr, nullptr, nullptr, 0, now); }
  // Is a touch at (x, y) over a control? (The picker and menus use their own hit tests.)
  bool overControl(int x, int y) const {
    return inDisc(L.pad, x, y) || (need.space && inDisc(L.space, x, y, 8)) || (need.enter && inDisc(L.enter, x, y, 8)) || inRect(L.menu, x, y) ||
           (need.nextra && inRect(L.keys, x, y));
  }

 private:
  enum Role { NONE, PAD, SPACE, ENTER, MENU, KEYS, TILE, IGNORED };
  struct Slot { int id = -1, role = NONE, tile = 0, oldLatch = 0, x0 = 0, y0 = 0, x = 0, y = 0; uint32_t t0 = 0, lostAt = 0; bool moved = false, ghost = false; uint8_t slideDirs = 0; int slideDiag = 0; bool slideSpace = false; };
  Slot slot[MAXCONTACT];
  bool want[128], sent[128];
  uint32_t holdUntil[128];
  int ev = EV_NONE;
  bool horiz = false, vert = false;   // the pad's last sectors (hysteresis)
  int diagHeld = -1;                  // the corner of the diagonal sector the finger is in (hysteresis), -1 none

  int find(int id) const { for (int k = 0; k < MAXCONTACT; k++) if (slot[k].id == id) return k; return -1; }

  int open(int id, int x, int y, int size, uint32_t now) {
    int k = -1;
    for (int i = 0; i < MAXCONTACT; i++) if (slot[i].id < 0) { k = i; break; }
    if (k < 0) return -1;
    Slot& s = slot[k];
    s = Slot();
    s.id = id; s.x0 = s.x = x; s.y0 = s.y = y; s.t0 = now;
    if (set.palm >= 1 && size >= palmSize()) { s.role = IGNORED; palmDropped++; return k; }
    if (set.palm >= 2) {
      for (int i = 0; i < MAXCONTACT; i++)
        if (i != k && slot[i].id >= 0 && slot[i].role != IGNORED) {
          int dx = x - slot[i].x, dy = y - slot[i].y;
          if (dx * dx + dy * dy < NEAR_PX * NEAR_PX) { s.role = IGNORED; palmDropped++; return k; }
        }
    }
    if (keysOpen)
      for (int t = 0; t < need.nextra; t++)
        if (inRect(L.tile[t], x, y, 4)) { s.role = TILE; s.tile = t; return k; }
    if (inRect(L.menu, x, y, 4)) { s.role = MENU; return k; }
    if (need.nextra && inRect(L.keys, x, y, 4)) { s.role = KEYS; return k; }
    bool onSpace = need.space && inDisc(L.space, x, y, 8), onEnter = need.enter && inDisc(L.enter, x, y, 8);
    if (onSpace && onEnter) {  // overlapping slop: the nearer centre
      int a = (x - L.space.cx) * (x - L.space.cx) + (y - L.space.cy) * (y - L.space.cy);
      int b = (x - L.enter.cx) * (x - L.enter.cx) + (y - L.enter.cy) * (y - L.enter.cy);
      onEnter = b < a; onSpace = !onEnter;
    }
    if (onSpace) { s.role = SPACE; return k; }
    if (onEnter) { s.role = ENTER; return k; }
    bool padTaken = false;
    for (int i = 0; i < MAXCONTACT; i++) if (i != k && slot[i].id >= 0 && slot[i].role == PAD) padTaken = true;
    if (!padTaken && inDisc(L.pad, x, y, 14)) { s.role = PAD; s.oldLatch = latch; latch = 0; return k; }
    return k;
  }
  // The chip's size units are not known until a board reports them; the debug strip shows what a finger gives.
  int palmSize() const { return 160; }

  void lift(int k, uint32_t now) {
    Slot& s = slot[k];
    bool tap = !s.moved && now - s.t0 <= (uint32_t)TAP_MS;
    switch (s.role) {
      case MENU: if (inRect(L.menu, s.x, s.y, 8)) ev = EV_MENU; break;
      case KEYS: if (inRect(L.keys, s.x, s.y, 8)) { keysOpen = !keysOpen; ev = EV_KEYS; } break;
      case PAD:
        if ((set.stylus || set.sticky) && tap) {
          int dx = s.x - L.pad.cx, dy = s.y - L.pad.cy;
          if (dx * dx + dy * dy < L.deadR * L.deadR) latch = 0;
          else {
            int ax = dx < 0 ? -dx : dx, ay = dy < 0 ? -dy : dy;
            if (ax >= ay) {
              int direction = dx < 0 ? -1 : 1;
              latch = set.sticky && s.oldLatch == direction ? 0 : direction;
            }
            else latch = 0;  // a tap up or down is a short press, taken from the hold below
          }
        }
        if (set.stylus && tap && latch == 0) {  // tapped up or down: a short press
          int dx = s.x - L.pad.cx, dy = s.y - L.pad.cy;
          int ax = dx < 0 ? -dx : dx, ay = dy < 0 ? -dy : dy;
          if (dx * dx + dy * dy >= L.deadR * L.deadR && ay > ax) press(dy < 0 ? S_UP : S_DOWN, now);
        }
        break;
    }
    s.id = -1;
    s.role = NONE;
  }
  void press(int scan, uint32_t now) { holdUntil[scan] = now + HOLD_MS; }

  void compute(uint32_t now) {
    bool down[128] = {};
    padDirs = 0; padDiag = 0; btnDown = 0; tileDown = 0;
    bool havePad = false;
    for (int k = 0; k < MAXCONTACT; k++) {
      Slot& s = slot[k];
      if (s.id < 0) continue;
      switch (s.role) {
        case PAD:
          havePad = true;
#ifdef POCKET_CYD28
          // Single-contact steering can cross onto Space. Widen the exit by 6 px to reject edge noise.
          if (need.space && inDisc(L.space, s.x, s.y, s.slideSpace ? 14 : 8)) {
            s.slideSpace = true; padDirs = s.slideDirs; padDiag = s.slideDiag;
            btnDown |= 1;
            if (!s.ghost) press(S_SPACE, now);
            break;
          }
          s.slideSpace = false;
#endif
          padDirs = padSector(s.x, s.y);
          s.slideDirs = padDirs; s.slideDiag = padDiag;
          break;
        case SPACE:
#ifdef POCKET_CYD28
          if (inDisc(L.pad, s.x, s.y, 14)) {
            s.role = PAD; havePad = true; padDirs = padSector(s.x, s.y); s.slideDirs = padDirs; s.slideDiag = padDiag; break;
          }
#endif
          btnDown |= 1; if (!s.ghost) press(S_SPACE, now); break;
        case ENTER: btnDown |= 2; if (!s.ghost) press(S_ENTER, now); break;
        case MENU: btnDown |= 4; break;
        case KEYS: btnDown |= 8; break;
        case TILE: tileDown |= 1 << s.tile; if (!s.ghost) press(needScan(need.extra[s.tile]), now); break;
      }
    }
    if (!havePad) { horiz = vert = false; diagHeld = -1; }
    uint8_t d = padDirs;
    if (!havePad && latch) d |= latch < 0 ? 1 : 2;
    padDirs = d;
#ifdef POCKET_CYD28
    // One resistive contact can steer and jump. Keep native diagonal bindings intact.
    if (need.jump && !padDiag && (d & 4) && (d & 3)) {
      down[S_SPACE] = true; btnDown |= 1;
      if (!sent[S_SPACE]) press(S_SPACE, now);
      d &= ~4;  // this wedge jumps instead of pressing Up
    }
#endif
    if (padDiag) down[padDiag] = true;   // a diagonal sector sends the game's own diagonal key, not two arrows
    else {
      if (d & 1 && need.left) down[S_LEFT] = true;
      if (d & 2 && need.right) down[S_RIGHT] = true;
      if (d & 4 && need.up) down[S_UP] = true;
      if (d & 8 && need.down) down[S_DOWN] = true;
    }
    for (int s = 0; s < 128; s++) want[s] = down[s] || now < holdUntil[s];
    // A pad direction counts as pressed for the minimum hold too.
    for (int sc : {S_LEFT, S_RIGHT, S_UP, S_DOWN}) if (down[sc] && !sent[sc]) holdUntil[sc] = now + HOLD_MS;
    if (padDiag && !sent[padDiag]) holdUntil[padDiag] = now + HOLD_MS;
    for (int s = 0; s < 128; s++) want[s] = down[s] || now < holdUntil[s];
    // The engine follows one direction key at a time: while the finger holds one, the others (arrows, diagonals) let go.
    {
      int dirs[8] = {S_LEFT, S_RIGHT, S_UP, S_DOWN, need.diag[0], need.diag[1], need.diag[2], need.diag[3]};
      bool active = false;
      for (int sc : dirs) if (sc && down[sc]) active = true;
      if (active) for (int sc : dirs) if (sc && !down[sc]) { holdUntil[sc] = 0; want[sc] = false; }
    }
    // Opposite directions never overlap: the one the finger is on wins at once.
    for (int pair = 0; pair < 2; pair++) {
      int a = pair ? S_UP : S_LEFT, b = pair ? S_DOWN : S_RIGHT;
      if (want[a] && want[b]) {
        int drop = down[a] ? b : a;
        if (down[a] == down[b]) drop = sent[a] ? b : a;
        holdUntil[drop] = 0;
        want[drop] = down[drop];
      }
    }
  }

  // Which of left (1), right (2), up (4), down (8) a finger at (x, y) presses; remembers the sector it is in.
  uint8_t padSector(int x, int y) {
    padDiag = 0;
    int dx = x - L.pad.cx, dy = y - L.pad.cy;
    int ax = dx < 0 ? -dx : dx, ay = dy < 0 ? -dy : dy;
    bool any = horiz || vert;
    int dead = any ? L.deadR * 4 / 5 : L.deadR;  // leaving the middle takes more than coming back
    if (dx * dx + dy * dy < dead * dead) { horiz = vert = false; diagHeld = -1; return 0; }
    // A game with diagonal keys: 30 degree wedges centered on the diagonals (30 to 60 degrees), 35 to 25 once held.
    if (need.anyDiag()) {
      int corner = (dy < 0 ? 0 : 2) + (dx < 0 ? 0 : 1);
      if (need.diag[corner]) {
        bool held = diagHeld == corner;
        int lo = held ? 47 : 58, hi = held ? 214 : 173;   // tan 25 / 30 and tan 65 / 60, times 100
        int r100 = ax ? ay * 100 / ax : 100000;
        if (r100 >= lo && r100 <= hi) {
          diagHeld = corner; horiz = vert = false;
          padDiag = need.diag[corner];
          return (dx < 0 ? 1 : 2) | (dy < 0 ? 4 : 8);
        }
      }
    }
    diagHeld = -1;
    // sector slopes: level within 27 degrees (tan 0.5), widened to 35 degrees (0.7) for the one already held
    bool h = ay * 100 <= ax * (horiz && !vert ? 70 : 50);
    bool v = ax * 100 <= ay * (vert && !horiz ? 70 : 50);
    bool useH = h || (!v), useV = v || (!h);
    if (!need.up && !need.down) {
#ifdef POCKET_CYD28
      if (!(need.jump && dy < 0 && useH && useV))
#endif
      { useH = true; useV = false; }
    }
    if (!need.left && !need.right) { useH = false; useV = true; }
    horiz = useH; vert = useV;
    uint8_t m = 0;
    if (useH) m |= dx < 0 ? 1 : 2;
    if (useV) m |= dy < 0 ? 4 : 8;
    return m;
  }
};

}  // namespace ctl
