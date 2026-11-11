# `vga/blocedit/`: Block Designer

Part of the [source map](../../README.md).

Edits block pixels, palettes and game behavior using the ported BLOCEDIT screens.

## Main modules

- [`layout.ts`](layout.ts): Defines screen positions, button tables and shared helpers.
- [`state.ts`](state.ts): Holds the block set, viewing grid, colors and active drawing state.
- [`paint.ts`](paint.ts): Implements pixel tools, fill, shape previews and whole-block transforms.
- [`screen.ts`](screen.ts): Draws the main screen, animated viewing grid, palette and block bars.
- [`infoScreen.ts`](infoScreen.ts): Draws a block's behavior information screen.
- [`info.ts`](info.ts): Handles behavior edits, including solidity, gravity, effects and monster birth.
- [`transfer.ts`](transfer.ts): Copies blocks between sets and converts palettes by nearest color.

## Loading

[`blocedit.ts`](../blocedit.ts) imports these layers statically. [`retro/gm.ts`](../../retro/gm.ts) loads the top-level program through a lazy `import.meta.glob` entry and can prefetch it while the menu waits; these layers are not independent dynamic entries.

## Tests

No tests are colocated here, and no direct tests of these designer layers were found. [`dosGmUtilities.test.ts`](../../../test/dosGmUtilities.test.ts) checks program resolution and exit behavior with a mocked Block Designer; it does not exercise these screens. Editing and rendering need a browser check.

Related areas: [VGA designers](../README.md), [shared VGA helpers](../shared/README.md), [retro PC](../../retro/README.md), [modern editors](../../editor/editors/README.md).
