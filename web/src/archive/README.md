# `archive/`: `archive.html`, a page for web archives

Part of the [source map](../README.md). A page that fetches every file of the site, a few at a
time, so a web archive's "save page" records them all. Nothing links to it.

Entry point: `archive.html` loads `archive.ts`.

- `archive.ts`: fetches the files in `archive.json` in order and shows counts only. It registers no service worker and writes no storage.
- `plan.ts`: what to fetch and in what order. The build writes `archive.json` listing every file.

Must not: show a file's or a game's name (a secret game would show), register a service worker,
or write storage. Keep it free of site code so it stays small (inferred).

Tests: `plan.test.ts`.

Check: `cd web && npx vitest run src/archive`.
