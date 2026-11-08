// Old Mossback's one line, "Oh. Excuse me.", said as Tess passes under its lifted toe in level 1 (next.ts puts an
// unseen trigger block where the toe was; touching it adds one to a counter nothing shows, and Game-Maker plays the
// "add other counter" sound, which next.snd sets to this clip).
// The take (sound/excuse.wav, 8-bit mono at 11025 Hz) was spoken by Pocket TTS (Kyutai, CC BY 4.0) in a voice
// cloned from the "Scroobie" sample, four semitones lower and at 0.85 speed: a deep, slow, friendly old mountain.
// It was made on the developer's computer with web/scripts/narrate.ts --lines and checked with Whisper; the model
// and the sample are not in the repository (NOTICE.md).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { audioFileToVoc } from '@lewismoten/gamemaker-sandbox-tools/audio-files';
import { SND } from '../../kit/starter/ids';
import { buildSounds } from '../../kit/starter/sounds';

/** The clip's file name on the disk (EXCUSE.VOC). */
export const EXCUSE = 'excuse';
/** The counter the trigger adds to: an extra counter no other block uses and nothing shows; Tess starts with it at 1 (build.ts), since an unlimited counter makes no sound. */
export const EXCUSE_COUNTER = 25;

const here = dirname(fileURLToPath(import.meta.url));

/** The clip as a Creative Voice File (Game-Maker reads a VOC's size as 16 bits, so it stays under 40,000 bytes). */
export const excuseVoc = (): Uint8Array => audioFileToVoc(join(here, 'sound', `${EXCUSE}.wav`), { sampleRate: 11025, maxBytes: 39999 });

/** Level 1's sounds: the game's own, with the mountain's voice on "add other counter". */
export function nextSounds(): SoundSet {
  const set = buildSounds();
  set.digital[SND.gain] = EXCUSE;
  return set;
}
