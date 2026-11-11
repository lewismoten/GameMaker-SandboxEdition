# Changelog

Changes to `@lewismoten/gamemaker-sandbox-tools`, released as `tools-v*` tags. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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

[Unreleased]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/tools-v3.5.0...HEAD
[3.5.0]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/tools-v3.4.0...tools-v3.5.0
[3.4.0]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/tools-v3.1.0...tools-v3.4.0
[3.1.0]: https://github.com/lewismoten/GameMaker-SandboxEdition/releases/tag/tools-v3.1.0
