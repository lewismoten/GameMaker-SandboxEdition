# Changelog

Changes to `@lewismoten/gamemaker-sandbox-tools`, released as `tools-v*` tags. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

Most of the game-building kit moves into the package, with new tools for FLI shrinking, palettes, disk diffs,
embroidery and 3D-printable and laser models.

### Added

- Shared game-building APIs: DOS disk writing, native character and text-screen builders, FLI clipping fades, route checks and the engine-backed simulator, perspective roads, photo processing, level previews, CMF arrangement effects and synthesis pieces.
- Audio: native PCM WAV decoding and Node-only conversion of source audio to native VOC files.
- Color: the original Library palette, reusable palette templates with hardware references, pixel-based color reduction, RGB and HSV helpers, and configurable ramps.
- Indexed surface painting and transforms, plus palette reservation planning that scores colors by delta E.
- `diskDiff`, a summary of what changed between two game disks by file type.
- `kit/fliShrink`: a per-chunk size report and shrink steps, with a shrink option in `fliClips`.
- Mesh tools: surface nets, binary STL read and write and a closed-mesh check, with a pixel-figure builder and a field-to-print trinket pipeline.
- Embroidery: a stitch generator, DST, EXP and PES writers and readers, and a simulation.
- Laser kit helpers: finger-joint panels, kerf offsets, part and sheet layout, and a wooden-nickel builder.
- Disks merge byte-identical palettes, and optimizing shrinks picture color tables losslessly.

### Changed

- Game builds replace `disk/` files in place, so a running dev server never finds one missing.
- `kit/tar` is browser-safe, so the web app's production build can import it.
- Text-fit audits and level rendering live in the package.

- Merging two background sets is much faster: finding blank block slots no longer re-serializes a block for every byte.
### Fixed

- Indexed-pixel shifts that are invalid are rejected, and fractional flood-fill seeds are ignored.
- `kit/audioEvents` is types only, so it no longer builds an empty chunk.

## [3.1.0] - 2026-10-29

The first release of the development tools as an npm package: drawing, palettes, fonts, music and PNG builders.

### Added

- The tools package, scoped as `@lewismoten/gamemaker-sandbox-tools` and published to GitHub Packages from version tags.
- CP437 and micro text drawn as indexed game pixels, with documented font, text-effect and lighting APIs.
- Reusable color ramps and time-of-day VGA lighting.

[Unreleased]: https://github.com/lewismoten/GameMaker-SandboxEdition/compare/tools-v3.1.0...HEAD
[3.1.0]: https://github.com/lewismoten/GameMaker-SandboxEdition/releases/tag/tools-v3.1.0
