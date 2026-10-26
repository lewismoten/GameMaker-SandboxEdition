// Stage 5's first leg, "The Ribbon Cable": out of the hard disk and up its ribbon cable to
// the CPU. The track (cableTrack.ts) runs corner to corner across a map that wraps on every
// side, five wires in a spiral: each lap ends at the kink, where the lane bends flat and
// carries on round the wrap into the next wire down. The fifth wire is the red one, and the
// gate is in it. Riding along visits every wire; a splice (a gap in a ridge, Right to hop
// through) skips a lap, and missing one only costs that lap.
import { MLEN, MWID } from '../../../../web/src/formats/map';
import { buildPalette, type Pal } from '../art/pal';
import { BlockSet } from '../art/draw';
import { CableBlocks, cableArt, type Mark } from '../blocks/cable';
import { EGG_BLOCK, eggPic } from '../blocks/egg';
import { addPickupTiles, pad } from '../blocks/tiles';
import { mine, pics, stalker, swooper } from '../characters/enemies';
import { POWER } from '../ids';
import { Bestiary } from '../characters/mons';
import { addCommon } from '../characters/sharedMonsters';
import { cluster, keyOf, mite, slug, spike } from '../sprites/sprites';
import { GATE_X, KINK, RIDGE, cellOf, tOf, wireNumber, wireOfLap } from './cableTrack';
import { Grid } from './mapkit';
import type { Leg } from './stage';

/** The cable's virus: Packets dive along the wire at you, Crosstalk jumps across it. */
function virus(b: Bestiary, p: Pal): void {
  pics(b, 'packet', ...spike(keyOf(p, { main: 'gold', accent: 'glow' })));
  pics(b, 'noise', ...mite(keyOf(p, { main: 'virus', accent: 'slime' })));
  pics(b, 'slug', ...slug(keyOf(p, { main: 'red', accent: 'gold' })));
  pics(b, 'cluster', ...cluster(p, { main: 'virus', accent: 'red' }));
  // a Packet swoops to a spot just ahead on your line, then dives down the wire through it
  b.add('packet', {
    power: POWER.enemy,
    pics: [
      ['packet0', 4],
      ['packet1', 4],
    ],
    becomes: 'boom',
    score: 150,
    attack: {
      mode: 'player',
      legs: [
        [3, -3, 4],
        [-14, 14, 6],
      ],
    },
  });
  // Crosstalk waits by the ridge above, then jumps across the wire, down and to the right
  swooper(b, 'noise', [[8, 8, 4]], { score: 120 });
  stalker(b, 'slug', { hp: 3, speed: 1, score: 250 });
  mine(b, 'cluster');
}

/** The cable's map and blocks. */
export function cableLeg(): Leg {
  const pal = buildPalette('cpu');
  const art = cableArt(pal);
  const bs = new BlockSet(150, 'bbl');
  const cb = new CableBlocks(bs, pal);
  const slope = (x: number) => (x < KINK ? 'slant' : 'flat');
  const plain = (x: number, y: number) => cb.name(tOf(x, y), slope(x));
  // the bare track first, so the block numbers follow the map
  for (let y = 0; y < MWID; y++) for (let x = 0; x < MLEN; x++) plain(x, y);
  addPickupTiles(bs, art);
  const beasts = new Bestiary();
  addCommon(beasts, pal, 'diag');
  virus(beasts, pal);

  const g = new Grid(bs, beasts, art, 0, 1, 501, plain);
  const at = (lap: number, x: number, o: number) => cellOf(lap, x, o);
  const mark = (lap: number, x: number, o: number, m: Mark) => {
    const c = at(lap, x, o);
    g.put(c.x, c.y, cb.name(tOf(c.x, c.y), slope(c.x), m));
  };
  const put = (lap: number, x: number, o: number, name: string) => {
    const c = at(lap, x, o);
    g.put(c.x, c.y, name);
  };
  const mon = (lap: number, x: number, o: number, name: string) => {
    const c = at(lap, x, o);
    if (o < RIDGE + 1) throw new Error(`${name} on a ridge at lap ${lap}, x ${x}`);
    g.monAt(c.x, c.y, name);
  };

  // lane markings: the wire's number at the start of each lap, chevrons along the middle
  for (let lap = 0; lap < 5; lap++) {
    mark(lap, 8, 11, `digit${wireNumber(wireOfLap(lap))}`);
    mark(lap, 40, 11, `digit${wireNumber(wireOfLap(lap))}`);
    for (let x = 14; x < KINK; x += 6) if (x !== 38 && x !== 44) mark(lap, x, 11, 'chevron');
    for (const x of [84, 90, 96]) mark(lap, x, 11, 'chevron');
  }
  // the splices: gaps in the ridge under wires 4 and 2, into the next wire down
  for (const [lap, x0] of [
    [1, 62],
    [3, 46],
  ])
    for (let x = x0; x < x0 + 6; x++) for (let o = 0; o < RIDGE; o++) mark(lap + 1, x, o, 'gap');

  const start = at(0, 4, 11);
  g.put(start.x, start.y, 'launch');

  // lap 0: wire 5
  for (const x of [22, 24, 26]) put(0, x, 11, 'bit');
  mon(0, 30, 8, 'packet');
  mon(0, 38, 15, 'packet');
  mon(0, 46, 7, 'cluster');
  mon(0, 52, 14, 'cluster');
  mon(0, 58, 4, 'noise');
  mon(0, 60, 15, 'packet');
  put(0, 64, 11, 'nova');
  mon(0, 70, 11, 'packet');
  // lap 1: wire 4
  mon(1, 14, 9, 'packet');
  mon(1, 16, 6, 'slug');
  mon(1, 20, 14, 'packet');
  mon(1, 44, 4, 'noise');
  mon(1, 50, 4, 'noise');
  mon(1, 54, 10, 'cluster');
  put(1, 58, 11, 'repair');
  mon(1, 70, 8, 'packet');
  mon(1, 74, 14, 'packet');
  // lap 2: wire 3
  for (const [x, o] of [
    [14, 6],
    [18, 14],
    [22, 9],
    [26, 16],
    [30, 7],
  ])
    mon(2, x, o, 'cluster');
  mon(2, 36, 11, 'packet');
  mon(2, 40, 6, 'packet');
  mon(2, 62, 14, 'packet');
  mon(2, 64, 4, 'noise');
  mon(2, 70, 4, 'noise');
  put(2, 74, 11, 'life');
  // lap 3: wire 2
  mon(3, 10, 15, 'packet');
  mon(3, 14, 11, 'slug');
  mon(3, 20, 8, 'packet');
  mon(3, 24, 14, 'packet');
  mon(3, 30, 4, 'noise');
  mon(3, 36, 4, 'noise');
  put(3, 42, 11, 'nova');
  mon(3, 54, 8, 'cluster');
  mon(3, 58, 15, 'cluster');
  for (const x of [62, 64]) put(3, x, 11, 'bit');
  // lap 4: the red wire, and the gate
  mon(4, 18, 10, 'packet');
  mon(4, 26, 14, 'packet');
  mon(4, 34, 4, 'noise');
  mon(4, 42, 7, 'cluster');
  mon(4, 46, 15, 'cluster');
  mon(4, 52, 9, 'packet');
  mon(4, 56, 13, 'packet');
  for (const x of GATE_X)
    for (let o = RIDGE; o < 20; o++) {
      const c = at(4, x, o);
      g.put(c.x, c.y, `gate${(c.y + x) % 4}`);
      g.linkAt(c.x, c.y);
    }

  // last, at the number it has in every set (the inventory keeps only block numbers)
  bs.addAt(EGG_BLOCK, 'egg', eggPic(pal, pad(art)), { obj: 1, touch: 'pad' });
  return {
    file: 's5r',
    kitFile: 's5r',
    title: 'The Ribbon Cable',
    kind: 'diag',
    grid: g,
    kit: { bs, beasts },
    start,
    cardView: { x: start.x - 8, y: start.y - 4 },
    card: ['Up the cable to the CPU!', 'UP: faster  DOWN: brake', 'LEFT/RIGHT: across wires.', 'The gate is on the RED wire.'],
  };
}
