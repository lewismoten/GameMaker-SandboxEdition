# `editor/check/walk/`: walkthrough generation, replay verification and kept author/bot routes

Part of the [source map](../../../README.md).

Builds, replays and keeps author/bot walkthrough routes through a game using the same headless engine as verification.

## Main files

- [`autoWalk.ts`](autoWalk.ts): Builds recorded routes from the title’s first link, trying author/reused keys and bot strategies while carrying replayed state between scenes.
- [`walkClient.ts`](walkClient.ts): Runs the bot worker; cancellation discards work, while stopping verifies the last completed-scene checkpoint in a fresh worker.
- [`walkWorker.ts`](walkWorker.ts): Supports whole-game, single-scene, and supplied-walk verification requests, then attaches measured timeline data.
- [`verify.ts`](verify.ts): Replays through headless `WalkRun` and returns won status, frames, chapters, entered scenes, remaining keys, and errors.
- [`keptWalk.ts`](keptWalk.ts): Shapes saved results and reusable routes, and persists look-only games’ walkthrough/play sections separately in browser storage.

## Loading and development

[`walkDialog.ts`](../../widgets/walkDialog.ts) starts the worker client and keeps results; [`walkAuto.ts`](../../../../scripts/walkAuto.ts) calls generation and verification headlessly.

Stop keeps a completed-scene checkpoint and verifies it in a fresh worker; Cancel discards work. Generation and replay verification report separate won states. Saved walkthroughs are companion metadata, not REC demo files.

## Tests

Colocated coverage includes [`autoWalk.test.ts`](autoWalk.test.ts), [`bestAttempt.test.ts`](bestAttempt.test.ts), [`botRoutes.test.ts`](botRoutes.test.ts).

From `web/`:

```sh
npx vitest run src/editor/check/walk
```
