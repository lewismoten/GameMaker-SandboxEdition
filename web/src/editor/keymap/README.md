# `editor/keymap/`: computed game controls and reusable Keys dialog

Part of the [source map](../../README.md).

Derives game-control descriptions from character data and presents them in reusable Keys dialogs and desk cards.

## Main files

- [`keyMap.ts`](keyMap.ts): Derives sequence/joystick action descriptions, groups bindings across characters and gathers built-in keys and instructions.
- [`keyMapView.ts`](keyMapView.ts): Builds the reusable Keys dialog with keyboard diagrams, action details, object/monster pictures and instructions.

## Loading and development

[`player.ts`](../../player/player.ts) dynamically opens the Keys dialog; [`keyCard.ts`](../../desk/pc/keyCard.ts) uses computed bindings for desk cards.

Action labels are inferred from sequence movement and jump behavior, not guaranteed authored semantics. Whole-game collection uses named scene characters, with folder fallback when no levels are collected.

## Tests

No colocated tests. Related coverage: [`keyMap.test.ts`](../../../test/keyMap.test.ts), [`keyCardRows.test.ts`](../../../test/keyCardRows.test.ts), [`keyStrip.test.ts`](../../desk/pc/keyStrip.test.ts).

From `web/`:

```sh
npx vitest run test/keyMap.test.ts test/keyCardRows.test.ts src/desk/pc/keyStrip.test.ts
```
