# @lewismoten/gamemaker-sandbox-archives

Discover and unpack Game-Maker games in browsers or Node.js 22.12+. This runtime package works alongside the engine; it does not depend on the development tools.

```sh
npm install @lewismoten/gamemaker-sandbox-archives
```

Install through your configured npm registry; configure authentication according to that registry's instructions.

```ts
import { unpackGame } from '@lewismoten/gamemaker-sandbox-archives';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine';

const response = await fetch('/stripe-chase.zip');
if (!response.ok) throw new Error('Could not download the game');
const game = await unpackGame(await response.arrayBuffer());
const files = new GameFiles(game.entries);
// Supply files and game.gam to Machine/runGame from the engine package.
```

Supported inputs:

- File/directory selections (`File[]` preserves `webkitRelativePath`), or portable `ScanFile[]` records with `path`, `size`, and async `read`.
- ZIPs, ZIPs inside ZIPs, and ZIP-based self-extracting DOS EXEs, including EXEs inside ZIPs. Both ZIP-relative and file-relative SFX offsets are supported.
- Raw or gzip-compressed GMPK game packs (`.gmpak`).

Executables are inspected as data and never run. Ordinary executables are not archive formats. Customized Game-Maker player EXEs can restore renamed game-file extensions; recovered settings are returned in `player`. Archives with several games use `unpackGames`; `unpackGame` requires exactly one. Low-level discovery (`scanImport`, `GameReader`, `scanFile`) exposes selection, progress, leftovers, and malformed archive reports using the same importer as the main application.

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

const given = Array.from(input.files ?? [], (file) => scanFile(file));
const report = await scanImport(given, {
  signal: controller.signal,
  zipLimits: { maxEntries: 8192, maxBytes: 128 << 20 },
  onProgress: (done, total, path) => showProgress(done, total, path),
});
showGames(report.games); // Let the user choose a FoundGame.
showSummary(scanSummary(report));

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

const bytes = await createZip([
  { name: 'GAME/DEMO.GAM', data: gameBytes },
  { name: 'GAME/README.TXT', data: new TextEncoder().encode('How to play…') },
], new Date(2000, 0, 1, 12));
// A fixed date and stable entry order make repeatable distribution builds.
const entries = await readZip(bytes);
const listing = listZip(bytes); // lazy entry.read()
```

ZIP creation uses deflate when available and smaller; otherwise it stores entries. It shares the reader's CRC code and adds no dependency. Consumers that only import unpacking can tree-shake the writer. Entry data is returned in memory; this package writes nothing to the filesystem. For the existing streaming game-pack format, `/pack` exports `encodePack`, `decodePack`, and `PackReader`.

## Development

With the repository's web dependencies installed, run `npm run build`, `npm run verify`, or `npm pack` here. The build is independent of the site's Vite configuration. The distribution includes JavaScript, TypeScript declarations, LICENSE, and NOTICE.md; no game assets. Keep npm tarballs outside source control. Repository publication is described in the [package release guide](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/docs/package-releases.md).
