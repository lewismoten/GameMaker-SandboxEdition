# `editor/editors/slideShow/`: LST media sequencing on a timeline

Part of the [source map](../../../README.md).

Edits LST media sequences on a timeline, with a media bin, transition controls and engine-backed playback.

## Main files

- [`slideShow.ts`](slideShow.ts): Owns LST entries, Undo/save, media bin, inspector, cached thumbnails and engine-based preview.
- [`slideTimeline.ts`](slideTimeline.ts): Calculates transition timing, widths, duration summaries and entry movement.
- [`timelineInput.ts`](timelineInput.ts): Handles media insertion, clip reordering/removal, edge resizing and timeline keyboard controls through owner callbacks.

## Loading and development

[`registry.ts`](../registry.ts) dynamically imports this file-kind editor; module evaluation registers its renderer.

An absent pause waits for a key, zero continues immediately, and a positive pause is a maximum wait. Text waits per page and nested lists keep their own timing, so timeline duration is not a guaranteed playback duration.

## Tests

No colocated tests. Related coverage: [`slideTimeline.test.ts`](../../../../test/slideTimeline.test.ts), [`registry.test.ts`](../registry.test.ts).

From `web/`:

```sh
npx vitest run test/slideTimeline.test.ts src/editor/editors/registry.test.ts
```
