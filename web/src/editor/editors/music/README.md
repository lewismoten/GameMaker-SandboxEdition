# `editor/editors/music/`: cMF tracks, instruments, piano-roll integration and playback

Part of the [source map](../../../README.md).

Edits CMF tracks and instruments through a shared song document, piano roll, transport and arrangement dialogs.

## Main files

- [`music.ts`](music.ts): Registers CMF editing and assembles transport, tracks, piano roll, instruments and settings tabs.
- [`doc.ts`](doc.ts): Owns parsed song state, selection, editing transactions, Undo, saving, playback and audition.
- [`roll.ts`](roll.ts): Extends pointer handling with keyboard edits, note clipboard operations and program-change popups.
- [`instrument.ts`](instrument.ts): Displays the shared instrument bank and edits two-operator SBI settings, presets and track assignment.
- [`accompanyDialog.ts`](accompanyDialog.ts): Generates and auditions accompaniment candidates, then installs the chosen song as one Undo step.

## Loading and development

[`registry.ts`](../registry.ts) dynamically imports this file-kind editor; module evaluation registers its renderer.

Edits target PLAYGAME’s CMF subset, not arbitrary MIDI. Track display order is companion data. Instruments are shared: changing one affects every track that uses it.

## Subareas

[`arrange/`](arrange/README.md), [`roll/`](roll/README.md).

## Tests

Colocated coverage includes [`instrumentLook.test.ts`](instrumentLook.test.ts), [`presetIcons.test.ts`](presetIcons.test.ts), [`presetPicker.test.ts`](presetPicker.test.ts).

From `web/`:

```sh
npx vitest run src/editor/editors/music
```
