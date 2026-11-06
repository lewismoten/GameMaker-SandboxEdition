# Repository scripts

`verify-changed.mjs` runs through `npm run verify:changed` (root or `web/`): the quick pre-merge check of only what the branch touched against `origin/develop` (or `--base <ref>`). `npm run verify` is the full check.

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
`build-games.mjs` also runs `games/kit/pixelTrinkets.ts` (after the games, about 0.6 s, 60 ms when nothing changed; `GM_SKIP_PIXEL_TRINKETS=1` skips it) for the 3D-printable pixel figures in `web/public/trinkets/<game>/`, each game keyed by its figures and the mesh code.
`GM_SKIP_FIELD_TRINKETS=1` likewise skips the plastic trinkets that Depth, Realm and the other field-trinket games mesh beside their builds, and `GM_SKIP_LASER_NICKELS=1` the laser nickels. The Mac, Windows and Linux download jobs set all three, since they need only the game disks.
`logo-build-entry.mjs` renders the Sand logo sting (about 7 s of ray tracing, the same in 17 games) once per run into the render cache; `build-games.mjs` hands the file to each game as `SANDLOGO_FLI`, keyed by the files `sandlogo.ts` imports.
`game-bundle.mjs` bundles a build entry (each game's `build.ts`, the Depth frame shards, the logo) with esbuild so `build-games.mjs` runs the child under plain `node`, not vite-node (about 16% less CPU, no 1.7 s startup per child); `GM_VITE_NODE=1` or any bundle failure runs vite-node as before.
`game-build-entry.mjs` runs one `build.ts` and exits at once (vite-node sometimes lingered after a finished
build until the 240 s timeout killed it). `game-build-inputs.mjs` is the fingerprint shared with
`render-game-frames.mjs`, which renders one animation shard for the game-frames workflow.
`child-signal-retry.mjs` retries a signaled child once, logging its stage, signal, `killed` flag and
elapsed time. Each attempt still has the 240 s deadline. Extra stages may retry a timeout; disks
retain their existing early-signal-only rule (at most 230 s), and shared logo/frame renders keep their
no-retry behavior. Numeric failures keep the bundle-to-vite-node
fallback and still fail if that fails. `killed` records an API kill, not proof of the signal's sender.
After a terminal concurrent failure, no new queued games start; active children are joined and successful
games keep their incremental cache entries before the parent fails. Tests: `web/test/buildGames.test.mjs`
(real readiness-gated external SIGTERM, tiny payloads) and `web/test/childSignalRetry.test.mjs`
(fake elapsed-time boundaries and a native timeout). `heavy.mjs` gates admission only; it has no build-duration timeout.

Site build-time tools remain in [`web/scripts`](../web/scripts/README.md).

`backup-local.mjs` (root `npm run backup:local -- <folder>`, `npm run backup:restore -- <file> <folder>`)
backs up the work Git doesn't keep: `.for-lewis`, `.narrate`'s results (not its `node_modules` or
models), `dosbox-saves`, `.claude/agents` and Claude's memory folder, into one dated archive encrypted
with AES-256-GCM (passphrase from `BACKUP_PASSPHRASE`, or asked). Restore into an empty folder for a drill.

`already.mjs` (`npm run already -- <words...>`, root) answers "is this already done?" before a brief: for the words given it prints the 10 best matches, with dates, among origin/develop's commits (`git log -i --grep` per word), tracked files (`git grep`, not `code/`, `cd/` or `runtime/`) and `.for-lewis/research/**/*.md` (path, title, headings; found here or in the main checkout). More of your words matched ranks higher, then the newer date. Tests: `web/test/already.test.mjs`.

`heavy.mjs` (`npm run heavy -- <command...>`, root or `web/`) runs a heavy job (a build, full vitest,
`verify:perf`, `check:games`, a walkthrough recording) in one of 2 shared slots, so agents on one Mac don't
run them all at once. Slots are lock files in `~/.cache/gamemaker-heavy/` (outside any worktree) holding the
holder's pid; a dead holder's slot is freed. It waits while the 1-minute load average is over
`HEAVY_MAX_LOAD` (default 20), passes the command's exit code through, frees the slot on exit or signal and
appends start, wait, duration, exit code, cwd and command to `log.tsv` there. Env: `HEAVY_DIR`,
`HEAVY_SLOTS`, `HEAVY_MAX_LOAD`, `HEAVY_POLL_MS`. Tests: `web/test/agentGuards.test.mjs`.

`hooks/` holds Claude Code `PreToolUse` hooks for the Bash tool (they read the call's JSON on stdin and exit
2 with a reason on stderr to block; a parse error allows). Wire them in `.claude/settings.json`
`hooks.PreToolUse`. `noMainCheckoutMerge.mjs` blocks `git merge`, `git pull` and `git rebase` in the main
checkout while something listens on 5173. `noSymlinkedDiskBuild.mjs` blocks game builds while any
`games/*/disk` is a symlink. `commitTrailer.mjs` blocks `git commit -m` with no `Co-Authored-By: Claude` line.
