# `offline/`: working without a network

Part of the [source map](../README.md). "Make available offline": the whole site in the service
worker's cache at once, and the notices around it.

Entry points: `offline.ts` (the service worker's notices) imports `loadFailure.ts`, `replay.ts` and
`updateState.ts`; `settingsMenu.ts` loads `offlineDialog.ts` on demand; `retro/computer.ts` loads
`offlineExe.ts` when OFFLINE.EXE runs.

- `offlineCopy.ts`: downloads every file into the service worker's cache, for the dialog and OFFLINE.EXE.
- `offlineDialog.ts`: today's web: the Offline dialog (header button and ⋯ menu); `offline.css` styles it.
- `offlineExe.ts`: OFFLINE.EXE in `C:\DOS` on the desk PC, the same job as a 1995 text program.
- `loadFailure.ts`: a part of the site that cannot load (a missing chunk, a deploy that replaced it) says so instead of leaving a blank page.
- `updateState.ts`: the new version waiting for a Reload, shared by the notice and the Settings menu; a game playing in a play page is never covered.
- `replay.ts`: tells whether the page is a Wayback Machine replay (no service workers there).

Must not: `offlineDialog.ts` and `offlineExe.ts` are loaded on demand (`settingsMenu.ts`, `retro/computer.ts`); keep
them dynamic so the first-load chunk stays small. `retro/computer.ts` is shared with `dos.html`, so nothing here may import `desk/`.

Tests: `replay.test.ts`.

Check: `cd web && npx vitest run src/offline src/firstLoad.test.ts`. The real offline run is
`npm run check:offline -- --dist <scratch build>` (3 to 6 minutes, through `npm run heavy --`).
