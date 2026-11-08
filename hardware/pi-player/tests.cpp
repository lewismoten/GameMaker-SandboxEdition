// Adapter regressions: real SDL virtual-pad polling and bounded PCM VOC parsing.
#include "src/audio.h"
#include "src/input.h"
#include <iostream>
#include <stdexcept>
static void require(bool ok, const char* message) { if (!ok) throw std::runtime_error(message); }
int main() {
  try {
    require(SDL_Init(SDL_INIT_GAMECONTROLLER | SDL_INIT_AUDIO) == 0, SDL_GetError());
    Input input;
    int index = SDL_JoystickAttachVirtual(SDL_JOYSTICK_TYPE_GAMECONTROLLER, SDL_CONTROLLER_AXIS_MAX, SDL_CONTROLLER_BUTTON_MAX, 0);
    require(index >= 0, SDL_GetError()); input.connect(); require(input.pad, "virtual controller did not open");
    auto* joy = SDL_GameControllerGetJoystick(input.pad);
    SDL_JoystickSetVirtualButton(joy, SDL_CONTROLLER_BUTTON_A, 1);
    SDL_JoystickSetVirtualButton(joy, SDL_CONTROLLER_BUTTON_START, 1);
    SDL_JoystickSetVirtualButton(joy, SDL_CONTROLLER_BUTTON_DPAD_UP, 1);
    SDL_JoystickSetVirtualAxis(joy, SDL_CONTROLLER_AXIS_LEFTX, 24000);
    SDL_JoystickUpdate(); auto held = input.held();
    require(held[57] && held[28] && held[72] && held[77], "Cross/Options/d-pad/stick mapping");
    SDL_JoystickSetVirtualButton(joy, SDL_CONTROLLER_BUTTON_B, 1); SDL_JoystickUpdate();
    require(input.held()[1], "Circle back mapping");
    SDL_Event e{}; e.type = SDL_KEYDOWN; e.key.keysym.sym = SDLK_RIGHT; input.event(e);
    SDL_JoystickSetVirtualAxis(joy, SDL_CONTROLLER_AXIS_LEFTX, 0); SDL_JoystickUpdate();
    require(input.held()[77], "keyboard lost when stick centered");
    e.type = SDL_WINDOWEVENT; e.window.event = SDL_WINDOWEVENT_FOCUS_LOST; input.event(e);
    require(!input.held()[77], "focus loss left key held");
    auto id = SDL_JoystickInstanceID(joy); SDL_JoystickDetachVirtual(index);
    e.type = SDL_CONTROLLERDEVICEREMOVED; e.cdevice.which = id; input.event(e);
    require(!input.held()[57] && !input.held()[1], "disconnect left button held");
    std::vector<uint8_t> voc(26); memcpy(voc.data(), "Creative Voice File\x1a", 20); voc[20] = 26;
    voc.insert(voc.end(), {1, 5, 0, 0, 131, 0, 0, 128, 255, 2, 1, 0, 0, 192, 0});
    auto pcm = decodeVoc(voc);
    require(pcm.rate == 8000 && pcm.samples.size() == 4 && pcm.samples[0] == -1 && pcm.samples[1] == 0 && pcm.samples[3] == .5f, "PCM8/continuation decoding");
    auto bad = voc; bad[27] = 255; bool rejected = false;
    try { decodeVoc(bad); } catch (const std::exception&) { rejected = true; }
    require(rejected, "truncated VOC accepted");
    bad = voc; bad[31] = 1; rejected = false;
    try { decodeVoc(bad); } catch (const std::exception&) { rejected = true; }
    require(rejected, "unsupported codec accepted");
    voc.resize(26); voc.insert(voc.end(), {9, 16, 0, 0, 0x40, 0x1f, 0, 0, 16, 1, 4, 0, 0, 0, 0, 0, 0, 0x80, 0xff, 0x7f, 0});
    pcm = decodeVoc(voc); require(pcm.samples.size() == 2 && pcm.samples[0] == -1 && pcm.samples[1] > .99, "PCM16 decoding");
    { Audio audio; require(audio.available(), "dummy audio device"); uint8_t tune[72]{}; tune[0] = 0xb8; tune[1] = 1; audio.play(0, tune); SDL_Delay(30); audio.stop(); }
    SDL_Quit(); std::cout << "PASS virtual DualSense mapping, disconnect/focus, VOC PCM8/16, malformed VOC, audio callback\n";
    return 0;
  } catch (const std::exception& e) { std::cerr << e.what() << '\n'; SDL_Quit(); return 1; }
}
