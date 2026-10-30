// Digitized clips of "Mustard Seed Hustle" (The Bard of Bizarre), as Sound Blaster .VOC files.
// The samples (clips/<name>.wav: 8-bit unsigned mono at 11025 Hz) are cut from the recording by
// games/mustard/tools/cutClips.py, which reads the MP3 (not in the repo) and regenerates them
// exactly. Game-Maker reads a VOC's size as 16 bits, so each stays under 40,000 bytes.
//
// Cue table (seconds of the recording; edges snap to the quietest 10 ms of the voice):
//   name      start    end     length  VOC bytes  what is sung
//   hustle     29.87   32.30   2.43 s    26824    chorus 1: "...it's the mustard seed hustle!"
//   hallelu   121.82  123.16   1.34 s    14807    the closing shout: "Hallelujah!"
//   keepon    102.83  104.52   1.69 s    18666    the bridge: "Keep on hustlin'"
//   alive     123.05  126.42   3.37 s    37188    the last line: "keep the mustard seed hustle alive!"
//   mountain  117.08  119.67   2.59 s    28588    the last chorus: "Tiny faith can move mountains"
//   feet       46.89   48.92   2.03 s    22414    chorus 1: "...got the greatest feet!"
// (A speech recognizer given the lyrics as a prompt hears each clip's words back.)
import { audioFileToVoc } from '@lewismoten/gamemaker-sandbox-tools/audio-files';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLIPS = ['hustle', 'hallelu', 'keepon', 'alive', 'mountain', 'feet'] as const;
type ClipName = (typeof CLIPS)[number];

const here = dirname(fileURLToPath(import.meta.url));

/** The clip as a Creative Voice File at 11025 Hz. */
export function clipVoc(name: ClipName): Uint8Array {
  return audioFileToVoc(join(here, 'clips', `${name}.wav`), { sampleRate: 11025, maxBytes: 39999 });
}
