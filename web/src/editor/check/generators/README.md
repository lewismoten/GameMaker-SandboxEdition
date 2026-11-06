# `editor/check/generators/`: one-click fixes and maze setup using ordinary game data

Part of the [source map](../../../README.md).

Turns supported findings into suggested fixes and builds maze paint operations from the game’s existing materials.

## Main files

- [`fixes.ts`](fixes.ts): Resolves a finding’s fix ID into a labeled operation declaring potentially changed files and applying serialized game-file changes.
- [`blockArt.ts`](blockArt.ts): Computes art bounds, stretches hazard art, chooses contrasting colors, and outlines sprites without altering block settings.
- [`mapFixes.ts`](mapFixes.ts): Computes ladder cells/blocks, air and landmark candidates, landmark placements, and seeded maze paint pairs.
- [`mazeFor.ts`](mazeFor.ts): Chooses existing map/block-set materials and returns maze paint pairs for a rectangle.

## Loading and development

[`checkPanel.ts`](../../editors/map/check/checkPanel.ts) imports fixes and applies them through its history-aware host.

Fixes declare the files they may change. The map check panel snapshots those files and owns Undo; these helpers do not supply a separate transaction layer.

## Tests

Colocated coverage includes [`generators.test.ts`](generators.test.ts).

From `web/`:

```sh
npx vitest run src/editor/check/generators
```
