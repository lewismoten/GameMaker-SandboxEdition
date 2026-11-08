# `editor/colorHelp/`: optional color naming, look-alike warnings and simulated previews

Part of the [source map](../../README.md).

Adds optional color names, look-alike warnings and simulated previews to painting and palette controls.

## Main files

- [`blockColorHelp.ts`](blockColorHelp.ts): Combines preferences, simulated preview, and advisory warnings for touching look-alike colors.
- [`colorHelpControl.ts`](colorHelpControl.ts): Builds synchronized preference controls and dynamically loads `quickCheck` when requested.
- [`colorHelpPrefs.ts`](colorHelpPrefs.ts): Parses, caches, stores, and broadcasts browser-local preferences under `gm-color-help`.
- [`quickCheckLogic.ts`](quickCheckLogic.ts): Converts tile-choice misses into optional preference suggestions.

## Loading and development

[`blocks.ts`](../editors/blocks/blocks.ts) constructs and disposes painter help; [`palette.ts`](../editors/palette/palette.ts) adds the preference controls.

Warnings are advisory and do not block edits. Quick-check suggestions require acceptance and are preference assistance, not a medical test. Preferences stay in this browser.

## Tests

Colocated coverage includes [`alike.test.ts`](alike.test.ts), [`colorHelpPrefs.test.ts`](colorHelpPrefs.test.ts), [`colorNames.test.ts`](colorNames.test.ts).

From `web/`:

```sh
npx vitest run src/editor/colorHelp
```
