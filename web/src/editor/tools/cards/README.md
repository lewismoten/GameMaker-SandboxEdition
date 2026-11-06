# `editor/tools/cards/`: instruction and level-card dialogs and generated files

Part of the [source map](../../../README.md).

Builds instruction and level cards from entered words and game controls, then wires their native assets into scenes.

## Main files

- [`cardDialog.ts`](cardDialog.ts): Collects instruction/level-card fields, previews text pages, and invokes asset wiring.
- [`cardText.ts`](cardText.ts): Wraps text, derives key descriptions, builds card lines, serializes DOS text, and orders levels through scene links.
- [`cardBackdrop.ts`](cardBackdrop.ts): Encodes the framed light-paper backdrop as a GIF.
- [`cardWire.ts`](cardWire.ts): Writes TXT plus optional GIF/LST assets and updates instructions slot 6 or intro slot 9.

## Loading and development

[`integrator.ts`](../../editors/integrator/integrator.ts) dynamically opens instruction/level-card dialogs and saves after success.

Cards write native TXT and optional GIF/LST assets. Integrator owns the subsequent GAM save, and old slot assets remain. Card text wraps to 30 columns; level cards are capped at 16 lines.

## Tests

Colocated coverage includes [`cards.test.ts`](cards.test.ts).

From `web/`:

```sh
npx vitest run src/editor/tools/cards
```
