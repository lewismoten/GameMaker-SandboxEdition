# @lewismoten/gamemaker-sandbox-tools

Tools for creating and checking native RSD Game-Maker data. Browser playback belongs to `@lewismoten/gamemaker-sandbox-engine`; this package has no game artwork, recordings, characters, or game-specific palettes.

Requires Node.js 22.12 or newer. Install as a development dependency from your configured npm registry:

```sh
npm install --save-dev @lewismoten/gamemaker-sandbox-tools
```

If your registry requires authentication or a scope mapping, configure npm using that registry's instructions.

## APIs

- `formats/blocks`, `character`, `game`, `map`, `monster`, `palette`, `gif`, `graphicScripts`, `sound`, `fli`, `fliLimits`, `voc`, `recording`, and `cmf`: native readers, writers, types, and limits. Each is a separate `formats/<name>` subpath.
- `gif-shrink`: `shrinkGif(bytes)` returns a smaller GIF with a trimmed color table, or `undefined` when it can't shrink without changing what PLAYGAME shows.
- `drawing`: indexed pixels, VGA palette builders, font drawing, shading, compositing, and cartoon reels.
- `audio`: original FM instrument presets, CMF composition, PC speaker effects, and VOC synthesis.
- `images`: indexed PNG encoding, CRC-32, color reduction, indexed drawing and picture transforms.
- `simulation`: headless `Sim`, `GameSim`, `readDisk`, `diskSim`, and `newCharInfo` for fixture checks. This includes the reference simulation; it does not replace testing the browser engine package.

The browser-safe `images` entry also exports `Pixels`, `flipX`, `flipY`, `turn90`,
`turn180`, and `shiftPixels` for indexed pictures of any size. Quarter turns return a
picture with exchanged dimensions. `mirrorAll`, `line`, `box`, and `floodFill` support
painting across tile boundaries. Fill accepts optional mask and writer callbacks for
missing cells or repeated references to the same tile; traversal uses the original
pixels so writes to shared cells do not break the fill.
Shift offsets use whole pixels. Fill ignores seeds outside the image, inside a masked
cell, or at non-integer coordinates; mismatched buffer dimensions throw a `RangeError`.

```ts
import { emptyBlock, serializeBlocks } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';

const blocks = Array.from({ length: 150 }, (_, i) => emptyBlock(i));
blocks[0].pixels.set(new Pixels(20, 20, 1).px);
const data = serializeBlocks(blocks);
```

`medianCutRgba` from `images` chooses up to a requested 1–256 eight-bit RGB colors from portable RGBA image buffers. It needs no canvas or DOM; flatten transparency onto the intended background before calling it. The palette is based on pixel colors and their frequency, not unused color-table entries.

Keep drawing and simulation imports in Node build scripts and tests; those entry points reject browser imports. Browser-safe `audio`, `images`, `text`, `colors`, `microFont`, `music/compose`, `image/png`, `kit/tar` and `menu-version` (stamps "v1.0" on a game menu picture) entry points also support the web editor. Playback through the engine and archives packages does not load this toolkit. Generated game data and your own copied assets belong in the consuming project.

## Fonts, text images, and lighting

`drawing` exports the complete `FONT_CP437` (256 × 8 rows, bit 0 leftmost), including DOS symbols, accents, block shading, and box drawing. NUL, space, and nonbreaking space are intentionally blank. The legacy `FONT8X8` and `text` helpers retain their ASCII behavior. `glyphRows(code)` returns a copy; `encodeText`, `toCp437`, and `fromCp437` convert Unicode DOS symbols and CP437 codes. This is the DOS glyph set, not an ANSI escape-sequence parser.

`MICRO_GLYPHS` exposes the project's original 3×5 uppercase font and punctuation. `glyphRows(code, 'micro')` accepts lowercase as uppercase and uses `?` for unsupported glyphs. It does not include game-specific lettering.

```ts
import { renderText, encodeText, PaletteBuilder, lightColor, TIME_OF_DAY_SKY } from '@lewismoten/gamemaker-sandbox-tools/drawing';

const caption = renderText('╔═╗\n║é║\n╚═╝', {
  color: 12, outline: 0, shadow: { color: 8 },
});
// caption.width, caption.height, caption.pixels suit indexed GIF/picture builders.
// Copy small images into a native block's 20×20 pixel array before serializing it.
const sign = renderText('GO!', { font: 'micro', color: 15, scale: 2 });
const rawGlyphs = renderText(Uint8Array.of(1, 3, 10, 219), { color: 15 });
const dosTextBytes = encodeText('Café ♥');

const palette = new PaletteBuilder();
palette.designerColors();
const [dark, light, middle] = TIME_OF_DAY_SKY.sunset;
palette.ramp('sky', 8, dark, light, middle);
const lit = lightColor([100, 180, 80], 'night');
```

`renderText` returns row-major indexed pixels with transparent index 255 and an origin for the first text cell. It pads the output for a one-pixel outline and shadow, even at larger scales or negative shadow offsets. Strings support LF/CRLF lines; raw byte arrays draw every byte as a glyph on one line. Empty text returns a 0×0 image. Unsupported Unicode throws rather than selecting an unrelated glyph. Ink indexes are 0–254.

`outline` and `dropShadow` also decorate `Pixels` sprites within their existing bounds; edges clip. The existing sprite outline uses four neighbors, while text outlines include all eight neighbors.

`colorRamp` returns eight-bit RGB stops without allocating palette entries. `rgbToHsv` and `hsvToRgb` convert eight-bit RGB and hue in degrees with saturation/value in 0..1, without changing inputs. `PaletteBuilder.ramp` allocates named ramps in a six-bit VGA palette. `TIME_OF_DAY_LIGHT`, `TIME_OF_DAY_SKY`, and `lightColor` provide morning, noon, afternoon, sunset, night, and stage-light presets. `adjustPalette` returns an adjusted native VGA palette without mutating its input. By default it preserves indexes 0 and 255; pass a custom index list to protect glowing colors or designer inks. Game-specific ramp names and cast colors belong in the consumer.

## Source audio files to VOC (Node.js)

Mono unsigned 8-bit PCM WAV files at the requested rate decode directly in Node.js, with
no additional software. For Ogg, FLAC, other WAV variants or resampling, install
[FFmpeg](https://ffmpeg.org/download.html) separately and make `ffmpeg` available on PATH,
or pass its executable path as `ffmpegPath`. No decoder binary is bundled, and browser
playback gains no dependency.

```ts
import { audioFileToVoc, decodeAudioFile } from '@lewismoten/gamemaker-sandbox-tools/audio-files';
import { writeFileSync } from 'node:fs';

writeFileSync('VOICE.VOC', audioFileToVoc(new URL('./voice.wav', import.meta.url), {
  sampleRate: 11025, maxBytes: 39999,
}));
const samples = decodeAudioFile('voice.ogg', { sampleRate: 8000 });
```

FLAC, Ogg, WAV and other formats supported by your FFmpeg build are accepted. Output is
mono at the requested sample rate (11025 Hz by default). VOC conversion defaults to a
65535-byte DOS limit; oversized clips fail instead of being shortened. `decodeAudioFile`
returns samples for mixing or other authoring operations, bounded by `maxSamples`
(default 16 MiB). Both functions accept `timeoutMs` (default 30000).

Use PCM WAV sources for inline GitHub audio previews and sample-exact native game builds.
Lossless FLAC input is also supported at its original sample rate.
The converter disables dithering and uses the inverse of the native VOC encoder's byte
mapping. Lossy sources such as Ogg Vorbis are supported for new audio, but cannot recreate
a previous recording's exact samples. Source `.wav`/`.ogg`/`.flac` files are authoring assets; only
8.3-named `.VOC` files belong on the generated DOS disk.

### Extended micro fonts

`microFont` exports `MICRO_GLYPHS`, `MICRO_SQUARE_GLYPHS`, and `microGlyphs(characters, square?)`.
The shared repertoire includes the sign and technical-label additions such as `µ`, `¢`,
`#`, `%`, `@`, `~`, quotes, underscore, and backslash. Both rounded and square letterforms
are preserved. `renderText(text, {font: 'micro-square'})` selects the square style;
`glyphRows(code, 'micro-square')` returns its five rows. `microGlyphs` can select an exact
legacy repertoire when an existing game's unsupported-character behavior must stay the same.
See NOTICE.md for the source and license of both project fonts.

### Shared text renderers

`drawing` exports `createMicroText` and `createPcText` for adapting existing lettering
without copying drawing loops. Micro text accepts a glyph repertoire, fallback, spacing,
and optional consumer-owned multicolor glyphs. PC text accepts custom glyph artwork,
scaled or absolute shadow offsets, and outline spacing. Both report ink to the existing
text-bounds audit. The default `text`, `outlined`, and `centered` retain their old behavior.

### Sprite composition

`drawing` also exports ASCII sprites, nearest-pixel rotations and reflections, and
`resampleBlit` for fractional scaling. `outline` can ignore existing outline-colored
neighbors or use an explicit transparent index; `outlineInPlace` keeps the original
canvas. `scaleBlitTransparent` selects transparency without changing its mirroring flag.
`bevel` accepts separate top/left/bottom/right shade offsets, and `pool` paints radial light.

`microWidth` measures visible cells with zero width for an empty string; `microAdvance`
retains the older cell-advance formula when preserving legacy layout. Default micro
drawing recognizes direct symbols such as `µ` before trying their uppercase forms.

### Palette and texture helpers

`drawing` and `kit/coverPaint` expose seeded tileable value noise, RGB mixing, smoothstep,
and clamping. `kit/palRamps` exports `Pal` and `wrap` for named palette ramps.

### Software rendering

`kit/quantize` chooses shared VGA palettes and ordered dithering for RGB frames.
`kit/sdftext` provides rounded stroke lettering, distance grids and extrusion; `kit/raytrace`
provides shapes, transforms, cameras and lighting. Consumers supply their own scenes.
The stroke glyphs, implementation provenance and method references are in NOTICE.md.

### Archives for downloads

`kit/tar` writes and reads POSIX ustar archives (`createTar`, `createTarGz`, `readTar`). Entries keep
their Unix mode, so a game folder's programs and scripts unpack executable, and names over 100
bytes use the header's prefix field. It has no dependencies and runs in Node and browsers
(`.tar.gz` uses the platform's `CompressionStream`).

### Native object builders

`kit/laserJoints` makes flat wooden-box panel outlines for the laser kits: finger (box) joints whose two sides mesh,
rectilinear outlines from rectangles, and mitered kerf offsets (`jointOutline`, `outlineFromRects`, `offsetPoly`).
`kit/laserLayout` has `Part` (one flat piece with named elements, kerf applied, spacing-checked with
`kit/laserClearance`) and `packRows`, which lays parts out on a Glowforge-bed sheet and throws if they do not fit.
Games' laser kits (`games/sleuth/laser/`) build on them with `kit/laserSvg`, `laserPixels` and `laserPreview`.

`embroidery/*` turns a vector design into machine-embroidery files. A `Design` is color blocks of items: `fill` (polygons), `satin` (a center line and a width) and `run`. `compile` sews each item with an underlay (an edge walk inside the shape, loose rows under big shapes, a center walk and zigzag under satin) and then its top stitching, and adds the jumps, trims, small tie stitches, color stops and an end, capping every stitch at 7 mm (`Params`: fill rows 0.4 mm apart with 3.5 mm stitches whose holes are staggered in thirds, satin 0.4 mm apart, 0.3 mm of pull compensation on satin and 0.15 mm on fills, a satin wider than 7 mm sewn as lanes). `fill` makes the tatami rows (a notched shape becomes several chains), `satin` the zigzag columns and their underlay, `strokeFont` a single-line capital alphabet that `arcText` bends around a circle for satin lettering (draw it 5 mm tall or more), and `geom` the outlines (`circle`, `star`, `inset`). `dst` (Tajima: a text header and 3-byte ternary records, a trim written as tiny jumps), `exp` (Melco, Bernina) and `pes` (Brother, Baby Lock: PES v1 written by hand, its PEC section with 7- and 12-bit moves, thread-chart indices and bitmaps) each write and read a `Pattern` (the readers are for checks). `units` turns a pattern into 0.1 mm moves and splits long jumps, `validate` reports stitch count, longest stitch, extents, jumps and color changes against a hoop, `simulate` draws the stitches thread by thread, and `svg` writes the design as a vector drawing in millimeters. None of it has been run on a real machine; sew a test on scrap first. `games/maximus/patch/` is the first design.

`kit/actors` builds character sequences and monster paths. `kit/screenText` validates
30-column, 16-line DOS text pages and looks up caller-supplied named sprites.

`kit/road3d` provides three-lane perspective geometry, timed spawner chains and sprite
shrinking. `kit/saveSlots` provides PLAYGAME's save-slot rectangles and their backgrounds.
These helpers take the consuming game's data and palette.

### Image preparation and previews

`kit/photo` reads a caller-supplied JPEG (`readScan`) and provides resampling, toning,
quantization, dithering and indexed photo composition. No photographs are included.
`kit/png` writes synchronous RGB preview PNGs with a checkerboard for transparent pixels
and builds block sheets. `kit/levelPicture` renders a level region with its placed monsters, and `kit/levelGrid` is a character grid to paint a level in code.
These Node build helpers complement the browser-safe `images` API.

### Sound and arrangement helpers

`audio` / `kit/synthParts` expose low-pass noise, envelopes, gates and filtering.
`kit/song` builds CMF arrangements from caller-supplied sections; `kit/songFx` adds native
CMF swells, arpeggios, glides, echoes and rhythm effects. Instrument presets are original
project data under the MIT License; recordings and complete songs are not included.

### Native animations and demos

`kit/fadeOut` adds palette-only FLI fades. `kit/fliClips` splits long animations at stable
palette boundaries and builds their slide-list entries; its opt-in `ClipOptions` leave out
the closing ring frame no player shows (`noLoopFrame`, also an `encodeFli` option) and put
cuts where a whole frame costs the fewest extra bytes (`cheapCuts`), and run `shrink` steps first.
`kit/fliShrink` is the size report (`fliReport`: bytes per chunk type per frame, and why) and the shrink
steps (`sparsePalettesStep` lossless; `holdStillStep`, `snapColorsStep`, `maxColorsStep`,
`flattenDitherStep`, `dropFramesStep` lossy), each returning the new frames, the bytes saved and how
visible the change is (`Visibility`: mean, worst, changed share); `decodeFli`/`encodeFrames` convert,
`shrinkFrames` chains steps. `kit/recordedDemo` turns delta/key
pairs into a native title demo with configurable Escape press and release delays.

### Shared block sets

`kit/shareBlocks` merges several scenes' background blocks into one `.BBL`: only the blocks a
map uses (and what they change into) are kept, matching blocks and rings become one, a pinned
number (such as a felt egg's) stays put, and each scene's map is renumbered.

### Look-alike blocks

`findLookAlikes` finds background blocks that are drawn the same colors under every palette a set
is shown with and play the same (it keeps what they turn into in step), and lists blocks that
share a shape in other colors without joining them: a scene has one palette. `applyFold` removes
the folded blocks and renumbers maps and links. Import from `@lewismoten/gamemaker-sandbox-tools/look-alike`.

### Versions as deltas

`diffVersions`, `applyDelta` and `deltaSize` keep a game's earlier versions like a git repository: a binary file
is a list of byte-range patches (one recolored block or map cell is a few bytes), a text file (lst, txt, json,
md...) a line patch, so each version costs only what changed. Lossless for any bytes. Import from
`@lewismoten/gamemaker-sandbox-tools/delta`.

### Color reduction

`reduceBlocks` moves the pixels of blocks that use colors outside their allowed set (a block type's reserved
range plus the colors nobody reserved) to the nearest allowed color, and scores the change in CIELAB delta E
(mean over changed pixels, worst pixel; a block is flagged above 6 mean or 20 worst, thresholds a guess). Index
0 and 255 never move. Import from `@lewismoten/gamemaker-sandbox-tools/color-reduce`.

### Palette reservations

`planRanges` proposes, for a game with no reservations, a range of color numbers for monsters and one for
characters (sized by the different colors their blocks draw, at most 48 each, starting at 16 because 1-15 look
like the engine's own interface colors, placed where the fewest other blocks already draw). `syncRange` makes a
reserved range identical in every palette a role's files are shown with: the role's colors move into the range
(pixels renumbered, palettes updated), and colors beyond the range's size become the nearest kept one, all scored
in delta E. Import from `@lewismoten/gamemaker-sandbox-tools/palette-reserve`.

### Joining block sets

`mergeBackgroundSets` moves one background set's drawn blocks into another's free slots (reusing an
identical block already there) and renumbers the moved set's maps; the kept set is not renumbered.
Pickups, required and starting items and block 0 keep their number or the join is refused.
Import from `@lewismoten/gamemaker-sandbox-tools/block-merge`.

### Meshes for 3D printing

`mesh/surfaceNets` turns a signed distance field (negative inside) into a closed triangle mesh
(`surfaceNets(field, { min, max, cell })`; it retries with a shifted grid until every edge is in exactly two
triangles), `mesh/stl` writes and reads binary STL (`writeStl`, `readStl`; a color per triangle goes in the
attribute bytes the VisCAM way, which slicers ignore) and `mesh/meshCheck` reports whether a mesh is closed,
how many pieces it has, its size and volume (`inspectMesh`). `mesh/tetraMesh` is the other mesher (four times
the triangles, but closed for any field, and neighbors meet on the same vertices); `mesh/overhang` measures what
an FDM printer cannot print (`overhang`) and builds the support pillars as a body of their own (`supportBody`);
`mesh/colorBodies` picks at most four colors from a colored mesh (`pickPalette`) and splits the solid into one
closed body per color (`colorBodies`, thinned and grown to the volume you give it); `mesh/decimate` takes the triangles a
closed mesh does not need out by quadric edge collapse (`decimate(mesh, { maxError })`: stays closed and in one piece, and the
borders between a triangle color and the next stay put); `mesh/sampledField` samples a field once on a grid and reads it back
by trilinear interpolation, for the many passes over one figure (`sampledField`); `mesh/threeMf` writes and reads multi-color 3MF files (`write3mf(parts,
title, codec)`, `read3mf`: parts are a mesh and a color), over the small ZIP writer `mesh/zipFile` (pass Node's
`deflateRawSync` as `codec.deflate` to compress). `mesh/voxel` meshes filled voxels (`voxelMesh`: coplanar faces merged into
rectangles, no T-junctions, so it stays closed) and `mesh/pixelFigure` turns a pixel sprite into a standee on a base with at
most four color bodies (`pixelFigure`). They are browser safe, except `mesh/trinketTool`.

Trinkets made of distance fields (Depth Perception's, Quest for the Round Tuit's) share one pipeline, all in millimeters
with the floor at z = 0: `mesh/sdfShapes` has the 2D shapes (circle, rounded rectangle, polygon, ring, capsule and
`pixelText2`, lettering in the 3x5 micro font), `extrude` and the solid combiners; `mesh/strokeText` (`strokeText2`, `ringText2`) letters raised or sunk text in smooth capsule strokes (capitals, digits, marks; use it instead of the stair-stepped `pixelText2` for anything printed); `mesh/figureShapes` has ellipsoids, round cones, a smooth union and `place3` for 3D figures; `mesh/trinketKinds` builds a `plate` (coin,
token, key-chain tag or badge: outline, raised rim, raised relief, sunk art, holes, a pin-back `pocket` from `pinBack`), a key-chain `ringTab`, a faceted `gem` (also a crystal shard) and a `die`; `mesh/fieldTrinket`
(`meshFieldTrinket`) meshes a field with a color per triangle and gives the checks (eroded pieces and specks, overhang),
up to four color bodies and supports; `mesh/trinketTool` (`runTrinketTool`, Node only) writes the STL, 3MF and manifest.json
of a game's trinkets, with a source key so an unchanged game is skipped, in worker threads when `--workers N` runs a bundle.
A game keeps its designs in `games/<id>/src/trinkets/` (`TRINKETS` and `makeTrinket`) and a four-line `tools/trinkets.ts`.
Surface nets need a cell smaller than half of any gap between pieces (a 0.6 mm kerf wants a 0.26 mm cell).

### Disk comparison

`diffDisks(a, b)` takes two `Map<name, bytes>` disks and returns the added, removed and changed files, with a plain-text
summary per changed file by type (`.gam`, `.pal`, blocks, `.map`, `.chr`, `.mon`, text, GIF, FLI, VOC, else bytes).
`formatDiff` prints it, sorted and the same every time. Import from
`@lewismoten/gamemaker-sandbox-tools/disk-diff`; `npm run disk:diff` in `web/` is the command line.
`releaseNotes(diff)` (`.../release-notes`) turns a diff into short paste-ready text grouped by kind of file, such as
"Changed 2 maps (A.MAP, B.MAP) and 1 palette (X.PAL). Added 1 sound (SONG3.VOC)."; `disk:diff -- --notes` prints it.

### Headless checking

`kit/hopBot` provides configurable hopping, steering and retry support for `GameSim`.
`kit/align` audits caller-supplied disks, multi-block layouts and pixel seams; finding the
games to audit and reporting the results belong to the consumer. `simulation` also exposes route scene
assertions and scene initialization that delegates to the engine. `GameSimState` names
the snapshot type; compatibility initialization preserves older block-birth bookkeeping.

### DOS disk output

`kit/disk` exports `Disk` for collecting 8.3-named files and writing a clean output
directory, plus the legacy `dosText` byte conversion. Destination and metadata are
caller-supplied. `kit/menuVersion` can stamp a supplied version on a native menu GIF;
this package reads no game metadata files and imposes no version policy.

`kit/palRamps` also exports `wrapWithBuilder` and `buildRampPalette`: supply ramp
descriptors, optional named endpoint replacements, and a color transform. The game
keeps its actual colors and lighting choices. `colors` and `text` are direct browser-safe
entries for the existing lighting, ramp, glyph-row, and rendered-text APIs.

`kit/textfit` audits caller-supplied native files for menu, save-slot, score-table and
text-page layout and contrast. Choosing which games to check, and printing the results, are left to the consumer.

## Original Library palette

`libraryDefaultPalette()` from `@lewismoten/gamemaker-sandbox-tools/palettes` returns
an independent 768-byte copy of the CD Library's `DEFAULT.PAL`, with black at index
zero. This is the original RSD palette, rather than the engine's generated fallback.
It works in browsers and Node without fetching the CD or using repository files.
See `NOTICE.md` for its source and license.

### Palette templates

`PALETTE_PRESETS` from `palettes` lists 20 ready-made templates with names, descriptions,
occupied entry counts and DOS-safe filename stems. `createPalettePreset(id)` returns a fresh
768-byte VGA palette with menu black at index 0, transparency reserved at 255, and unused
entries black. Templates include monochrome, Atari NTSC/PAL, NES, CGA, EGA, EGA with skin/hair
ramps, LCD greens, Sega Master System, Commodore 64, web-safe colors and grayscale steps.
128-step grayscale necessarily repeats VGA's 64 distinct gray shades. LCD greens include
four green shades plus menu black. Console RGB references and their licenses are in NOTICE.md;
all values are adapted to six-bit VGA and do not impose the original consoles' drawing limits.

## Developing

This package's source lives in [the project's repository](https://github.com/lewismoten/GameMaker-SandboxEdition), in `web/packages/tools`. The folder holds its builders in `src/`, build configuration, license and notices. Shared codecs and runtime types come through declared engine and archives dependencies, and it never reads source from another repository folder. After `npm install` in a standalone copy, or `npm ci` at the repository root:

```sh
npm run build
npm run verify
npm pack
```

The build bundles source from the format, drawing, audio, and simulation modules. It does not use or restart the site's Vite configuration. The tarball contains JavaScript, declarations, this guide, the MIT license, and notices. From the repository root, `npm run verify:packages` copies each package outside the repository, builds it with packed declared dependencies, and tests its npm distribution, which also supports unpublished sibling versions.

`verify` installs the tarball in a temporary npm consumer and checks codecs, drawing, sound generation, headless simulation, NodeNext declarations, absence of game content, and rejected browser imports. Tarballs are local build artifacts and must not be committed to a consuming project. The [monorepo guide](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/docs/monorepo.md) covers the workspace layout, and the [package release guide](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/docs/package-releases.md) covers publishing.

## License and notices

The source is MIT licensed. The published package carries `LICENSE` and `NOTICE.md` (credits for third-party code and formats); it includes no game assets.
