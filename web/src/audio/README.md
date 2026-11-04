# `audio/`: music and sound

Part of the [source map](../README.md). Playback modules (`opl`, `cmfPlayer`, `cmfLoad`, `music.worklet`, `engine`, `context`, `output`) now live in the [engine workspace](../../packages/engine/README.md), under `src/audio/`. CMF composition belongs to the [tools workspace](../../packages/tools/README.md), `src/music/compose.ts`. This folder retains editor-specific tools, presets and integration tests.

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

## The 64 KB .VOC limit

`vocLimit.ts` holds the size PLAYGAME can load. `PlaySbVocFile` (`code/GM/SOUNDC.C`) reads the
whole file with a 16-bit size (`new char[vocfilesize]`, `read(..., (uint) vocfilesize)`), so a
sound of 64 KB or more is cut short or fails. The limit used is 65,535 bytes, header included
(`VOC_MAX_BYTES`), which is `VOC_MAX_SAMPLES` (65,502) 8-bit samples as `encodeVoc` writes
them: about 5.9 s at 11 kHz. The web engine plays a larger file anyway; the editor only warns
(the Level check's `voc-size` finding, an import warning) and stops a recording at the limit.

## The wall phone's voices (`phone/`)

The 1994 desk's wall phone and the picked-up kitchen extension speak recorded clips
(`public/phone/voice/<caller>/<id>.ogg`, with its own README and `index.json`), falling back to the
browser's speech (`voices.ts`) only for a line with no clip or a clip that fails to load.

- `phoneScript.ts`: every fixed line and who says it (calls.ts, hintLine.ts, phone.ts and the
  extension take their words from it, so none can lack a clip).
- `phoneCast.ts`: each caller's voice, cast like the tour's hosts (Kokoro stock voices, or Pocket
  TTS clones of voice samples; never Lewis's own).
- `phoneClips.ts`: cuts a line into sentence clips and splices the two lines with numbers (the
  time; Teddy's pretend bill, up to $99.99, above which the browser speaks it).
- `phonePlayer.ts`: plays them through one shared phone line (300 to 3400 Hz band-pass, a little
  hiss) in Web Audio, following the Voice channel.

Record with `npm run voice:phone`, check with `npm run voice:phone:check` (`web/scripts/README.md`).
The test `scripts/narrate/phoneLines.test.ts` fails if a line has no clip.
