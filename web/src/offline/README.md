# `offline/`: working without a network

Part of the [source map](../README.md). Play offline and the desk's OFFLINE.EXE prepare
an explicit offline copy. Ordinary browsing still caches what the visitor opens.
Nothing starts a bulk download until the visitor chooses Download (Y on the desk).

- `tiers.ts`: manifest file metadata and the nine independent tier boundaries. Core always
  includes the application code, editor, desk, catalogs, lessons, previews and narration
  metadata. Starters, Sandbox, Specials, Bizarre and CD independently add their catalog group’s public packs
  and compressed walkthroughs. CD holds the original CD gameware and shareware. Shared ZIP
  blobs (including Starter kit files) stay with their sole consuming group, or Core when
  several public groups need them. Specials holds the limited-time games marked `series: "special"`.
  Feelies & library adds craft files and library resources. Spoken tour & phone adds the
  recordings and tour effects. Hardware & native exports adds firmware, installer files
  and native players. In-game sound stays with its game pack. Videos need the internet.
- `offlineCopy.ts`: reads the production inventory, resolves the selected tiers and
  already-revealed games, checks actual cached bodies and storage estimates, and prepares
  or removes the copy. The default first selection is Core; subsequent visits use the
  last requested selection (an old Games choice expands to all five game groups; an old Sandbox choice expands to Sandbox and Specials), so a closed tab can resume an unfinished choice. Removing an optional tier prepares a smaller replacement while
  retaining Core. Saved selections and committed pointers carry a tier-schema version so
  migrated Sandbox selections can later drop Specials independently. Browser storage estimates are advisory, with 10% headroom required.
- `archiveStore.ts`: status checks snapshot each eligible cache with one keys/matchAll pair,
  then verify selected files with 32 workers, sharing results across reuse, committed and
  staged checks within that call. Default committed matching still honors Vary and query
  strings; reuse still ignores both. Downloads use four workers, checking both stored length and
  SHA-256 before accepting a file. A version/selection-specific staging cache retains
  verified responses after interruption, quota failure or cancellation. Retries check its
  bodies again. Unchanged files are reused from committed copies, previous staging or
  ordinary browsing only after matching the new manifest's hash. Changed files use
  `cache: no-store`, which the worker passes directly to the network. The old ZIP is never
  requested. The filename remains for continuity with the earlier implementation.
- `availability.ts`: checks actual committed and browsing cache entries when offline;
  absent game packs/actions say “Not in your offline copy.” Local imported projects remain
  usable. The worker also sends a missing-content notice when both cache and network fail.
  Phone captions remain readable without substituting browser speech for missing recordings;
  the written tour remains available without its spoken tier.
- `offlineDialog.ts`, `offline.css`: today's web tier picker with bytes still needed,
  space required for safe replacement, verified-file progress, cancellation and removal.
  Saved tier choices appear before cached bodies are checked; controls stay disabled and
  readiness and byte estimates wait for full verification.
  Wide, short screens show the tier list in two columns without removing names or sizes.
- `offlineExe.ts`: the same operation in the desk's text UI. Keys 1–8 toggle optional
  tiers, Y saves the selection, R removes the prepared copy and Esc stops/quits.
- `loadFailure.ts`, `replay.ts`, `updateState.ts`: load notices, archive replay detection,
  and the explicit Reload handshake for a waiting worker.

The production build uses `scripts/offlineManifest.ts` from `vite.config.ts` to emit
`offline.json`: version, shell, and files with `path`, exact `stored` bytes, estimated
compressed `wire` bytes, `sha256`, and `tier`. It excludes crawlers, link previews, capture
pages, legacy ZIP aliases and unrevealed games. Shared blobs needed only by private games
are excluded too. Per-game inventories at gated paths are read only for entries the
browser has already revealed, using the existing catalog gate. Public manifests never
name or advertise those extras. `archive.json` retains its separate capture format.

A scoped Web Lock serializes installations/removal across tabs. After all selected files
are verified, the stage stores the public inventory and one Cache.put publishes its pointer
and selection atomically. Until that write the worker can serve only the old complete
snapshot. Cleanup runs after publication; unsuccessful stages stay resumable. Replacement
space includes duplicated unchanged responses while the previous copy remains protected.
The root URL aliases `index.html`. Removing the explicit copy removes stages and its
control pointer, leaving the shell and ordinary browsing cache alone.

Worker activation preserves committed snapshots, including complete legacy copies. An older
snapshot is a fallback before the newer partial browsing cache when the network fails.
A new worker still waits for Reload. Cache eviction is detected by checking actual bodies;
a saved completion flag alone never makes a copy Ready. Browser eviction can still remove
an entire copy, so persistence is requested but cannot be guaranteed.

Keep dialog and EXE imports dynamic (`settingsMenu.ts`, `retro/computer.ts`). Nothing in
this area imports the desk: `dos.html` shares the computer but must not load desk code.

Checks: `npx vitest run src/offline scripts/offlineManifest.test.ts test/offlineArchiveFlow.test.ts
test/siteWorkerArchive.test.ts test/siteWorker.test.ts src/firstLoad.test.ts` from `web/`.
Fake Cache/fetch tests cover secret inventory exclusion, tier selection/removal, integrity,
resume, changed-file reuse, failure preservation, eviction and concurrency. The browser check
is `npm run check:offline -- --dist <scratch production build>`: Core-only cold start, then
all tiers, a Starter, desk, recorded phone and tour voice. It also checks that no offline ZIP
is requested. Browser layout, light/dark accessibility, cancellation during transfer, worker
updates and real storage eviction still need live checks. Hardware flashing needs a board.
