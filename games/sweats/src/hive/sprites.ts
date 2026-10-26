// HIVE.MBL's own sprites (after the common ones): a moviegoer's "SHHH!" rising out of the seats.
import { Pixels } from '../../../kit/pixels';
import { micro } from '../../../snowbound/src/art/font';
import type { Pal } from '../art/pal';
import { outline, T, type SpriteBook } from '../common/sprites';
import { anim, corner, mon } from '../common/characters';
import type { Monster } from '../../../../web/src/formats/monster';
import { POWER } from '../ids';
import { HIVE_MON } from './ids';

export function buildHiveSprites(book: SpriteBook, pal: Pal): void {
  const c = pal.c;
  const shush = (f: number) => {
    const p = new Pixels(20, 20, T);
    p.rect(1, 5 + f, 18, 9, c('gray', 3)).rect(2, 6 + f, 16, 7, c('white', 2));
    p.set(5, 14 + f, c('gray', 3)).set(4, 15 + f, c('gray', 3));
    micro(p, 3, 7 + f, 'SHH', c('red', 1));
    p.set(16, 7 + f, c('red', 1))
      .set(16, 8 + f, c('red', 1))
      .set(16, 9 + f, c('red', 1))
      .set(16, 11 + f, c('red', 1));
    return outline(p, c('ink', 0));
  };
  book.add('shush0', shush(0), { chHitPt: -2 });
  book.add('shush1', shush(1), { chHitPt: -2 });
}

export function hiveMonsters(set: Monster[], mb: SpriteBook): void {
  set[HIVE_MON.shush] = mon(anim(mb, 'shush0', 'shush1', 4), { power: POWER.foe, thru: 1, end: -1 }, [
    corner(0, 0, 3),
    corner(0, -3, 3, 0),
    corner(1, -4, 1, 0),
  ]);
}
