# @lewismoten/gamemaker-sandbox-tools

Development-only tools for creating and checking native RSD Game-Maker data. Browser playback belongs to `@lewismoten/gamemaker-sandbox-engine`; this package has no game artwork, recordings, characters, or palettes.

Requires Node.js 22.12 or newer. Install with `npm install --save-dev @lewismoten/gamemaker-sandbox-tools` once published. Until publication, `npm pack` produces a self-contained installation candidate.

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

Keep these imports in build scripts and tests. The package explicitly rejects browser imports. Generated game data and your own copied assets belong in the consuming project.

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

From this directory, with the repository's web development dependencies installed:

```sh
npm run build
npm run verify
npm pack
```

The build bundles source from the format, drawing, audio, and simulation modules. It does not use or restart the site's Vite configuration. The tarball contains JavaScript, declarations, this guide, the MIT license, and notices. Validate a packed installation in a separate project before publishing.

`verify` installs the tarball in a temporary npm consumer and checks codecs, drawing, sound generation, headless simulation, NodeNext declarations, absence of game content, and rejected browser imports. After reviewing the candidate, publish with `npm publish --access public`; publishing is a separate action.

## Tagged releases

The [release workflow](../../../.github/workflows/publish-tools.yml) publishes to the public npm registry when a `tools-v<version>` tag is pushed. The tag must match this package's version and point to a commit on `master`. For this release, use `tools-v3.1.0` after merging the package changes.

Configure the repository's `NPM_TOKEN` Actions secret with an npm publishing token authorized for `@lewismoten/gamemaker-sandbox-tools` (including automated publishing with 2FA). The workflow checks source, builds and verifies the packed package, then publishes with provenance. Ordinary branch pushes do not publish anything. See npm's [publishing documentation](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/).

Tarballs are local build artifacts and must not be committed to a consuming project. Consumers should use `npm install --save-dev @lewismoten/gamemaker-sandbox-tools@^3.1.0` after the tagged release is published.
