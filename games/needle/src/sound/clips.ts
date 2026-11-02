// Digitized clips of "Thread the Needle, Brother Camel" (The Bard of Bizarre), as Sound Blaster
// .VOC files. The previewable source samples (clips/<name>.wav: 8-bit unsigned mono at 11025 Hz) are cut from the
// recording by games/needle/tools/cutClips.py, which reads the MP3 (not in the repo) and
// regenerates them exactly. Game-Maker reads a VOC's size as 16 bits, so each stays under 40,000 bytes.
//
// Cue table (seconds of the recording; edges snap to the quietest 10 ms of the voice):
//   name      start    end     length  VOC bytes  what is sung
//   thread    121.88  124.58   2.70 s    29801    the last chorus: "Thread the needle, Brother Camel..."
//   squeeze   124.58  125.85   1.27 s    14035    "...squeeze on through!"
//   gold      135.96  139.50   3.54 s    39062    "(So) drop that gold and run your race!"
//   dream     151.78  155.38   3.60 s    39723    "Even a camel can dream!"
//   humpdown  161.04  164.08   3.04 s    33549    the outro, long and slow: "Hump... down..."
// (A speech recognizer given the lyrics as a prompt hears the first four back word for word; the
// outro's drawn-out "Hump down" it finds only in the whole outro.)
import { audioFileToVoc } from '@lewismoten/gamemaker-sandbox-tools/audio-files';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CLIPS = ['thread', 'squeeze', 'gold', 'dream', 'humpdown'] as const;
type ClipName = (typeof CLIPS)[number];

const here = dirname(fileURLToPath(import.meta.url));

/** The clip as a Creative Voice File at 11025 Hz. */
export function clipVoc(name: ClipName): Uint8Array {
  return audioFileToVoc(join(here, 'clips', `${name}.wav`), { sampleRate: 11025, maxBytes: 39999 });
}
