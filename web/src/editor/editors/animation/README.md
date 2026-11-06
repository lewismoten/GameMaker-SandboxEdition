# `editor/editors/animation/`: fLI frame editing and Scene/Frames workflows

Part of the [source map](../../../README.md).

Edits and plays FLI frames, with a Scene maker tab and an on-demand size-reduction dialog.

## Main files

- [`animation.ts`](animation.ts): Registers FLI editing with frame playback/edit/import/export, exact-byte-aware undo, and Frames/Scene maker tabs.

## Loading and development

[`registry.ts`](../registry.ts) dynamically imports this file-kind editor; module evaluation registers its renderer.

FLI frame duration uses 1/70-second units. Frames edits re-encode the animation; shrink results retain exact returned bytes for Undo. Scene maker is a static dependency of this editor, while the shrink panel loads on demand.

## Subareas

[`scene/`](scene/README.md), [`shrink/`](shrink/README.md).

## Tests

No colocated tests. Related coverage: [`registry.test.ts`](../registry.test.ts), [`scene.test.ts`](scene/scene.test.ts), [`shrinkOptions.test.ts`](shrink/shrinkOptions.test.ts).

From `web/`:

```sh
npx vitest run src/editor/editors/registry.test.ts src/editor/editors/animation/scene/scene.test.ts src/editor/editors/animation/shrink/shrinkOptions.test.ts
```
