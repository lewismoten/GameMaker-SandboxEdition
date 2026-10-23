// Digitized clips of "I Screamed, She Smirked" (The Bard of Bizarre), as Sound Blaster .VOC files.
// The samples (clips/<name>.pcm: 8-bit unsigned mono at 11025 Hz) are cut from the recording by
// games/smirked/tools/cutClips.py, which reads the MP3 (not in the repo) and regenerates them
// exactly. Game-Maker reads a VOC's size as 16 bits, so each stays under 40,000 bytes.
//
// Cue table (seconds of the recording; edges snap to the quietest 10 ms of the voice):
//   name       start    end     length  VOC bytes  what is sung
//   mild         2.18    4.87   2.69 s    29691    verse 1: "the sign said mild scares for all ages"
//   fog         35.13   38.06   2.93 s    32337    verse 3: "Fog machine hisses, I scream like a cat"
//   okay        39.27   40.27   1.00 s    11058    verse 3: "You okay with that?"
//   afraid      45.93   48.52   2.59 s    28588    chorus 1: "She's eight, and I'm afraid"
//   getdown     54.60   55.90   1.30 s    14366    chorus 1: "GET DOWN!"
//   cardbrd     57.13   59.74   2.61 s    28809    chorus 1: "Turns out she was cardboard"
//   target      62.28   65.39   3.11 s    34321    chorus 1: "She strolls like it's Target"
//   exit        70.18   72.42   2.24 s    24729    chorus 1: "the emergency exit sign"
//   werewolf    80.30   83.23   2.93 s    32337    verse 4: "There's a guy in a werewolf mask, he growls"
//   dontrun     83.67   84.70   1.03 s    11389    verse 4: "I don't run. No, no."
//   sneezing    88.43   90.87   2.44 s    26934    verse 4: "Now I'm sneezing like Salem's last witch left behind"
//   notreal    100.23  101.63   1.40 s    15468    the bridge: "You know it's not real, right?"
//   pats       102.01  103.84   1.83 s    20209    the breakdown: "Then she pats me. Pats me."
//   juice      103.60  106.08   2.48 s    27375    the breakdown: "like I need the juice box and some therapy"
//   badge      106.18  108.66   2.48 s    27375    the breakdown: "She gets a Bravery Badge from the front desk"
//   sword      108.54  110.38   1.84 s    20319    the breakdown: "I get a souvenir sword"
//   ashamed    110.78  114.28   3.50 s    38621    the last chorus: "She's eight, and I'm ashamed"
//   datewell   139.38  141.31   1.93 s    21312    the outro: "So yeah. The date went well."
// (A speech recognizer hears each clip's words back.)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodeVoc } from '../../../../web/src/formats/voc';

export const CLIPS = ['mild', 'fog', 'okay', 'afraid', 'getdown', 'cardbrd', 'target', 'exit', 'werewolf', 'dontrun', 'sneezing', 'notreal', 'pats', 'juice', 'badge', 'sword', 'ashamed', 'datewell'] as const;
export type ClipName = (typeof CLIPS)[number];
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
