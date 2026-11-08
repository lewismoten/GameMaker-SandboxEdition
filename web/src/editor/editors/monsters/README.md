# `editor/editors/monsters/`: monster values, animation and movement-path UI

Part of the [source map](../../../README.md).

Edits MON creature slots, animation and movement paths, with map-backed previews and companion-only names.

## Main files

- [`monsters.ts`](monsters.ts): Edits MON slots, animation frames, power, lifetime and movement; owns serialized-data Undo and debounced saves.
- [`monsterPathEditor.ts`](monsterPathEditor.ts): Assembles map-backed normal/attack path editing and the timed walking preview.
- [`monsterPathState.ts`](monsterPathState.ts): Defines per-editor shared path state and current-monster/path/placement accessors.
- [`monsterNames.ts`](monsterNames.ts): Reads and updates trimmed per-slot names in the MON file’s companion `names` section.

## Loading and development

[`registry.ts`](../registry.ts) dynamically imports this file-kind editor; module evaluation registers its renderer.

MON data Undo and companion names are separate: do not assume Undo of a serialized monster also restores its name. Movement-path state belongs to the current editor instance.

## Tests

Colocated coverage includes [`freeSlot.test.ts`](freeSlot.test.ts), [`monsterNames.test.ts`](monsterNames.test.ts), [`newestMonster.test.ts`](newestMonster.test.ts).

From `web/`:

```sh
npx vitest run src/editor/editors/monsters
```

Unused slots have no active portrait in the list or heading. Their retained frames are labeled as template data; editing them still activates the slot as before.
