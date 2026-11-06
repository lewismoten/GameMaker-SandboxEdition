# `editor/editors/blocks/`: block-set pixel and behavior editor

Part of the [source map](../../../README.md).

Paints BBL, MBL and CBL block sets and exposes their kind-specific behavior, groups and character-frame views.

## Main files

- [`blocks.ts`](blocks.ts): Registers the BBL/MBL/CBL painter, coordinates native block serialization, pixel-history scopes, tools, palettes, groups, behavior panels, and character-frame painting.
- [`blockProperties.ts`](blockProperties.ts): Builds behavior fields for the selected native block: BBL walking/touch/time settings, MBL contact effects, and a picture-only explanation for CBL.
- [`groupsPanel.ts`](groupsPanel.ts): Manages companion-backed groups, assembled previews, explicit group suggestions, and requests to paint groups as one picture.
- [`characterFramesPanel.ts`](characterFramesPanel.ts): Selects linked CHR animation frames for oriented one-/two-block painting and live CBL previews.

## Loading and development

[`registry.ts`](../registry.ts) dynamically imports this file-kind editor; module evaluation registers its renderer.

BBL, MBL and CBL share the painter. Group layouts and names are companion data, while painting changes native pixels. Character-frame painting edits CBL pixels, not CHR frame definitions.

## Tests

Colocated coverage includes [`animClip.test.ts`](animClip.test.ts), [`blockAnim.test.ts`](blockAnim.test.ts), [`blockChoice.test.ts`](blockChoice.test.ts).

From `web/`:

```sh
npx vitest run src/editor/editors/blocks
```
