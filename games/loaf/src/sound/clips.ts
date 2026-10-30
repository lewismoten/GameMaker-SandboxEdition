// Digitized clips of "Loaf #13 (Left in the Basket)" (The Bard of Bizarre), as Sound Blaster
// .VOC files. The previewable source samples (clips/<name>.wav: lossless 8-bit unsigned mono WAV) are cut from the recording by
// games/loaf/tools/cutClips.py, which reads the MP3 (not in the repo) and regenerates them
// exactly. Game-Maker reads a VOC's size as 16 bits, so each stays under 40,000 bytes.
//
// Cue table (seconds of the recording; edges snap to the quietest 10 ms of the voice):
//   name     start    end     length  rate      VOC bytes  what is sung
//   bread     69.20   71.44   2.24 s  11025 Hz    24729    chorus 1: "I'm still bread!"
//   countme   72.23   75.32   3.09 s  11025 Hz    34100    chorus 1: "Don't count me out!"
//   twelve   106.25  108.22   1.97 s  11025 Hz    21753    the bridge: "twelve baskets full"
//   wasted   113.03  116.63   3.60 s  11025 Hz    39723    the bridge: "Nothing's ever wasted."
//   still    195.73  199.33   3.60 s  11025 Hz    39723    the very end, hushed: "I'm still bread."
//   mama     135.84  140.51   4.67 s   8000 Hz    37394    verse 3: "Mama, look what I've got..."
//                                                          (spliced round a breath)
// (A speech recognizer given the lyrics as a prompt hears each clip's words back.)
import { audioFileToVoc } from '@lewismoten/gamemaker-sandbox-tools/audio-files';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLIPS = { bread: 11025, countme: 11025, twelve: 11025, wasted: 11025, still: 11025, mama: 8000 } as const;
type ClipName = keyof typeof CLIPS;

const here = dirname(fileURLToPath(import.meta.url));

/** The clip as a Creative Voice File at its own rate. */
export function clipVoc(name: ClipName): Uint8Array {
  return audioFileToVoc(join(here, 'clips', `${name}.wav`), { sampleRate: CLIPS[name], maxBytes: 39999 });
}
