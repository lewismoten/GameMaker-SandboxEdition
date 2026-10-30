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

## Build and inspect

From this directory, with the repository's web development dependencies installed:

```sh
npm run build
npm run verify
npm pack
```

The build bundles source from the format, drawing, audio, and simulation modules. It does not use or restart the site's Vite configuration. The tarball contains JavaScript, declarations, this guide, the MIT license, and notices. Validate a packed installation in a separate project before publishing.

`verify` installs the tarball in a temporary npm consumer and checks codecs, drawing, sound generation, headless simulation, NodeNext declarations, absence of game content, and rejected browser imports. After reviewing the candidate, publish with `npm publish --access public`; publishing is a separate action.
