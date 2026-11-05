// PICK IT UP's hero: Mara from the kit, plus
//   3  PICKUP  P  takes the object block he is standing in into the pack (ten places)       (Game-Maker's sequence 3)
//   4  DROP    D  opens the pack: arrows choose a place, Enter puts it down where he stands  (Game-Maker's sequence 4)
//   14 FLAME   Enter  throws a flame   only while a flame item is in the pack  (the sequence is tied to that block)
//   15 STAR    Enter  throws a star    only while a star item is in the pack
//   17 NONE    Enter  a short shrug and a low blip: nothing to throw             (never tied, never used up)
// Game-Maker (PLAYGAME.C SimKeyPress) starts the FIRST sequence on a key that is switched on, so a flame goes before a
// star, and the shrug comes last. There is no select key: what Enter throws is which tied items are in the pack, and
// the way to throw the star while holding the flame is to put the flame down. The Mara's walking on D is given up: D drops.
import { MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { INF_REPEAT, emptyFrame, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Book } from '../../kit/starter/book';
import { buildHero } from '../../kit/starter/heroChar';
import { buildHeroBlocks } from '../../kit/starter/hero';
import { SEQ } from '../../kit/starter/ids';
import type { Pal } from '../../kit/starter/palette';
import { FLAME, STAR } from './monsters';
import { SEQ_FLAME, SEQ_NONE, SEQ_STAR } from './items';
import { SND_DROP, SND_FLAME, SND_NONE, SND_PICK, SND_THROW } from './sounds';

/** Keys, as Game-Maker names them: scan code in the high byte, ASCII in the low byte. */
export const KEY_ENTER = 0x1c0d;
export const KEY_PICK = 0x1970; // P
export const KEY_DROP = 0x2064; // D
/** The PC scan codes the bot and the demo press. */
export const SCAN_ENTER = 28;
export const SCAN_PICK = 25;
export const SCAN_DROP = 32;
export const SCAN_RIGHT = 77;
export const HERO_HIT_POINTS = 50;
export const HERO_LIVES = 3;
export { SEQ_FLAME, SEQ_NONE, SEQ_STAR };

/** The kit's hero blocks, plus his three throw poses again with the star in his hand turned to a flame. */
export function buildItemHeroBlocks(pal: Pal): Book {
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

/** HERO.CHR: Mara with P and D, and Enter throwing a flame, else a star, else shrugging; `items` are the blocks the throws are tied to. */
export function buildItemHero(cb: Book, items: { star: number; flame: number }): Character {
  const ch = buildHero(cb);
  const f = (top: string, bottom: string, o: Partial<Frame> = {}): Frame => ({ ...emptyFrame(), pic1: cb.n(top), pic2: cb.n(bottom), pause: 3, ...o });
  // D is the drop key, so the twin walk on D gives way (A still walks left)
  ch.sequences[SEQ.rightD].key = 0;
  // pick up and put down: a short stoop. The block is taken (or put down) on the first frame, as Game-Maker does it.
  set(ch.sequences[3], [f('stand.top', 'dig0'), f('stand.top', 'dig1'), f('stand.top', 'stand', { pause: 2 })], {
    key: KEY_PICK,
    sound: SND_PICK,
    norepeat: 1,
  });
  set(ch.sequences[4], [f('stand.top', 'dig1'), f('stand.top', 'dig0'), f('stand.top', 'stand', { pause: 2 })], {
    key: KEY_DROP,
    sound: SND_DROP,
    norepeat: 1,
  });
  const toss = (poses: string[], monster: number, sound: number, seq: number, tie: number) => {
    const s = ch.sequences[seq];
    const frames = [
      f('stand.top', poses[0]),
      f('cheer.top', poses[1], { pause: 2 }),
      { ...emptyFrame(), x: 0, y: 20, pic1: monster, pic2: MONBL, pause: 0 },
      f('stand.top', poses[2]),
    ];
    s.frames.forEach((_, i) => (s.frames[i] = frames[i] ?? emptyFrame(true)));
    // one toss a press (norepeat); it cannot be cut short (ground); bloc ties it to the item
    Object.assign(s, { key: KEY_ENTER, sound, norepeat: 1, ground: 1, jstkMov: 9, jstkBut: 2, bloc: tie });
  };
  toss(['fire0', 'fire1', 'fire2'], FLAME, SND_FLAME, SEQ_FLAME, items.flame);
  toss(['throw0', 'throw1', 'throw2'], STAR, SND_THROW, SEQ_STAR, items.star);
  set(ch.sequences[SEQ_NONE], [f('stand.top', 'stand', { pause: 4 })], { key: KEY_ENTER, sound: SND_NONE, norepeat: 1 });
  // never used up: the ties are what switch them on and off
  ch.meter[SEQ_FLAME] = INF_REPEAT;
  ch.meter[SEQ_STAR] = INF_REPEAT;
  ch.meter[SEQ_NONE] = INF_REPEAT;
  return ch;
}
