# `editor/editors/animation/scene/`: companion-backed animation Scene maker and renderer

Part of the [source map](../../../../README.md).

Edits a companion-backed scene model and renders its objects, timeline and fades into a native FLI animation.

## Main files

- [`sceneEditor.ts`](sceneEditor.ts): Edits timeline objects and companion scene data, previews rendered frames, and writes regenerated FLI after changes.
- [`sceneModel.ts`](sceneModel.ts): Defines and normalizes bounded scene/background/track/item data and actor paths.
- [`sceneRender.ts`](sceneRender.ts): Composites indexed frames, actor animation and palette fades, then encodes a 320×200 FLI.
- [`sceneMaker.ts`](sceneMaker.ts): Registers the FLI maker and lazily loads generation/rendering after a creation choice.

## Loading and development

[`animation.ts`](../animation.ts) imports the scene editor for its Scene maker tab; [`all.ts`](../../../tools/all.ts) imports the maker registration.

The companion scene model is editable source; generated FLI bytes are playback data. Opening Scene maker does not replace an unrelated animation until an edit schedules regeneration.

## Tests

Colocated coverage includes [`scene.test.ts`](scene.test.ts).

From `web/`:

```sh
npx vitest run src/editor/editors/animation/scene
```
