# `desk/boxes/covers/`: painted box fronts

Part of the [source map](../../../README.md).

Draws box-cover artwork on canvas and caches each rendered size for reuse.

## Main modules

- [`index.ts`](index.ts): Selects and dynamically imports a painter, caches its canvas and supplies seal positions.
- [`paint.ts`](paint.ts): Provides the painter type, gradients, glows, shapes and surface finish.
- [`dog.ts`](dog.ts): Draws Teddy and Gwinn for cover scenes.
- [`leoFace.ts`](leoFace.ts): Draws Doc Leo's face in the cover figure's coordinate system.
- [`depth.ts`](depth.ts): Renders a cover scene with a small ray tracer.

## Loading

[`gameBox.ts`](../gameBox.ts) imports the registry statically. The registry dynamically imports each cover painter when requested; painters import their drawing helpers statically. The other cover modules each export a painter for their registered box.

## Tests

No tests are colocated here, and no direct cover-painter tests were found. Inspect rendered box fronts for artwork and lettering; [`manualGmCover.test.ts`](../../../../test/manualGmCover.test.ts) covers a different manual cover.

Related areas: [boxes](../README.md), [graphics](../../../gfx/README.md), [Library](../../../library/README.md).
