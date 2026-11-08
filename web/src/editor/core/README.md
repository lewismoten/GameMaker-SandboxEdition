# `editor/core/`: shared editor project, history, DOM and indexed drawing helpers

Part of the [source map](../../README.md).

Shares project state, history, DOM controls and indexed drawing across the editors and other browser UI.

## Main files

- [`project.ts`](project.ts): Owns open-game files, parsed-game caching, companion extras, change listeners, autosave, palette selection, and filename helpers.
- [`history.ts`](history.ts): Provides bounded generic snapshot undo/redo.
- [`fileUndo.ts`](fileUndo.ts): Provides whole-file history with merging/joining/splitting; `fileUndo` adds buttons and removable keyboard handling.
- [`ui.ts`](ui.ts): Provides DOM construction, dialogs, fields, notices, downloads, file picking, and debounce helpers. Notices belong to the top modal when one is open and coalesce one-second identical bursts; pass `{ repeat: true }` for a new deliberate attempt or final outcome. `{ persistent: true }` notices have independent caller-owned lifetimes and never coalesce.
- [`progressAnnouncements.ts`](progressAnnouncements.ts): Samples intermediate speech at five-second intervals while visible progress updates freely; terminal outcomes bypass the interval and disable further progress. Create one per operation; it owns no timers.
- [`draw.ts`](draw.ts): Provides cached palette lookup tables and indexed/block canvas rendering.

## Loading and development

[`modernUi.ts`](../../modernUi.ts) constructs Project for the workspace.

Companion extras stay separate from native game files. Whole-file Undo retains byte-array references, so edits must replace arrays rather than mutate saved bytes. Read-only projects restrict persistence and extra-data changes.

## Tests

Colocated coverage includes [`gameControls.test.ts`](gameControls.test.ts), [`readOnly.test.ts`](readOnly.test.ts), [`readablePalette.test.ts`](readablePalette.test.ts).

From `web/`:

```sh
npx vitest run src/editor/core
```

`libraryCatalog.ts` separates CD, Sandbox & Bizarre, and Starter assets and excludes secret entries. The file picker can filter each source by game before choosing an asset. The picker retains per-game palette copies so deduplication cannot remove a game from that filter.
