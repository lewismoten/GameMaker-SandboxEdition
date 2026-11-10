# `audio/chez/`: THE CHEZ's motor sound

Part of the [source map](../../README.md).

Synthesizes the same motor, contactor and road sounds for the cast stage and the desk window.

## Main modules

- [`chezSound.ts`](chezSound.ts): Creates a controllable motor or a timed pass-by sound.
- [`chezSynth.ts`](chezSynth.ts): Builds the Web Audio voice and schedules acceleration, coasting and contactor sounds.
- [`chezTypes.ts`](chezTypes.ts): Defines motor controls, options, measured constants, noise and the output chain.

## Loading

Imported statically by [`castSound.ts`](../../cast/castSound.ts) and [`propSound.ts`](../../desk/props/propSound.ts); this folder has no dynamic entry point of its own.

## Tests

[`chezSound.test.ts`](chezSound.test.ts) checks lifecycle cleanup and acceleration with a fake audio context. Sound quality still needs listening.

Related areas: [audio](../README.md), [cast](../../cast/README.md), [desk props](../../desk/props/README.md).
