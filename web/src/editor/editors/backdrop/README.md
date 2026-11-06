# `editor/editors/backdrop/`: bKD picture-window editing and picture resolution

Part of the [source map](../../../README.md).

Edits the GIF reference and picture window stored in a BKD, with game-screen previews and missing-picture recovery.

## Main files

- [`backdrop.ts`](backdrop.ts): Edits a BKD’s GIF reference and 320×200 window, provides drag/keyboard positioning, whole-file Undo, playback, and PNG/GIF/ZIP downloads.

## Loading and development

[`registry.ts`](../registry.ts) dynamically imports this file-kind editor; module evaluation registers its renderer.

BKD saves the picture reference and window, not GIF pixels. Missing-picture recovery can copy a library GIF into the project; it is not only a display fallback.

## Tests

No colocated tests. Related coverage: [`registry.test.ts`](../registry.test.ts). Registry coverage checks dispatch, not this editor’s UI.

From `web/`:

```sh
npx vitest run src/editor/editors/registry.test.ts
```
