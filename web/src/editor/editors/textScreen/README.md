# `editor/editors/textScreen/`: TXT page editing and game-accurate preview

Part of the [source map](../../../README.md).

Edits TXT pages with DOS layout guides and a game-accurate preview, preserving the native reader’s quirks.

## Main files

- [`textScreen.ts`](textScreen.ts): Edits TXT bytes with page guides, warnings, background selection and engine-backed preview.
- [`textLayout.ts`](textLayout.ts): Models 31-character reads and 16-line pages, including exact-multiple newline blanks, and supplies optional word wrapping.
- [`textUndo.ts`](textUndo.ts): Groups typing/deletion bursts and isolates paste, cut, newline and tool edits.

## Loading and development

[`registry.ts`](../registry.ts) dynamically imports this file-kind editor; module evaluation registers its renderer.

Preserve DOS’s 31-column, 16-line reading quirks. Word wrapping is an explicit tool, not automatic normalization. Background selection changes the preview, not a scene or slide-show configuration.

## Tests

Colocated coverage includes [`textUndo.test.ts`](textUndo.test.ts).

From `web/`:

```sh
npx vitest run src/editor/editors/textScreen
```
