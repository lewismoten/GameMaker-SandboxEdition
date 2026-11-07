// SCORE POPUPS' monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then,
// in pairs (a prize and the number it leaves):
//   COIN, GEM, BOX     a prize that spins in the air: 100, 200 and 500 points. Its picture block pays
//                      the points when Yana touches it (Score points, in the blocks editor), and its
//                      power is under 100, so the touch also destroys it: it BECOMES (`newmon`) its popup.
//   POP100, POP200, POP500   the number: a picture of "100", "200" or "500" that blinks (the picture
//                      swaps with an empty one), rises three blocks along its path and is gone when the
//                      path ends (`end` -1). Power 150 and not solid, so Yana walks through it and
//                      it pays nothing.
//   STUCK, STUCKPOP    the mistake: a coin whose number never leaves. It has no path and `end` -2.
// What the engine does (code/GM/PLAYGAME.C): a monster Yana touches whose power is under 100 (CHARPOWER)
// first has its picture block's effects applied (DoBlockTouchChar: the score), then KillMon (line ~3253)
// turns it into `newmon` at the same place, born that tick (BirthTime). A number is only a picture.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';

/** The monster numbers this game adds after the kit's gumdrop 0, buzzer 1 and shelly 2. */
export const COIN = 3;
export const POP100 = 4;
export const GEM = 5;
export const POP200 = 6;
export const BOX = 7;
export const POP500 = 8;
export const STUCK = 9;
export const STUCKPOP = 10;

/** What each prize pays. */
export const PAYS = { [COIN]: 100, [GEM]: 200, [BOX]: 500, [STUCK]: 100 } as const;
/** Hit points Yana starts with (nothing in this game takes any, but Game-Maker wants a number). */
export const HERO_HIT_POINTS = 50;
/** Prizes are under 100 (touching Yana destroys them); numbers are over (touching Yana does nothing). */
export const PRIZE_POWER = 50;
export const NUMBER_POWER = 150;
/** How far a number rises (blocks) and how fast (pixels a tick). */
export const RISE = 3;
export const RISE_SPEED = 1;

const T = 255;

/** Five-by-seven digits, drawn by hand: the pictures of the numbers. */
const DIGITS: Record<string, string[]> = {
  '0': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
};

/** A number as a picture: gold digits with an ink outline, centered in one block. */
function number(pal: Pal, digits: string): Pixels {
  const ink = pal.c('ink', 0);
  const fill = pal.c('gold', 5);
  const flat = new Pixels(20, 20, T);
  const x0 = Math.floor((20 - (digits.length * 6 - 1)) / 2);
  [...digits].forEach((d, i) => flat.draw(x0 + i * 6, 6, DIGITS[d], { '#': fill }));
  const p = new Pixels(20, 20, T);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++)
      if (flat.get(x, y) === T && [-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => flat.get(x + dx, y + dy) === fill))) p.set(x, y, ink);
  return p.blit(flat, 0, 0, T);
}

/** Shades `ramp` over a shape given as a test; `w` squeezes it to look edge-on. */
function shape(pal: Pal, ramp: number[], inside: (dx: number, dy: number) => boolean, ink = pal.c('ink', 0)): Pixels {
  const p = new Pixels(20, 20, T);
  const at = (x: number, y: number) => inside(x - 9.5, y - 9.5);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      if (!at(x, y)) continue;
      const edge = !at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1);
      const lit = (x - 9.5) * -0.6 + (y - 9.5) * -0.8; // light from the upper left
      p.set(x, y, edge ? ink : ramp[Math.max(1, Math.min(ramp.length - 1, Math.round(3 + lit / 3)))]);
    }
  return p;
}

/** The prize pictures, two frames each: face-on and turned. */
function prize(pal: Pal, kind: 'coin' | 'gem' | 'box', turned: boolean): Pixels {
  const sq = turned ? 0.3 : 1;
  if (kind === 'coin') {
    const p = shape(pal, pal.r('gold'), (dx, dy) => (dx / (8.5 * sq)) ** 2 + (dy / 8.5) ** 2 <= 1);
    if (!turned) p.ring(9.5, 9.5, 5.5, pal.c('gold', 2)).rect(6, 6, 2, 3, pal.c('gold', 5)).set(8, 5, pal.c('gold', 5));
    return p;
  }
  if (kind === 'gem') {
    const p = shape(pal, pal.r('blue'), (dx, dy) => Math.abs(dx) / (8.5 * sq) + Math.abs(dy) / 9 <= 1);
    if (!turned) p.set(7, 6, pal.c('white', 3)).set(8, 5, pal.c('white', 3)).set(7, 7, pal.c('white', 3));
    return p;
  }
  const p = shape(pal, pal.r('orange'), (dx, dy) => Math.abs(dx) <= 7.6 * sq && Math.abs(dy) <= 7.6);
  if (!turned) p.rect(5, 5, 3, 1, pal.c('white', 3)).rect(5, 5, 1, 3, pal.c('white', 3)).rect(9, 5, 2, 10, pal.c('orange', 5));
  return p;
}

/** The monster pictures: the kit's, then each prize in two frames, the numbers and an empty picture to blink with. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  for (const [name, score] of [
    ['coin', 100],
    ['gem', 200],
    ['box', 500],
  ] as const) {
    mb.add(`${name}0`, prize(pal, name, false), { score });
    mb.add(`${name}1`, prize(pal, name, true), { score });
  }
  mb.add('num100', number(pal, '100'), {});
  mb.add('num200', number(pal, '200'), {});
  mb.add('num500', number(pal, '500'), {});
  mb.add('empty', new Pixels(20, 20, T), {});
  return mb;
}

/** The finished .MBL: nothing here hurts. The kit's own three are made harmless and not solid, and so are all of this game's. */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const n of ['gumdrop0', 'gumdrop1', 'buzzer0', 'buzzer1', 'shelly0', 'shelly1']) {
    blocks[mb.n(n)].solid = 0;
    blocks[mb.n(n)].chHitPt = 0;
  }
  return blocks;
}

/** The .MON: the kit's three, then the prizes and their numbers. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  const spin = (name: string): [number, number][] => [
    [mb.n(`${name}0`), 5],
    [mb.n(`${name}1`), 3],
  ];
  const blink = (name: string): [number, number][] => [
    [mb.n(name), 9],
    [mb.n('empty'), 2],
  ];
  const up = [corner(0, -RISE, RISE_SPEED)];
  // a prize: hangs in the air (no path), under 100 so Yana's touch destroys it, and becomes its number
  set[COIN] = mon(spin('coin'), { power: PRIZE_POWER, thru: 1, newmon: POP100 });
  set[GEM] = mon(spin('gem'), { power: PRIZE_POWER, thru: 1, newmon: POP200 });
  set[BOX] = mon(spin('box'), { power: PRIZE_POWER, thru: 1, newmon: POP500 });
  // a number: blinks, rises along its path, and is gone when the path ends (end -1)
  set[POP100] = mon(blink('num100'), { power: NUMBER_POWER, thru: 1, end: -1 }, up);
  set[POP200] = mon(blink('num200'), { power: NUMBER_POWER, thru: 1, end: -1 }, up);
  set[POP500] = mon(blink('num500'), { power: NUMBER_POWER, thru: 1, end: -1 }, up);
  // the mistake: this number has no path and is never destroyed (end -2), so it blinks there for good
  set[STUCK] = mon(spin('coin'), { power: PRIZE_POWER, thru: 1, newmon: STUCKPOP });
  set[STUCKPOP] = mon(blink('num100'), { power: NUMBER_POWER, thru: 1, end: -2 });
  return set;
}
