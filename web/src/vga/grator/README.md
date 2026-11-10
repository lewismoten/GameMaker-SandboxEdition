# `vga/grator/`: Integrator

Part of the [source map](../../README.md).

Edits the game scene graph, scene files and entry and exit links using the ported GRATOR screens.

## Main modules

- [`layout.ts`](layout.ts): Defines scene-map layout, constants and folder helpers.
- [`state.ts`](state.ts): Reads and writes GAM data and creates scenes and links.
- [`draw.ts`](draw.ts): Draws scene boxes, XOR links and controls.
- [`scenes.ts`](scenes.ts): Edits scene descriptions, files, scrolling and world-map positions.
- [`gramap.ts`](gramap.ts): Shows two scenes' maps for choosing link departure and arrival cells.

## Loading

[`grator.ts`](../grator.ts) imports these layers statically. [`retro/gm.ts`](../../retro/gm.ts) loads the top-level program through a lazy `import.meta.glob` entry and can prefetch it while the menu waits; these layers are not independent dynamic entries.

## Tests

No tests are colocated here, and no direct tests of these designer layers were found. [`dosGmUtilities.test.ts`](../../../test/dosGmUtilities.test.ts) checks program resolution and exit behavior with a mocked Block Designer; it does not exercise these screens. Editing and rendering need a browser check.

Related areas: [VGA designers](../README.md), [shared VGA helpers](../shared/README.md), [retro PC](../../retro/README.md), [modern editors](../../editor/editors/README.md).
