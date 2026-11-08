# `editor/editors/sounds/`: SND speaker and Sound Blaster effect editing

Part of the [source map](../../../README.md).

Edits a SND’s PC speaker steps and Sound Blaster sample references, with audition and effect-maker integration.

## Main files

- [`sounds.ts`](sounds.ts): Edits SND speaker-frequency arrays and VOC references, auditions both outputs and integrates generated effects.
- [`speakerFit.ts`](speakerFit.ts): Stores per-slot VOC-to-speaker fit preferences and renders their radio controls.

## Loading and development

[`registry.ts`](../registry.ts) dynamically imports this file-kind editor; module evaluation registers its renderer.

PC speaker steps and digital sample references remain separate. A conversion preview does not replace steps until accepted. VOC-to-speaker fit preferences are companion data.

## Tests

Colocated coverage includes [`speakerFit.test.ts`](speakerFit.test.ts).

From `web/`:

```sh
npx vitest run src/editor/editors/sounds
```
