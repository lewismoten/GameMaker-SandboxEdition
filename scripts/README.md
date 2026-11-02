# Repository scripts

`verify-packages.mjs` runs through root `npm run verify:packages`. It copies each SDK
workspace outside the monorepo, installs declared development dependencies plus locally
packed SDK dependencies, and invokes that package's own build and packed-consumer tests.
A final consumer exercises engine, archives and tools together. Run this longer verification locally before a package release. GitHub workflows have five-minute job limits and run only the fast Vitest selection; they do not run this isolated-consumer check. Temporary source copies
and tarballs are removed afterwards. This catches hidden repository source dependencies
that testing a package inside the workspace would miss.

`build-games.mjs` rebuilds the ignored game outputs (root `npm run build:games`), caching a key and an
output hash per game, written as each game lands so a build stopped partway keeps what it finished (CI
caches these outputs between runs; `prune-render-cache.mjs` keeps only the current Depth frames there). `--timing` (or `GM_BUILD_TIMING=1`) prints each game's seconds, `--game <id>` builds
only that game (repeatable), `GM_BUILD_JOBS=n` sets the workers (two by default, every core when `CI` is
set). `game-import-keys.mjs` makes the keys: the files a game's `build.ts` really imports (an esbuild
metafile), its own folder, the data files in `games/kit` and the packages, the stock player and the
lockfile, so editing a page under `web/src` that no game imports rebuilds nothing.
`logo-build-entry.mjs` renders the Sand logo sting (about 7 s of ray tracing, the same in 17 games) once per run into the render cache; `build-games.mjs` hands the file to each game as `SANDLOGO_FLI`, keyed by the files `sandlogo.ts` imports.
`game-bundle.mjs` bundles a build entry (each game's `build.ts`, the Depth frame shards, the logo) with esbuild so `build-games.mjs` runs the child under plain `node`, not vite-node (about 16% less CPU, no 1.7 s startup per child); `GM_VITE_NODE=1` or any bundle failure runs vite-node as before.
`game-build-entry.mjs` runs one `build.ts` and exits at once (vite-node sometimes lingered after a finished
build until the 240 s timeout killed it). `game-build-inputs.mjs` is the fingerprint shared with
`render-game-frames.mjs`, which renders one animation shard for the game-frames workflow.

Site build-time tools remain in [`web/scripts`](../web/scripts/README.md).

`backup-local.mjs` (root `npm run backup:local -- <folder>`, `npm run backup:restore -- <file> <folder>`)
backs up the work Git doesn't keep: `.for-lewis`, `.narrate`'s results (not its `node_modules` or
models), `dosbox-saves`, `.claude/agents` and Claude's memory folder, into one dated archive encrypted
with AES-256-GCM (passphrase from `BACKUP_PASSPHRASE`, or asked). Restore into an empty folder for a drill.
