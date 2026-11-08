// Keyboard and SDL logical GameController input, including DualSense USB/Bluetooth.
#pragma once
#include <SDL.h>
#include <array>
struct Input {
  std::array<bool, 128> keys{};
  SDL_GameController* pad = nullptr;
  ~Input() { if (pad) SDL_GameControllerClose(pad); }
  static int scan(SDL_Keycode k) {
    switch (k) {
      case SDLK_UP: return 72; case SDLK_DOWN: return 80;
      case SDLK_LEFT: return 75; case SDLK_RIGHT: return 77;
      case SDLK_SPACE: return 57; case SDLK_RETURN: return 28; case SDLK_ESCAPE: return 1;
      default: return 0;
    }
  }
  void event(const SDL_Event& e) {
    if (e.type == SDL_KEYDOWN || e.type == SDL_KEYUP) {
      int s = scan(e.key.keysym.sym); if (s) keys[s] = e.type == SDL_KEYDOWN;
    }
    if (e.type == SDL_WINDOWEVENT && e.window.event == SDL_WINDOWEVENT_FOCUS_LOST) keys.fill(false);
    if (e.type == SDL_CONTROLLERDEVICEREMOVED && pad && e.cdevice.which == SDL_JoystickInstanceID(SDL_GameControllerGetJoystick(pad))) {
      SDL_GameControllerClose(pad); pad = nullptr;
    }
  }
  void connect() {
    if (pad) return;
    for (int i = 0; i < SDL_NumJoysticks(); ++i) if (SDL_IsGameController(i) && (pad = SDL_GameControllerOpen(i))) break;
  }
  std::array<bool, 128> held() const {
    auto out = keys;
    if (!pad) return out;
    auto b = [&](SDL_GameControllerButton button) { return SDL_GameControllerGetButton(pad, button) != 0; };
    int x = SDL_GameControllerGetAxis(pad, SDL_CONTROLLER_AXIS_LEFTX), y = SDL_GameControllerGetAxis(pad, SDL_CONTROLLER_AXIS_LEFTY);
    out[72] = out[72] || b(SDL_CONTROLLER_BUTTON_DPAD_UP) || y < -12000;
    out[80] = out[80] || b(SDL_CONTROLLER_BUTTON_DPAD_DOWN) || y > 12000;
    out[75] = out[75] || b(SDL_CONTROLLER_BUTTON_DPAD_LEFT) || x < -12000;
    out[77] = out[77] || b(SDL_CONTROLLER_BUTTON_DPAD_RIGHT) || x > 12000;
    out[57] = out[57] || b(SDL_CONTROLLER_BUTTON_A); // DualSense Cross
    out[28] = out[28] || b(SDL_CONTROLLER_BUTTON_START); // Options
    out[1] = out[1] || b(SDL_CONTROLLER_BUTTON_B); // Circle
    return out;
  }
};
