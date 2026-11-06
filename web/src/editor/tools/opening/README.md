# `editor/tools/opening/`: opening-sting selection, previews and scene wiring

Part of the [source map](../../../README.md).

Adds and removes opening stings through shared choices, previews and native scene assets for New Game and the Integrator.

## Main files

- [`openingDialog.ts`](openingDialog.ts): Adds, replaces, or removes an opening; dynamically loads card generation on Apply.
- [`openingFields.ts`](openingFields.ts): Supplies shared intro choices, preview buttons, and validated optional studio/name input.
- [`openingIntros.ts`](openingIntros.ts): Defines intro choices and fetches their bytes on demand, caching successful requests.
- [`openingWire.ts`](openingWire.ts): Recognizes, prepends, records, and removes opening assets/title-list wiring.

## Loading and development

[`integrator.ts`](../../editors/integrator/integrator.ts) dynamically opens the opening dialog; [`homeImport.ts`](../../shell/homeImport.ts) uses the shared opening fields for new games.

Output is ordinary GIF/FLI/LST content. Companion metadata tracks ownership for removal; files referenced elsewhere are retained. Recognition without metadata is filename-based and cannot recover every original style.

## Tests

Colocated coverage includes [`opening.test.ts`](opening.test.ts).

From `web/`:

```sh
npx vitest run src/editor/tools/opening
```
