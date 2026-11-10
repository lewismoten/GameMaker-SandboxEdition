# `vga/shared/`: VGA designer primitives

Part of the [source map](../../README.md).

Shares the indexed screen, input, drawing and file helpers used by Game-Maker's ported DOS designers.

## Main modules

- [`vga.ts`](vga.ts): Implements the 320×200 indexed screen, palette, font, mouse, BIOS-style keys and clock.
- [`facelift.ts`](facelift.ts): Draws common designer surfaces, borders, buttons and color controls.
- [`blocc.ts`](blocc.ts): Loads and saves block sets and draws and scrolls block lists.
- [`designer.ts`](designer.ts): Defines the program contract, text-mode bars and open-work metadata.

## Loading

Designers import these helpers statically. [`retro/computer.ts`](../../retro/computer.ts) also imports `Vga` statically, so the screen code belongs to the shared PC path and is not deferred until a designer opens. This folder has no independent dynamic entry point.

## Tests

No tests are colocated here, and no direct tests of these helpers were found. [`dosGmUtilities.test.ts`](../../../test/dosGmUtilities.test.ts) checks launch and exit behavior with a mocked designer, not VGA drawing. Palette, input and rendering need a browser check.

Related areas: [VGA designers](../README.md), [retro computer](../../retro/computer/README.md), [screen capture](../../media/README.md).
