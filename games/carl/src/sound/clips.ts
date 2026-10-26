// Digitized clips of "A Fly Named Carl" (The Bard of Bizarre), as Sound Blaster .VOC files. The
// samples (clips/<name>.pcm: 8-bit unsigned mono at 11025 Hz) are cut from the recording by
// games/carl/tools/cutClips.py, which reads the MP3 (not in the repo) and regenerates them
// exactly. Game-Maker reads a VOC's size as 16 bits, so each stays under 40,000 bytes.
//
// Cue table (seconds of the recording; edges snap to the quietest 10 ms of the voice):
//   name     start    end     length  VOC bytes  what is sung
//   hook      27.93   30.06   2.13 s    23517    chorus 1: "There's a fly in the room"
//   miss      33.53   34.73   1.20 s    13263    chorus 1: "I swing and I miss"
//   smile     54.05   55.50   1.45 s    16020    verse 2: "...to flash me a smile"
//   lamp      71.28   72.82   1.54 s    17012    chorus 2: "On my lamp"
//   named     76.32   78.82   2.50 s    27596    chorus 2: "I've named it Carl. I hate Carl."
//   window    94.94   96.81   1.87 s    20650    the bridge: "I've opened the window"
//   time     109.19  111.67   2.48 s    27375    the breakdown: "Carl has broken time"
//   seen     112.08  114.41   2.33 s    25722    the breakdown: "Carl has seen things"
//   aux      142.94  144.88   1.94 s    21422    the very end: "Carl's got the aux cord now"
// (A speech recognizer given the lyrics as a prompt hears each clip's words back.)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodeVoc } from '../../../../web/src/formats/voc';

export const CLIPS = ['hook', 'miss', 'smile', 'lamp', 'named', 'window', 'time', 'seen', 'aux'] as const;
type ClipName = (typeof CLIPS)[number];
const RATE = 11025;

const here = dirname(fileURLToPath(import.meta.url));

/** The clip as a Creative Voice File. */
export function clipVoc(name: ClipName): Uint8Array {
  const pcm = readFileSync(join(here, 'clips', `${name}.pcm`));
  const samples = new Float32Array(pcm.length);
  // encodeVoc writes round(v * 127 + 128), so this gives back the very bytes cutClips.py wrote.
  for (let i = 0; i < pcm.length; i++) samples[i] = (pcm[i] - 128) / 127;
  const voc = encodeVoc(samples, RATE);
  if (voc.length >= 40000) throw new Error(`${name}.voc is ${voc.length} bytes; Game-Maker reads 16 bits of size`);
  return voc;
}
