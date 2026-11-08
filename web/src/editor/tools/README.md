# `editor/tools/`: file-maker registry, import/conversion and generators

Part of the [source map](../../README.md).

Registers file makers and supplies picture conversion, song generation and microphone recording to the workspace’s creation flows.

## Main files

- [`makers.ts`](makers.ts): Stores file-kind-specific maker callbacks and appends registrations.
- [`all.ts`](all.ts): Imports picture conversion, VOC recording, song composition, and Scene maker modules for registration side effects.
- [`importPicture.ts`](importPicture.ts): Converts selected image frames into previewable indexed GIF/FLI files and writes the chosen output.
- [`songMaker.ts`](songMaker.ts): Generates seeded melody/chord/bass note strings and provides CMF editing, audition, and saving.
- [`vocMaker.ts`](vocMaker.ts): Records microphone audio, trims/resamples/effects it, and saves size-limited VOC files; registers a separately loaded sound-effect maker.

## Loading and development

[`workspace.ts`](../shell/workspace.ts) dynamically loads tools/all and passes registered makers to pickFile.

Workspace imports registrations, reads the maker registry and supplies actions to the picker; the picker does not discover makers itself. Makers write ordinary native assets, with generic conversion and synthesis in SDK packages.

## Subareas

[`cards/`](cards/README.md), [`opening/`](opening/README.md).

## Tests

No colocated tests. Related coverage: [`cards.test.ts`](cards/cards.test.ts), [`opening.test.ts`](opening/opening.test.ts).

From `web/`:

```sh
npx vitest run src/editor/tools/cards/cards.test.ts src/editor/tools/opening/opening.test.ts
```
