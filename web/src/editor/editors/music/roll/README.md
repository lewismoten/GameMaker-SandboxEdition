# `editor/editors/music/roll/`: layered piano-roll input and cached rendering

Part of the [source map](../../../../README.md).

Splits piano-roll state, input and drawing into layers, with cached tiles and dirty tick ranges for incremental repaint.

## Main files

- [`state.ts`](state.ts): Captures painted note attributes and computes merged dirty tick spans between renders.
- [`view.ts`](view.ts): Owns canvas setup, resizing, coordinate conversion, zoom/scroll and hit testing.
- [`pointer.ts`](pointer.ts): Handles note gestures, selection, velocity editing, ruler/end dragging, wheel navigation and deletion.
- [`draw.ts`](draw.ts): Synchronizes render caches, composites visible tiles and draws transient overlays.
- [`paint.ts`](paint.ts): Paints scrolling grid, notes, ruler, program lane and velocity bars into tile stretches.
- [`tiles.ts`](tiles.ts): Maintains reusable 256-world-pixel canvas tiles with partial repaint and eviction.
- [`layout.ts`](layout.ts): Defines lane measurements, drag types, note labels and program lookup.

## Loading and development

[`roll.ts`](../roll.ts) extends the pointer layer with keyboard editing; [`music.ts`](../music.ts) constructs the complete PianoRoll.

The class chain is `RollView` → `RollDraw` → `RollPointer` → the parent `PianoRoll`. Keep edits in MusicDoc transactions and include new visible state in cache invalidation. Playback frame updates do not resynchronize edited content.

## Tests

No colocated tests. Related coverage: [`trackClip.test.ts`](../trackClip.test.ts), [`trackOrder.test.ts`](../trackOrder.test.ts). These song-model tests do not cover canvas gestures or tile rendering.

From `web/`:

```sh
npx vitest run src/editor/editors/music/trackClip.test.ts src/editor/editors/music/trackOrder.test.ts
```
