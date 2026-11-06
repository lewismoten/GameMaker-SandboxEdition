# Changelog

Changes to `@lewismoten/gamemaker-sandbox-engine`, released as `engine-v*` tags. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

Live sound control, a hook for life losses, and fixes to scrolling and picture decoding.

### Added

- Experimental gameplay patches (`player/patchTable` group `play`: `play.maxSpeed`, `play.gravityCap`, `play.gravityTicks`, `play.attackX`, `play.attackY`, `play.scrollSpeedX`, `play.scrollSpeedY`, `play.scrollSteps`, `play.fadeSteps`), `ImmField.negate`, and `World.tune` with `STOCK_TUNING` and `playTuning(look)`, so a scene plays by a patched player's constants. With no patches play is unchanged.
- Scene-load disk reads on a slow PC: `sceneLoadMs(pc, reads)` (an open per file at `vocOpenMs` plus its bytes at `vocBytesPerMs`), `sceneReads(s, scene, card, slots?)` (the byte count of each file loadscene opens; the song only with a card), `LOADGAME_SLOTS` (the files F6's LoadGame reads again) and `Session.sceneLoad` (the last charge: files, bytes, ms). `playScene` holds the black screen that long before the fade-in, and F6's LoadGame before its pause, on every preset (`486`, `386`, `286`, `ps1`); game time does not move. `TURBO_OFF` (no disk figures) and Today are unchanged.
- An IBM PS/1 slow-PC preset (`SPEED_PRESETS.ps1`: 286 at 10 MHz, slow disk, `vocHeapBytes`), `vocWontFit`, and a voice that starts only after its emulated disk read (a sound too big for the heap is read and not played). Estimates; Today charges nothing.
- Slow-PC presets for 486, 386 and 286 (`SPEED_PRESETS`, `costsFor`) and a voice-read stall (`vocStallMs`): a game freezes while a .voc is read from disk, as PLAYGAME's synchronous read did. Estimates; the default speed charges nothing.
- Color-vision simulation (`gfx/colorVision`): the Machado, Oliveira and Fernandes matrices, sRGB and linear RGB, CIELAB and CIE76 delta E, one copy for the palette editor, the badge look-alike report and the games' color checks.
- Player life-loss events, so a caller can watch for them without counting recorded playback.
- Play's F10 shows an imported player's own About page and the build it was first made with.
- Sparse FLI palette changes (only the colors a frame draws), and FLI clip options that leave out the ring frame or cut where a whole frame adds the fewest bytes.

### Changed

- The sound mix (music, voice, effects: on and volume) is followed live, and sound-card output changes without restarting audio or play.
- Card changes route through the active scene and the packed API.
- The FLI encoder uses plain loops, about five times faster on long clips with the same bytes.
- Engine-specific notices ship in the package.

### Fixed

- A too-short or oversized-header FLI, and a CMF cut short, give a clear error (or play) instead of a RangeError or a huge allocation.

- Scroll speed wraps like DOS's 16-bit integers.
- Progressive JPEG prefixes decode only from complete MCU data.

## [3.1.0] - 2026-10-29

The first release of the browser engine as an npm package: the TypeScript port of PLAYGAME with readers and writers
for every Game-Maker file format, OPL2 and CMF audio, screen, input and fonts.

### Added

- The engine, scoped as `@lewismoten/gamemaker-sandbox-engine` and published to GitHub Packages from version tags.

[Unreleased]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/engine-v3.1.0...HEAD
[3.1.0]: https://github.com/lewismoten/GameMaker-SandboxEdition/releases/tag/engine-v3.1.0
