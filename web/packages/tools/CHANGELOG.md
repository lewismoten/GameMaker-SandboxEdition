# Changelog

Changes to `@lewismoten/gamemaker-sandbox-tools`, released as `tools-v*` tags. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [3.8.0] - 2026-11-17

Tiled signs pack tighter and can wrap two lines of small letters, and a new VOC measurement lets builds lower sample rates only where nobody can hear the difference.

### Changed

- Add VOC band-energy measurements and filtered PCM rate reduction for build tools.

### Fixed

- Tiled signs use uniform font pixels and tighter packing, with optional two-line 3×5 boards that wrap whole words inside one frame.

Full list: [changes/release/tools/3.8.0.md](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/tools-v3.8.0/changes/release/tools/3.8.0.md)

## [3.7.0] - 2026-11-15

### Added

- `kit/cameraLog`: `recordCamera` logs where PLAYGAME's screen really is at every tick of a bot's run, so level pictures frame the hero where the player saw him.
- `kit/eventLog`: `recordEvents` logs a headless game run's key presses, score changes and scene changes as an `EventLog`, without changing the engine.
- `kit/laserNest`: first-fit circle nesting of small laser parts inside the empty middles of hollow ones, with a re-check of every placed pair.
- `cameraTop` in `kit/levelPicture` gives the map row the DOS screen starts at while the hero stands, so progress pictures show what a player sees.
- Build a game's tiled signs together with centered text packed across reusable tiles, compact shared borders, one centered post, larger-letter and block-budget options.
- Tiled signs support compact 4×8 letters and word wrapping to a maximum board width.
- Select a map’s sign vocabulary when building tiled signs, keeping separate room block sets within the tile budget.

## [3.6.0] - 2026-11-12

Laser kits pack onto library stock sheets, with cutter-margin checks and fitting tables.

### Added

- Add Proofgrade stock packing, cutter-margin checks and fitting tables for laser kits.

### Fixed

- Apply large text deltas without passing every inserted line as a function argument.

## [3.5.0] - 2026-11-11

A browser-safe ISO 9660 writer, exports for the laser-kit helpers and the Level check's animation check, and a level-generator jump fix.

### Added

- Added a browser-safe ISO 9660 / Rock Ridge writer with long names, Unix modes and symbolic links.
- Exports for the laser-cut kit helpers: `./kit/laserJoints`, `./kit/laserLayout`, `./kit/laserSvg`, `./kit/laserPixels` and `./kit/laserClearance`.
- Exported the Level check’s animation compatibility check for native game files in browsers and Node.

### Fixed

- The level generator's jump math follows the hero's sideways movement when a jump hits the edge of a solid ceiling, so predicted landings match the player.

## [3.4.0] - 2026-11-07

Most of the game-building kit moves into the package: a seeded level generator for dungeons, forests, towns, castles
and side views, block roles, nonsense-talk voices, and tools for FLI shrinking, palettes, disk diffs, embroidery, and
3D-printable and laser models.

### Added

- `kit/levelGen`, a seeded level generator with no DOM: dungeons, forests, homes, shops, castles, towns, overworlds and platform side views, with each key reachable before its lock.
- Shared game-building APIs move into the package: DOS disk writing, native character and text-screen builders, route checks, the engine-backed simulator and more.
- `kit/blockRoles`, `kit/mumble` (nonsense talk as a .VOC), `kit/levelGrid` and `image/animatedGif`.
- Mesh, embroidery and laser-kit tools: surface nets and STL files, a stitch generator with DST, EXP and PES files, finger-joint panels and a wooden-nickel builder.
- `diskDiff` and `kit/fliShrink`.

### Changed

- Game builds replace `disk/` files in place, and `kit/tar` is browser-safe.

### Fixed

- `kit/gameSim`: a scene with a blank character or character-blocks slot keeps the last scene's, as PLAYGAME's loadscene does.

Full list: [changes/release/tools/3.4.0.md](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/tools-v3.4.0/changes/release/tools/3.4.0.md)

## [3.1.0] - 2026-10-29

The first release of the development tools as an npm package: drawing, palettes, fonts, music and PNG builders.

### Added

- The tools package, scoped as `@lewismoten/gamemaker-sandbox-tools` and published to GitHub Packages from version tags.
- CP437 and micro text drawn as indexed game pixels, with documented font, text-effect and lighting APIs.
- Reusable color ramps and time-of-day VGA lighting.

[Unreleased]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/tools-v3.8.0...HEAD
[3.8.0]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/tools-v3.7.0...tools-v3.8.0
[3.7.0]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/tools-v3.6.0...tools-v3.7.0
[3.6.0]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/tools-v3.5.0...tools-v3.6.0
[3.5.0]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/tools-v3.4.0...tools-v3.5.0
[3.4.0]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/tools-v3.1.0...tools-v3.4.0
[3.1.0]: https://github.com/lewismoten/GameMaker-SandboxEdition/releases/tag/tools-v3.1.0
