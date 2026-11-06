# `retro/text/`: text mode

Part of [`retro/`](../README.md) and the [source map](../../README.md). The 80 x 25 text screen and Game-Maker's text user interface (`code/GM/WINDIO.C`, `MENUC.C`).

Entry points: every text-mode program on the PC (the shell, the designers, the BBS terminal, the utilities) draws through `textScreen.ts`.

- `textScreen.ts`: an 80 x 25 color screen (VGA mode 3) on a canvas: character plus attribute.
- `textInput.ts`: the queue of key presses and what text programs read from it.
- `textUi.ts`: menu bars, windows and dialogs as Game-Maker drew them.

This folder imports only the engine package (CP437 text and glyphs, `@lewismoten/gamemaker-sandbox-engine/text/cp437`, `gfx/cp437Glyphs`), so every other part of `retro/` can use it.

Must not: import `desk/`, `dosPage/` or any editor code.

Tests: `cp437.test.ts`, `textScreenRender.test.ts`.

Check: `cd web && npx vitest run src/retro/text`.
