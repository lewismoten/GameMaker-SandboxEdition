# `editor/editors/animation/shrink/`: worker-backed FLI size reduction and real result preview

Part of the [source map](../../../../README.md).

Analyzes and reduces FLI size in workers, showing the decoded result before it is applied or copied.

## Main files

- [`shrinkPanel.ts`](shrinkPanel.ts): Presents size analysis, synchronized original/result playback, options, and apply-or-copy behavior.
- [`shrinkClient.ts`](shrinkClient.ts): Launches separate report/shrink workers and terminates jobs on completion or cancellation.
- [`shrinkWorker.ts`](shrinkWorker.ts): Dispatches size reports or `shrinkFli`, returning data or an error.
- [`shrinkOptions.ts`](shrinkOptions.ts): Builds ordered optimization steps and describes size/visibility changes.

## Loading and development

[`animation.ts`](../animation.ts) dynamically imports the panel when requested.

Previews decode the actual result bytes. Lossless steps always run; lossy steps are opt-in. Apply requires a smaller result and uses the parent editor’s Undo callback; look-only games offer a copy instead.

## Tests

Colocated coverage includes [`shrinkOptions.test.ts`](shrinkOptions.test.ts).

From `web/`:

```sh
npx vitest run src/editor/editors/animation/shrink
```
