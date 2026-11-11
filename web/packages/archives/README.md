# @lewismoten/gamemaker-sandbox-archives

Version **3.2.1**. Discover and unpack Game-Maker games in modern browsers or Node.js
**22.12+**, using ES modules with TypeScript declarations. The only runtime npm dependency
is `@lewismoten/gamemaker-sandbox-engine` **^3.2.0**. Compressed inputs use
`DecompressionStream` (including `deflate-raw` for ZIP and `gzip` for compressed packs);
ZIP writing uses `CompressionStream` when available and otherwise stores bytes.

```sh
npm install @lewismoten/gamemaker-sandbox-archives
```

Install through your configured npm registry; configure authentication according to that registry's instructions.

```ts
import { unpackGame } from '@lewismoten/gamemaker-sandbox-archives';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine';

const response = await fetch('/game.zip');
if (!response.ok) throw new Error('Could not download the game');
const game = await unpackGame(await response.arrayBuffer());
const files = new GameFiles(game.entries);
// Supply files and game.gam to Machine/runGame from the engine package.
```

Supported inputs:

- File/directory selections (`File[]` preserves `webkitRelativePath`), or portable `ScanFile[]` records with `path`, `size`, and async `read`.
- ZIPs, ZIPs inside ZIPs, and ZIP-based self-extracting DOS EXEs, including EXEs inside ZIPs. Both ZIP-relative and file-relative SFX offsets are supported.
- Raw or gzip-compressed GMPK game packs (`.gmpak`).

Executables are inspected as data and never run. Ordinary executables are not archive formats. A supplied Game-Maker player EXE is identified by build (1.0, 1.04, 2.00, 2.02, 2.04 or 3.00: size and MD5, then its About text's version line, with a confidence and reasons). A customized one can restore renamed game-file extensions; its settings (read at each build's own offsets) are returned in `player`, and its other changed bytes in `player.origin.regions` (128-byte blocks, a buyer's owner field never kept), which `applyPlayerPatches` writes back into a 3.00 player. Archives with several games use `unpackGames`; `unpackGame` requires exactly one. Low-level discovery (`scanImport`, `GameReader`, `scanFile`) exposes selection, progress, leftovers, and malformed archive reports using the same importer as the main application.

`UnpackedGame.entries` is a portable tuple array, avoiding a dependency on the engine's class identity. ZIPs are searched up to the importer's existing three archive levels. `maxEntries` (8192) and `maxBytes` (128 MiB) bound each archive and the returned game; `signal` supports cancellation between reads. ZIP64, encrypted ZIPs, and compression methods other than stored/deflate are not supported. HTML game exports are not archive inputs.

## Scan and choose games before reading their files

The full import scanner is included, both at the package root and through `/scan`. It
finds games in folder selections and nested ZIP/SFX archives, reports damaged or empty
archives, identifies incomplete leftovers, and recognizes customized DOS player files.
Scanning reads game headers and archive directories; `GameReader` then reads the chosen
game's files. This lets an application offer a choice when an archive contains several games.

```ts
import { scanFile, scanImport, scanSummary, GameReader, type FoundGame }
  from '@lewismoten/gamemaker-sandbox-archives/scan';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine';

const input = document.querySelector<HTMLInputElement>('#files')!;
const given = Array.from(input.files ?? [], (file) => scanFile(file));
const report = await scanImport(given, {
  zipLimits: { maxEntries: 8192, maxBytes: 128 << 20 },
});
console.log(scanSummary(report));
// Present report.games to the user, then pass a FoundGame to openChosenGame.

const reader = new GameReader(given, { maxEntries: 8192, maxBytes: 128 << 20 });
async function openChosenGame(choice: FoundGame) {
  const game = await reader.read(choice);
  return new GameFiles(game.files.entries());
}
```

`report.games` holds the choices; `badZips`, `emptyZips`, and `loose` explain the rest.
`GameReader.file` reads just one chosen resource and `mainGam` identifies a game's entry
point. `scanFile` adapts browser files, while `ScanFile` records work with any asynchronous
file source. `/scan` also exports `groupGames`, `playedBy`, `PLAYER_EXE`, `gameFromFiles`,
and their report types. The higher-level `unpackGame` and `unpackGames` APIs use this same
scanner and also perform customized-player recovery.

## ZIP reading and writing

```ts
import { createZip, readZip, listZip } from '@lewismoten/gamemaker-sandbox-archives/zip';

const gameBytes = new Uint8Array([71, 77]); // stand-in for a real .GAM file's bytes
const bytes = await createZip(
  [
    { name: 'GAME/DEMO.GAM', data: gameBytes },
    { name: 'GAME/README.TXT', data: new TextEncoder().encode('How to play') },
  ],
  new Date(2000, 0, 1, 12), // a fixed date and stable entry order make repeatable distribution builds
);
const entries = await readZip(bytes);
const listing = listZip(bytes); // lazy entry.read()
console.log(entries.map((e) => `${e.name} ${e.data.length}`).join(', '), listing.length);
// prints: GAME/DEMO.GAM 2, GAME/README.TXT 11 2
```

ZIP creation uses deflate when available and smaller; otherwise it stores entries. It shares the reader's CRC code and adds no dependency. Consumers that only import unpacking can tree-shake the writer. Entry data is returned in memory; this package writes nothing to the filesystem. `/zip` (also `/project/zip`) exports `DEFAULT_ZIP_LIMITS`: **8192 entries, 256 MiB**
unpacked. `listZip(bytes, limits?)` and `readZip(bytes, limits?)` use it when limits are
omitted. Directory totals are checked before reading; inflation is capped at each entry's
declared size. These differ from `unpackGame`/`unpackGames` defaults of **128 MiB**.
`DEFAULT_ZIP_LIMITS` is not re-exported at the package root. `createZip` has no limits option.

## Game packs

`/pack` exports `encodePack`, `decodePack`, and incremental `PackReader`. These consume
or produce raw GMPK bytes; handle gzip separately, or use root `unpackGame` for imports.

```ts
import { encodePack, decodePack, PackReader } from '@lewismoten/gamemaker-sandbox-archives/pack';

const pack = encodePack([['README.TXT', new TextEncoder().encode('How to play')]]);
const entries = decodePack(pack);
const reader = new PackReader();
const streamedEntries = reader.push(pack); // push uncompressed chunks as they arrive
console.log(entries.length, streamedEntries.length, reader.done);
```

## Subpath exports

`zip` (above), `pack` and `scan` are the main entry points. `project/zip`, `project/gamePack` and `project/importScan` are the same modules under their source names. The other subpaths are:

- `project/importPlayer`: `adoptPlayer`, player build identification, settings and preservation types/data.
- `project/importLeftovers`: `markZipLeftovers` for scan reports.
- `project/extensionNames`: `swapExtension`, `rewriteNames` for renamed DOS resources.
- `player/applyPatches`: `applyPlayerPatches`, `readPlayerPatches`, `STOCK_PLAYER_MD5` and preservation helpers.
- `player/md5`: `md5Hex`.

See the [public source modules](https://github.com/lewismoten/GameMaker-SandboxEdition/tree/master/web/packages/archives/src) for signatures.

## License and notices

The source is MIT licensed. The published package carries [LICENSE](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/web/packages/archives/LICENSE) and [NOTICE.md](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/web/packages/archives/NOTICE.md) (credits for third-party code and formats); it includes no game assets.

## Developing

Source is in [web/packages/archives](https://github.com/lewismoten/GameMaker-SandboxEdition/tree/master/web/packages/archives/src).
In the package folder, run `npm run build`, `npm run verify` or `npm pack`.
Standalone builds use only package-owned source and declared dependencies. Repository
development uses root `npm ci`; root `npm run verify:packages` supplies packed sibling
dependencies for isolated builds and consumer checks. The tarball includes JavaScript,
declarations, README, changelog, license and notices. See the
[monorepo guide](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/docs/monorepo.md)
and [release guide](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/docs/package-releases.md).
