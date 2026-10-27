# `audio/`: music and sound

Part of the [source map](../README.md).

`opl.ts` (OPL2 FM emulation), `cmfPlayer.ts` (port of `PlayIt` and the SBFMDRV
calls; `cmfLoad.ts` reads a song's header as its `load_file` did, CMF 1.0 included, and refuses
what it refused), the AudioWorklet (`music.worklet.ts`), Web Audio output (`engine.ts`, the page's one
`context.ts`, one volume for everything in `output.ts`), PC speaker sound sets (`vocToSpeaker.ts`
drafts one from a `.voc`'s pitch) and sample editing (`sampleEdit.ts`).

- Music: `compose.ts` writes `.CMF` songs from notes as text (shared with `games/kit`); the
  instrument presets are `oplPresets.ts` and `oplDrumPresets.ts` (written with `oplPatch.ts`,
  shown off by `oplPresetPreview.ts`).
- Sound effects: `sfxSynth.ts` and `sfxPresets.ts` (the sound effect maker); `soundProfile.ts`
  sorts digital sounds into kinds by listening to them.
- `voices.ts`: the people on the other end of the desk's phone line, in the browser's speech.
