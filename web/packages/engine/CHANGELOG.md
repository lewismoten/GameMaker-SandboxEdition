# Changelog

Changes to `@lewismoten/gamemaker-sandbox-engine`, released as `engine-v*` tags. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [3.3.0] - 2026-11-07

Slow-PC presets that play a game at the pace of a 486, 386, 286 or IBM PS/1, experimental gameplay patches, live
control of the sound mix and sound card, and a hook for life losses. Fixes cover scroll speed, JPEG and FLI decoding,
short CMF files, and a recorded Enter on key screens.

### Added

- Slow-PC presets (`SPEED_PRESETS`: 486, 386, 286 and the IBM PS/1) with voice-read stalls, disk-read costs and music holds. They are estimates, and the default speed charges nothing.
- Experimental gameplay patches (`player/patchTable` group `play`, `World.tune`). With no patches, play is unchanged.
- Player life-loss events, so a caller can watch for them without counting recorded playback.
- Color-vision simulation (`gfx/colorVision`) and sparse FLI palette changes.

### Changed

- The sound mix (music, voice, effects: on and volume) is followed live, and sound-card output changes without restarting audio or play.

### Fixed

- Scroll speed wraps like DOS's 16-bit integers. Damaged FLI and CMF files give a clear error, and progressive JPEGs decode only complete data.

Full list: [changes/release/engine/3.3.0.md](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/engine-v3.3.0/changes/release/engine/3.3.0.md)

## [3.1.0] - 2026-10-29

The first release of the browser engine as an npm package: the TypeScript port of PLAYGAME with readers and writers
for every Game-Maker file format, OPL2 and CMF audio, screen, input and fonts.

### Added

- The engine, scoped as `@lewismoten/gamemaker-sandbox-engine` and published to GitHub Packages from version tags.

[Unreleased]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/engine-v3.3.0...HEAD
[3.3.0]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/engine-v3.1.0...engine-v3.3.0
[3.1.0]: https://github.com/lewismoten/GameMaker-SandboxEdition/releases/tag/engine-v3.1.0
