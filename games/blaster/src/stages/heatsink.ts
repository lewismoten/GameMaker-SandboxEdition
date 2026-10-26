// Stage 5-D, "The Heat Sink": the CPU's side leg, the last run before GLITCH. Side-on over the
// 486 under its fan: aluminum fins rise from the heat sink's base and the fan's grille hangs
// from its frame, the heat off the chip shoves the ship up through the gaps, and the virus
// throws everything it has: Opcodes stall and snap, Clock Spikes dive, Logic Bombs plow in.
import { cpuVirus } from '../blocks/cpu5';
import { sinkArt, sinkBlocks, sinkRamps } from '../blocks/heatsink';
import { STALL, S_CURVE, diver, heavy, mine, stalker, swooper } from '../characters/enemies';
import { buildPalette } from '../art/pal';
import { rng } from '../../../kit/pixels';
import { sideLeg, sideMites, wander, type Side } from './sideLeg';
import type { Leg } from './stage';

/** A fin h rows tall on the base at column c. */
function fin(s: Side, c: number, h: number): void {
  const b = s.bottom(c);
  for (let k = 0; k < h - 1; k++) s.put(c, b - k, 'finM');
  s.put(c, b - h + 1, 'finT');
}

/** The fan's grille hanging h rows down at column c. */
function grille(s: Side, c: number, h: number): void {
  for (let k = 0; k < h; k++) s.put(c, s.top(c) + k, 'grille');
}

const conga = (s: Side, c: number, r: number, n: number, name: string) => {
  for (let i = 0; i < n; i++) s.mon(c + i, r, name);
};

export function sinkLeg(): Leg {
  const pal = buildPalette('cpu');
  sinkRamps(pal);
  const art = sinkArt(pal);
  const r = rng(531);
  const ceil = wander(r, 1, 2, 16, 4);
  const floor = wander(r, 1, 2, 16, 3);
  return sideLeg({
    file: 's5s',
    title: 'The Heat Sink',
    card: ['Over the 486, under its fan.', 'Weave the fins: heat rises', 'and shoves you up. GLITCH', 'is waiting past the gate!'],
    seed: 532,
    pal,
    art,
    own: (bs) => sinkBlocks(bs, art),
    virus: (b) => {
      cpuVirus(b, pal);
      sideMites(b, 'mite', 6);
      diver(b, 'spike', { score: 180, speed: 6, dive: 9 });
      swooper(b, 'opL', S_CURVE(-1, 6), { pic: 'op', score: 180 });
      swooper(b, 'opStall', STALL(1), { pic: 'op', score: 200 });
      stalker(b, 'slug', { hp: 4, speed: 2, score: 450 });
      heavy(b, 'bomb', { hp: 7, score: 700, speed: 1 });
      heavy(b, 'clawL', { hp: 2, score: 150 });
      heavy(b, 'clawR', { hp: 2, score: 150 });
      mine(b, 'cluster', { hp: 3 });
    },
    opts: { turretEvery: 9, seekerEvery: 32, flakEvery: 24, hatchShut: 34, hatchOpen: 30, hatchEvery: 7, fenceOn: 24, fenceOff: 22 },
    ceil,
    floor,
    build: (s) => {
      const mid = (c: number) => (s.top(c) + s.bottom(c)) >> 1;
      s.mon(22, 3, 'spike').mon(24, 6, 'spike');
      fin(s, 27, 3);
      fin(s, 29, 4);
      s.draft(30, 31, 'U');
      fin(s, 32, 3);
      for (const c of [33, 34]) s.pickup(c, mid(c) - 1, 'bit');
      grille(s, 37, 3);
      conga(s, 40, 5, 4, 'opStall');
      s.turret(46, 'floor', 'flak');
      s.pickup(48, mid(48), 'nova');
      fin(s, 50, 4);
      s.draft(51, 52, 'U');
      fin(s, 53, 4);
      s.mon(56, 4, 'clawL').mon(56, 5, 'bomb').mon(56, 6, 'clawR');
      s.turret(59, 'ceil');
      s.fence(62, 'A');
      s.mon(64, 3, 'slug');
      s.pickup(66, mid(66), 'repair');
      grille(s, 68, 3);
      fin(s, 71, 3);
      s.hatch(73, 'floor');
      conga(s, 75, 3, 3, 'opL');
      s.mon(78, 6, 'cluster');
      s.fence(80, 'B');
      s.pickup(82, mid(82), 'life');
      s.scatter([['fan0', 2, 2, 'any']], 6);
    },
    cardView: { c: 25, r: 2 },
  });
}
