// Digitized clips of "Where's the Remote?" (The Bard of Bizarre), as Sound Blaster .VOC files.
// The samples (clips/<name>.wav: 8-bit unsigned mono at 11025 Hz) are cut from the recording by
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
import { audioFileToVoc } from '@lewismoten/gamemaker-sandbox-tools/audio-files';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLIPS = ['remote', 'dogcat', 'fridge', 'mom', 'hand', 'raccoon', 'sneaky'] as const;
type ClipName = (typeof CLIPS)[number];
const RATE = 11025;

const here = dirname(fileURLToPath(import.meta.url));

/** The clip as a Creative Voice File. */
export function clipVoc(name: ClipName): Uint8Array {
  return audioFileToVoc(join(here, 'clips', `${name}.wav`), { sampleRate: RATE, maxBytes: 39999 });
}
