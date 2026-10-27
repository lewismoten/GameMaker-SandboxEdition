// Digitized lines of "The Great Dairy Reckoning of 3:17 a.m." (The Bard of Bizarre, spoken), as
// Sound Blaster .VOC files. The samples (clips/<name>.pcm: 8-bit unsigned mono) are cut from the
// recording by games/reckoning/tools/cutClips.py, which reads the MP3 (not in the repo) and
// regenerates them exactly. Game-Maker reads a VOC's size as 16 bits, so each stays under
// 40,000 bytes.
//
// Cue table (seconds of the recording; edges snap to the quietest 10 ms of the voice):
//   name     start    end     length  rate      VOC bytes  what is said
//   enemy      0.00    3.57   3.57 s  11025 Hz    39393    "The enemy. And the lover."
//   cant      14.25   17.27   3.02 s  11025 Hz    33329    "I shouldn't. I can't."
//   intol     17.59   21.87   4.28 s   8000 Hz    34273    "I am lactose intolerant."
//   better    39.43   40.52   1.09 s  11025 Hz    12051    "You know better."
//   betray    73.58   76.51   2.93 s  11025 Hz    32337    "Why must betrayal taste so good?!"
//   ohno      77.83   80.73   2.90 s  11025 Hz    32006    "Oh no, oh no, oh no no no no no"
//   worth    111.88  114.12   2.24 s  11025 Hz    24729    "IT'S NOT WORTH IT!"
//   demon    115.78  119.70   3.92 s   8000 Hz    31393    "Sweet dairy demon, you lie!"
//   colon    122.73  124.97   2.24 s  11025 Hz    24729    "My colon is in open rebellion!"
//   coward   128.61  131.47   2.86 s  11025 Hz    31565    the Devil: "You lactose-weak mortal. You cheesy coward."
//   begone   131.88  133.49   1.61 s  11025 Hz    17784    "Begone, foul beast!"
//   almond   133.83  136.07   2.24 s  11025 Hz    24729    "I have almond milk now!"
//   suffer   148.71  151.43   2.72 s  11025 Hz    30021    the Devil: "You've made your choice. Now suffer."
//   shins    155.98  158.97   2.99 s  11025 Hz    32998    "I'm sweating from my shins!"
//   lactaid  175.94  179.22   3.28 s  11025 Hz    36195    "...Is there Lactaid in hell?"
// (A speech recognizer hears each clip's words back.)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodeVoc } from '../../../../web/src/formats/voc';

export const CLIPS = {
  enemy: 11025,
  cant: 11025,
  intol: 8000,
  better: 11025,
  betray: 11025,
  ohno: 11025,
  worth: 11025,
  demon: 8000,
  colon: 11025,
  coward: 11025,
  begone: 11025,
  almond: 11025,
  suffer: 11025,
  shins: 11025,
  lactaid: 11025,
} as const;
type ClipName = keyof typeof CLIPS;

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
