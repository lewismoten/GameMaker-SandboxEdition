# `editor/editors/map/check/`: level-check UI, heat maps and author play sessions

Part of the [source map](../../../../README.md).

Presents the level-check worker’s progress, heat and findings beside the map, along with the author’s recorded play heat.

## Main files

- [`checkPanel.ts`](checkPanel.ts): Runs scene checks through the worker client and presents live/saved heat, findings, acceptance controls, fixes, legends, and comparison views.
- [`myHeat.ts`](myHeat.ts): Records touched cells/deaths from elapsed ticks, merges sparse session data, and computes combined/comparison heat and coverage.
- [`playSession.ts`](playSession.ts): Associates recorded frames with scenes sharing the selected map, extracts scene takes, and persists accumulated heat.
- [`markInfo.ts`](markInfo.ts): Converts heat steps and overlay marks into tooltip/readout text.

## Loading and development

[`map.ts`](../map.ts) dynamically loads the check panel; [`playScene.ts`](../../../widgets/playScene.ts) records play-session heat.

Results and author heat are companion data. Fixes change ordinary game files and use panel-owned Undo. Hiding the panel clears overlays but does not cancel an active worker.

## Tests

Colocated coverage includes [`markInfo.test.ts`](markInfo.test.ts), [`myHeat.test.ts`](myHeat.test.ts), [`playSession.test.ts`](playSession.test.ts).

From `web/`:

```sh
npx vitest run src/editor/editors/map/check
```
