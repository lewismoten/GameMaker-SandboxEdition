# @lewismoten/gamemaker-sandbox-engine 3.3.0 - 2026-11-07

Every change in this version (tag `engine-v3.3.0`). The [changelog](../../web/packages/engine/CHANGELOG.md) has the summary and the most important ones.

Slow-PC presets that play a game at the pace of a 486, 386, 286 or IBM PS/1, experimental gameplay patches, live
control of the sound mix and sound card, and a hook for life losses. Fixes cover scroll speed, JPEG and FLI decoding,
short CMF files, and a recorded Enter on key screens.

### Added

- Experimental gameplay patches (`player/patchTable` group `play`: `play.maxSpeed`, `play.gravityCap`, `play.gravityTicks`, `play.attackX`, `play.attackY`, `play.scrollSpeedX`, `play.scrollSpeedY`, `play.scrollSteps`, `play.fadeSteps`), `ImmField.negate`, and `World.tune` with `STOCK_TUNING` and `playTuning(look)`, so a scene plays by a patched player's constants. With no patches play is unchanged.
- Scene-load disk reads on a slow PC: `sceneLoadMs(pc, reads)` (an open per file at `vocOpenMs` plus its bytes at `vocBytesPerMs`), `sceneReads(s, scene, card, slots?)` (the byte count of each file loadscene opens; the song only with a card), `LOADGAME_SLOTS` (the files F6's LoadGame reads again) and `Session.sceneLoad` (the last charge: files, bytes, ms). `playScene` holds the black screen that long before the fade-in, and F6's LoadGame before its pause, on every preset (`486`, `386`, `286`, `ps1`); game time does not move. `TURBO_OFF` (no disk figures) and Today are unchanged.
- Optional custom-PC disk-read music holds (`readHoldsMusic`, `musicHoldMs`, `AudioEngine.holdMusic`, a `hold` message to the music worklet) and slow-PC timer interrupt and FM-write costs per interrupt (`isrMs`, `fmEventMs`, `fmWriteMs`; `engine/slowPcMusic`: `songLoad`, `songIsrMs`, `songPeakIsrMs`). The PS/1's `vocHeapBytes` is 145,000 (DOS in ROM). Estimates.
- An IBM PS/1 slow-PC preset (`SPEED_PRESETS.ps1`: 286 at 10 MHz, slow disk, `vocHeapBytes`), `vocWontFit`, and a voice that starts only after its emulated disk read (a sound too big for the heap is read and not played). Estimates; Today charges nothing.
- Slow-PC presets for 486, 386 and 286 (`SPEED_PRESETS`, `costsFor`) and a voice-read stall (`vocStallMs`): a game freezes while a .voc is read from disk, as PLAYGAME's synchronous read did. Estimates; the default speed charges nothing.
- Color-vision simulation (`gfx/colorVision`): the Machado, Oliveira and Fernandes matrices, sRGB and linear RGB, CIELAB and CIE76 delta E, one copy for the palette editor, the badge look-alike report and the games' color checks.
- Player life-loss events, so a caller can watch for them without counting recorded playback.
- Play's F10 shows an imported player's own About page and the build it was first made with.
- Sparse FLI palette changes (only the colors a frame draws), and FLI clip options that leave out the ring frame or cut where a whole frame adds the fewest bytes.
- The DOS screen's gameplay crop and the last scene it drew, for screenshot tools, without changing rendering or timing.

### Changed

- The sound mix (music, voice, effects: on and volume) is followed live, and sound-card output changes without restarting audio or play.
- Card changes route through the active scene and the packed API.
- The FLI encoder uses plain loops, about five times faster on long clips with the same bytes.
- Engine-specific notices ship in the package.

### Fixed

- CP437 display decoding recovers the Windows-1252 aliases produced by the binary reader; `cp437Text` decodes DOS text files while retaining their line endings and end markers for callers.
- Slow-PC presets keep FM music advancing during disk reads while preserving the full gameplay freeze and delayed digital-sound start. Explicit custom timer holds and interrupt/FM costs are unchanged.
- A too-short or oversized-header FLI, and a CMF cut short, give a clear error (or play) instead of a RangeError or a huge allocation.
- Scroll speed wraps like DOS's 16-bit integers.
- Progressive JPEG prefixes decode only from complete MCU data.
- A recording that waits on a key screen (such as a drop picker) gets one recorder poll per tick, so a recorded Enter reaches it instead of hanging.
