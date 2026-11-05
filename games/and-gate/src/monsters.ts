// BOTH TOGETHER's monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   SPARK     3  a small gold spark that runs along the wire (power 80, dies at the end of its path)
//   DIAL_OFF  4  a dial that is off: a red lamp on a gray box (power 90)
//   DIAL_ON   5  the same dial turned on: a green lamp (power 80, never dies)
//   LAMP      6  the lamp at the end of the wire, dark (power 70)
//   FALLING   7  the light that comes loose when the lamp lights: it slides down the post (power 200)
//   LIGHT     8  the light at the foot of the post, waiting to be touched (power 200, never dies)
// What the engine does (code/GM/PLAYGAME.C, DoCollision and the touch test in moveallmons): when
// two monsters meet, the stronger kills the weaker and equal powers pass through each other. Kit
// kills (by touching) only a monster with a power under 100, and only if its "End" is not -2.
//   - the spark (80) dies on a dial that is off (90) and passes through a dial that is on (80)
//   - touching a dial that is off kills it, and it "becomes" the dial that is on
//   - the spark (80) kills the dark lamp (70), which becomes the falling light
//   - the falling light ends its path and becomes the light at the foot of the post
//   - the light's picture block adds 1 to counter 22; the gate spends it
// So every dial must be on before a spark gets through, which is an AND. Nothing here is logic.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';
import { LIGHTS } from './gateBlocks';

/** The monster numbers this game adds after the kit's gumdrop 0, buzzer 1 and shelly 2. */
export const SPARK = 3;
export const DIAL_OFF = 4;
export const DIAL_ON = 5;
export const LAMP = 6;
export const FALLING = 7;
export const LIGHT = 8;
/** Powers: a spark meets a dial that is off (stronger) and dies, meets one that is on (equal) and passes. */
export const POWER = { spark: 80, off: 90, on: 80, lamp: 70, light: 200 } as const;
/** Hit points Kit starts with (nothing in this game takes any, but Game-Maker wants a number). */
export const HERO_HIT_POINTS = 50;
/** The spark's speed, and the falling light's. */
export const SPARK_SPEED = 2;
export const FALL_SPEED = 2;
/** How far the light slides down from the lamp to the foot of the post, in blocks. */
export const FALL = 8;

const T = 255;

/** A dial: a gray box with a round lamp (red or green) over a slider whose knob sits at the left when off and at the right when on. */
function dial(pal: Pal, on: boolean, lit: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  p.rect(2, 3, 16, 14, c('stone', 1)).rect(3, 4, 14, 12, c('stone', 3)).rect(3, 4, 14, 1, c('stone', 4));
  const lamp = r(on ? 'green' : 'red');
  p.disc(10, 8, 3.4, c('ink', 0))
    .disc(10, 8, 2.6, lamp[lit ? 4 : 2])
    .set(9, 7, lamp[lamp.length - 1]);
  // the slider: a dark track, with its knob at the left when off and at the right when on
  p.rect(5, 12, 10, 3, c('ink', 0)).rect(6, 13, 8, 1, c('stone', 0));
  const kx = on ? 11 : 5;
  p.rect(kx, 11, 4, 5, c('ink', 0)).rect(kx + 1, 12, 2, 3, on ? c('green', 3) : c('hot', 0));
  return outline(p, c('ink', 0), { transparent: T });
}

/** The spark: a gold ball with four short rays, bigger or smaller by turns. */
function spark(pal: Pal, big: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  const g = r('gold');
  const rad = big ? 4.8 : 3.8;
  const reach = big ? 9 : 7;
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const)
    p.line(10 + dx * (rad + 1), 10 + dy * (rad + 1), 10 + dx * reach, 10 + dy * reach, g[4]);
  blob(p, 9.5, 9.5, rad, rad, g, 2, 5);
  p.disc(9.5, 9.5, rad - 2, g[5]);
  return outline(p, c('ink', 0), { transparent: T });
}

/** A lamp bulb on its socket: dark and gray until lit, then gold. */
function bulb(pal: Pal, lit: boolean, bright = true): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  p.rect(7, 14, 6, 3, c('stone', 1)).rect(7, 14, 6, 1, c('stone', 3)).rect(8, 17, 4, 2, c('ink', 1));
  if (lit) {
    const g = r('gold');
    p.disc(10, 8, 7.6, bright ? g[1] : g[0]); // a halo
    blob(p, 9.5, 8.5, 5.4, 5.6, g, 2, 5);
    p.disc(8, 6, 1.6, g[5]);
  } else {
    blob(p, 9.5, 8.5, 5.4, 5.6, r('stone'), 0, 3);
    p.disc(8, 6, 1.4, c('stone', 4));
  }
  return outline(p, c('ink', 0), { transparent: T });
}

/** The monster pictures: the kit's, then the spark (two frames), the dials (two each), the dark and the lit bulb. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  mb.add('spark0', spark(pal, true), {});
  mb.add('spark1', spark(pal, false), {});
  mb.add('dialOff0', dial(pal, false, true), {});
  mb.add('dialOff1', dial(pal, false, false), {});
  mb.add('dialOn0', dial(pal, true, true), {});
  mb.add('dialOn1', dial(pal, true, false), {});
  mb.add('lamp', bulb(pal, false), {});
  mb.add('fall0', bulb(pal, true, true), {});
  mb.add('fall1', bulb(pal, true, false), {});
  // the light at the foot of the post: touch it and counter 22 goes up by one
  mb.add('light0', bulb(pal, true, true), { effect: LIGHTS, eamt: 1 });
  mb.add('light1', bulb(pal, true, false), { effect: LIGHTS, eamt: 1 });
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

/** The path a spark runs: corners are measured from where it starts, in blocks. Level 1 and 2 each give their own. */
export type Route = [number, number][];

/** The .MON: the kit's three, then the spark, the two dials, the dark bulb, the falling light and the light at the foot. */
export function monsterSet(mb: Book, route: Route): Monster[] {
  const set = buildMonsters(mb);
  const pics = (name: string, ticks = 4): [number, number][] => [
    [mb.n(`${name}0`), ticks],
    [mb.n(`${name}1`), ticks],
  ];
  const still = (p: [number, number][], o: Partial<Monster>): Monster => mon(p, { thru: 0, ...o });
  set[SPARK] = mon(
    pics('spark', 3),
    { power: POWER.spark, thru: 0, end: -1 },
    route.map(([x, y], i) => corner(x, y, i === 0 ? SPARK_SPEED : SPARK_SPEED)),
  );
  set[DIAL_OFF] = still(pics('dialOff', 9), { power: POWER.off, end: 0, newmon: DIAL_ON });
  set[DIAL_ON] = still(pics('dialOn', 9), { power: POWER.on, end: -2 });
  set[LAMP] = still([[mb.n('lamp'), 8]], { power: POWER.lamp, end: 0, newmon: FALLING });
  set[FALLING] = mon(pics('fall', 4), { power: POWER.light, thru: 0, end: -1, newmon: LIGHT }, [corner(0, 0, FALL_SPEED), corner(0, FALL, FALL_SPEED)]);
  set[LIGHT] = still(pics('light', 8), { power: POWER.light, end: -2 });
  return set;
}
