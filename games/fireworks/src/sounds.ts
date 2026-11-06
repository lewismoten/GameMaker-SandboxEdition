// FIREWORKS' sounds: the kit's, plus a rising whoosh for a rocket launched with Enter. (A burst has no bang: a
// monster cannot play a sound when it turns into another, and a launcher block cannot either.)
import type { SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { SPEAKER } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import { buildSounds } from '../../kit/starter/sounds';

/** The launch's sound number (the kit uses 0 to 12). */
export const SND_LAUNCH = 13;

export function launchSounds(): SoundSet {
  const set = buildSounds();
  set.freqs[SND_LAUNCH] = SPEAKER.rise(400, 2000);
  return set;
}
