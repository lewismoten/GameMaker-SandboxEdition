# `editor/check/walk/`: walkthrough generation, replay verification and kept author/bot routes

Part of the [source map](../../../README.md).

Builds, replays and keeps author/bot walkthrough routes through a game using the same headless engine as verification.

## Main files

- [`scenePlan.ts`](scenePlan.ts): Ranks hub branches by unpaid counter gates, deferring branches that need resources from another trip. A failed forward route can return through a real link, including a traversal failure without a counter gate. Arrival points that failed are retried when carried state or hit points change. The dependency scan follows inherited files along scene links and targets local supplies needed by later gates before leaving a side room. Static ranking is only a suggestion, and engine exploration confirms each route.
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

Jump sequences that also fire use held and steered jump templates. Search states retain sequence availability and distinct opened-passage block values; visible counter pickups and ability refills are targets of the human-paced route.

Bot searches keep active-key checkpoints at least three ticks apart and released flight checkpoints six ticks apart so a route can keep moving over changing platforms and steer before landing. All generated strategies hold keys for at least three ticks, allow normal steering chords and direct changes, and include intermediate jump holds and sustained horizontal movement; search states keep flight momentum and favor less explored cells. The human strategy uses arrows, Space and Enter first; other strategies can try extra controls. Continuous flight uses steering moves instead of jump-and-land templates. Goal distances guide detours around permanent walls and between footings. Footing guidance can spend a finite jump once, then uses the ordinary routes left after it. Engine replay still decides whether a route works.

Key searches move every monster, and exits retain separate paths for different carried supplies. A required pickup on a wanted exit keeps its real transition; the key search does not require a resting state between the pickup and leaving.

Detailed maze and key searches keep exact alignment and human-spaced steering checkpoints while a walk animation is still running; the first human route keeps its smaller search. Movement-mode inference ignores permanent walls and terrain that kills on contact. After each key trip, targets follow the replayed world: collected supplies and already paid counters no longer attract the next search. If an exhausted search cannot fetch more keys from a pickup, key planning can retry from the preceding checkpoint within the same time and trip limits; discarded tries never enter the recording.
