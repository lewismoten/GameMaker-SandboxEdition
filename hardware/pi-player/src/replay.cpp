// Reads unmodified pocketHostCheck.ts artifacts. Headless means SDL is never initialized.
#include "replay.h"
#include "files.h"
#include <fstream>
#include <iostream>
#include <sstream>
#include <stdexcept>
int replay(const char* source, const char* id, const char* keys, const char* expected) {
  struct Event { int tick, key; }; std::vector<Event> events;
  std::ifstream script(keys), oracle(expected); if (!script || !oracle) throw std::runtime_error("cannot read replay files");
  std::string line; int ticks = 0; uint32_t seed = 1;
  while (std::getline(script, line)) {
    std::istringstream in(line); char tag; int t, k; in >> tag;
    if (tag == 'R') in >> seed;
    if (tag == 'T') in >> ticks;
    if (tag == 'K' && in >> t >> k) {
      if (t < 1 || (!events.empty() && t < events.back().tick)) throw std::runtime_error("unordered replay keys");
      events.push_back({t, k});
    }
  }
  if (ticks <= 0 || ticks > 1000000) throw std::runtime_error("invalid replay length");
  Game game({id, id, source, std::string(id) + ".cfg"}, seed); auto& w = *game.world;
  size_t e = 0; int ends = 0;
  for (int tick = 1; tick <= ticks; ++tick) {
    while (e < events.size() && events[e].tick == tick) {
      int k = events[e++].key;
      if (k >= 256) w.dropSlot = k - 256; else w.key(k & 127, !(k & 128));
    }
    char code = w.tick(); uint32_t hash = 2166136261u; uint8_t row[gm::SIZEX];
    for (int y = 0; y < 196; ++y) { w.renderRow(y, row); for (int x = 0; x < 312; ++x) hash = (hash ^ row[x]) * 16777619u; }
    if (!std::getline(oracle, line)) throw std::runtime_error("oracle ended early");
    std::istringstream in(line); std::vector<std::string> fields; std::string field;
    while (in >> field) fields.push_back(field);
    if (fields.size() != 25 || fields[0] != "S" || std::stoi(fields[1]) != tick || fields[2][0] != (code ? code : '-') || std::stoi(fields[3]) != w.level || std::stoul(fields.back()) != hash)
      throw std::runtime_error("frame/state differs at tick " + std::to_string(tick));
    if (code == 'L' || code == 'W') ++ends;
    w.nsnd = 0;
  }
  if (std::getline(oracle, line)) throw std::runtime_error("oracle has extra ticks");
  if (!ends) throw std::runtime_error("replay did not complete a level");
  std::cout << "PASS " << ticks << " frame hashes, " << ends << " level ends\n";
  // Destroying Game releases the session, exactly as the launcher's Back path does.
  return 0;
}
