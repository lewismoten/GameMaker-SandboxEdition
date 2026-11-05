// ONE KEY, MANY WEAPONS' hero: Lena from the kit, with three sequences on Enter, in this order:
//   14  FLAME  throws a flame (a frame in the middle births monster FLAME)  uses left: counter 14
//   15  STAR   throws a star (a frame in the middle births monster STAR)    uses left: counter 15
//   17  NONE   a short shrug and a low blip: nothing to throw                 uses left: no limit
// Game-Maker (PLAYGAME.C SimKeyPress) starts the FIRST sequence on a key that is switched on and has
// uses left, so a flame goes before a star, and the shrug comes last, when both counters are at 0.
// A sequence's "uses left" is the repetition counter with its own number (5 to 19): each throw takes
// one off, and a pouch block raises it with its Effect and Amount (levels.ts). So there is no weapon
// menu: which weapon Enter throws is just which counter is above 0.
import { MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { INF_REPEAT, emptyFrame, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Book } from '../../kit/starter/book';
import { buildHero } from '../../kit/starter/heroChar';
import { buildHeroBlocks } from '../../kit/starter/hero';
import type { Pal } from '../../kit/starter/palette';
import { FLAME, STAR } from './monsters';
import { FLAMES_PER_POUCH, SEQ_FLAME, SEQ_NONE, SEQ_STAR, STARS_PER_POUCH } from './weapons';
import { SND_FLAME, SND_NONE, SND_THROW } from './sounds';

/** Enter, as Game-Maker names a key: scan code 28 in the high byte, ASCII 13 in the low byte. */
export const KEY_ENTER = 0x1c0d;
/** The PC scan code the bot and the demo press. */
export const SCAN_ENTER = 28;
/** Hit points and lives at the start (nothing here takes any, but Game-Maker wants a number). */
export const HERO_HIT_POINTS = 50;
export const HERO_LIVES = 3;
export { FLAMES_PER_POUCH, SEQ_FLAME, SEQ_NONE, SEQ_STAR, STARS_PER_POUCH };

/** The kit's hero blocks, plus his three throw poses again with the star in his hand turned to a flame. */
export function buildWeaponHeroBlocks(pal: Pal): Book {
  const book = buildHeroBlocks(pal);
  const gold = pal.r('gold');
  const orange = pal.r('orange');
  for (const n of ['throw0', 'throw1', 'throw2']) {
    const pic = book.pics.get(n)!.map((_x, _y, c) => {
      const k = gold.indexOf(c);
      return k < 0 ? c : orange[Math.min(k, orange.length - 1)];
    });
    book.add(n.replace('throw', 'fire'), pic);
  }
  return book;
}

/** HERO.CHR: the kit's hero with Enter throwing a flame, else a star, else shrugging. */
export function buildWeaponHero(cb: Book): Character {
  const ch = buildHero(cb);
  const f = (top: string, bottom: string, o: Partial<Frame> = {}): Frame => ({ ...emptyFrame(), pic1: cb.n(top), pic2: cb.n(bottom), pause: 3, ...o });
  const toss = (poses: string[], monster: number, sound: number, seq: number) => {
    const s = ch.sequences[seq];
    const frames = [
      f('stand.top', poses[0]),
      f('cheer.top', poses[1], { pause: 2 }),
      { ...emptyFrame(), x: 0, y: 20, pic1: monster, pic2: MONBL, pause: 0 },
      f('stand.top', poses[2]),
    ];
    s.frames.forEach((_, i) => (s.frames[i] = frames[i] ?? emptyFrame(true)));
    // one toss a press (norepeat); it cannot be cut short (ground), so nothing is born without the arm swinging
    Object.assign(s, { key: KEY_ENTER, sound, norepeat: 1, ground: 1, jstkMov: 9, jstkBut: 2 });
  };
  toss(['fire0', 'fire1', 'fire2'], FLAME, SND_FLAME, SEQ_FLAME);
  toss(['throw0', 'throw1', 'throw2'], STAR, SND_THROW, SEQ_STAR);
  // nothing to throw: a half-second shrug in place and a low blip
  set(ch.sequences[SEQ_NONE], [f('stand.top', 'stand', { pause: 4 })], { key: KEY_ENTER, sound: SND_NONE, norepeat: 1 });
  // the counters: no flames, no stars until a pouch gives some; the shrug is never used up
  ch.meter[SEQ_FLAME] = 0;
  ch.meter[SEQ_STAR] = 0;
  ch.meter[SEQ_NONE] = INF_REPEAT;
  return ch;
}
