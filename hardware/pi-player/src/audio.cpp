// Original host PCM VOC decoder based on this project's formats/voc.ts and SOUNDC.C.
// SDL2 (Sam Lantinga and contributors, zlib license); see root NOTICE.md.
#include "audio.h"
#include "files.h"
#include <algorithm>
#include <cmath>
#include <filesystem>
#include <fstream>
#include <stdexcept>
namespace {
uint32_t u16(const uint8_t* p) { return p[0] | uint32_t(p[1]) << 8; }
uint32_t u24(const uint8_t* p) { return u16(p) | uint32_t(p[2]) << 16; }
uint32_t u32(const uint8_t* p) { return u24(p) | uint32_t(p[3]) << 24; }
}
Pcm decodeVoc(const std::vector<uint8_t>& b) {
  auto fail = []() { throw std::runtime_error("unsupported or truncated VOC (PCM mono only)"); };
  if (b.size() < 26 || memcmp(b.data(), "Creative Voice File\x1a", 20)) fail();
  size_t pos = u16(b.data() + 20); if (pos < 26 || pos >= b.size()) fail();
  Pcm out; int bits = 8; bool ended = false;
  while (pos < b.size()) {
    int type = b[pos++]; if (!type) { ended = true; break; }
    if (b.size() - pos < 3) fail();
    size_t len = u24(b.data() + pos); pos += 3;
    if (len > b.size() - pos) fail();
    const uint8_t* p = b.data() + pos; size_t start = 0;
    int rate = out.rate;
    if (type == 1) {
      if (len < 2 || p[1] != 0) fail();
      rate = 1000000 / (256 - p[0]); bits = 8; start = 2;
    } else if (type == 9) {
      if (len < 12 || p[5] != 1) fail();
      rate = u32(p); bits = p[4]; start = 12;
      if (!((bits == 8 && u16(p + 6) == 0) || (bits == 16 && u16(p + 6) == 4))) fail();
    } else if (type == 3) {
      if (len != 3) fail();
      rate = 1000000 / (256 - p[2]);
    } else if (type != 2 && type != 4 && type != 5) fail();
    if (type == 1 || type == 2 || type == 9 || type == 3) {
      if (rate < 1000 || rate > 192000 || (out.rate && rate != out.rate)) fail();
      out.rate = rate;
      size_t count = type == 3 ? u16(p) + 1 : (len - start) / (bits / 8);
      if (out.samples.size() + count > 48000 * 120) fail();
      if (type != 3 && (len - start) % (bits / 8)) fail();
      for (size_t i = 0; i < count; ++i) {
        float value = 0;
        if (type != 3) value = bits == 8 ? (p[start + i] - 128) / 128.f : static_cast<int16_t>(u16(p + start + i * 2)) / 32768.f;
        out.samples.push_back(value);
      }
    }
    pos += len;
  }
  if (!ended || out.samples.empty()) fail();
  return out;
}
Audio::Audio() {
  SDL_AudioSpec want{}, got{}; want.freq = 48000; want.format = AUDIO_F32SYS; want.channels = 1;
  want.samples = 1024; want.callback = callback; want.userdata = this;
  device = SDL_OpenAudioDevice(nullptr, 0, &want, &got, 0);
  if (device) SDL_PauseAudioDevice(device, 0);
}
Audio::~Audio() { if (device) SDL_CloseAudioDevice(device); }
void Audio::callback(void* user, Uint8* raw, int len) {
  auto& a = *static_cast<Audio*>(user); auto* dst = reinterpret_cast<float*>(raw);
  for (int i = 0; i < len / int(sizeof(float)); ++i, ++a.sample) {
    a.speaker.update(static_cast<uint32_t>(a.sample * 1000000 / 48000), a.hz);
    a.phase += a.hz / 48000.0; a.phase -= std::floor(a.phase);
    float v = a.hz ? (a.phase < .5 ? .12f : -.12f) : 0;
    if (a.voice) {
      size_t at = static_cast<size_t>(a.voicePos);
      if (at < a.voice->samples.size()) { v += a.voice->samples[at] * .65f; a.voicePos += a.voice->rate / 48000.0; }
      else a.voice = nullptr;
    }
    dst[i] = std::clamp(v, -1.f, 1.f);
  }
}
void Audio::stop() {
  if (!device) return;
  SDL_LockAudioDevice(device); speaker.stop(); hz = 0; voice = nullptr; SDL_UnlockAudioDevice(device);
}
void Audio::level(const std::string& sidecar, int n) {
  std::array<Pcm, 30> next;
  std::ifstream in(std::filesystem::path(sidecar) / "audio.txt"); int lv, effect; std::string name;
  while (in >> lv >> effect >> name) {
    if (lv != n || effect < 0 || effect >= 30 || name.find_first_not_of("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._") != std::string::npos || name == "." || name == "..") continue;
    try { next[effect] = decodeVoc(readBytes((std::filesystem::path(sidecar) / name).string())); }
    catch (const std::exception& e) { SDL_Log("VOC: %s", e.what()); }
  }
  if (!device) return;
  SDL_LockAudioDevice(device); voice = nullptr; bank = std::move(next); SDL_UnlockAudioDevice(device);
}
void Audio::play(int effect, const uint8_t* tune) {
  if (!device) return;
  SDL_LockAudioDevice(device);
  speaker.start(tune, static_cast<uint32_t>(sample * 1000000 / 48000));
  if (effect >= 0 && effect < 30 && !bank[effect].samples.empty()) { voice = &bank[effect]; voicePos = 0; }
  SDL_UnlockAudioDevice(device);
}
