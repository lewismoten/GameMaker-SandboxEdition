# `project/saveData/`: save files and save backups

Part of the [source map](../../README.md).

Provides the shared data layer for Saves & scores and the PC save utilities, including slot editing, high scores, level changes and backup storage.

## Main modules

- [`index.ts`](index.ts): Loads a whole save record, writes or deletes slots and writes high-score tables.
- [`saveGame.ts`](saveGame.ts): Parses web-engine JSON saves and slot names and defines editable fields and limits.
- [`highScores.ts`](highScores.ts): Reads and writes binary high-score tables while preserving unedited name bytes.
- [`gameLabels.ts`](gameLabels.ts): Derives level, character, inventory and counter labels from game files.
- [`newGame.ts`](newGame.ts): Uses engine initialization to create a save at the first playable level.
- [`saveLevel.ts`](saveLevel.ts): Uses engine scene entry to change levels, move the hero and render save-map previews.
- [`backups.ts`](backups.ts): Stores dated save backups in a separate IndexedDB database and notifies tabs of changes.

## Loading

Consumers import the `index.ts` API statically, including [`savesPanel.ts`](../../saves/savesPanel.ts) and the retro backup utility. This folder has no separate dynamic entry point; its code follows those callers.

## Tests

[`saveData.test.ts`](../../../test/saveData.test.ts) checks codecs, fields and storage; [`newGameSave.test.ts`](../../../test/newGameSave.test.ts) checks engine-created saves; [`saveLevel.test.ts`](../../../test/saveLevel.test.ts) checks scene changes. [`oldSaves.test.ts`](../../../test/oldSaves.test.ts) checks compatibility. No tests are colocated here.

Related areas: [project](../README.md), [Saves & scores](../../saves/README.md), [retro save utilities](../../retro/hacks/README.md), [backup sections](../../backup/sections/README.md).
