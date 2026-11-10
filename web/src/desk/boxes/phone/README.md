# `desk/boxes/phone/`: phone kit 3D viewer

Part of the [source map](../../../README.md).

Displays the phone kit as assembled parts, an exploded view, electronics or a bare board, using generated mesh data.

## Main modules

- [`phoneData.ts`](phoneData.ts): Parses and fetches variant parts, filters groups and builds the printer-parts ZIP.
- [`phoneExplode.ts`](phoneExplode.ts): Computes stack offsets from part bounds while keeping the board fixed.
- [`phoneMesh.ts`](phoneMesh.ts): Converts axes and triangle winding and produces vertices with smoothed normals and colors.
- [`phoneGl.ts`](phoneGl.ts): Draws parts in WebGL and frames the visible groups and explosion.
- [`phoneViewer.ts`](phoneViewer.ts): Adds view controls, variant selection, rotation, zoom, pan and visibility handling.

## Loading

[`trinketShelf.ts`](../trinketShelf.ts) dynamically imports the viewer on first use. [`feelieThumbs.ts`](../feelieThumbs.ts) dynamically imports the data and renderer for thumbnails. Availability and download callers also import data helpers statically; mesh files are fetched on demand.

## Tests

[`phoneData.test.ts`](phoneData.test.ts) checks parsing, groups, sizes and explosion math. [`phoneBay.test.ts`](phoneBay.test.ts), [`phoneCase.test.ts`](phoneCase.test.ts) and [`phoneClearance.test.ts`](phoneClearance.test.ts) check generated mechanical data. WebGL appearance and gestures need a browser check.

Related areas: [boxes](../README.md), [printables](../../../manual/printables/README.md), [wall phone](../../room/phone/README.md).
