// Mr. Plume's character file (PLUME.CHR) and the game's sounds (.SND). He walks, jumps and climbs like any hero (the
// kit's heroChar.ts), and Enter is his kick: a wind-up, the strike with its WHAP (a frame whose second picture is
// MONBL gives birth to monster number "first picture", the way every Game-Maker hero shoots; code/GM/PLAYGAME.C
// CharBirthMon), and the recovery. A kick in the air is a flying kick. One kick a press (norepeat).
import { MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { emptyFrame, type Character } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import type { SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { speaker } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import type { Book } from '../../kit/starter/book';
import { buildHero } from '../../kit/starter/heroChar';
import { SEQ } from '../../kit/starter/ids';
import { buildSounds } from '../../kit/starter/sounds';
import { MONS } from './monsters';

/** Enter, as Game-Maker names a key: scan code 28 in the high byte, ASCII 13 in the low byte. */
const KEY_ENTER = 0x1c0d;
/** The PC scan code the bot presses. */
export const SCAN_ENTER = 28;
/** The kick's sound number (the kit uses 0 to 12). */
export const SND_KICK = 13;

/** The sounds: the kit's, and the kick: a quick rising swish and a low thump. */
export function buildGameSounds(): SoundSet {
  const set = buildSounds();
  set.freqs[SND_KICK] = speaker((i) => (i < 10 ? 500 + i * 160 : i < 13 ? 0 : i < 24 ? 110 - (i - 13) * 4 : 0));
  return set;
}

/** PLUME.CHR: the kit's hero with Enter kicking. */
export function buildPlume(cb: Book): Character {
  const ch = buildHero(cb);
  const s = ch.sequences[SEQ.throw];
  const f = (top: string, bottom: string, pause: number) => ({ ...emptyFrame(), pic1: cb.n(top), pic2: cb.n(bottom), pause });
  const birth = { ...emptyFrame(), x: 0, y: 20, pic1: MONS.whap, pic2: MONBL, pause: 0 };
  const frames = [f('kick0.top', 'throw0', 3), f('kick1.top', 'throw1', 1), birth, f('kick1.top', 'throw1', 4), f('stand.top', 'throw2', 2)];
  frames.forEach((fr, i) => (s.frames[i] = fr));
  for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  // the kick cannot be cut short once started (ground: 1 keeps it from being a kick that never lands)
  Object.assign(s, { key: KEY_ENTER, sound: SND_KICK, norepeat: 1, ground: 1, jstkMov: 9, jstkBut: 2 });
  return ch;
}
