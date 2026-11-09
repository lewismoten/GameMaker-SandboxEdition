// Phase-one SDL launcher; the play rules stay in the gamemaker-pocket repository's src.
#include "audio.h"
#include "display.h"
#include "input.h"
#include "replay.h"
#include <filesystem>
#include <iostream>
int main(int argc, char** argv) {
  try {
    // Four replay operands, without SDL or a display/audio device.
    if (argc == 6 && std::string(argv[1]) == "--headless") return replay(argv[2], argv[3], argv[4], argv[5]);
    bool windowed = false, smoke = false; std::string path, shots;
    for (int i = 1; i < argc; ++i) {
      std::string arg = argv[i];
      if (arg == "--windowed") windowed = true;
      else if (arg == "--smoke" && i + 1 < argc) { smoke = true; windowed = true; shots = argv[++i]; }
      else if (path.empty()) path = arg; else throw std::runtime_error("unexpected argument");
    }
    if (path.empty()) { std::cerr << "Usage: pi-player [--windowed] POCKET-DIRECTORY\n       pi-player --headless DATA ID keys.txt expected.txt\n"; return 2; }
    auto entries = library(path);
    if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO | SDL_INIT_GAMECONTROLLER | SDL_INIT_TIMER)) throw std::runtime_error(SDL_GetError());
    struct Quit { ~Quit() { SDL_Quit(); } } quit;
    Display display(windowed); Input input; Audio audio;
    if (!audio.available()) SDL_Log("Audio unavailable: %s", SDL_GetError());
    std::unique_ptr<Game> game; size_t selected = 0; bool running = true;
    std::array<bool, 128> previous{}; std::string status = entries.empty() ? "NO COMPATIBLE GAMES INSTALLED" : "";
    uint64_t last = SDL_GetPerformanceCounter(); double debt = 0; int step = 0, smokeTicks = 0;
    auto back = [&]() { audio.stop(); game.reset(); debt = 0; };
    while (running) {
      SDL_Event event;
      while (SDL_PollEvent(&event)) { if (event.type == SDL_QUIT) running = false; input.event(event); }
      input.connect(); auto held = input.held();
      if (smoke) {
        if (entries.empty()) throw std::runtime_error("smoke requires a public compatible game");
        // Exercise the same navigation and launch/back actions, with dummy SDL video/audio.
        held.fill(false); if (step == 1) held[28] = true;
        if (step > 1 && smokeTicks >= 3) held[1] = true;
      }
      auto pressed = [&](int k) { return held[k] && !previous[k]; };
      uint64_t now = SDL_GetPerformanceCounter(); double elapsed = double(now - last) / SDL_GetPerformanceFrequency(); last = now;
      if (pressed(1)) {
        if (game) { back(); status = "CHOOSE A GAME"; if (smoke) { display.list(entries, selected, status); display.save(shots + "/returned.bmp"); running = false; } }
        else running = false;
      } else if (!game) {
        if (!entries.empty()) {
          if (pressed(72)) selected = (selected + entries.size() - 1) % entries.size();
          if (pressed(80)) selected = (selected + 1) % entries.size();
          if (pressed(28) || pressed(57)) {
            try { game.reset(new Game(entries[selected])); audio.level(entries[selected].source + ".audio", game->world->level); debt = 0; status.clear(); }
            catch (const std::exception& e) { status = "COULD NOT LOAD GAME"; SDL_Log("%s", e.what()); }
          }
        }
      } else {
        debt = std::min(debt + elapsed, 4.0 / 18.2);
        while (debt >= 1.0 / 18.2 && game) {
          auto& w = *game->world; int old = w.level;
          for (int k = 0; k < 128; ++k) w.key(k, held[k]);
          char code = w.tick(); ++smokeTicks;
          if (w.nsnd && w.snd) { int n = w.sndQ[w.nsnd - 1]; audio.play(n, w.snd + n * 72); } w.nsnd = 0;
          if (old != w.level) audio.level(entries[selected].source + ".audio", w.level);
          debt -= 1.0 / 18.2;
          if (code == 'W') { back(); status = "GAME COMPLETE"; }
        }
      }
      if (game) display.game(*game); else display.list(entries, selected, status);
      display.present();
      if (smoke && step == 0) { std::filesystem::create_directories(shots); display.save(shots + "/list.bmp"); }
      if (smoke && game && smokeTicks == 2) display.save(shots + "/game.bmp");
      previous = held; ++step; SDL_Delay(4);
      if (smoke && step > 2000) throw std::runtime_error("smoke launch/back timeout");
    }
    if (smoke) std::cout << "PASS SDL list -> play -> back; " << smokeTicks << " ticks\n";
    return 0;
  } catch (const std::exception& e) { std::cerr << e.what() << '\n'; return 1; }
}
