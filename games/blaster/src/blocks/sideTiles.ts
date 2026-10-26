// The blocks every side-scrolling leg has, seen from the side: the strips' own pictures
// (tiles.ts) turned a quarter turn, so what fired down the screen fires left at the ship.
// Turret mounts stand on the floor or hang from the ceiling on a bracket and sweep, firewalls
// run from a post in the ceiling to one in the floor, hatches open in the terrain's face,
// drafts shove the ship up or down, and the gate is a glowing wall at the end. Pickups keep
// their letters upright.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../../../../web/src/formats/blocks';
import { Pixels } from '../../../kit/pixels';
import { BlockSet, bevel, micro, text, turn90 } from '../art/draw';
import { HURT } from '../characters/sharedMonsters';
import { SEQ } from '../ids';
import { beam, current, gap, gate, hatch, launch, mount, pickup, post, type PickupKind, type StageArt } from './tiles';

export const SOLID = SOLTOP | SOLRIG | SOLBOT | SOLLEF;

/** A side leg's look: its backdrop (floor) and the faces of its terrain. */
export interface SideArt extends StageArt {
  /** The top face of the floor and the bottom face of the ceiling. */
  face(side: 'floor' | 'ceil'): Pixels;
}

export interface SideOpts {
  turretEvery?: number;
  seekerEvery?: number;
  flakEvery?: number;
  hatchOpen?: number;
  hatchShut?: number;
  hatchEvery?: number;
  fenceOn?: number;
  fenceOff?: number;
}

/** A turned mount on a bracket to the floor or the ceiling. */
function sideMount(a: StageArt, kind: 'L' | 'D' | 'R' | 'S' | 'F', on: 'floor' | 'ceil'): Pixels {
  const p = a.pal;
  const t = turn90(mount(a, kind));
  // the bracket: a steel foot from the socket to the surface
  const y0 = on === 'floor' ? 16 : 0;
  bevel(t, 5, y0, 10, 4, p.r('deep'), 2, 1);
  t.rect(8, on === 'floor' ? 15 : 4, 4, 1, p.c('steel', 2));
  return t;
}

/** Turns a tile picture drawn for the strips (over the backdrop). */
const turned = (pic: Pixels) => turn90(pic);

/** Adds the shared side-leg blocks to bs (the leg adds its backdrop and terrain first). */
export function addSideTiles(bs: BlockSet, a: SideArt, o: SideOpts): void {
  const T = o.turretEvery ?? 12;
  // a floor mount sweeps up-left and left, a ceiling mount left and down-left, firing where they point
  bs.add('tfU', sideMount(a, 'L', 'floor'), { next: 'tfL', ntime: T, birth: 'pelletL', birthTime: T });
  bs.add('tfL', sideMount(a, 'D', 'floor'), { next: 'tfU', ntime: T, birth: 'pellet', birthTime: T });
  bs.add('tcL', sideMount(a, 'D', 'ceil'), { next: 'tcD', ntime: T, birth: 'pellet', birthTime: T });
  bs.add('tcD', sideMount(a, 'R', 'ceil'), { next: 'tcL', ntime: T, birth: 'pelletR', birthTime: T });
  // fixed mounts: seeker pods and flak cannons
  bs.add('tsF', sideMount(a, 'S', 'floor'), { birth: 'seeker', birthTime: o.seekerEvery ?? 40 });
  bs.add('tsC', sideMount(a, 'S', 'ceil'), { birth: 'seeker', birthTime: o.seekerEvery ?? 40 });
  bs.add('tkF', sideMount(a, 'F', 'floor'), { birth: 'flak', birthTime: o.flakEvery ?? 30 });
  // a virus hatch in the terrain's face: shut, then open and spitting mites (miteF up out of
  // the floor, miteC down out of the ceiling: sideLeg.ts sideMites)
  for (const side of ['floor', 'ceil'] as const) {
    const f = { ...a, floor: () => a.face(side) };
    const k = side === 'floor' ? 'F' : 'C';
    bs.add(`hatch${k}`, hatch(f, false), { next: `hatch${k}O`, ntime: o.hatchShut ?? 40, solid: SOLID });
    bs.add(`hatch${k}O`, hatch(f, true), { next: `hatch${k}`, ntime: o.hatchOpen ?? 30, birth: `mite${k}`, birthTime: o.hatchEvery ?? 10, solid: SOLID });
  }
  // firewalls from the ceiling to the floor: two sets blinking out of step
  const on = o.fenceOn ?? 24;
  const off = o.fenceOff ?? 24;
  bs.add('postT', turned(post(a, 'L')));
  bs.add('postB', turned(post(a, 'R')));
  bs.add('beamGap', turned(gap(a)));
  bs.add('beamA', turned(beam(a, true, 0)), { next: 'beamA1', ntime: on, chHitPt: HURT.hazard, touch: 'beamGap' });
  bs.add('beamA1', turned(beam(a, false, 0)), { next: 'beamA', ntime: off });
  bs.add('beamB', turned(beam(a, false, 2)), { next: 'beamB1', ntime: off });
  bs.add('beamB1', turned(beam(a, true, 2)), { next: 'beamB', ntime: on, chHitPt: HURT.hazard, touch: 'beamGap' });
  // pickups, upright and floating free (no pad: taken, they leave the backdrop)
  const pk = (kind: PickupKind, props: object) => {
    bs.add(`${kind}`, pickup(a, kind, 0, a.floor(0)), { next: `${kind}1`, ntime: 5, touch: 'floor0', ...props });
    bs.add(`${kind}1`, pickup(a, kind, 1, a.floor(0)), { next: kind, ntime: 5, touch: 'floor0', ...props });
  };
  pk('nova', { effect: SEQ.nova, eamt: 2 });
  pk('repair', { chHitPt: 10 });
  pk('life', { effect: 1, eamt: 1 });
  pk('bit', { scorePts: 50 });
  // drafts shove the ship up or down (gravity blocks: 1 up, 4 down)
  bs.add('curU', turned(current(a, 'L', 0)), { next: 'curU1', ntime: 2, grav: 1 });
  bs.add('curU1', turned(current(a, 'L', 1)), { next: 'curU', ntime: 2, grav: 1 });
  bs.add('curD', turned(current(a, 'R', 0)), { next: 'curD1', ntime: 2, grav: 4 });
  bs.add('curD1', turned(current(a, 'R', 1)), { next: 'curD', ntime: 2, grav: 4 });
  // the gate out and the launch pad
  for (let k = 0; k < 4; k++) bs.add(`gate${k}`, turned(gate(a, k)), { next: `gate${(k + 1) % 4}`, ntime: 2 });
  bs.add('launch', turned(launch(a)));
}

/**
 * A side leg's terrain: the ceiling's inside and its bottom face, the floor's inside and its
 * top face (solid), and the four slopes where a height steps by one (the face cut corner to
 * corner over the backdrop, with an `edge` color along the cut; scenery, not solid).
 */
export function addTerrain(bs: BlockSet, back: Pixels, t: { cIn: Pixels; cBot: Pixels; fIn: Pixels; fTop: Pixels }, edge: number): void {
  bs.add('cIn', t.cIn, { solid: SOLID });
  bs.add('cBot', t.cBot, { solid: SOLID });
  bs.add('fIn', t.fIn, { solid: SOLID });
  bs.add('fTop', t.fTop, { solid: SOLID });
  const cut = (face: Pixels, inside: (x: number, y: number) => boolean, line: (x: number, y: number) => boolean) =>
    new Pixels(20, 20).map((x, y) => (line(x, y) ? edge : inside(x, y) ? face.get(x, y) : back.get(x, y)));
  // floor rising to the right: its lower-right half; falling: its lower-left half
  bs.add(
    'fUp',
    cut(
      t.fTop,
      (x, y) => y > 19 - x,
      (x, y) => y === 19 - x || y === 20 - x,
    ),
  );
  bs.add(
    'fDn',
    cut(
      t.fTop,
      (x, y) => y > x,
      (x, y) => y === x || y === x + 1,
    ),
  );
  // ceiling coming down to the right: its upper-right half; going up: its upper-left half
  bs.add(
    'cDn',
    cut(
      t.cBot,
      (x, y) => y < x,
      (x, y) => y === x || y === x - 1,
    ),
  );
  bs.add(
    'cUp',
    cut(
      t.cBot,
      (x, y) => y < 19 - x,
      (x, y) => y === 19 - x || y === 18 - x,
    ),
  );
}

/**
 * The distance meter: a sign every screen along a side leg, GATE and an arrow over the screens
 * left to the gate (4, 3, 2, 1), in the stage's trim and glow. The arrow is a ring of three
 * pictures, so it runs toward the gate.
 */
export function addMeter(bs: BlockSet, a: SideArt): void {
  const p = a.pal;
  const plate = () => {
    const t = a.floor(0).crop(0, 0, 20, 20);
    bevel(t, 0, 3, 20, 14, p.r('trim'), 1, 1);
    t.rect(1, 4, 18, 12, p.c('ink', 0));
    return t;
  };
  for (let k = 0; k < 3; k++) {
    const t = plate();
    micro(t, 2, 5, 'GATE', p.c('trim', 5));
    for (let i = 0; i < 3; i++) {
      const x = 3 + i * 5;
      const c = i === k ? p.c('glow', 4) : p.c('glow', 1);
      t.rect(x, 12, 2, 1, c)
        .rect(x + 2, 13, 1, 1, c)
        .rect(x, 14, 2, 1, c);
    }
    bs.add(`mtr${k}`, t, { next: `mtr${(k + 1) % 3}`, ntime: 4 });
  }
  for (let n = 1; n <= 4; n++) {
    const t = plate();
    text(t, 6, 6, String(n), p.c('glow', 4));
    bs.add(`mtrN${n}`, t);
  }
}
