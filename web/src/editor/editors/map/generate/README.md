# `editor/editors/map/generate/`: seeded map-generation dialog and placement

Part of the [source map](../../../../README.md).

Offers seeded layouts with real block previews and validation, then places the chosen result or creates linked scenes.

## Main files

- [`generateDialog.ts`](generateDialog.ts): Presents seeded layout offers, role requirements, actual block previews, validation/bot status, layout application, and optional scene creation.
- [`makeScenes.ts`](makeScenes.ts): Plans eligible proposed links, generates verified maps, creates scenes and return links, and reports skipped proposals.
- [`place.ts`](place.ts): Places generated cells with terrain adaptation, selects usable monster IDs, replaces area monsters, and builds seeded offers.
- [`platformBotClient.ts`](platformBotClient.ts): Runs each side-view validation job in a module worker, forwards required files, and terminates/rejects on cancellation.

## Loading and development

[`map.ts`](../map.ts) dynamically opens Generate and imports placement.

Applying a layout is one Undo step. Optional scene creation is different: the dialog warns that those scenes must be removed in the Integrator. Reach/proof validation does not judge monsters or fun.

## Tests

Colocated coverage includes [`makeScenes.test.ts`](makeScenes.test.ts), [`place.test.ts`](place.test.ts), [`props.test.ts`](props.test.ts).

From `web/`:

```sh
npx vitest run src/editor/editors/map/generate
```
