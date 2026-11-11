# `editor/check/`: level check orchestration, worker protocol, exploration and reporting

Part of the [source map](../../README.md).

Runs level checks against native game data and engine-backed exploration, returning findings and route/heat data for editor and assistant callers.

## Main files

- [`client.ts`](client.ts): `startCheck` launches the module worker, forwards progress/live messages, resolves the report, and rejects cancellation with `AbortError`.
- [`worker.ts`](worker.ts): Reconstructs `GameFiles`, calls `runChecks`, and posts progress, live data, completion, or errors.
- The portable animation check is `fliCheck` from `@lewismoten/gamemaker-sandbox-tools/fli-check`, shared with the kit runner through `report.ts`.
- [`report.ts`](report.ts): Collects scene/game checks, optional exploration and comparison runs, then deduplicates and sorts findings into serializable summaries.
- [`sim.ts`](sim.ts): `SceneSim` loads and ticks engine worlds with synthetic keys, seeded randomness, and compact snapshot/restore support.
- [`terrainStates.ts`](terrainStates.ts): Follows touch and animation cycles to identify possible passages and footings for planning.
- [`platformGoals.ts`](platformGoals.ts): Ranks platform routes between footings with relaxed jump arcs, including map wrapping, so falling past an exit does not replace a stair route. Actual moves and replay determine reachability.
- [`goalDistances.ts`](goalDistances.ts): Ranks goals by wrapped distance around permanent walls, allowing blocks that can open through touch or animation. It guides search without claiming that a jump or gate is reachable.
- [`explore.ts`](explore.ts): Searches bucketed scene states using generated moves, recording heat, exits, incidents, and graph edges, then confirms suspected stuck areas.

## Loading and development

[`checkPanel.ts`](../editors/map/check/checkPanel.ts) calls startCheck to run the worker; [`editorContext.ts`](../../assistant/bridge/editorContext.ts) loads the client dynamically for assistant context.

Findings are suggestions, not proof of playability. Disabling exploration does not disable every engine-backed probe. Accepted finding keys are stored in companion data; acceptance changes presentation, not the check report.

## Subareas

[`checks/`](checks/README.md), [`generators/`](generators/README.md), [`walk/`](walk/README.md).

## Tests

Colocated coverage includes [`accepted.test.ts`](accepted.test.ts), [`checks.test.ts`](checks.test.ts), [`course.test.ts`](course.test.ts).

From `web/`:

```sh
npx vitest run src/editor/check
```
