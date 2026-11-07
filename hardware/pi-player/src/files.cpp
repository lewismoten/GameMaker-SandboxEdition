// stdio/zlib adapters and Pocket library discovery. No ESP32 sources change.
#include "files.h"
#include "gmsmall.h"
#include "public-games.h"
#include <algorithm>
#include <filesystem>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <zlib.h>
namespace fs = std::filesystem;
namespace {
std::string source;
constexpr size_t LIMIT = 64 * 1024 * 1024;
uint32_t le32(const uint8_t* p) { return p[0] | uint32_t(p[1]) << 8 | uint32_t(p[2]) << 16 | uint32_t(p[3]) << 24; }
bool safe(const std::string& s) {
  return !s.empty() && s.size() <= 31 && s != "." && s != ".." &&
    s.find_first_not_of("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._") == std::string::npos;
}
bool bundle(const std::string& path) { auto e = fs::path(path).extension().string(); return e == ".GMP" || e == ".gmp"; }
bool readAt(void* user, uint32_t off, void* buf, uint32_t n) {
  auto* v = static_cast<std::vector<uint8_t>*>(user);
  if (off > v->size() || n > v->size() - off) return false;
  memcpy(buf, v->data() + off, n); return true;
}
std::vector<uint8_t> packed(const std::string& path, const std::string& name) {
  auto v = readBytes(path);
  if (v.size() < 8 || memcmp(v.data(), "GMS1", 4)) throw std::runtime_error("invalid Pocket bundle");
  uint32_t count = le32(v.data() + 4);
  if (count > (v.size() - 8) / 40) throw std::runtime_error("truncated Pocket table");
  std::string last;
  for (uint32_t i = 0; i < count; ++i) {
    const auto* p = v.data() + 8 + i * 40;
    if (!memchr(p, 0, 32)) throw std::runtime_error("unterminated Pocket name");
    std::string key(reinterpret_cast<const char*>(p));
    uint32_t off = le32(p + 32), len = le32(p + 36);
    if (!safe(key) || key <= last || off < 8 + count * 40 || off > v.size() || len > v.size() - off || len > 8 * 1024 * 1024)
      throw std::runtime_error("invalid Pocket entry");
    last = key;
  }
  gm::SmallPak pak; pak.user = &v; pak.readAt = readAt;
  uint32_t off, len;
  if (!pak.begin() || !pak.find(name.c_str(), &off, &len)) throw std::runtime_error("missing Pocket entry: " + name);
  return {v.begin() + off, v.begin() + off + len};
}
std::vector<uint8_t> get(const std::string& name) {
  if (!safe(name)) throw std::runtime_error("invalid asset name");
  if (bundle(source)) return packed(source, name);
  if (fs::is_regular_file(fs::path(source) / name)) return readBytes((fs::path(source) / name).string());
  return packed((fs::path(source) / "small.pak").string(), name);
}
uint8_t* reader(const char* name, size_t* n) {
  try {
    auto v = get(name); auto* p = static_cast<uint8_t*>(malloc(v.size() + 1));
    if (!p) return nullptr;
    memcpy(p, v.data(), v.size()); *n = v.size(); return p;
  } catch (const std::exception&) { return nullptr; }
}
bool inflateRaw(const uint8_t* src, size_t n, uint8_t* dst, size_t cap) {
  z_stream z{}; if (inflateInit2(&z, -15) != Z_OK) return false;
  z.next_in = const_cast<Bytef*>(src); z.avail_in = n; z.next_out = dst; z.avail_out = cap;
  int r = inflate(&z, Z_FINISH); bool ok = r == Z_STREAM_END && z.total_out == cap;
  inflateEnd(&z); return ok;
}
struct Text { std::istringstream stream; explicit Text(const std::string& s): stream(s) {} };
void* openLines(void*, const char* name) {
  try { auto v = get(name); return new Text(std::string(v.begin(), v.end())); } catch (...) { return nullptr; }
}
bool nextLine(void* h, char* out, int cap) {
  std::string line; if (!std::getline(static_cast<Text*>(h)->stream, line)) return false;
  snprintf(out, cap, "%s", line.c_str()); return true;
}
void closeLines(void* h) { delete static_cast<Text*>(h); }
const gm::Lines lines{openLines, nextLine, closeLines, nullptr};
bool visible(const std::string& id) { for (const char* p: PUBLIC_IDS) if (id == p) return true; return false; }
std::vector<std::string> split(const std::string& line) {
  std::vector<std::string> parts; std::istringstream in(line); std::string s;
  while (std::getline(in, s, '|')) parts.push_back(s); return parts;
}
}
std::vector<uint8_t> readBytes(const std::string& path) {
  std::ifstream in(path, std::ios::binary | std::ios::ate);
  auto n = in.tellg(); if (!in || n < 0 || n > static_cast<std::streamoff>(LIMIT)) throw std::runtime_error("cannot read bounded file: " + path);
  std::vector<uint8_t> v(static_cast<size_t>(n)); in.seekg(0);
  if (!in.read(reinterpret_cast<char*>(v.data()), n)) throw std::runtime_error("short read: " + path);
  return v;
}
std::vector<Entry> library(const std::string& path) {
  std::vector<Entry> out;
  auto add = [&](const std::vector<std::string>& p, const std::string& src, bool gmp) {
    if (p.size() < 3 || !visible(p[0]) || !safe(p[0])) return;
    std::string cfg = (gmp || p.size() < 4 ? p[0] : p[3]) + ".cfg";
    if (!safe(cfg)) return;
    for (const auto& e: out) if (e.id == p[0]) return;
    out.push_back({p[0], p[1], src, cfg});
  };
  if (!fs::is_directory(path)) throw std::runtime_error("library must be a Pocket data directory");
  std::ifstream index(fs::path(path) / "games.txt"); std::string line;
  while (std::getline(index, line)) add(split(line), path, false);
  for (const auto& item: fs::directory_iterator(path)) {
    if (!item.is_regular_file() || !bundle(item.path().string())) continue;
    try {
      auto v = packed(item.path().string(), "game.txt");
      std::istringstream meta(std::string(v.begin(), v.end())); std::string version;
      std::getline(meta, version); if (version != "GMP 1") continue;
      std::getline(meta, line); add(split(line), item.path().string(), true);
    } catch (const std::exception&) { /* A malformed bundle never hides the remaining games. */ }
  }
  std::sort(out.begin(), out.end(), [](const Entry& a, const Entry& b) { return a.title < b.title; });
  return out;
}
Game::Game(const Entry& entry, uint32_t seed): world(new gm::World{}) {
  source = entry.source;
  if (!safe(entry.cfg) || !gm::parseCfgFile(lines, entry.cfg.c_str(), *world, cfg)) throw std::runtime_error("cannot load game config");
  assets.attach(*world, cfg, reader, inflateRaw); assets.lines = &lines;
  snprintf(assets.cfgName, sizeof assets.cfgName, "%s", entry.cfg.c_str());
  world->seed = seed;
  if (!world->begin()) { assets.release(); throw std::runtime_error("cannot load first level"); }
}
Game::~Game() { assets.release(); }
