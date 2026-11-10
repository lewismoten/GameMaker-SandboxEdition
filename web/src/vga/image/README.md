# `vga/image/`: Graphics Image Reader

Part of the [source map](../../README.md).

The drawing and layout layers of IMAGE.EXE, ported from `code/GM/IMAGE.C`,
`GIFC.C` and the block drawing routines. The reader cuts GIF pixels into background
blocks and selects a picture window for a backdrop.

- [`layout.ts`](layout.ts): screen positions, the help filename, palette byte conversion,
  blank solid blocks and the empty-block check.
- [`screen.ts`](screen.ts): `ImageReaderScreen` holds the GIF, palette, block set and
  selection state. It decodes and draws the GIF, saves and restores the capture box's
  edges, draws and scrolls the block list, copies pixels into blocks and plays the beep.
- [`../image.ts`](../image.ts): `ImageReader` extends that screen with menus, input,
  block capture, the reduced picture selector and PAL, BBL and BKD saves through `WorkArea`.

## Imports and loading

`retro/gm.ts` loads the top-level program through a lazy `import.meta.glob` entry
and can prefetch it while the menu waits. That program imports these layers statically.
Use the shared VGA helpers, the retro host and work area, and the engine package's
format and audio exports. Do not import `desk/` here, even dynamically: these layers
also run on `dos.html`. Keep the modern editor UI behind its own lazy entry.
Preserve the DOS file bytes and original behavior when changing these layers.

## Tests

No tests are colocated here, and no direct tests of these screen layers were found.
[`dosGmUtilities.test.ts`](../../../test/dosGmUtilities.test.ts) checks IMAGE.EXE name
resolution; its designer execution test uses a mocked Block Designer.
[`boundary.test.ts`](../../dosPage/boundary.test.ts) checks that the DOS page and PC
core cannot reach `desk/`. GIF selection, capture, scrolling and saving still need
a browser check.
