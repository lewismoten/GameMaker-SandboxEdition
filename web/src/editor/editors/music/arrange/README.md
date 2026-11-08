# `editor/editors/music/arrange/`: seeded accompaniment and melody-copy transforms

Part of the [source map](../../../../README.md).

Provides seeded accompaniment, harmony estimation and melody-copy transforms behind the music editor’s dialogs.

## Main files

- [`accompany.ts`](accompany.ts): Clones a song, preserves selected tracks, allocates rhythm-mode voices and generates seeded bass, comping and drums.
- [`harmony.ts`](harmony.ts): Estimates major/minor keys from duration-weighted pitch classes and chooses chord spans with a scored Viterbi pass.
- [`styles.ts`](styles.ts): Defines style-specific bar lengths, patterns, preset IDs, fills and velocities.
- [`copyTune.ts`](copyTune.ts): Clones one melody onto channel 0, removes other channels/mode events, transposes and scales timing.

## Loading and development

[`accompanyDialog.ts`](../accompanyDialog.ts) calls accompaniment generation; [`copyTuneDialog.ts`](../copyTuneDialog.ts) copies a melody and optionally accompanies it.

Transforms are DOM-free and do not mutate the supplied song. Seeded generation is repeatable for the same inputs; harmony is an estimate, not authored key information. Voice limits can omit parts or reject a choice.

## Tests

Colocated coverage includes [`accompany.test.ts`](accompany.test.ts), [`harmony.test.ts`](harmony.test.ts).

From `web/`:

```sh
npx vitest run src/editor/editors/music/arrange
```
