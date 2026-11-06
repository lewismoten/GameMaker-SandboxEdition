// TAKE THE WHEEL's sounds: the kit's, plus a two-beat horn for the honk.
import type { SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { SPEAKER } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import { buildSounds } from '../../kit/starter/sounds';
import { SND_HONK } from './kart';

export function honkSounds(): SoundSet {
  const set = buildSounds();
  set.freqs[SND_HONK] = SPEAKER.arpeggio([330, 330, 0, 392, 392]);
  return set;
}
