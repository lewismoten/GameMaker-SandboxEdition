# `backup/`: back up and restore everything this browser keeps

Part of the [source map](../README.md).

The ⚙ Settings menu's _Back up / restore…_ (`settingsMenu.ts` loads `openDataBackup.ts` when it is
chosen). It saves what this site keeps in a browser to one file and brings it back, part by part.

- `inventory.ts`: every gm-\* localStorage key and IndexedDB store, sorted into the ten sections
  (and what is left out, with why). `inventory.test.ts` fails when a new key or database appears in
  the code without a place here.
- `sections/`: one file a section, each with its rules: what it takes from the browser, how it
  merges with what's here, how it replaces it, and what a change would do in words.
  - `projects.ts`: My games (files, companion and to-do list, the per-game maps). Never imported
    games. A game whose id is here already and differs: keep both (the default), replace or skip.
  - `saves.ts`: every game's saves and high-score table, and the Save backups. The tables join
    into the best ten; a slot that differs keeps this browser's or the file's, and the other goes
    to Save backups.
  - `trophies.ts` and `achievements.ts`: the higher score and count; the union of unlocks.
  - `eggs.ts` and `hearts.ts`: found stays found (an egg found in a save comes as an "added"
    egg); the higher tap and pop counts.
  - `desk.ts`: the C: drive (its lists joined) and the PC's records, and the room's settings.
  - `notes.ts`: imported games' notes and ratings and removed-game records; the newer edit wins,
    and a note whose game isn't here waits as a removed game's record.
  - `settings.ts`: preferences, and the AI setup (its API key left out unless asked for).
- `world.ts`: everything at once as plain data, read from the browser, and written back only where
  it differs. `codec.ts`: the sections' JSON, with binary data kept byte for byte.
- `file.ts`: the `.gmbackup` file, a zip of `manifest.json` (format, version, date, the site's
  version, each section with its item count) and `sections/<id>.json`; reading checks it all, and
  refuses a newer format, before anything is written.
- `plan.ts`: an import worked out on a copy (only the chosen sections touched), with what each
  changes. `applyImport.ts` does it.
- `openDataBackup.ts`, `exportDialog.ts`, `importDialog.ts`, `backup.css`, `formatBytes.ts`: the
  dialogs.

Tests: `backup.test.ts` (round trip, merges, untouched sections, partial and damaged files).
