# `editor/editors/map/tools/`: map selection, terrain, stamps and building tools

Part of the [source map](../../../../README.md).

Supplies selection, terrain, stamps and building gestures through the map editor’s history-aware host.

## Main files

- [`toolController.ts`](toolController.ts): Coordinates tool gestures, selection/clipboard actions, previews, brush setup, native-cell changes, and host-owned save/Undo hooks.
- [`selection.ts`](selection.ts): Captures rectangular/polygon selections, masks unselected cells, and handles wrapped reads.
- [`autotile.ts`](autotile.ts): Maps neighbor masks to terrain blocks and paints/erases terrain with adjacent-cell repair and optional wrapping.
- [`building.ts`](building.ts): Assembles roof/wall/door/window grids and places nonempty cells with optional wrapping.

## Loading and development

[`map.ts`](../map.ts) constructs MapTools with host change/history hooks.

Tools call the host’s history and change hooks rather than saving independently. Brush definitions live in BBL companion data. Selection masks use skipped cells, and wrapping does not change native block IDs.

## Tests

Colocated coverage includes [`autoDetect.test.ts`](autoDetect.test.ts), [`autotile.test.ts`](autotile.test.ts), [`blockMarks.test.ts`](blockMarks.test.ts).

From `web/`:

```sh
npx vitest run src/editor/editors/map/tools
```
