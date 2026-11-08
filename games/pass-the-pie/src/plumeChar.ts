// The heroes' character files. Both walk, jump and climb like any hero (the kit's heroChar.ts); Enter is each one's
// move. A frame whose second picture is MONBL gives birth to monster number "first picture", the way every
// Game-Maker hero shoots (code/GM/PLAYGAME.C CharBirthMon), flying off the way the hero last moved.
//   PLUME.CHR  Enter is a three-hit combo: wind-up, WHAP, WHAP, a turn and the POW that reaches further. One combo a
//              press (norepeat), on the ground.
//   RORY.CHR   Enter tosses a dinner roll from the basket: a vacuum that catches it stalls (a step to stand on), a
//              squirrel catches it and scampers off.
import { MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MAXFRAME, emptyFrame, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import type { Book } from '../../kit/starter/book';
import { buildHero } from '../../kit/starter/heroChar';
import { SEQ } from '../../kit/starter/ids';
import { MONS } from './monsters';
import { SND } from './sounds';

/** Enter, as Game-Maker names a key: scan code 28 in the high byte, ASCII 13 in the low byte. */
const KEY_ENTER = 0x1c0d;
/** The PC scan code the bot presses. */
export const SCAN_ENTER = 28;

const frame =
  (cb: Book) =>
  (top: string, bottom: string, pause: number): Frame => ({ ...emptyFrame(), pic1: cb.n(top), pic2: cb.n(bottom), pause });
const birth = (monster: number, y = 20): Frame => ({ ...emptyFrame(), x: 0, y, pic1: monster, pic2: MONBL, pause: 0 });

function enterMove(ch: Character, frames: Frame[], sound: number): void {
  if (frames.length > MAXFRAME) throw new Error(`A sequence holds ${MAXFRAME} frames, not ${frames.length}`);
  const s = ch.sequences[SEQ.throw];
  frames.forEach((fr, i) => (s.frames[i] = fr));
  for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  // once started it plays out (ground: 1, so it is never a move that hangs in the air)
  Object.assign(s, { key: KEY_ENTER, sound, norepeat: 1, ground: 1, jstkMov: 9, jstkBut: 2 });
}

/** PLUME.CHR: the kit's hero with Enter for the combo. */
export function buildPlume(cb: Book): Character {
  const ch = buildHero(cb);
  const f = frame(cb);
  enterMove(
    ch,
    [
      f('kick0.top', 'throw0', 2),
      f('kick1.top', 'throw1', 2),
      birth(MONS.whap),
      f('kick0.top', 'throw0', 2),
      f('kick1.top', 'throw1', 2),
      birth(MONS.whap),
      f('stand.top', 'dig0', 2),
      f('kick1.top', 'throw1', 2),
      birth(MONS.pow),
      f('kick1.top', 'throw1', 4),
    ],
    SND.kick,
  );
  return ch;
}

/** RORY.CHR: the kit's hero with Enter tossing a roll. */
export function buildRory(cb: Book): Character {
  const ch = buildHero(cb);
  const f = frame(cb);
  enterMove(ch, [f('stand.top', 'throw0', 2), f('cheer.top', 'throw1', 1), birth(MONS.roll, 10), f('cheer.top', 'throw1', 2), f('stand.top', 'throw2', 3)], SND.toss);
  return ch;
}
