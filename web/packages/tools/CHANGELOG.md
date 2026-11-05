# Changelog

Changes to `@lewismoten/gamemaker-sandbox-tools`, released as `tools-v*` tags. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

Most of the game-building kit moves into the package, with new tools for FLI shrinking, palettes, disk diffs,
embroidery and 3D-printable and laser models.

### Added

- `kit/levelGen`: a seeded level generator with no DOM. `generate` draws a dungeon (rooms and corridors) or a forest (trees, clearings, a winding path) from the blocks that hold roles, `checkNeeds` says which roles a kind needs, and `verifyReach` checks every open cell can be reached from the proposed entry.
- `kit/levelGen` props: locked doors with their keys (each key is reachable before its own lock; `proveResult` checks it again by playing the keys out), treasure and a heart in corners and dead ends, and monster spots from the monster numbers you pass (`GenParams.monsters`, returned as `monsters` with their start cells). Without the roles or monsters a layout is unchanged.
- `kit/levelGen` interiors and castle: `generate` also draws a `home` (one to three rooms) or `shop` (counter across the room, shopkeeper spot behind it) and a `castle` (outer wall, corner towers, gate, courtyard, a keep built by the dungeon generator). Furniture goes by rules (`furnish.ts`): beds, shelves, counters and stoves stand against a wall with their front to the room, chairs sit next to a table and look at it, and a lane two cells wide runs in from the door. A piece is put down only if every open cell stays reachable, and the result lists each piece's role, facing and block (`furniture`). Roles with no block, or no block facing the right way, are skipped with a note. `proveResult` also reports `furnished`, and each kind has its own smallest area (`kindInfo(kind).min`); a building is drawn in the middle of a larger area.
- `kit/blockRoles`: block roles (wall, door, key, chair with a facing and more) with `suggestRoles`, which guesses them from a block's behavior and picture, and helpers to clean and pack them for an editor's companion data.
- `kit/mumble`: nonsense talk as a .VOC. `mumble` and `mumbleVoc` voice a list of syllables, `syllablesFromText` turns a line of text into syllables the same way every time, and `MUMBLE_VOICES` has bright, deep and small voices.
- `kit/levelGrid`: a character grid to paint a level in code (fill, row, column, put) before it becomes rows of text.
- `image/animatedGif`: a looping animated GIF from indexed frames that each carry their own VGA palette, as an FLI's do.
- Shared game-building APIs: DOS disk writing, native character and text-screen builders, FLI clipping fades, route checks and the engine-backed simulator, perspective roads, photo processing, level previews, CMF arrangement effects and synthesis pieces.
- Text-fit audit: `levelCards` and `cardOverflow` find words baked into a Starter level card that run past its parchment box.
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

- `kit/gameSim`: a scene with a blank character or character-blocks slot keeps the last scene's, as PLAYGAME's loadscene does.
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
