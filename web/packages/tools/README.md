# @lewismoten/gamemaker-sandbox-tools

Tools for creating and checking native RSD Game-Maker data. Browser playback belongs to `@lewismoten/gamemaker-sandbox-engine`; this package has no game artwork, recordings, characters, or palettes.

Requires Node.js 22.12 or newer. Install as a development dependency from your configured npm registry:

```sh
npm install --save-dev @lewismoten/gamemaker-sandbox-tools
```

If your registry requires authentication or a scope mapping, configure npm using that registry's instructions.

## APIs

- `formats/blocks`, `character`, `game`, `map`, `monster`, `palette`, `gif`, `graphicScripts`, `sound`, `fli`, `fliLimits`, `voc`, `recording`, and `cmf`: native readers, writers, types, and limits. Each is a separate `formats/<name>` subpath.
- `drawing`: indexed pixels, VGA palette builders, font drawing, shading, compositing, and cartoon reels.
- `audio`: original FM instrument presets, CMF composition, PC speaker effects, and VOC synthesis.
- `images`: indexed PNG encoding and CRC-32.
- `simulation`: headless `Sim`, `GameSim`, `readDisk`, `diskSim`, and `newCharInfo` for fixture checks. This includes the reference simulation; it does not replace testing the browser engine package.

```ts
import { emptyBlock, serializeBlocks } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';

const blocks = Array.from({ length: 150 }, (_, i) => emptyBlock(i));
blocks[0].pixels.set(new Pixels(20, 20, 1).px);
const data = serializeBlocks(blocks);
```

Keep drawing and simulation imports in Node build scripts and tests; those entry points reject browser imports. Browser-safe `audio`, `images`, `music/compose` and `image/png` entry points also support the web editor. Playback through the engine and archives packages does not load this toolkit. Generated game data and your own copied assets belong in the consuming project.

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

`colorRamp` returns eight-bit RGB stops without allocating palette entries. `PaletteBuilder.ramp` allocates named ramps in a six-bit VGA palette. `TIME_OF_DAY_LIGHT`, `TIME_OF_DAY_SKY`, and `lightColor` provide morning, noon, afternoon, sunset, night, and stage-light presets. `adjustPalette` returns an adjusted native VGA palette without mutating its input. By default it preserves indexes 0 and 255; pass a custom index list to protect glowing colors or designer inks. Game-specific ramp names and cast colors belong in the consumer.

## Build and inspect

This folder owns its builders in `src/`, build configuration, license and notices. Shared codecs and runtime types come through declared engine and archives dependencies. It never reads source from another repository folder. After `npm install` in a standalone copy, or root `npm ci` in the monorepo:

```sh
npm run build
npm run verify
npm pack
```

The build bundles source from the format, drawing, audio, and simulation modules. It does not use or restart the site's Vite configuration. The tarball contains JavaScript, declarations, this guide, the MIT license, and notices. Root `npm run verify:packages` copies each package outside the repository, builds it with packed declared dependencies, and tests its npm distribution. This also supports unpublished sibling versions.

`verify` installs the tarball in a temporary npm consumer and checks codecs, drawing, sound generation, headless simulation, NodeNext declarations, absence of game content, and rejected browser imports. Repository automation is documented in the [package release guide](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/docs/package-releases.md).

Tarballs are local build artifacts and must not be committed to a consuming project.

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

### Native object builders

`kit/actors` builds character sequences and monster paths. `kit/screenText` validates
30-column, 16-line DOS text pages and looks up caller-supplied named sprites.
