// MEET THE MONSTERS' monsters: the kit's three that hurt (gumdrop, buzzer, shelly, kit/starter/
// monsters.ts) and two more of this game's own:
//   pop  a mint-green gumdrop that is harmless: touch it and it pops into a star (and 50 points)
//   star  the pop: a star that floats up and is gone
// What the engine does when a monster is touched (code/GM/PLAYGAME.C, the monster loop): the
// monster block's effects are applied to the hero (hit points, score, a counter), and a monster
// whose "power" is under 100 then dies, or becomes the monster named in "Newmon". It does not
// matter which side was touched, so the pop is the same from the top, the side or below.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';

/** The monster numbers this game adds after the kit's gumdrop 0, buzzer 1 and shelly 2. */
export const POP = 3;
export const STAR = 4;

/** Hit points a hurting monster takes when touched, and the hero's own (so three touches cost a life). */
export const HURT = -10;
export const HERO_HIT_POINTS = 30;

const T = 255;

/** The gumdrop's picture with its purple turned mint green. */
function mint(pal: Pal, pic: Pixels): Pixels {
  const purple = pal.r('purple');
  const teal = pal.r('teal');
  return pic.crop(0, 0, 20, 20).map((_x, _y, c) => {
    const k = purple.indexOf(c);
    return k < 0 ? c : teal[k];
  });
}

/** A five-pointed star with a happy face, twinkling between two sizes. */
function star(pal: Pal, big: boolean): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  const R = big ? 9.2 : 7.4;
  const r = R * 0.48;
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r : R;
    pts.push([9.5 + Math.cos(a) * rad, 10.5 + Math.sin(a) * rad]);
  }
  const inside = (x: number, y: number) => {
    let hit = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  };
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (inside(x + 0.5, y + 0.5)) p.set(x, y, y < 9 ? c('gold', 4) : c('gold', 3));
  p.rect(8, 5, 2, 2, c('gold', 5)).set(7, 6, c('gold', 5));
  p.set(7, 10, c('ink', 0)).set(7, 11, c('ink', 0)).set(12, 10, c('ink', 0)).set(12, 11, c('ink', 0));
  p.set(8, 13, c('ink', 0)).set(9, 14, c('ink', 0)).set(10, 14, c('ink', 0)).set(11, 13, c('ink', 0));
  return outline(p, c('ink', 0), { transparent: T });
}

/** The monster pictures: the kit's, then pop and star. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  // harmless: no hit points taken, 50 points for the pop
  const rules = { score: 50 };
  mb.add('pop0', mint(pal, mb.pics.get('gumdrop0')!), rules);
  mb.add('pop1', mint(pal, mb.pics.get('gumdrop1')!), rules);
  mb.add('star0', star(pal, true), {});
  mb.add('star1', star(pal, false), {});
  return mb;
}

/** The finished .MBL: the hurting monsters take HURT hit points. */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const b of blocks) if (b.chHitPt < 0) b.chHitPt = HURT;
  return blocks;
}

/** The .MON: the kit's three, then pop (power 1: it pops, into a star) and star (it floats up and ends). */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb, { gumdrop: 4, shelly: 2 });
  const anim = (name: string, t: number): [number, number][] => [
    [mb.n(`${name}0`), t],
    [mb.n(`${name}1`), t],
  ];
  set[POP] = mon(anim('pop', 4), { power: 1, thru: 1, newmon: STAR });
  set[STAR] = mon(anim('star', 5), { power: 150, thru: 0, end: -1 }, [corner(0, 0, 1), corner(0, -3, 1), corner(0, 0, 0)]);
  return set;
}
