# `editor/editors/map/`: map painting, monsters, viewport and play entry

Part of the [source map](../../../README.md).

Paints native maps and places monsters while coordinating viewport gestures, tools, links, checks, generation and play tests.

## Main files

- [`map.ts`](map.ts): Registers native map painting/monster placement and coordinates history, tools, links, view state, exports, generation, checks, and play-from-view entry.
- [`mapViewport.ts`](mapViewport.ts): Implements bounded/repeating viewport rendering and native-versus-continuous gesture coordinate conversion.
- [`mapViews.ts`](mapViews.ts): Reads/writes per-project/map zoom and position in bounded localStorage history.
- [`mapTouchGestures.ts`](mapTouchGestures.ts): Arbitrates pinch/pan/long-press gestures ahead of painting handlers and requests stroke cancellation through callbacks.

## Loading and development

[`registry.ts`](../registry.ts) dynamically imports this file-kind editor; module evaluation registers its renderer.

Repeating the viewport does not enlarge native map storage. Position and zoom are browser-local; the Wrap preference is companion-backed. Link edits also preserve GAM bytes in map Undo.

## Subareas

[`check/`](check/README.md), [`generate/`](generate/README.md), [`links/`](links/README.md), [`tools/`](tools/README.md).

## Tests

Colocated coverage includes [`mapTouchGestures.test.ts`](mapTouchGestures.test.ts), [`mapViews.test.ts`](mapViews.test.ts), [`mapWrap.test.ts`](mapWrap.test.ts).

From `web/`:

```sh
npx vitest run src/editor/editors/map
```

A Scenes link with `generate=1` opens layout generation once, then removes that request from the address. New-map feedback also points to Generate in the Blocks panel.
