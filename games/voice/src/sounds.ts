// OUT LOUD's three sound sets (.SND), one a level. A sound has two halves: the beeps a PC speaker
// plays, and the name of a .VOC file a Sound Blaster plays instead when there is one. Game-Maker
// plays sound 7 when a counter goes up and sound 8 when a counter goes down, so the voice a
// speaker block says comes from which way its counter moves (the block cannot name a clip).
import { SPEAKER } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import { type SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { SND } from '../../kit/starter/ids';
import { buildSounds } from '../../kit/starter/sounds';

/** Sound 13: Kit's hello, played by his Enter move. */
export const SND_HELLO = 13;
/** Enter, as the character file writes a key: scan code 0x1C, ASCII 13. */
export const ENTER = 0x1c0d;

function setWith(names: Partial<Record<number, string>>): SoundSet {
  const set = buildSounds();
  set.freqs[SND_HELLO] = SPEAKER.arpeggio([784, 988, 1175]);
  set.digital[SND_HELLO] = 'HELLO';
  for (const [n, name] of Object.entries(names)) set.digital[Number(n)] = name ?? '';
  return set;
}

/** Level 1: only Kit's hello. Level 2: the up voice and the down voice. Level 3: one long goodbye on the up sound. */
export function voiceSounds(): SoundSet[] {
  return [setWith({}), setWith({ [SND.gain]: 'WELCOME', [SND.use]: 'DEEPER' }), setWith({ [SND.gain]: 'BYE' })];
}
