# `editor/editors/recording/`: REC demo recording, playback and trimming

Part of the [source map](../../../README.md).

Records, plays and trims native REC demos, including optional conversion of bot walkthrough keys into a demo.

## Main files

- [`recording.ts`](recording.ts): Registers REC editing and human/bot makers; records engine sessions, plays demos and saves timeline edits.
- [`recTimelineModel.ts`](recTimelineModel.ts): Converts delta records into events/presses, models timing and supports trimming, retiming and pause shortening.
- [`botDemo.ts`](botDemo.ts): Replays walkthrough keys on the engine and converts them to bounded REC events with held-key releases and optional Esc.
- [`botDemoWorker.ts`](botDemoWorker.ts): Builds or reuses a walkthrough, then posts progress and the converted demo.

## Loading and development

[`registry.ts`](../registry.ts) dynamically imports this file-kind editor; module evaluation registers its renderer.

REC is native demo data, not walkthrough JSON: it starts from normal Play and has a 1,000-event ceiling. Between-screen key polling and gameplay timing are modeled separately.

## Tests

Colocated coverage includes [`botDemo.test.ts`](botDemo.test.ts).

From `web/`:

```sh
npx vitest run src/editor/editors/recording
```
