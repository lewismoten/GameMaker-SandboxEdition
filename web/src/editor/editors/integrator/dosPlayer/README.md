# `editor/editors/integrator/dosPlayer/`: dOS player customization UI and preview

Part of the [source map](../../../../README.md).

Provides the Overview’s DOS player customization panel: patch fields, presets and draggable screen previews.

## Main files

- [`playerPanel.ts`](playerPanel.ts): Builds DOS-player customization, presets, patch history, field targeting, previews, drag editing, and companion persistence.
- [`screenTabs.ts`](screenTabs.ts): Defines screen/files tabs and groups patch-table entries into field sections.
- [`playerFields.ts`](playerFields.ts): Constructs typed patch controls with validation feedback, stock resets, locked format codes, and drag refresh hooks.
- [`playerPreview.ts`](playerPreview.ts): Draws preview screens through engine renderers using project pictures/palettes and illustrative fallback content.
- [`dragStage.ts`](dragStage.ts): Handles preview hit selection, pointer movement/resizing, keyboard nudging, outlines, and commits.

## Loading and development

[`overview.ts`](../../../shell/overview.ts) dynamically loads the panel for its DOS player tab.

The panel stores validated settings in companion data; patch/export code lives outside this UI. Previews use the engine’s screen renderers but include illustrative status, save-slot and score content. Some fields are DOS-only.

## Tests

Colocated coverage includes [`aboutFields.test.ts`](aboutFields.test.ts), [`dragItems.test.ts`](dragItems.test.ts), [`patchBytes.test.ts`](patchBytes.test.ts).

From `web/`:

```sh
npx vitest run src/editor/editors/integrator/dosPlayer
```
