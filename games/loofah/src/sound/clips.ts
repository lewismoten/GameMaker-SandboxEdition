// Digitized clips of "Cleanse Me, O Loofah, But Leave My Soul" (The Bard of Bizarre), as Sound
// Blaster .VOC files. The samples (clips/<name>.pcm: 8-bit unsigned mono) are cut from the
// recording by games/loofah/tools/cutClips.py, which reads the MP3 (not in the repo) and
// regenerates them exactly. Game-Maker reads a VOC's size as 16 bits, so each stays under
// 40,000 bytes.
//
// Cue table (seconds of the recording; edges snap to the quietest 10 ms of the voice):
//   name      start    end     length  rate      VOC bytes  what is sung
//   pink       1.62    4.65   3.03 s  11025 Hz    33439    verse 1: "Don't touch the pink one. It's mine!"
//   wrong      9.08   11.22   2.14 s  11025 Hz    23627    verse 1: "...just a loofah. How wrong I was."
//   lucifer   59.74   61.79   2.05 s  11025 Hz    22635    chorus 1: "Loofah of Lucifer"
//   rough     90.56   91.66   1.10 s  11025 Hz    12161    after chorus 1: "Rough!"
//   line     116.43  117.89   1.46 s  11025 Hz    16130    verse 3: "You crossed a line"
//   scream   120.29  124.09   3.80 s   8000 Hz    30433    verse 3: "My towel screams, YOU MADE IT WORSE!"
//   worse    121.81  124.09   2.28 s  11025 Hz    25170    verse 3: "YOU MADE IT WORSE!"
//   scrubbus 124.22  126.77   2.55 s  11025 Hz    28147    the bridge: "Scrubbus maximus"
//   brine    129.29  134.19   4.90 s   8000 Hz    39234    the bridge: "Lather my guilt in rosemary brine"
//   mango    159.28  161.42   2.14 s  11025 Hz    23627    chorus 2: "You smelled of mango"
//   never    183.58  186.13   2.55 s  11025 Hz    28147    the end: "Never touch the loofah."
// (A speech recognizer hears each clip's words back.)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodeVoc } from '../../../../web/src/formats/voc';

export const CLIPS = {
  pink: 11025,
  wrong: 11025,
  lucifer: 11025,
  rough: 11025,
  line: 11025,
  scream: 8000,
  worse: 11025,
  scrubbus: 11025,
  brine: 8000,
  mango: 11025,
  never: 11025,
} as const;
export type ClipName = keyof typeof CLIPS;

const here = dirname(fileURLToPath(import.meta.url));

/** A clip's samples (-1..1) at its own rate. */
export function clipSamples(name: ClipName): Float32Array {
  const pcm = readFileSync(join(here, 'clips', `${name}.pcm`));
  const samples = new Float32Array(pcm.length);
  // encodeVoc writes round(v * 127 + 128), so this gives back the very bytes cutClips.py wrote.
  for (let i = 0; i < pcm.length; i++) samples[i] = (pcm[i] - 128) / 127;
  return samples;
}

/** Samples as a Creative Voice File (checked against Game-Maker's 16-bit size). */
export function vocOf(name: string, samples: Float32Array, rate: number): Uint8Array {
  const voc = encodeVoc(samples, rate);
  if (voc.length >= 40000) throw new Error(`${name}.voc is ${voc.length} bytes; Game-Maker reads 16 bits of size`);
  return voc;
}

/** The clip as a Creative Voice File at its own rate. */
export function clipVoc(name: ClipName): Uint8Array {
  return vocOf(name, clipSamples(name), CLIPS[name]);
}
