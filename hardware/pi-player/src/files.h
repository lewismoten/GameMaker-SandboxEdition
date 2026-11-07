// Host file adapter for the unchanged Pocket config/asset interfaces.
#pragma once
#include <memory>
#include <string>
#include <vector>
#include "gmcfg.h"

struct Entry { std::string id, title, source, cfg; };
std::vector<Entry> library(const std::string& path);
std::vector<uint8_t> readBytes(const std::string& path);
struct Game {
  std::unique_ptr<gm::World> world;
  gm::Cfg cfg{};
  gm::Assets assets;
  explicit Game(const Entry& entry, uint32_t seed = 1);
  ~Game();
  Game(const Game&) = delete;
  Game& operator=(const Game&) = delete;
};
