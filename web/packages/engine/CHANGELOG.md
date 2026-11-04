# Changelog

Changes to `@lewismoten/gamemaker-sandbox-engine`, released as `engine-v*` tags. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [3.3.0] - 2026-11-04

Live sound control, a hook for life losses, and fixes to scrolling and picture decoding.

### Added

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

[Unreleased]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/engine-v3.3.0...HEAD
[3.3.0]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/engine-v3.1.0...engine-v3.3.0
[3.1.0]: https://github.com/lewismoten/GameMaker-SandboxEdition/releases/tag/engine-v3.1.0
