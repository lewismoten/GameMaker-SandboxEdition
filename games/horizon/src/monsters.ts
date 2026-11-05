// TO THE HORIZON's monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   BALL + lane  a beach ball (BALL 3 left lane, 4 middle, 5 right) that comes over the hill.
// What the engine does (code/GM/PLAYGAME.C, the monster path): a monster walks its list of corners at
// the speed written on each, and shows its pictures in turn, each for the ticks written beside it.
// So a ball whose first corner is one big leap onto the vanishing point, then four slides down its
// lane that get longer and faster, and whose four pictures are the same ball at four sizes, seems
// to roll out of the distance and come near. Nothing is 3-D; it is the path and the pictures.
// Every ball is harmless: its blocks are not solid and take no hit points.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { ROAD_SIZES, growPics, laneSlide, leapTo, roadCorners, shrinkSprite } from '@lewismoten/gamemaker-sandbox-tools/kit/road3d';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';
import { HORIZON_ROW, SPAWN_COL, VP } from './view';

/** The ball for each lane (0 left, 1 middle, 2 right) is monster number BALL + lane. */
export const BALL = 3;
/** Powers: 100 or more cannot be popped by touching Kit. */
export const POWER = 110;
/** Hit points Kit starts with (nothing in this game takes any, but Game-Maker wants a number). */
export const HERO_HIT_POINTS = 50;

const T = 255;

/** A beach ball at full size: red, white and blue wedges with a pale glint. */
function ball(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  const cx = 9.5;
  const cy = 10.5;
  const R = 8.2;
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.hypot(dx, dy);
      if (d > R) continue;
      // five wedges turning round the ball's top
      const wedge = Math.floor(((Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2)) * 6 + 0.5) % 6;
      const ramp = wedge % 3 === 0 ? 'red' : wedge % 3 === 1 ? 'white' : 'blue';
      const shade = dx + dy < -4 ? 3 : dx + dy > 5 ? 1 : 2;
      p.set(x, y, c(ramp, Math.min(shade, ramp === 'white' ? 3 : 4)));
    }
  p.disc(cx, cy, 1.6, c('gold', 3)); // the cap in the middle
  p.set(6, 6, c('white', 3)).set(7, 5, c('white', 3)).set(6, 7, c('white', 3)); // a glint
  return outline(p, c('ink', 0), { transparent: T });
}

/** The monster pictures: the kit's, then the ball at four sizes (ball0 the dot on the horizon, ball3 full size). */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  const full = ball(pal);
  ROAD_SIZES.forEach((s, i) => mb.add(`ball${i}`, shrinkSprite(full, s.scale, s.bottom, T), {}));
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

/** The .MON: the kit's three, then the three lanes' balls. Each leaps onto the vanishing point, then slides down its lane growing. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  for (const lane of [0, 1, 2]) {
    const steps = [leapTo([SPAWN_COL + lane, HORIZON_ROW], VP), ...laneSlide(lane - 1)];
    set[BALL + lane] = mon(
      growPics('ball').map(([name, ticks]) => [mb.n(name), ticks] as [number, number]),
      { power: POWER, thru: 0, end: -1 },
      roadCorners(steps, 0).map(([x, y, speed, orient]) => corner(x, y, speed, orient)),
    );
  }
  return set;
}
