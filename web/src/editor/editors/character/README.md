# `editor/editors/character/`: hero starting values, sequences and character frames

Part of the [source map](../../../README.md).

Edits a CHR’s starting values and key sequences, with CBL frame pictures, motion audition and mirroring.

## Main files

- [`character.ts`](character.ts): Registers CHR editing for initial meters/inventory and sequences, coordinates previews, sound, mirroring, serialization, and Undo snapshots.
- [`characterLogic.ts`](characterLogic.ts): Supplies orientation composition, frame-list edits preserving end markers/trailing slots, birth-frame detection, and travel totals.
- [`characterFrames.ts`](characterFrames.ts): Builds sequence key capture and editable frame cards for pictures/orientations, monster birth, motion, timing, and ordering.
- [`characterStage.ts`](characterStage.ts): Supplies a cached arrival-area map backdrop or dark-grid choice for character previews.

## Loading and development

[`registry.ts`](../registry.ts) dynamically imports this file-kind editor; module evaluation registers its renderer.

CHR sequences reference CBL block numbers. Mirroring may also change CBL bytes, so its Undo includes both native files and companion mirror links. Preview background choices remain companion-only.

## Tests

Colocated coverage includes [`characterMirror.test.ts`](characterMirror.test.ts).

From `web/`:

```sh
npx vitest run src/editor/editors/character
```
