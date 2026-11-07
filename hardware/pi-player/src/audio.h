// SDL PCM output; PC-speaker timing comes directly from Pocket's portable model.
#pragma once
#include <SDL.h>
#include <array>
#include <string>
#include <vector>
#include "pcspeaker.h"
struct Pcm { int rate = 0; std::vector<float> samples; };
Pcm decodeVoc(const std::vector<uint8_t>& bytes);
class Audio {
  SDL_AudioDeviceID device = 0;
  gm::Speaker speaker;
  std::array<Pcm, 30> bank;
  const Pcm* voice = nullptr;
  double voicePos = 0, phase = 0;
  uint64_t sample = 0;
  int hz = 0;
  static void callback(void*, Uint8*, int);
public:
  Audio();
  ~Audio();
  void level(const std::string& sidecar, int level);
  void play(int effect, const uint8_t* tune);
  void stop();
  bool available() const { return device != 0; }
};
