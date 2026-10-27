// Digitized clips of "Where's the Remote?" (The Bard of Bizarre), as Sound Blaster .VOC files.
// The samples (clips/<name>.pcm: 8-bit unsigned mono at 11025 Hz) are cut from the recording by
// games/remote/tools/cutClips.py, which reads the MP3 (not in the repo) and regenerates them
// exactly. Game-Maker reads a VOC's size as 16 bits, so each stays under 40,000 bytes.
//
// Cue table (seconds of the recording; edges snap to the quietest 10 ms of the voice):
//   name     start    end     length  VOC bytes  what is sung
//   remote    23.25   25.10   1.85 s    20430    chorus 1: "Where's the remote?!"
//   dogcat    30.98   33.42   2.44 s    26934    chorus 1: "Lifted the dog, looked under the cat."
//   fridge    51.98   55.20   3.22 s    35534    verse 2: "Opened the fridge, who knows anymore?"
//   mom       55.73   57.38   1.65 s    18225    verse 2: "Called my mom..."
//   hand      59.20   61.72   2.52 s    27816    verse 2: "She said, 'Check your hand.'"
//   raccoon   93.87   95.59   1.72 s    18996    the bridge: "a tiny raccoon"
//   sneaky   114.17  116.31   2.14 s    23627    the last chorus: "There you are, you sneaky guy."
// (A speech recognizer hears each clip's words back.)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodeVoc } from '../../../../web/src/formats/voc';

const CLIPS = ['remote', 'dogcat', 'fridge', 'mom', 'hand', 'raccoon', 'sneaky'] as const;
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
