// 320x200 indexed game output and a TV-readable list using Pocket's existing font.
// softfont.h retains the public-domain font credits in root NOTICE.md.
#pragma once
#include <SDL.h>
#include <algorithm>
#include <array>
#include <stdexcept>
#include "files.h"
#include "softfont.h"
struct Display {
  SDL_Window* window = nullptr; SDL_Renderer* renderer = nullptr; SDL_Texture* texture = nullptr;
  std::array<uint32_t, 320 * 200> pixels{};
  explicit Display(bool windowed) {
    SDL_SetHint(SDL_HINT_RENDER_SCALE_QUALITY, "0");
    window = SDL_CreateWindow("Game-Maker", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, 960, 600,
      windowed ? SDL_WINDOW_RESIZABLE : SDL_WINDOW_FULLSCREEN_DESKTOP);
    if (!window) throw std::runtime_error(SDL_GetError());
    renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC);
    if (!renderer) renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_SOFTWARE);
    if (!renderer) throw std::runtime_error(SDL_GetError());
    texture = SDL_CreateTexture(renderer, SDL_PIXELFORMAT_ARGB8888, SDL_TEXTUREACCESS_STREAMING, 320, 200);
    if (!texture) throw std::runtime_error(SDL_GetError());
  }
  ~Display() { SDL_DestroyTexture(texture); SDL_DestroyRenderer(renderer); SDL_DestroyWindow(window); }
  void text(int x, int y, std::string s, uint32_t color, int limit = 44) {
    if (int(s.size()) > limit) s = s.substr(0, limit - 3) + "...";
    for (unsigned char c: s) {
      if (c < 32 || c > 126) c = '?';
      for (int yy = 0; yy < 8; ++yy) for (int xx = 0; xx < 8; ++xx)
        if ((SOFT_FONT[c - 32][yy] >> xx) & 1) {
          int px = x + xx, py = y + yy; if (px >= 0 && px < 320 && py >= 0 && py < 200) pixels[py * 320 + px] = color;
        }
      x += 8;
    }
  }
  void list(const std::vector<Entry>& entries, size_t selected, const std::string& status) {
    pixels.fill(0xff101c30); text(16, 12, "GAME-MAKER", 0xffffd478);
    text(16, 28, "CHOOSE A GAME", 0xffd3e5ff);
    size_t first = selected / 5 * 5;
    for (size_t i = first; i < entries.size() && i < first + 5; ++i) {
      int y = 52 + int(i - first) * 22;
      if (i == selected) for (int row = y - 5; row < y + 15; ++row) std::fill_n(pixels.begin() + row * 320 + 12, 296, 0xff375b83);
      text(20, y, entries[i].title, 0xffffffff, 35);
    }
    text(16, 164, status, 0xffffd478, 36);
    text(16, 180, "ARROWS  CROSS/ENTER  CIRCLE/BACK", 0xffd3e5ff, 36);
  }
  void game(const Game& game) {
    uint8_t row[gm::SIZEX];
    for (int y = 0; y < 200; ++y) {
      game.world->renderRow(y, row);
      for (int x = 0; x < 320; ++x) {
        const uint8_t* p = game.assets.pal + row[x] * 3;
        auto vga = [](uint8_t c) { return uint32_t((c << 2) | (c >> 4)); };
        pixels[y * 320 + x] = 0xff000000 | vga(p[0]) << 16 | vga(p[1]) << 8 | vga(p[2]);
      }
    }
  }
  void present() {
    SDL_UpdateTexture(texture, nullptr, pixels.data(), 320 * sizeof(uint32_t));
    int w, h; SDL_GetRendererOutputSize(renderer, &w, &h);
    // Square pixels: exact 320:200 aspect, integral scale, centered black borders.
    int scale = std::max(1, std::min(w / 320, h / 200));
    SDL_Rect dst{(w - 320 * scale) / 2, (h - 200 * scale) / 2, 320 * scale, 200 * scale};
    SDL_SetRenderDrawColor(renderer, 0, 0, 0, 255); SDL_RenderClear(renderer);
    SDL_RenderCopy(renderer, texture, nullptr, &dst); SDL_RenderPresent(renderer);
  }
  void save(const std::string& path) {
    SDL_Surface* s = SDL_CreateRGBSurfaceWithFormatFrom(pixels.data(), 320, 200, 32, 320 * 4, SDL_PIXELFORMAT_ARGB8888);
    if (!s || SDL_SaveBMP(s, path.c_str())) { SDL_FreeSurface(s); throw std::runtime_error(SDL_GetError()); }
    SDL_FreeSurface(s);
  }
};
