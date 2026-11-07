// Level 8, THE LOW TUNNEL (night, nearly dark): the puddles go into the old mill tunnel under the road. There are
// no lights in Game-Maker, so light is paint (the Lights Out Starter's tricks): two old lamps glow on the wall,
// painted in rings of brighter stone; every dark bit of air Tess walks through stays lit behind her, so she leaves
// a trail of light; and each lantern she touches lights up. Glow-worms twinkle on the ceiling, each at its own
// pace. Some stretches are so low there is only just room to walk. At the far end, a very small cloud is hiding,
// raining on itself: Wisp.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { addSigns, onGround, startBook, type Level } from '../level';
import { TRAIL } from '../monsters';

export const CEIL = 4;
export const FLOOR8 = 11;

export const TUNNEL_AT = {
  low: [
    [18, 27],
    [46, 55],
  ],
  lanterns: [12, 33, 42, 62, 74],
  lamps: [8, 68],
  worms: [[24, 0], [30, 1], [37, 2], [40, 0], [58, 1], [65, 2], [71, 0]],
  puddles: [15, 29, 39, 57, 70, 77],
  wisp: 80,
  exit: 85,
  signs: { dark: 5, worms: 35, low: 13, wisp: 75 },
} as const;

const SIGNS = {
  dark: ['SO DARK! LIGHT THE LANTERNS.', 4, 2],
  low: ['LOW BIT. IT IS JUST TALL ENOUGH.', 4, 3],
  worms: ['LOOK UP: GLOW WORMS LIKE THE DARK.', 4, 3],
  wisp: ['A SNIFFLE. THERE YOU ARE, WISP!', 4, 3],
} as const;

export function levelTunnel(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['trail', 'tunnel', 'rain']);
  const s = addSigns(book, pal, SIGNS);
  const W = 88;
  const H = 15;
  const T = TUNNEL_AT;
  // the starter grid is not needed: every block of the tunnel is set here
  const rows = Array.from({ length: H }, (_, y) =>
    Array.from({ length: W }, (_, x) => (x === 3 ? (y === FLOOR8 - 2 ? 's' : y === FLOOR8 - 1 ? 'S' : ' ') : x === T.exit ? (y === FLOOR8 - 2 ? 'e' : y === FLOOR8 - 1 ? 'E' : ' ') : ' ')).join(''),
  );
  const m = new StarterMap(book, rows);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const inside = x > 0 && x < W - 1 && y > CEIL && y < FLOOR8;
      m.set(x, y, inside ? 'tAir' : y >= FLOOR8 && x > 0 && x < W - 1 ? (y === FLOOR8 ? 'tFloor' : 'dirt') : 'tStone');
    }
  // the low stretches: the ceiling comes down to leave two blocks
  for (const [a, b] of T.low) for (let x = a; x <= b; x++) for (let y = CEIL + 1; y < FLOOR8 - 2; y++) m.set(x, y, 'tStone');
  // two old lamps on the wall, lit from the start, with rings of lit stone round them in the ceiling
  for (const x of T.lamps) {
    m.set(x, CEIL + 2, 'lanternLit');
    for (let dx = -3; dx <= 3; dx++) m.set(x + dx, CEIL, Math.abs(dx) <= 1 ? 'tStone2' : 'tStone1');
    for (let dx = -3; dx <= 3; dx++)
      for (let y = CEIL + 1; y < FLOOR8; y++) {
        const d = Math.hypot(dx, y - (CEIL + 2));
        if (d > 0 && d <= 1.5) m.set(x + dx, y, 'glow2');
        else if (d > 1.5 && d <= 3.2) m.set(x + dx, y, 'tAirLit');
      }
  }
  for (const x of T.lanterns) m.set(x, FLOOR8 - 2, 'lantern');
  for (const x of T.puddles) m.set(x, FLOOR8 - 1, 'puddle');
  // the way in and the way out
  m.set(3, FLOOR8 - 2, 'doorwayTop').set(3, FLOOR8 - 1, 'doorwayBottom');
  m.set(T.exit, FLOOR8 - 2, 'doorTop').set(T.exit, FLOOR8 - 1, 'doorBottom');
  for (const [x, k] of T.worms) m.mon([TRAIL.glowA, TRAIL.glowB, TRAIL.glowC][k], x, CEIL + 1);
  m.mon(TRAIL.wispHide, T.wisp, FLOOR8 - 2);
  const at = T.signs;
  for (const k of Object.keys(at) as (keyof typeof at)[]) m.sign(at[k], onGround(FLOOR8, s[k]), s[k]);
  return { file: 'tunnel', title: 'The Low Tunnel', hint: 'Light the lanterns as you go.', look: 'tunnel', map: m, book, timed, mon: 'trail', song: 'dusk' };
}
