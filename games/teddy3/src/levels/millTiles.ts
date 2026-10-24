// Level 8's background blocks, the old mill on a summer afternoon (the river and the mill
// from the sequel, where Teddy fished Doc Leo's rubber chicken out of the pool): the bank, the
// mill cut open like a dollhouse (stone below, boards above, the sill, the gallery and the
// loft, ledges Teddy can hop up through), the hubs and spokes of its water wheels (the
// paddles are monsters), the flume that pours down the mill's far side into the millrace (air
// whose gravity points down and along), the millrace (water that floats Teddy and carries him
// downstream to the big wheel), the quay beyond it, and the miller with his sacks.
import { Pixels } from '../../../kit/pixels';
import { blob } from '../art/draw';
import { GRAV, Tiles } from './level';
import { CTR } from '../ids';
import { errandOn } from '../sprites/errands';
import { bricks, c, canvas, cloud, copy, cut, dirt, grassTop, hedge, leaves, planks, r, sky, trunk, tuft } from '../blocks/tiles';
import { bandAt, water, wideSign } from './common';
import { miller, sack } from '../sprites/river';
import { bubble } from '../sprites/townfolk';
import { leoOn } from '../sprites/leo';

export const G = 40;
/** The mill's rows: its roof, the boards above the stone (the loft), the stone below. */
export const MILL = { roof: 22, stone: 28 };

/** A beam across the top of a block (a floor to stand on), drawn over it. */
function beamOver(p: Pixels): Pixels {
  p.rect(0, 0, 20, 5, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 5, 20, 1, c('ink', 0));
  p.rect(3, 6, 2, 3, c('wood', 1)).rect(15, 6, 2, 3, c('wood', 1));
  return p;
}

/**
 * The hub and spokes of a wheel (3x3, inside its ring of paddles), over per-cell bases. With
 * `floor`, a beam runs across its top row (a ledge): the floor Teddy steps off onto.
 */
export function hub(t: Tiles, name: string, base: (bx: number, by: number) => Pixels, floor: boolean): void {
  const p = canvas(3, 3, base);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    p.line(30, 30, Math.round(30 + Math.cos(a) * 34), Math.round(30 + Math.sin(a) * 34), c('wood', 1));
    p.line(31, 30, Math.round(31 + Math.cos(a) * 34), Math.round(30 + Math.sin(a) * 34), c('wood', 2));
  }
  p.ring(30, 30, 27, c('wood', 1)).ring(30, 30, 26, c('wood', 2));
  p.disc(30, 30, 7, c('metal', 1)).disc(30, 30, 4, c('metal', 3)).disc(30, 30, 1, c('ink', 0));
  const cells = cut(p);
  for (let by = 0; by < 3; by++)
    for (let bx = 0; bx < 3; bx++) {
      if (floor && by === 0) t.ledge(`${name}${bx}${by}`, beamOver(cells[by][bx]));
      else t.air(`${name}${bx}${by}`, cells[by][bx]);
    }
}

export function millTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  for (let part = 0; part < 3; part++) t.air(`cloud${part}`, cloud(2, part, 31));
  t.wall('grass', grassTop(33));
  t.wall('dirt', dirt(34));
  t.wall('deep', dirt(35, true));
  t.air('tuft', tuft(sky(3), 36));
  t.air('flower', tuft(sky(3), 37, 'yellow'));
  t.wall('hedgeWall', hedge(false, 38));
  t.wall('hedgeTop', hedge(true, 39, sky(bandAt(29, G))));
  // the tree on the bank (its leaves and trunk over the sky bands of the rows it stands in)
  t.air('leaf1', leaves(41, sky(1)));
  for (const k of [2, 3]) t.air(`trunk${k}`, trunk(sky(k)));

  // The mill: stone below, boards above, a shingled roof; its floor, ledges and walls.
  const stone = bricks(41, 'stone', 'ink');
  const boards = planks(42, 'wood', 1);
  t.air('millStone', stone);
  t.air('millIn', boards);
  t.wall(
    'millFloor',
    (() => {
      const p = planks(43, 'wood', 3);
      p.rect(0, 0, 20, 1, c('wood', 4));
      return p;
    })(),
  );
  t.wall('millWall', bricks(44, 'stone', 'ink'));
  const roof = (k: number, side: 'L' | 'M' | 'R') => {
    const p = sky(k);
    for (let y = 0; y < 20; y++) {
      const x0 = side === 'L' ? 19 - y : 0;
      const x1 = side === 'R' ? y + 1 : 20;
      for (let x = Math.max(0, x0); x < Math.min(20, x1); x++) p.set(x, y, y % 5 === 4 ? c('roof', 0) : c('roof', 2));
    }
    return p;
  };
  for (const side of ['L', 'M', 'R'] as const) t.air(`roof${side}`, roof(0, side));
  // the floors: beams across the mill, to stand on (and hop up through)
  t.ledge('beam', beamOver(copy(stone)));
  // the loft's door onto the flume: shut (it opens for the banner), and open
  t.air(
    'millDoor',
    (() => {
      const p = copy(stone);
      p.rect(2, 2, 16, 18, c('ink', 0)).rect(2, 2, 16, 2, c('wood', 3));
      return p;
    })(),
  );
  t.wall(
    'loftGate',
    (() => {
      const p = copy(stone);
      p.rect(2, 2, 16, 18, c('wood', 2)).frame(2, 2, 16, 18, c('ink', 0));
      for (const y of [7, 13]) p.rect(3, y, 14, 1, c('wood', 1));
      p.rect(13, 10, 2, 2, c('metal', 3));
      return p;
    })(),
    { effect: CTR.clues, eamt: -1, touch: 'millDoor' },
  );

  // The wheels' hubs: one picture for the three inside the mill, one for the big one outside.
  hub(t, 'hub', () => stone, true);
  hub(t, 'bigHub', (_bx, by) => sky(bandAt(37 + by, G)), false);

  // The millrace: water that floats Teddy and carries him downstream (gravity right, as the
  // sequel's rapids); the flume: a chute of water down the mill's side (gravity down and along).
  const foam = (base: Pixels, ph: number) => {
    const p = copy(base);
    for (let i = 0; i < 7; i++) {
      const x = (i * 7 + ph * 5) % 20;
      const y = (i * 5 + ph * 3) % 20;
      p.rect(x, y, 3, 1, c('paint', 3));
    }
    return p;
  };
  for (const ph of [0, 1]) {
    t.air(`race${ph}`, foam(water(true, ph, sky(3)), ph), { grav: GRAV.right | GRAV.down, next: `race${1 - ph}`, ntime: 3 });
    t.air(`raceDeep${ph}`, foam(water(false, ph), ph + 2), { grav: GRAV.right | GRAV.up, next: `raceDeep${1 - ph}`, ntime: 3 });
  }
  t.wall(
    'bed',
    (() => {
      const p = dirt(45, true);
      for (let i = 0; i < 6; i++) blob(p, (i * 7) % 20, 4 + ((i * 5) % 12), 3, 2, r('stone'), 1, 3);
      return p;
    })(),
  );
  const flume = (k: number) => {
    const p = sky(k);
    for (let i = 0; i < 20; i++)
      p.rect(i - 4, i, 9, 1, c('water', 2))
        .set(i - 4, i, c('water', 3))
        .set(i + 4, i, c('paint', 3));
    p.line(-1, 4, 15, 20, c('wood', 1));
    return p;
  };
  for (let k = 0; k < 4; k++) t.air(`flume${k}`, flume(k), { grav: GRAV.right | GRAV.down });
  for (let k = 0; k < 4; k++) t.air(`spray${k}`, foam(sky(k), k), { grav: GRAV.right | GRAV.down });

  // The perch over the race: the end of the old hoist arm, sticking out of the quay wall.
  t.ledge(
    'perch',
    (() => {
      const p = sky(bandAt(34, G));
      p.rect(0, 0, 20, 5, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 5, 20, 1, c('ink', 0));
      p.line(19, 6, 12, 19, c('wood', 1)).line(18, 6, 11, 19, c('wood', 2));
      return p;
    })(),
  );

  // The quay over the race, where THE CHEZ is parked.
  t.wall('quay', bricks(46, 'stone', 'ink'));
  t.wall(
    'quayTop',
    (() => {
      const p = bricks(47, 'stone', 'ink');
      p.rect(0, 0, 20, 4, c('stone', 4)).rect(0, 4, 20, 1, c('ink', 0));
      return p;
    })(),
  );

  // The miller, his sacks, and a word for Teddy.
  const [mTop, mBot] = leoOn(miller(), stone, stone);
  t.air('millerTop', mTop);
  t.air('millerBot', mBot);
  t.air('millerSays', bubble(['UP', 'TOP!'], stone));
  t.on('sack', sack(), 'millStone');
  t.on('sackLoft', sack(), 'millIn');
  // The banner counts twice: the loft's door to the flume takes one (so nobody slides down
  // to the quay without it, where there's no way back up), and THE CHEZ's door the other.
  t.add('banner', errandOn(boards, 'banner'), { obj: true, effect: CTR.clues, eamt: 2, score: 100, touch: 'millIn', grav: GRAV.down });

  // Signs.
  const sayWide = (name: string, base: Pixels, words: string) => {
    const [a, b] = wideSign(base, words);
    t.air(`${name}L`, a);
    t.air(`${name}R`, b);
  };
  sayWide('signRide', sky(3), 'RIDE A\nPADDLE UP');
  sayWide('signLevel', stone, 'STEP ON\nWHEN LEVEL');
  sayWide('signFlume', boards, 'FLUME TO\nTHE CAR');
  return t;
}
