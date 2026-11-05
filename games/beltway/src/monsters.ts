// ROUND AND ROUND's monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   CAR  a little orange car that drives round the loop track in level 2.
// What the engine does (code/GM/PLAYGAME.C, MonEndPath): a monster walks its list of corners at the
// speed written on each, and a corner with speed 0 ends the path. A monster that never dies starts the path
// over from wherever it stands, so a path whose last corner is the place it began goes round forever.
// Each corner also says how the picture is turned while the monster walks to it: one of 8 orientations (turned
// a quarter at a time, or flipped). So the car's nose points up the right side of the loop and its wheels
// face the track all the way round. The path is eight straight pieces; the engine cannot bend a path.
// The car is harmless: its blocks are not solid and take no hit points.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';
import { CAR_SPEED, LOOP } from './view';

/** The car is monster number CAR. */
export const CAR = 3;
/** Powers: 100 or more cannot be popped by touching Kit. */
export const POWER = 110;
/** Hit points Kit starts with (nothing in this game takes any, but Game-Maker wants a number). */
export const HERO_HIT_POINTS = 50;

const T = 255;

/** The car facing right, wheels down; the hub dot sits at a different place in each of its two pictures. */
function car(pal: Pal, frame: number): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  p.rect(2, 9, 16, 6, c('orange', 2)); // the body
  p.rect(2, 9, 16, 1, c('orange', 4)); // its top edge
  p.rect(5, 5, 9, 4, c('orange', 3)); // the cabin
  p.rect(6, 6, 3, 3, c('sky', 4)).rect(10, 6, 3, 3, c('sky', 4)); // two windows
  p.rect(2, 12, 16, 1, c('white', 3)); // a stripe
  p.rect(17, 10, 2, 2, c('gold', 4)); // the headlamp at the nose
  p.rect(1, 10, 1, 2, c('red', 2)); // the tail lamp
  for (const x of [5, 14]) {
    p.disc(x, 15, 3, c('ink', 0));
    p.set(x + (frame ? 1 : -1), 15 + (frame ? 0 : 0), c('stone', 4)).set(x, frame ? 14 : 16, c('stone', 3));
  }
  return outline(p, c('ink', 0), { transparent: T });
}

/** The monster pictures: the kit's, then the car in its two pictures. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  mb.add('car0', car(pal, 0), {});
  mb.add('car1', car(pal, 1), {});
  return mb;
}

/** The finished .MBL: nothing here hurts or blocks. The kit's own three are made harmless and not solid. */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const n of ['gumdrop0', 'gumdrop1', 'buzzer0', 'buzzer1', 'shelly0', 'shelly1']) {
    blocks[mb.n(n)].solid = 0;
    blocks[mb.n(n)].chHitPt = 0;
  }
  return blocks;
}

/** The .MON: the kit's three, then the car. It starts at the bottom of the loop and its last corner is where it began. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  set[CAR] = mon(
    [
      [mb.n('car0'), 3],
      [mb.n('car1'), 3],
    ],
    { power: POWER, thru: 0, end: -2 },
    [...LOOP.map(([x, y, orient]) => corner(x, y, CAR_SPEED, orient)), corner(0, 0, 0)],
  );
  return set;
}
