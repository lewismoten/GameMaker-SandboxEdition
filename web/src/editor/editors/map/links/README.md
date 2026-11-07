# `editor/editors/map/links/`: integrator link markers and detail popover on maps

Part of the [source map](../../../../README.md).

Shows GAM exits and arrivals on a map and lets authors inspect, move and edit those links.

## Main files

- [`linkMarkers.ts`](linkMarkers.ts): Creates arrival/exit marker controls, groups shared locations, coordinates drag/nudge edits, and saves validated GAM changes through a history-aware adapter.
- [`linkPopover.ts`](linkPopover.ts): Displays source/destination previews and link-edit/remove fields using the marker adapter.
- [`markerMath.ts`](markerMath.ts): Derives markers/groups and computes marker geometry, pointer cells, stacking, and clamped nudges without DOM access.

## Loading and development

[`map.ts`](../map.ts) constructs markers; their detail popover loads on demand.

Markers edit GAM links, not map cells. The host supplies Undo and saves; Integrator helpers enforce link conflicts and read-only projects reject edits.

## Tests

Colocated coverage includes [`markerMath.test.ts`](markerMath.test.ts).

From `web/`:

```sh
npx vitest run src/editor/editors/map/links
```
