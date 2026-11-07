// Level 8, THE LOW TUNNEL (night, nearly dark): the snow trail goes into the old mill tunnel under the road. There are
// no lights in Game-Maker, so light is paint (the Lights Out Starter's tricks): two old lamps glow on the wall,
// painted in rings of brighter stone; every dark bit of air Tess walks through stays lit behind her, so she leaves
// a trail of light; and each lantern she touches lights up. Glow-worms twinkle on the ceiling, each at its own
// pace. Some stretches are so low there is only just room to walk. The low road goes in; a ladder at its end
// climbs to the old mill race, which runs back. At its far end, a very small cloud is hiding, snowing on itself: Wisp.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { addSigns, onGround, startBook, type Level } from '../level';
import { TRAIL } from '../monsters';

/** Two tunnels, one over the other: the low road in (to the right) and the old mill race back (to the left). */
export const LOWER = { ceil: 11, floor: 18 } as const;
export const UPPER = { ceil: 3, floor: 10 } as const;

export const TUNNEL_AT = {
  /** [first, last column, which tunnel] of each stretch where the ceiling comes down. */
  low: [
    [18, 27, 'lower'],
    [46, 55, 'lower'],
    [60, 68, 'upper'],
    [22, 30, 'upper'],
  ],
  ladder: 84,
  lanterns: [
    [12, 'lower'],
    [33, 'lower'],
    [42, 'lower'],
    [62, 'lower'],
    [74, 'lower'],
    [76, 'upper'],
    [50, 'upper'],
    [36, 'upper'],
    [16, 'upper'],
  ],
  lamps: [
    [8, 'lower'],
    [70, 'lower'],
    [44, 'upper'],
  ],
  worms: [[24, 0, 'upper'], [34, 1, 'lower'], [37, 2, 'lower'], [40, 0, 'lower'], [58, 1, 'lower'], [78, 2, 'lower'], [72, 0, 'upper'], [54, 1, 'upper'], [40, 2, 'upper'], [12, 0, 'upper']],
  puddles: [
    [15, 'lower'],
    [29, 'lower'],
    [39, 'lower'],
    [57, 'lower'],
    [80, 'lower'],
    [70, 'upper'],
    [45, 'upper'],
    [20, 'upper'],
  ],
  wisp: 6,
  exit: 2,
  signs: { dark: 5, low: 13, worms: 35, race: 78, wisp: 9 },
} as const;

const SIGNS = {
  dark: ['SO DARK! LIGHT THE LANTERNS.', 4, 2],
  low: ['LOW BIT. IT IS JUST TALL ENOUGH.', 4, 3],
  worms: ['LOOK UP: GLOW WORMS LIKE THE DARK.', 4, 3],
  race: ['UP THE LADDER TO THE OLD MILL RACE.', 4, 3],
  wisp: ['A SNIFFLE. THERE YOU ARE, WISP!', 4, 3],
} as const;

export function levelTunnel(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['trail', 'tunnel', 'rain']);
  const s = addSigns(book, pal, SIGNS);
  const W = 88;
  const H = 21;
  const T = TUNNEL_AT;
  const tun = { lower: LOWER, upper: UPPER };
  // every block of the tunnels is set here; the grid only marks the way in (lower left) and out (upper left)
  const rows = Array.from({ length: H }, (_, y) =>
    Array.from({ length: W }, (_, x) =>
      x === 3 && y === LOWER.floor - 2 ? 's' : x === 3 && y === LOWER.floor - 1 ? 'S' : x === T.exit && y === UPPER.floor - 2 ? 'e' : x === T.exit && y === UPPER.floor - 1 ? 'E' : ' ',
    ).join(''),
  );
  const m = new StarterMap(book, rows);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = [LOWER, UPPER].find((k) => y > k.ceil && y < k.floor);
      m.set(x, y, t && x > 0 && x < W - 1 ? 'tAir' : y === LOWER.floor || y === UPPER.floor ? 'tFloor' : y > LOWER.floor ? 'dirt' : 'tStone');
    }
  // the low stretches: the ceiling comes down to leave two blocks
  for (const [a, b, k] of T.low) for (let x = a; x <= b; x++) for (let y = tun[k].ceil + 1; y < tun[k].floor - 2; y++) m.set(x, y, 'tStone');
  // the ladder up from the low road to the mill race
  for (let y = UPPER.floor - 1; y < LOWER.floor; y++) m.set(T.ladder, y, 'ladder');
  // old lamps on the wall, lit from the start, in rings of lit stone and warm air
  for (const [x, k] of T.lamps) {
    const { ceil, floor } = tun[k];
    m.set(x, ceil + 2, 'lanternLit');
    for (let dx = -3; dx <= 3; dx++) m.set(x + dx, ceil, Math.abs(dx) <= 1 ? 'tStone2' : 'tStone1');
    for (let dx = -3; dx <= 3; dx++)
      for (let y = ceil + 1; y < floor; y++) {
        const d = Math.hypot(dx, y - (ceil + 2));
        if (d > 0 && d <= 1.5) m.set(x + dx, y, 'glow2');
        else if (d > 1.5 && d <= 3.2) m.set(x + dx, y, 'tAirLit');
      }
  }
  for (const [x, k] of T.lanterns) m.set(x, tun[k].floor - 2, 'lantern');
  for (const [x, k] of T.puddles) m.set(x, tun[k].floor - 1, 'puddle');
  m.set(3, LOWER.floor - 2, 'doorwayTop').set(3, LOWER.floor - 1, 'doorwayBottom');
  m.set(T.exit, UPPER.floor - 2, 'doorTop').set(T.exit, UPPER.floor - 1, 'doorBottom');
  for (const [x, n, k] of T.worms) m.mon([TRAIL.glowA, TRAIL.glowB, TRAIL.glowC][n], x, tun[k].ceil + 1);
  m.mon(TRAIL.wispHide, T.wisp, UPPER.floor - 2);
  const at = T.signs;
  m.sign(at.dark, onGround(LOWER.floor, s.dark), s.dark);
  m.sign(at.low, onGround(LOWER.floor, s.low), s.low);
  m.sign(at.worms, onGround(LOWER.floor, s.worms), s.worms);
  m.sign(at.race, onGround(LOWER.floor, s.race), s.race);
  m.sign(at.wisp, onGround(UPPER.floor, s.wisp), s.wisp);
  return { file: 'tunnel', title: 'The Low Tunnel', hint: 'Light the lanterns as you go.', look: 'tunnel', map: m, book, timed, mon: 'trail', song: 'dusk' };
}
