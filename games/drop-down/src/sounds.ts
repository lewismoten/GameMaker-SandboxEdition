// DROP DOWN's sounds: the kit's, with two of the ones Game-Maker plays by itself when a counter changes:
//   7 (a spare counter goes up): the whack of Lena's hit, a short low thump. The burst adds to the hit counter.
//   8 (a spare counter goes down): the crunch of the crate giving way, a burst of noise then a low thump.
import type { SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { speaker } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import { SND } from '../../kit/starter/ids';
import { buildSounds } from '../../kit/starter/sounds';

const WHACK = speaker((i) => (i < 10 ? 220 - i * 12 : 0));
const CRUNCH = speaker((i) => (i < 14 ? 160 + ((i * 7919) % 11) * 80 : i < 24 ? 120 - (i - 14) * 6 : 0));

export function dropSounds(): SoundSet {
  const set = buildSounds();
  set.freqs[SND.gain] = WHACK;
  set.freqs[SND.use] = CRUNCH;
  return set;
}
