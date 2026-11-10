# Native Pi player (host phase)

SDL2 launcher and player for macOS now and Raspberry Pi OS Lite later. It compiles
`gmcore.h`, `gmmon.h`, `gmcfg.h`, `gmsmall.h` and `pcspeaker.h`
in place. No copied core headers, board changes, firmware writes, browser or server.
This is the compact Pocket compatibility profile, **not a complete DOS player or OS image**.

## Build and run on the host

Install SDL2 with Homebrew (`brew install sdl2`), then from this directory:

```sh
make SDL_CONFIG=/opt/homebrew/bin/sdl2-config
./build/pi-player /path/to/card/pocket
./build/pi-player --windowed /path/to/card/pocket
```

The default is fullscreen at the current desktop/TV resolution, with nearest-neighbor
integer scaling of the complete 320×200 frame, centered in black borders. This preserves
320:200 square-pixel aspect (not CRT 4:3 correction). A 1280×720 mode displays 960×600;
1920×1080 displays 1600×1000. Select the TV's video mode in the OS; the launcher does
not change it. Small windows below 320×200 crop at 1×.

The list accepts Pocket `games.txt` plus loose assets/`small.pak`, and discovers one-file
`*.GMP`/`*.gmp` bundles in the same directory. These are GMS1 bundles, not ZIPs or GMPAKs.
The build generates an allowlist from repository `about.json`: only known public games
outside the Starter series can appear. Unknown ids are skipped because GMP has no secret
flag. Rebuild after metadata changes. This is visibility policy, not package authentication.
Starters remain private headless fixtures and are never added to this list.

Make a public demo library from the repository root (build games first if their disks
are absent; all generated library files below are ignored):

```sh
npm run heavy -- npx vite-node games/sandcast/build.ts
cd web
npx vite-node scripts/pocketData.ts --gmp ../hardware/pi-player/library --only sandcast
cd ../hardware/pi-player
./build/pi-player library/pocket
```

Use the existing Pocket packer's compatibility decisions; never force an unsupported
game into the public demo. Existing bundles omit media and scenes, and native import of
ordinary DOS folders/ZIPs remains future work. This first cut starts the first playable
level directly, follows the shared core's level links, and returns to the list when won.
It does not yet show the bundle's intro/exit cards, title menus, inventory picker or saves.
A complete-level replay proves deterministic compatibility, not human playability.

## Input and audio

Keyboard arrows move, Space acts, Enter confirms, Escape returns to Games (Escape from
the list quits). SDL's logical GameController mapping supports DualSense: d-pad/left
stick → arrows, Cross → Space, Options → Enter, Circle → Back. Controllers may connect
or disconnect during use. Keyboard and pad inputs combine; a centered stick does not
release a held keyboard arrow. Stick threshold is 12000 of 32767. Navigation is one row
per press. Games needing additional keyboard actions are outside this first controller
profile. Pair Bluetooth in the host OS; the launcher does not manage pairing.

The simulation uses the Pocket's 18.2 Hz clock with at most four catch-up ticks, separate
from presentation. SDL outputs float mono PCM at 48 kHz. PC speaker effects use the
unchanged `gm::Speaker` at 145.6 steps/second, sample-clocked in the audio callback.
Files, decoding and allocation stay outside that callback. Missing audio devices allow
silent play with a diagnostic.

VOC is an optional first cut for **effect clips**. The Pocket packer removes VOC names
and bytes, so generate a separate host sidecar from the original DOS disk:

```sh
python3 tools/audio.py ../../games/sandcast/disk library/pocket/SANDCAST.GMP.audio
```

The sidecar lives at `<source>.audio/audio.txt`; each row is `level effect filename`.
The tool follows version 3.00 GAM adventure scenes and SND effect names in order,
copying the original VOC bytes. Keep the original game's licenses/notices with it.
The SDL adapter decodes mono PCM8 (blocks 1/2), PCM16 (block 9) and silence (block 3),
with bounded reads and sample counts; it rejects ADPCM, stereo, repeats, rate changes
and truncated streams explicitly. Unsupported clips log a diagnostic and PC speaker
remains available. A new digital effect replaces the previous clip; PC speaker mixes
independently. Intro/exit voices, complete VOC coverage and scene clip-wait policy still
need the later full-media profile. No CMF playback is claimed; see [music plan](MUSIC.md).

## Verification without a window

```sh
make check
python3 tools/check.py library/pocket/SANDCAST.GMP sandcast
SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy ./build/pi-player --smoke /tmp/pi-shots library/pocket
```

`make check` tests a real SDL virtual controller (arrows, Cross, Options, Circle,
keyboard coexistence, disconnect and focus loss), VOC PCM8/16 and malformed files, and
the dummy audio callback. `--smoke` uses SDL's dummy backends to render the list, launch
and advance a game, then use the ordinary Back path; it writes actual framebuffer BMPs.
It opens no visible window. It does not simulate completing a level.

`tools/check.py` runs the unchanged `web/scripts/pocketHostCheck.ts` first: recorded
walkthrough → TypeScript oracle → Pocket C++ comparison of state, frames and speaker
schedule. It passes those exact seed/keys/expected artifacts to this binary's
`--headless DATA ID keys.txt expected.txt`. That path initializes **no SDL subsystem**,
uses the same `Game` and file adapter as interactive play, compares every 312×196
visible-crop FNV hash, tick, level and transition code, and requires at least one level
end. A mismatch, missing/extra oracle tick or incomplete level exits nonzero. The
312×196 test crop is intentionally distinct from the displayed 320×200 texture.

Other existing Pocket checks (from `web/`):

```sh
npx vite-node scripts/pocketControlsCheck.ts
npx vite-node scripts/pocketCardsCheck.ts
npx vite-node scripts/pocketHostCheck.ts
```

Run board builds only, never upload: from the repository root,
`npm run heavy -- ~/.platformio/penv/bin/pio run -d ../gamemaker-pocket -e esp32-3248s035 -e cyd-2432s028` (the Pocket Player lives in its own repository, https://github.com/lewismoten/gamemaker-pocket; `make` finds it through `POCKET_DIR`, default `../gamemaker-pocket`).

## Raspberry Pi OS Lite and ARMv6 later

On the Pi, install a C++17 compiler, make, Python 3 (build-time catalog only), SDL2 and
zlib development packages, then `make SDL_CONFIG=sdl2-config`. Runtime needs only the
binary, SDL2/zlib and game bundles/sidecars; no Node or Python. Select a distribution
SDL build with KMSDRM and ALSA support. On a local VT, try
`SDL_VIDEODRIVER=kmsdrm ./build/pi-player /path/to/pocket` as an unprivileged user with
graphics/input/audio device access. No service, image, boot configuration or disk
flashing is installed by this area. Confirm actual HDMI audio and controller access
before adding a boot service.

Zero W v1.1 is ARM1176/ARMv6 with VFP, not ARMv7 or ARM64. Cross-build in a Linux
ARMv6 hard-float toolchain/sysroot matching the selected Pi OS release, with target
SDL2/zlib (never Homebrew libraries). For example, after preparing that sysroot:

```sh
make CXX=/toolchain/bin/arm-linux-gnueabihf-g++ \
  SDL_CONFIG=/sysroot-tools/sdl2-config \
  CXXFLAGS='-O2 -std=c++17 -Wall -Wextra -march=armv6zk -mtune=arm1176jzf-s -mfpu=vfp -mfloat-abi=hard' \
  CPPFLAGS='--sysroot=/pi-sysroot -I$(POCKET_DIR)/src -Ibuild -I/pi-sysroot/usr/include/SDL2 -D_REENTRANT' \
  LDFLAGS='--sysroot=/pi-sysroot' LDLIBS='-lSDL2 -lz'
```

The compiler's triplet alone does not guarantee ARMv6: check the executable **and all
libraries**, including libstdc++, with `readelf -A` and test on the actual Zero. Use a
clean build when switching target. No ARM cross-build or Pi performance result is
implied by a successful Mac build.

Before calling Phase 1 complete on hardware: select/play/finish a level/return using
only DualSense; listen to speaker and VOC; check overscan/aspect/readability at TV
resolution, hotplug/reconnect, 30-minute stability/audio underruns and 20 cold boots.
Record boot timestamps, PSS, CPU and audio behavior. CEC/IR, network setup, shutdown,
saves, installer, Design/browser mode and OS images remain later phases.

`src/files.*` is the thin stdio/zlib adapter and bounded bundle reader; `src/input.h`
is the input adapter; `src/display.h` renders the game/list; `src/audio.*` handles PCM;
`src/replay.*` verifies host frames. Tools generate metadata/audio and run the oracle.
Credits: OpenAI Codex implemented this area under Lewis Moten's direction. SDL2 is by
Sam Lantinga and contributors (zlib license); zlib is by Jean-loup Gailly and Mark Adler
(zlib license). The reused font's public-domain provenance and existing core/game
credits remain in root [NOTICE.md](../../NOTICE.md). Distribute that notice with builds.
