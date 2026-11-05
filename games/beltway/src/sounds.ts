// WHO WINS?'s sounds: the kit's, plus a quick rising swish for the throw.
import type { SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { SPEAKER } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import { buildSounds } from '../../kit/starter/sounds';

/** The throw's sound number (the kit uses 0 to 12). */
export const SND_THROW = 13;

export function throwSounds(): SoundSet {
  const set = buildSounds();
  set.freqs[SND_THROW] = SPEAKER.rise(500, 1500);
  return set;
}
