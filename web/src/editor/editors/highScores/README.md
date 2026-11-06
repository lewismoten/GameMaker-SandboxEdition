# `editor/editors/highScores/`: HIS table editing

Part of the [source map](../../../README.md).

Edits and clears the names and scores in a native HIS table, with whole-file Undo and Redo.

## Main files

- [`highScores.ts`](highScores.ts): Registers HIS table editing, serializes changed names/scores, clears entries, and supplies whole-file Undo/Redo.

## Loading and development

[`registry.ts`](../registry.ts) dynamically imports this file-kind editor; module evaluation registers its renderer.

This edits native HIS table data, not the DOS player’s high-score screen layout. Names and numeric scores are normalized by the input controls before serialization.

## Tests

No colocated tests. Related coverage: [`registry.test.ts`](../registry.test.ts). Registry coverage checks dispatch, not this editor’s UI.

From `web/`:

```sh
npx vitest run src/editor/editors/registry.test.ts
```
