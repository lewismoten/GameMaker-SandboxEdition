# Old saves compatibility recheck

Tuesday, 2026-11-24, UTC. Tested the current checkout at `beda6ecc7` against the original capture from `66c59762c`.

- **02:46** — Read the November 4 housekeeping entry and the fixture history on the local `origin/develop` ref. The original suite passed all 4 tests in 1.39 s.
- **02:47** — Compared the storage code across both revisions. Commits `317a7b552` and `535047e4b` added About metadata and an export-preview preference to the companion. Per-map wrap and block roles followed in `8fc45017b` and `cf865b82f`. The backup inventory also gained settings including `gm-chicken`. The IndexedDB, companion and backup versions remain 1. The original notes, reservations, checkpoint deltas, settings strings and DOS data still decode. Older companions already read with empty About metadata and previews enabled, so they need no migration.
- **02:48** — Captured a second fixture in `web/test/fixtures/saves/2026-11-24-develop-beda6ecc7/`. Used the November 2 sample as input and the current writers for the project ZIP, companion, checkpoints, full backup and DOS files. The capture includes About credits, previews switched off, map wrap, block roles and the saved chicken selection. The original fixture is unchanged.
- **02:48** — Ran the extended suite. The first run exposed an uppercase-only lookup in the test. Current checkpoint writers use normalized game filenames. The test now checks the restored bytes through the game's file lookup for both dates.

Final Vitest output from `web/`:

```text
Test Files  1 passed (1)
     Tests  9 passed (9)
  Start at  02:48:46
  Duration  1.13s
```

The tests cover the standalone companion, settings, DOS save, slot names and high scores, the project and both checkpoints restored from the full backup, and the November 24 browser project ZIP.

Tuesday 02:50 UTC — Prettier and ESLint passed on the changed TypeScript test. The full project typecheck passed with `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .` after the default heap was exhausted. All changes remain uncommitted.

Suggested commit message: `test: keep November 24 browser projects, backups and DOS saves opening`
