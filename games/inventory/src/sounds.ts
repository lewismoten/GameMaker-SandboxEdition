// PICK IT UP's sound effects: the kit's, plus a pick-up chirp, a put-down thud, a star's whoosh, a flame's crackle and a shrug.
import { SPEAKER } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import type { SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { buildSounds } from '../../kit/starter/sounds';

/** The sound numbers (the kit uses 0 to 12). */
export const SND_THROW = 13;
export const SND_FLAME = 14;
export const SND_NONE = 15;
export const SND_PICK = 16;
export const SND_DROP = 17;

export function itemSounds(): SoundSet {
  const set = buildSounds();
  set.freqs[SND_THROW] = SPEAKER.rise(500, 1500);
  set.freqs[SND_FLAME] = SPEAKER.noise(7, 150, 900);
  set.freqs[SND_NONE] = SPEAKER.fall(300, 150);
  set.freqs[SND_PICK] = SPEAKER.rise(700, 1100);
  set.freqs[SND_DROP] = SPEAKER.fall(500, 200);
  return set;
}
