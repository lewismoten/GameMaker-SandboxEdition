# `offline/`: working without a network

Part of the [source map](../README.md). "Make available offline": the site's offline manifest and
the games in this browser's catalog in the service worker's cache at once, and the notices around it.
The separate web-player pages, trinket and laser-kit downloads, firmware and link-preview files
are not part of it (`offlineFiles` in `web/vite.config.ts`).

Entry points: `offline.ts` (the service worker's notices) imports `loadFailure.ts`, `replay.ts` and
`updateState.ts`; `settingsMenu.ts` loads `offlineDialog.ts` on demand; `retro/computer.ts` loads
`offlineExe.ts` when OFFLINE.EXE runs.

- `offlineCopy.ts`: reads `offline.json`, checks the committed snapshot's version and complete file coverage, and prepares or removes it for the dialog and OFFLINE.EXE.
- `archiveStore.ts`: downloads the single `offline.<sha256>.zip`, reports streamed download bytes then unpacked file counts, verifies length/SHA-256 and the exact ZIP directory, and unpacks with the existing archives package into a separate Cache API snapshot. Exact-case site-relative URLs and MIME types are restored, with `index.html` also stored under the site's root URL. No archive entry is served implicitly: `../siteWorker.ts` explicitly reads and serves the committed cache.
- `offlineDialog.ts`: today's web: the Offline dialog (header button and ⋯ menu); `offline.css` styles it.
- `offlineExe.ts`: OFFLINE.EXE in `C:\DOS` on the desk PC, the same job as a 1995 text program.
- `loadFailure.ts`: a part of the site that cannot load (a missing chunk, a deploy that replaced it) says so instead of leaving a blank page.
- `updateState.ts`: the new version waiting for a Reload, shared by the notice and the Settings menu; a game playing in a play page is never covered.
- `replay.ts`: tells whether the page is a Wayback Machine replay (no service workers there).

Must not: `offlineDialog.ts` and `offlineExe.ts` are loaded on demand (`settingsMenu.ts`, `retro/computer.ts`); keep
them dynamic so the first-load chunk stays small. `retro/computer.ts` is shared with `dos.html`, so nothing here may import `desk/`.

## Acquisition and lifecycle

Installation still downloads **only the app shell**, never the offline archive. Nothing starts
an offline download until the visitor presses Download in Play offline or Y in OFFLINE.EXE.
Ordinary browsing continues to cache files on first use in `gm-site-v2`. A public offline copy is
one ZIP request, not a fetch for every entry in `offline.json`. Already-revealed secret game
packs/walkthroughs are the only supplemental requests: neither their files nor gate catalogs
may appear in the public ZIP. An unchanged complete copy is reused without fetching the ZIP.

The production Vite plugin builds the ZIP from the same selected resources as the old explicit
copy, plus the complete shell (including `index.html`); `scripts/offlineArchive.ts` uses sorted
entries, a fixed local ZIP date and a SHA-256 filename. `offline.json` records its path, exact
byte length and SHA-256. The manifest is saved beside the extracted entries, not inside the ZIP
(which would create a circular hash). A payload change changes the archive identity; the worker
still uses the build's version to invalidate readiness across deployments.

A base-URL-scoped Web Lock serializes preparation/removal across tabs. A unique staging cache
is invisible to the worker until one atomic pointer write to the scoped control cache. Cancel,
truncation, a bad checksum, extraction failure or quota failure discards staging, not the last
committed copy. The browser must have Web Locks, Cache Storage and service workers. Retries
restart the whole archive (no partial-download resume); replacements need free space for the
new unpacked copy while the old one is retained. Progress at 100% downloaded does not mean
Ready: extraction and publication must finish too.

A new worker still waits for Reload. Activation preserves committed offline snapshots rather
than deleting them with obsolete shell/staging caches. With a current snapshot it serves entries
cache-first; with an older snapshot it tries the network, falling back to that complete snapshot
before any new partial browsing cache. Thus an offline navigation can still load the old home,
its hashed code and its matching catalogs after a failed replacement. While connected the dialog
reports the current build as needing an update, not Ready for the old copy. On successful
replacement, the old snapshot is deleted; abandoned staging is cleaned up on the next preparation.
Removing the prepared copy leaves the shell and ordinary browsing cache alone. Legacy per-file
`gm-site` is adopted in place only if its cached legacy manifest and every listed/shell URL
are present. This preserves a previously complete per-file copy without a second allocation or
network fanout. It remains an old-version fallback until a successful explicit ZIP replacement
(or removal) deletes it. Incomplete legacy browsing caches are not declared ready and are cleaned
up during activation. Subsequent browsing uses `gm-site-v2`, retaining group invalidation.

Tests: `replay.test.ts`, `archiveStore.test.ts`, `../../test/offlineArchiveFlow.test.ts`,
`../../test/siteWorkerArchive.test.ts` and `../../scripts/offlineArchive.test.ts`.

To reproduce the network check, use a fresh browser profile on a scratch production preview:
wait for the worker to control the page, open Play offline, count requests from Download until
Ready, then disconnect and reload. There must be one `offline.<sha256>.zip` request, no
per-entry provisioning fanout, and no ZIP request on a normal first visit, refresh, or reopening
a ready dialog. Normal page/catalog/prefetch requests are separate from provisioning. The
existing `check:offline` exercises real navigation, a Starter, desk and recorded audio offline.

Check: `cd web && npx vitest run src/offline src/firstLoad.test.ts`. The real offline run is
`npm run check:offline -- --dist <scratch build>` (3 to 6 minutes, through `npm run heavy --`).
