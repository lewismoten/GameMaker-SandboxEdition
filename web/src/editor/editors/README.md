# `editor/editors/`: file-kind dispatch and lazy editor registration

Part of the [source map](../../README.md).

Dispatches native file kinds to independently loaded editors, with an information/hex fallback for unknown files.

## Main files

- [`registry.ts`](registry.ts): Maps file kinds to dynamic imports, accepts module self-registration, and returns the registered renderer or fallback information/hex view.

## Loading and development

[`workspace.ts`](../shell/workspace.ts) loads an editor by file kind and retains its cleanup.

Add both a loader mapping and module self-registration for a new kind. A renderer can return cleanup, which the workspace calls when switching editors. Preserve dynamic loading rather than importing all editors up front.

## Subareas

[`animation/`](animation/README.md), [`backdrop/`](backdrop/README.md), [`blocks/`](blocks/README.md), [`character/`](character/README.md), [`highScores/`](highScores/README.md), [`integrator/`](integrator/README.md), [`map/`](map/README.md), [`monsters/`](monsters/README.md), [`music/`](music/README.md), [`picture/`](picture/README.md), [`recording/`](recording/README.md), [`sample/`](sample/README.md), [`slideShow/`](slideShow/README.md), [`sounds/`](sounds/README.md), [`textScreen/`](textScreen/README.md), [`palette/`](palette/README.md).

## Tests

Colocated coverage includes [`registry.test.ts`](registry.test.ts).

From `web/`:

```sh
npx vitest run src/editor/editors
```
