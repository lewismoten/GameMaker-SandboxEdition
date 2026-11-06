# Repository scripts

`npm run merge:gate -- feature/name [feature/other ...] [--games id,id] [--push]`
fetches origin and builds a detached candidate in the main clone's
`.claude/worktrees/merge`, outside the invoking checkout. The existing integration
worktree must be clean and detached; a concurrent gate is rejected by an exclusive
directory lock. A failed candidate and its logs remain for inspection. After an
interrupted process, inspect the worktree before manually removing `merge.gate-lock`.
No server is started and no running server is contacted.

The gate pins develop and every branch SHA, merges in argument order, aborts code,
binary and modify/delete conflicts, and permits text union only for `.md`, `.json`,
`.csv`, and `.txt`. JSON unions must parse; this does not validate schemas or CSV
meaning, so review these resolutions. It never takes an entire generated file from
one side. It builds SDK declarations, force-rebuilds disks before tests, optionally
regenerates the requested Level Maps and commits only `levelViews.json`, then pins
the final candidate commit and tree. Typecheck, lint and full Vitest follow, then
each requested game's `checkGames --quick`. Builds, scans, Vitest and game checks use
the shared heavy scheduler; invoke the gate directly, without wrapping it in another
heavy slot. Provision dependencies in the integration worktree first
(for example with the bootstrap command below); builds reject symlinked disks.

Without `--push` this validates only. With it, the gate requires remote develop to
still match its starting SHA, a clean candidate, and unchanged HEAD, then pushes the
exact tested commit to develop with a normal fast-forward push. It never touches
master. If develop advances, rerun the whole gate. Checks may not edit tracked inputs.
The printed JSON and a private temporary directory (printed as `output`) contain
`result.json`, per-command logs, pinned revisions/tree, durations, test fingerprints,
exceptions used, and publication status. Exit codes: **0** pass (possibly with exact
exceptions), **2** usage/setup/policy, **3** merge/conflict, **4** build/check/candidate
drift, **5** publication or remote drift. Missing reports, signals, test collection
errors, interruption and unhandled errors block publication.

`merge-gate-allowlist.json` replaces handoff prose. It currently allows **nothing**:
the two previously named Integrator cases passed on revision
`1a172cad7c9d286614101c6225f98265654f4726` with the local disks on November 6, 2026.
Stale Level Maps disks are rebuilt, never waived. Any unresolved failure must first
be reproduced; add an entry with exact web-relative `file`, Vitest `test` fullName,
`owner`, `issue` link or local tracking ID, `firstSeenRevision` (40 hex characters),
`fingerprint` (SHA-256 from the gate result), and `expires` (UTC date, exclusive).
Failure fingerprints include assertion messages but remove ANSI and stack locations.
Changed messages, extra failures, duplicate entries and expired entries block.
Policy is read from the invoking checkout before candidate merges and checked again
after tests. `gate-vitest-reporter.mjs` records completion and unhandled errors alongside
Vitest JSON, whose reporter omits those fields. No test or budget is automatically weakened.

`npm run worker:bootstrap -- feature/name <new-path>` fetches origin, creates a
feature worktree at that exact develop revision, copies private disks and walkthrough
paths from the main checkout, then runs `npm ci` in a heavy slot. On macOS it uses
`cp -cR` for APFS clones; Linux uses `cp --reflink=auto -R` (private copies when reflinks
are unavailable). There is no symlink fallback, and any source/output symlink or
preexisting destination output blocks setup. `npm ci` builds SDKs in dependency order
and refreshes generated disks; copied timestamps alone are not proof of freshness.
Failure leaves the partial worktree for inspection, never deletes it automatically.

`npm run worker:bootstrap -- --doctor` prints capabilities without creating a
worktree or installing dependencies. Both modes report the actual shared heavy-lock
write probe, PlatformIO executable and directory access, bounded HTTPS reachability
to npm/PlatformIO registries, and serial paths with access bits. This does not open
devices, acquire PlatformIO's lock, or flash hardware. Those capabilities remain
explicitly unverified; unavailable operations belong in an authorized host job.
Heavy-lock failure blocks bootstrap; never set a per-worker lock directory to bypass
the shared limit. The report includes what the worker can do and remaining limits.

`npm run branches:triage` reports cached unmerged `origin/feature/*`: tip age in days,
SHA, ahead/behind develop, last author (not assumed task ownership), patch-equivalent
or identical-tree work already on develop, merge-tree conflicts and worktree state,
including dirty, locked and prunable worktrees. Fetch beforehand for a current remote
inventory. Merged ancestors are omitted. `merge-tree --write-tree` uses temporary
object storage, leaving repository refs, index and objects unchanged. Errors are
reported as unknown, never clean. It never deletes branches. Use `npm run already --
<task words>` before briefing; task records supply ownership and supersession intent.

Workflow tests: `web/test/mergeGate.test.mjs`, `gateFailures.test.mjs`,
`branchTriage.test.mjs`, and `workerDisks.test.mjs`. They use disposable local Git
remotes and real merge/push mechanics; costly checks are stubbed. They never publish
to a network remote or touch the maintainer's refs or servers. Git-backed tests inherit
the host's signing policy; if sandbox restrictions block its signing agent, report that
capability failure and run them on an authorized host rather than disabling signing.

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
The [headless PLAYGAME capture harness](../tools/dosbox-286/README.md) records WAV
and raw OPL audio under DOSBox-X's 286 instruction model at fixed cycles; it needs
no display or manual input.

[`player-diff/`](player-diff/README.md) (Python, `uv run scripts/player-diff/gmpdiff.py all`)
is research tooling, not part of a build. It inventories historical Game-Maker players,
compares their machine code and writes [small text reports](../docs/analysis/player-diff/README.md).
Optional archive inputs must be supplied explicitly; local source hierarchies and binaries
are not published.

`backup-local.mjs` (`npm run backup:local -- <folder>` and
`npm run backup:restore -- <file> <folder>`) makes an AES-256-GCM encrypted archive of
local working data. The passphrase comes from `BACKUP_PASSPHRASE` or a prompt.
Restore into an empty folder for a drill; inspect the script's input list before use.

`already.mjs` (`npm run already -- <words...>`) searches commit history, tracked files
and optional local research notes for earlier work. Results rank by matching words and
date. Tests: `web/test/already.test.mjs`.

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
