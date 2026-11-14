// The heroes' character files. Both walk, jump and climb like any hero (the kit's heroChar.ts); Enter is each one's
// move. A frame whose second picture is MONBL gives birth to monster number "first picture", the way every
// Game-Maker hero shoots (code/GM/PLAYGAME.C CharBirthMon), flying off the way the hero last moved.
//   PLUME.CHR  Enter is a split-kick combo: wind-up and a WHAP, a reset and the POW that reaches further, each striking high and
//              low, so a thing on the street takes two hits a press. One combo a press (norepeat), on the ground.
//   RORY.CHR   Enter tosses a dinner roll from the basket: a vacuum that catches it stalls (a step to stand on), a
//              squirrel catches it and scampers off.
// Both stand, kick and toss face on (standFaceOn), since those pictures cannot know which way the move will fly.
import { MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MAXFRAME, emptyFrame, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import type { Book } from '../../kit/starter/book';
import { buildHero } from '../../kit/starter/heroChar';
import { SEQ } from '../../kit/starter/ids';
import { MONS } from './monsters';
import { SND } from './sounds';

/** Where below the top of Mr. Plume a kick is born: each strike lands high (a balloon at chest height) and low (a lawn turkey). */
const HIGH = 0;
const LOW = 20;
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

/**
 * Standing still, a hero faces the player. Game-Maker has one idle sequence whichever way he last walked
 * (code/GM/PLAYGAME.C PopKey falls back to IDLESEQ), while the kick flies the way he last moved (CharBirthMon,
 * ci.netx), so a side view at rest would face right with the kick or roll about to fly left.
 */
function standFaceOn(ch: Character, cb: Book): void {
  const swap: Record<string, string> = { 'stand.top': 'front.top', 'look.top': 'front.top', 'blink.top': 'fblink.top', stand: 'fstand' };
  const swapped = (n: number) => {
    const name = Object.keys(swap).find((k) => cb.n(k) === n);
    return name ? cb.n(swap[name]) : n;
  };
  for (const fr of ch.sequences[SEQ.idle].frames) Object.assign(fr, { pic1: swapped(fr.pic1), pic2: swapped(fr.pic2) });
}

/** PLUME.CHR: the kit's hero with Enter for the combo. */
export function buildPlume(cb: Book): Character {
  const ch = buildHero(cb);
  standFaceOn(ch, cb);
  const f = frame(cb);
  enterMove(
    ch,
    [
      f('fkick0.top', 'fthrow0', 2),
      f('fkick1.top', 'fthrow1', 2),
      birth(MONS.whap, HIGH),
      birth(MONS.whap, LOW),
      f('fkick0.top', 'fthrow0', 2),
      f('front.top', 'fstand', 1),
      f('fkick1.top', 'fthrow1', 2),
      birth(MONS.pow, LOW),
      birth(MONS.pow, HIGH),
      f('fkick1.top', 'fthrow1', 4),
    ],
    SND.kick,
  );
  return ch;
}

/** RORY.CHR: the kit's hero with Enter tossing a roll. */
export function buildRory(cb: Book): Character {
  const ch = buildHero(cb);
  standFaceOn(ch, cb);
  const f = frame(cb);
  enterMove(
    ch,
    [f('front.top', 'fstand', 2), f('fcheer.top', 'fthrow1', 1), birth(MONS.roll), f('fcheer.top', 'fthrow1', 2), f('front.top', 'fstand', 3)],
    SND.toss,
  );
  return ch;
}
