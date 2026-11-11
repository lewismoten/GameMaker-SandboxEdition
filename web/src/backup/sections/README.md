# `backup/sections/`: backup rules for each kind of stored data

Part of the [source map](../../README.md).

Extracts, validates, merges and describes each backup section as plain data before the backup system writes changes to the browser.

## Main modules

- [`index.ts`](index.ts): Registers sections in import order, with projects first so copied IDs can follow through to saves.
- [`types.ts`](types.ts): Defines section contracts, merge choices, validation and shared data helpers.
- [`projects.ts`](projects.ts): Backs up authored projects and handles conflicting project IDs.
- [`saves.ts`](saves.ts): Merges save slots, names, recordings and high scores while backing up conflicting files.
- [`trophies.ts`](trophies.ts): Merges score records and trophy overrides.
- [`achievements.ts`](achievements.ts): Combines unlock dates, progress and counted items.
- [`eggs.ts`](eggs.ts): Carries found eggs and overrides across imports, including finds held in saves.
- [`hearts.ts`](hearts.ts): Merges tin-heart finds, overrides and clock hunt state.
- [`desk.ts`](desk.ts): Combines C: drive records and stored room and PC settings.
- [`notes.ts`](notes.ts): Matches imported-game notes by ID or fingerprint and keeps the newer edit.
- [`settings.ts`](settings.ts): Handles preferences and AI setup, leaving API keys out unless requested.

## Loading

Imported statically by the backup codec, file and planning modules. Settings dynamically imports [`openDataBackup.ts`](../openDataBackup.ts); individual sections do not have dynamic entry points.

## Tests

[`backup.test.ts`](../backup.test.ts) covers round trips, merge rules and damaged or partial backups. [`inventory.test.ts`](../inventory.test.ts) checks storage coverage; [`oldSaves.test.ts`](../../../test/oldSaves.test.ts) checks older backup fixtures. No tests are colocated here.

Related areas: [backup](../README.md), [save data](../../project/saveData/README.md), [imported games](../../imported/README.md).
