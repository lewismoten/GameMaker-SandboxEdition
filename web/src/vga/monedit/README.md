# `vga/monedit/`: Monster Maker

Part of the [source map](../../README.md).

Edits monster frames, movement settings and paths using the ported MONEDIT screens.

## Main modules

- [`layout.ts`](layout.ts): Defines screen coordinates, button tables and blank-monster helpers.
- [`state.ts`](state.ts): Holds and loads monsters, their block set and palette.
- [`draw.ts`](draw.ts): Draws lists and frames and handles dropped blocks and monsters.
- [`path.ts`](path.ts): Edits march and attack path legs, pictures and speeds.
- [`movement.ts`](movement.ts): Edits movement, speed and attack settings and the monster born on death.

## Loading

[`monedit.ts`](../monedit.ts) imports these layers statically. [`retro/gm.ts`](../../retro/gm.ts) loads the top-level program through a lazy `import.meta.glob` entry and can prefetch it while the menu waits; these layers are not independent dynamic entries.

## Tests

No tests are colocated here, and no direct tests of these designer layers were found. [`dosGmUtilities.test.ts`](../../../test/dosGmUtilities.test.ts) checks program resolution and exit behavior with a mocked Block Designer; it does not exercise these screens. Editing and rendering need a browser check.

Related areas: [VGA designers](../README.md), [shared VGA helpers](../shared/README.md), [retro PC](../../retro/README.md), [modern editors](../../editor/editors/README.md).
