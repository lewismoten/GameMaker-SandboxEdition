# `editor/check/checks/`: individual static and play-derived design checks

Part of the [source map](../../../README.md).

Implements the individual checks collected by the level-check report, from block art and links to findings derived from played routes.

## Main files

- [`blockChecks.ts`](blockChecks.ts): Exposes scene-data checks for hazard art, opposing gravity, repeated rewards, waits, births, mazes, telegraphing, and look-alike footing; also provides counter/cycle helpers.
- [`playChecks.ts`](playChecks.ts): Converts exploration results into findings for stuck areas, missed content, incidents, coverage, exits, and long routes; `curve` compares exit health.
- [`linkChecks.ts`](linkChecks.ts): Checks shadowed, immediate-arrival, corner, solid, and off-map links plus structural reachability of the won scene.
- [`colorRoles.ts`](colorRoles.ts): Compares displayed block colors against project palette reservations and limits per-file finding detail.

## Loading and development

[`report.ts`](../report.ts) imports and invokes the checks explicitly.

Add check calls explicitly in the report orchestrator; files are not discovered automatically. Use the finding IDs and location/fix metadata in `../findings.ts`. Design-preference checks and incomplete exploration must not be presented as proof that a game is broken.

## Tests

Colocated coverage includes [`colorRoles.test.ts`](colorRoles.test.ts), [`colorZero.test.ts`](colorZero.test.ts), [`counterLedger.test.ts`](counterLedger.test.ts).

From `web/`:

```sh
npx vitest run src/editor/check/checks
```
