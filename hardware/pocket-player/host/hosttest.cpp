// Mac test for the Pocket Player's play loop (src/gmcore.h). It reads the same data files the board
// gets, replays a key script, and prints the character's state after every tick, so
// web/scripts/pocketHostCheck.ts can compare it with the real engine.
//   hosttest <data dir> <game id> <key script>     key script lines: "K <tick> <scan, +128 for a release>", "R <seed>", "T <ticks>"
//   hosttest <data dir> <game id> <key script> resume   checks Continue and Restart level instead (resumeCheck below)
// Build: c++ -std=c++17 -O1 -I../src hosttest.cpp -o hosttest
#include <stdio.h>
#include <stdlib.h>
#include <string>
#include <vector>
#include <zlib.h>
#include "gmcfg.h"
#include "stdiolines.h"
#include "pcspeaker.h"

using namespace gm;

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

// The visible part of the game screen (CropScreen: 312 x 196) as a hash, row by row.
static uint32_t frameHash(const World& w) {
  uint32_t h = 2166136261u;
  uint8_t row[SIZEX];
  for (int y = 0; y < 196; y++) {
    w.renderRow(y, row);
    for (int x = 0; x < 312; x++) h = (h ^ row[x]) * 16777619u;
  }
  return h;
}

static int msum(const World& w) {
  int32_t a = 0;
  for (int i = 0; i < 30; i++) a += w.meter[i];
  return a;
}

// FNV hash of one effect's 36 frequencies (72 bytes), as the web check computes from the .snd file.
static uint32_t tuneHash(const uint8_t* t) {
  uint32_t h = 2166136261u;
  for (int i = 0; i < 72; i++) h = (h ^ t[i]) * 16777619u;
  return h;
}

// Plays one effect through the board's Speaker model (pcspeaker.h), polling every 250 us as the 1 ms task
// would (finer here), and checks every step starts within the polling slack of its time (n / 145.6 s)
// and holds the frequency PLAYGAME would sound. Returns the number of wrong steps.
static int tuneTiming(const uint8_t* tune) {
  Speaker sp;
  sp.start(tune, 1000);
  int bad = 0, seen = 0, f = 0;
  for (uint32_t us = 1000; us < 1000 + 300000 && (sp.on || seen == 0); us += 250) {
    if (!sp.update(us, f)) continue;
    int step = seen++;
    if (step < NUMFREQ) {
      int want = tune[step * 2] | (tune[step * 2 + 1] << 8);
      want = want < 20 ? 0 : want > 20000 ? 20000 : want;
      uint32_t due = 1000 + (uint32_t)((uint64_t)step * 10000000ull / TICK_RATE_X10);
      if (f != want || us < due || us > due + 500) bad++;
    }
  }
  return bad + (seen == NUMFREQ + 1 ? 0 : 1);
}

struct Ev { int tick, key; };
static std::vector<Ev> evs;
static std::vector<uint8_t> cfgText;
static uint32_t keySeed = 1;

// A world with the game's .cfg and files attached, as the board has it after a power cycle.
static World* newWorld(const char* id, Assets& as) {
  World* w = new World();
  if (!parseCfg((const char*)cfgText.data(), *w, cfg)) exit(2);
  as.attach(*w, cfg, readFile, inflateRaw);
  as.lines = &stdioLines;
  snprintf(as.cfgName, sizeof as.cfgName, "%s.cfg", id);
  w->seed = keySeed;
  return w;
}
// The key events of tick t (events before it are skipped).
static void applyKeys(World& w, int t, size_t& e) {
  while (e < evs.size() && evs[e].tick < t) e++;
  for (; e < evs.size() && evs[e].tick == t; e++) {
    if (evs[e].key >= 256) w.dropSlot = evs[e].key - 256;  // the picker's choice, ahead of the D press
    else w.key(evs[e].key & 127, !(evs[e].key & 128));
  }
}
static std::string stateLine(const World& w, int t, char code) {
  char b[256];
  snprintf(b, sizeof b, "S %d %c %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %u", t, code ? code : '-', w.level, w.cx[0], w.cx[1], w.cy[0],
           w.cy[1], w.cseq, w.cframe, w.mx, w.my, w.sc.nx, w.sc.ny, w.sc.lsx, w.sc.lsy, w.score, w.nextx, w.nexty, w.scrx, w.scry, w.hitpts, w.lives, msum(w),
           frameHash(w));
  return b;
}
// A state line without its tick and code: what Restart level must give back.
static std::string stateBody(const std::string& l) { return l.substr(l.find(' ', l.find(' ', 2) + 1)); }
// Plays ticks from + 1 .. last on w; each state line must be the continuous run's (want[t - 1]). The first tick that differs, or 0.
static int replayFrom(World& w, int from, int last, const std::vector<std::string>& want) {
  size_t e = 0;
  for (int t = from + 1; t <= last; t++) {
    applyKeys(w, t, e);
    char code = w.tick();
    w.nsnd = 0;
    if (stateLine(w, t, code) != want[t - 1]) return t;
  }
  return 0;
}

// Continue and Restart level (gmcore.h EntryState), against the continuous run on the same keys. At every level change
// (and the first few deaths) the entry state goes through bytes, as the board's NVS keeps it, into a fresh world, which
// plays the rest of the keys and must match the continuous run tick for tick to the end. At each level change the game
// also plays on 60 ticks, Restart level must give back the entry's state (place, sequence, scroll, score, hit points, lives,
// counters and the picture), and the keys from the entry on must again match to the end.
static int resumeCheck(const char* id, int maxTick) {
  Assets a0;
  World* w = newWorld(id, a0);
  w->begin();
  std::vector<std::string> lines;
  struct Snap { int tick; std::vector<uint8_t> bytes; };
  std::vector<Snap> snaps;
  size_t e = 0;
  bool won = false;
  for (int t = 1; t <= maxTick && !won; t++) {
    applyKeys(*w, t, e);
    char code = w->tick();
    w->nsnd = 0;
    lines.push_back(stateLine(*w, t, code));
    if (code == 'L' || (code == 'D' && snaps.size() < 8)) {
      std::vector<uint8_t> b(sizeof(EntryState));
      memcpy(b.data(), &w->entry, sizeof(EntryState));
      snaps.push_back({t, b});
    }
    won = code == 'W';
  }
  delete w;
  int last = (int)lines.size(), bad = 0, resumed = 0, restarts = 0;
  for (const Snap& s : snaps) {
    Assets as;
    World* r = newWorld(id, as);
    EntryState es;
    memcpy(&es, s.bytes.data(), sizeof es);
    const std::string& want = lines[s.tick - 1];
    if (!r->restore(es)) {
      printf("RESUME %s tick %d: the level did not load\n", id, s.tick);
      bad++;
    } else if (stateBody(stateLine(*r, s.tick, '-')) != stateBody(want)) {
      printf("RESUME %s tick %d: entered as %s, the run had %s\n", id, s.tick, stateLine(*r, s.tick, '-').c_str(), want.c_str());
      bad++;
    } else if (int d = replayFrom(*r, s.tick, last, lines)) {
      printf("RESUME %s from tick %d: differs at tick %d\n", id, s.tick, d);
      bad++;
    } else resumed++;
    delete r;
    if (want[want.find(' ', 2) + 1] != 'L') continue;
    int on = s.tick + 60 < last ? s.tick + 60 : last - 1;
    if (on <= s.tick) continue;
    Assets ar;
    World* q = newWorld(id, ar);
    q->begin();
    size_t k = 0;
    int t = 1;
    for (; t <= on; t++) {
      applyKeys(*q, t, k);
      char c = q->tick();
      q->nsnd = 0;
      if (c && t > s.tick) break;  // a death or the next level inside the 60 ticks: that entry is checked on its own
    }
    if (t <= on) { delete q; continue; }
    if (!q->restartLevel()) {
      printf("RESTART %s tick %d: the level did not load\n", id, s.tick);
      bad++;
    } else if (stateBody(stateLine(*q, s.tick, '-')) != stateBody(want)) {
      printf("RESTART %s after tick %d: %s, entry %s\n", id, on, stateLine(*q, s.tick, '-').c_str(), want.c_str());
      bad++;
    } else if (int d = replayFrom(*q, s.tick, last, lines)) {
      printf("RESTART %s from tick %d: differs at tick %d\n", id, s.tick, d);
      bad++;
    } else restarts++;
    delete q;
  }
  printf("R %s ticks=%d won=%d resumed=%d restarts=%d bad=%d entry=%zu\n", id, last, won ? 1 : 0, resumed, restarts, bad, sizeof(EntryState));
  return bad || !won || !resumed || !restarts ? 1 : 0;
}

// hosttest <data dir> <game id> <key script> [resume]
int main(int argc, char** argv) {
  if (argc < 4) return 2;
  dir = argv[1];
  static World w;
  cfgText = slurp(dir + "/" + argv[2] + ".cfg");
  cfgText.push_back(0);
  if (!parseCfg((const char*)cfgText.data(), w, cfg)) return 2;
  assets.attach(w, cfg, readFile, inflateRaw);
  linesDir = dir;
  assets.lines = &stdioLines;
  snprintf(assets.cfgName, sizeof assets.cfgName, "%s.cfg", argv[2]);
  FILE* f = fopen(argv[3], "r");
  if (!f) return 2;
  char line[64];
  int maxTick = 0;
  while (fgets(line, sizeof line, f)) {
    int t, k;
    if (sscanf(line, "K %d %d", &t, &k) == 2) evs.push_back({t, k});
    if (sscanf(line, "T %d", &t) == 1) maxTick = t;
    unsigned seed;
    if (sscanf(line, "R %u", &seed) == 1) w.seed = keySeed = seed;
  }
  fclose(f);
  if (argc > 4 && !strcmp(argv[4], "resume")) return resumeCheck(argv[2], maxTick);
  w.begin();
  size_t e = 0;
  int timed = 0, timedBad = 0;
  for (int t = 1; t <= maxTick; t++) {
    applyKeys(w, t, e);
    char code = w.tick();
    printf("%s\n", stateLine(w, t, code).c_str());
    // The effects started this tick: Q <tick> <effect> <hash of its 36 frequencies>
    for (int q = 0; q < w.nsnd; q++) {
      const uint8_t* tune = w.snd + w.sndQ[q] * 72;
      printf("Q %d %d %u\n", t, w.sndQ[q], tuneHash(tune));
      if (timed < 40 && !(timed++ % 1)) timedBad += tuneTiming(tune);
    }
    w.nsnd = 0;
    if (code == 'W') break;
  }
  printf("Z %d %d\n", timed, timedBad);
  return 0;
}
