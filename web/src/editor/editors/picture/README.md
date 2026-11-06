# `editor/editors/picture/`: gIF viewing/import and copying regions into blocks

Part of the [source map](../../../README.md).

Views and replaces indexed GIFs and copies selected picture regions into block-set pixels.

## Main files

- [`picture.ts`](picture.ts): Views indexed GIFs, imports replacements and copies selected 20×20 pixel regions into block sets.
- [`pictureLogic.ts`](pictureLogic.ts): Identifies flat-color background blocks or fully transparent sprite blocks as blank.

## Loading and development

[`registry.ts`](../registry.ts) dynamically imports this file-kind editor; module evaluation registers its renderer.

Image imports stretch to 320×200 and quantize against the selected palette. Copying into a block changes pixels while retaining its other settings, with optional palette remapping.

## Tests

No colocated tests. Related coverage: [`pictureLogic.test.ts`](../../../../test/pictureLogic.test.ts), [`registry.test.ts`](../registry.test.ts).

From `web/`:

```sh
npx vitest run test/pictureLogic.test.ts src/editor/editors/registry.test.ts
```
