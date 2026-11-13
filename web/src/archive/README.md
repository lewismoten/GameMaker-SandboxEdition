# `archive/`: `archive.html`, a page for web archives

Part of the [source map](../README.md). A page that requests files from the build's archive
manifest, four at a time, to help a web archive's "save page" discover them. A successful
fetch does not prove the archive saved the response. No player-facing link leads to it.

Entry point: `archive.html` loads `archive.ts`.

- `archive.ts`: reads `archive.json`, falling back to the older deployment's smaller
  `offline.json` list if that fails. It fetches the selected files with four workers, retries
  each failed fetch once and reports unavailable-file counts without showing names. It
  registers no service worker and writes no storage.
- `plan.ts`: what to fetch and in what order. The default selection leaves out game packs,
  phone files and the large kit files; `?games=1` includes those groups. The shell comes
  first, followed by startup code and data, the remaining files, then the optional groups.
  `?part=N` selects a numbered slice starting at 1; without it, the whole selection is used.
  Slices target 12,000,000 wire bytes, but do not split a file, so one can exceed that size.

Must not: show a file's or a game's name (a secret game would show), register a service worker,
or write storage. Keep this entry point focused on fetching and counts; it is not an offline installer.

Tests: `plan.test.ts`.

Check: `cd web && npm run heavy -- npx vitest run src/archive`.
