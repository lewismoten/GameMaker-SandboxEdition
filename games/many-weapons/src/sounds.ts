// ONE KEY, MANY WEAPONS' sounds: the kit's, plus a quick rising swish for a star, a crackle for a flame
// and a low blip for "nothing to throw".
import type { SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { SPEAKER } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import { buildSounds } from '../../kit/starter/sounds';

/** The sound numbers (the kit uses 0 to 12). */
export const SND_THROW = 13;
export const SND_FLAME = 14;
export const SND_NONE = 15;

export function weaponSounds(): SoundSet {
  const set = buildSounds();
  set.freqs[SND_THROW] = SPEAKER.rise(500, 1500);
  set.freqs[SND_FLAME] = SPEAKER.noise(7, 150, 900);
  set.freqs[SND_NONE] = SPEAKER.fall(300, 150);
  return set;
}
