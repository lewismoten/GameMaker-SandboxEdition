# `vga/charedit/`: Character Maker

Part of the [source map](../../README.md).

Edits character animation sequences, frame placement and inventory using the ported CHAREDIT screens.

## Main modules

- [`layout.ts`](layout.ts): Defines screen tables, helpers and initial character data.
- [`state.ts`](state.ts): Holds character, blocks, palette and sounds and loads supporting files.
- [`draw.ts`](draw.ts): Draws oriented blocks, frames, lists and placement controls.
- [`sequence.ts`](sequence.ts): Edits frame pairs, relative placement, orientation and animation timing.
- [`inventory.ts`](inventory.ts): Edits starting inventory, the object a sequence requires and the monster a frame gives birth to. Sequence execution limits are set by the text menus in [`../charedit.ts`](../charedit.ts).

## Loading

[`charedit.ts`](../charedit.ts) imports these layers statically. [`retro/gm.ts`](../../retro/gm.ts) loads the top-level program through a lazy `import.meta.glob` entry and can prefetch it while the menu waits; these layers are not independent dynamic entries.

## Tests

No tests are colocated here, and no direct tests of these designer layers were found. [`dosGmUtilities.test.ts`](../../../test/dosGmUtilities.test.ts) checks program resolution and exit behavior with a mocked Block Designer; it does not exercise these screens. Editing and rendering need a browser check.

Related areas: [VGA designers](../README.md), [shared VGA helpers](../shared/README.md), [retro PC](../../retro/README.md), [modern editors](../../editor/editors/README.md).
