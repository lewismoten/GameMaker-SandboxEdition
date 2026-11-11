# `vga/mapmaker/`: Map Maker

Part of the [source map](../../README.md).

Edits native maps and monster placement using the ported MAPMAKER screens.

## Main modules

- [`layout.ts`](layout.ts): Defines screen coordinates, tool tables and shared helpers.
- [`state.ts`](state.ts): Holds the map, blocks, monsters and view and reads and writes cells.
- [`draw.ts`](draw.ts): Draws map cells, monsters, lists and tools and converts screen coordinates.
- [`paint.ts`](paint.ts): Changes cells and monster placements and implements fill, shapes and copy previews.

## Loading

[`mapmaker.ts`](../mapmaker.ts) imports these layers statically. [`retro/gm.ts`](../../retro/gm.ts) loads the top-level program through a lazy `import.meta.glob` entry and can prefetch it while the menu waits; these layers are not independent dynamic entries.

## Tests

No tests are colocated here, and no direct tests of these designer layers were found. [`dosGmUtilities.test.ts`](../../../test/dosGmUtilities.test.ts) checks program resolution and exit behavior with a mocked Block Designer; it does not exercise these screens. Editing and rendering need a browser check.

Related areas: [VGA designers](../README.md), [shared VGA helpers](../shared/README.md), [retro PC](../../retro/README.md), [modern editors](../../editor/editors/README.md).
