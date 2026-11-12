# @lewismoten/gamemaker-sandbox-tools

Version **3.4.0**. Tools for creating and checking native RSD Game-Maker data, without
game assets. ES modules with TypeScript declarations; Node.js **22.12+**. Runtime npm
dependencies are `@lewismoten/gamemaker-sandbox-engine` **^3.2.0** and
`@lewismoten/gamemaker-sandbox-archives` **^3.2.0**.

Install through your configured npm registry (configure its authentication if needed):

```sh
npm install --save-dev @lewismoten/gamemaker-sandbox-tools
```

There is **no root import**. Import a subpath. `drawing`, `simulation`, `formats/*` and
`audio-files` reject browser imports. Other entries include browser-safe APIs; PNG and
compressed tar output need `CompressionStream`. Filesystem helpers such as `kit/disk`,
`kit/photo`, `kit/png`, `kit/laserPreview` and `mesh/trinketTool` need Node.

## Main entries

`drawing` exports `Pixels`, `PaletteBuilder`, fonts, text rendering, compositing, shading,
transforms and cartoon reels. Native format subpaths re-export engine codecs:
`formats/blocks`, `character`, `cmf`, `fli`, `fliLimits`, `game`, `gif`, `graphicScripts`,
`map`, `monster`, `palette`, `recording`, `sound`, and `voc` (each prefixed `formats/`).

```ts
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { emptyBlock, serializeBlocks } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';

const blocks = Array.from({ length: 150 }, (_, i) => emptyBlock(i));
blocks[0].pixels.set(new Pixels(20, 20, 1).px);
const data = serializeBlocks(blocks);
```

`audio` exports `song`, `blankSong`, `sbi`, `INSTRUMENTS`, `tune`, speaker effects and
sample synthesis, without playback devices. `images` exports indexed PNG encoding,
`crc32`, `medianCutRgba`, `Pixels`, transforms and painting helpers.

```ts
import { song, INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/audio';
import { encodePng } from '@lewismoten/gamemaker-sandbox-tools/images';

const cmf = song(120, [{ channel: 0, instrument: INSTRUMENTS.piano, notes: 'C4 q, E4 q, G4 h' }]);
const png = await encodePng({
  width: 1, height: 1, pixels: Uint8Array.of(1),
  palette: new Uint8Array(768).fill(63), // 256 × RGB, six-bit VGA levels
});
```

`simulation` exports `Sim`, `GameSim`, `readDisk`, `diskSim`, `newCharInfo`,
`TICKS_PER_SECOND`, scene initialization, route assertions and `GameSimState`.
It provides headless checks; a bot win does not establish playability.

```ts
import { GameSim, readDisk } from '@lewismoten/gamemaker-sandbox-tools/simulation';

const sim = new GameSim(readDisk('./disk'), 1); // caller's complete DOS game directory
const before = sim.snapshot();
sim.restore(before);
```

`iso9660` exports `createIso(entries, { volume, date?, application? })`, returning an
ISO 9660 image with Rock Ridge long names, Unix modes and symbolic links. Folders are
implied or supplied without data or a link. It works in Node and browsers.

```ts
import { createIso } from '@lewismoten/gamemaker-sandbox-tools/iso9660';

const iso = createIso([
  { path: 'README.TXT', data: new TextEncoder().encode('How to play'), mode: 0o644 },
], { volume: 'GAME', date: new Date('2000-01-01T00:00:00Z') });
```

## Checks and build helpers

- `fli-check`: `fliCheck(files)` accepts engine `GameFiles`' `get` and `byExtension`
  methods and returns warning findings for PLAYGAME animation decoder limits. It works
  in Node and browsers, reads no project metadata, and leaves accepting suggestions to callers.
- `kit/blockRoles` and `kit/levelGen`: role-based seeded map generation. The latter
  exports `generate`, `generatePlatform`, `heroPhysics`, `capability`, `proveResult` and
  `reachFrom(area, physics, start, locksOpen, options?)`. The reach model tracks touched
  and standing cells; `{ route: true }` enables `routeTo(cell)`. It treats space above the
  generated rectangle as unknown and rejects moves through ledges that require uncertain
  engine correction. Its proof does not judge monsters or fun.
- `kit/fliShrink`: `fliReport`, decoding/encoding, lossless sparse palettes and optional
  lossy shrink steps with visibility scores. `kit/fliClips` splits clips; `kit/fadeOut`
  adds palette fades; `kit/recordedDemo` builds native demos.
- `kit/tar`: `createTar`, `createTarGz`, `readTar`, with Unix modes and ustar prefixes.
- `audio-files`: `decodeAudioFile`, `audioFileToVoc`. Matching mono unsigned 8-bit PCM WAV
  decodes directly; other inputs/resampling require separately installed FFmpeg on PATH
  or `ffmpegPath`. VOC defaults to 11025 Hz and a 65535-byte cap; oversize output throws.

Laser helpers use millimeters and take caller-supplied designs:

- `kit/laserJoints`: `jointOutline`, `outlineFromRects`, `offsetPoly`, rectangle and rotation helpers.
- `kit/laserLayout`: kerf-adjusted `Part` with compensated `cutBounds`, `BED`, `PART_GAP`, `packRows`,
  and `STOCK`/`STOCK_MARGIN` for Proofgrade 6 × 12, 8 × 12, 12 × 12 and 12 × 20 inch sheets.
  `packStock` packs with quarter turns inside the cutter margins; `placePart` copies a placement without SVG transforms.
  Packing throws when a part cannot fit. Call `Part.close()` to check spacing.
- `kit/laserStock`: `packKitStock` nests small solid pieces in polygonal or round cut-out holes before
  stock packing; `stockFitting` returns sheet counts for all four sizes using the same layout;
  `stockProblems` checks every operation and its hairline against cutter margins. Hole nesting uses
  unturned bounding rectangles with one level of guests; root pieces and their guests may turn together.
  Layouts are deterministic heuristics, not guaranteed minimum sheet counts.
- `kit/laserSvg`: `LaserSheet`, operation colors and shape types; `.svg(title)` writes SVG.
- `kit/laserPixels`: pixel engraving, straight/arc text, bitmap toning and ink bounds.
- `kit/laserClearance`: `tooClose` reports element pairs below supplied gaps; `cutSpacingProblems` checks exact compensated
  cut-path distances, and `engravingRegionProblems` checks convex engraving in circular or annular regions.
- `kit/laserPreview`: Node raster previews and PNG output.

## Other subpaths

| Entry                             | Public surface                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------- |
| `text`, `microFont`, `colors`     | CP437 and micro glyphs, `renderText`, lighting, RGB/HSV and ramps                 |
| `palettes`                        | `libraryDefaultPalette`, `PALETTE_PRESETS`, `createPalettePreset`                 |
| `menu-version`                    | `stampMenuVersion` and `MenuVersionSpot`                                          |
| `gif-shrink`                      | `shrinkGif`, smaller GIFs preserving PLAYGAME's display                           |
| `block-merge`, `look-alike`       | `mergeBackgroundSets`, `findLookAlikes`, `applyFold`                              |
| `color-reduce`, `palette-reserve` | `reduceBlocks`, `planRanges`, `syncRange` and scoring helpers                     |
| `delta`                           | File/version diffs, patch application and `deltaSize`                             |
| `disk-diff`, `release-notes`      | `diffDisks`, `formatDiff`, `releaseNotes` and summaries                           |
| `music/*`                         | `music/compose`: CMF composition and instrument presets                           |
| `image/*`                         | `png`, `animatedGif`, `surface`: encoding and indexed painting                    |
| `embroidery/*`                    | Designs, stitch compilation, DST/EXP/PES readers/writers, validation and previews |
| `mesh/*`                          | Distance fields, mesh generation/checks, STL/3MF, color bodies and trinket output |
| `pack/*`                          | `meshPack`, `threeMfPack`: lossless mesh packing                                  |
| `kit/*`                           | Drawing, text, palette, song, disk, simulation, layout and build helpers          |

Wildcard paths expose existing modules, not arbitrary filenames. The
[public source tree](https://github.com/lewismoten/GameMaker-SandboxEdition/tree/master/web/packages/tools/src)
and [export map](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/web/packages/tools/package.json)
list their modules and signatures. Embroidery output has not been tested on a real machine;
sew a test on scrap before using a design.

## Development and license

Run `npm run build`, `npm run verify` or `npm pack` in the package folder. Standalone
builds use only package-owned source and declared dependencies. Repository development
uses root `npm ci`; root `npm run verify:packages` checks isolated builds with packed
sibling dependencies. See the
[monorepo guide](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/docs/monorepo.md)
and [release guide](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/docs/package-releases.md).

The tarball includes JavaScript, declarations, README, changelog,
[LICENSE](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/web/packages/tools/LICENSE)
and [NOTICE.md](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/web/packages/tools/NOTICE.md).
Source is MIT licensed; no game assets or decoder binaries are bundled.
