# `editor/core/`: shared editor project, history, DOM and indexed drawing helpers

Part of the [source map](../../README.md).

Shares project state, history, DOM controls and indexed drawing across the editors and other browser UI.

## Main files

- [`project.ts`](project.ts): Owns open-game files, parsed-game caching, companion extras, change listeners, autosave, palette selection, and filename helpers.
- [`history.ts`](history.ts): Provides bounded generic snapshot undo/redo.
- [`fileUndo.ts`](fileUndo.ts): Provides whole-file history with merging/joining/splitting; `fileUndo` adds buttons and removable keyboard handling.
- [`ui.ts`](ui.ts): Provides DOM construction, dialogs, fields, notices, downloads, file picking, and debounce helpers.
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
