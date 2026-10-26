// Stage 1: THE MOTHERBOARD. Leg A "The Data Bus" teaches everything gently; leg B "The
// Chipset" brings sweeping turrets, hatches and firewalls; then the BIOS Bug.
import { boardArt, boardTiles, boardVirus } from '../blocks/board';
import { HOVER_DROP, S_CURVE, SWEEP, ZIGZAG, diver, heavy, mine, mite, swooper } from '../characters/enemies';
import { LENGTH, strip, type Grid } from './mapkit';
import { rng } from '../../../kit/pixels';
import { buildPalette } from '../art/pal';
import { kit, type Stage } from './stage';
import { bossBIOS } from '../bosses/boss1';

function virus1(b: Parameters<typeof boardVirus>[0], p: Parameters<typeof boardVirus>[1]): void {
  boardVirus(b, p);
  mite(b, 'mite', [
    [1, 2, 3],
    [-2, 3, 3],
    [2, 3, 3],
    [-1, 12, 4],
  ]);
  diver(b, 'biter', { score: 100 });
  swooper(b, 'mothL', S_CURVE(-1), { pic: 'moth' });
  swooper(b, 'mothR', S_CURVE(1), { pic: 'moth' });
  swooper(b, 'mothSL', SWEEP(-1), { pic: 'moth' });
  swooper(b, 'mothSR', SWEEP(1), { pic: 'moth' });
  swooper(b, 'mothZ', ZIGZAG(1), { pic: 'moth' });
  swooper(b, 'mothD', HOVER_DROP(), { pic: 'moth' });
  heavy(b, 'bomb', { hp: 4, score: 400 });
  heavy(b, 'clawL', { score: 100 });
  heavy(b, 'clawR', { score: 100 });
  mine(b, 'cluster');
}

/**
 * Light green signal traces over the bare board: each runs north from a via, may jog east or
 * west round a 45-degree bend, and ends in another via. A run only crosses plain floor.
 * Half the empty part footprints are wiped first, so the silkscreen doesn't get noisy.
 */
function wires(g: Grid, seed: number, count: number): void {
  const r = rng(seed);
  const n = (k: number) => Math.floor(r() * k);
  for (let d = 0; d < LENGTH; d++)
    for (let c = 1; c < 15; c++) if (['floor2', 'floor5', 'floor6', 'floor7'].includes(g.get(c, d)) && r() < 0.6) g.set(c, d, 'floor0');
  for (let made = 0, tries = 0; made < count && tries < count * 40; tries++) {
    const c0 = 1 + n(14);
    const d0 = 2 + n(LENGTH - 16);
    const up1 = 1 + n(6);
    const jog = n(3) === 0 ? 0 : (n(2) ? 1 : -1) * (1 + n(3));
    const up2 = jog ? 1 + n(5) : 0;
    // two or three side by side, as a little bundle
    const wide = n(3) === 0 ? 1 : 1 + n(3);
    const lanes: [number, number, string][][] = [];
    for (let k = 0; k < wide; k++) {
      // the inside lane of a bend turns sooner, so the bundle keeps its spacing
      const inner = jog > 0 ? wide - 1 - k : k;
      const cells: [number, number, string][] = [[c0 + k, d0, 'tr_nV']];
      let d = d0;
      for (let i = 0; i < up1 + inner; i++) cells.push([c0 + k, ++d, 'tr_ns']);
      let c = c0 + k;
      if (jog) {
        const dir = Math.sign(jog);
        cells.push([c, ++d, dir > 0 ? 'tr_se' : 'tr_sw']);
        for (let i = 1; i < Math.abs(jog); i++) cells.push([(c += dir), d, 'tr_ew']);
        cells.push([(c += dir), d, dir > 0 ? 'tr_nw' : 'tr_ne']);
        for (let i = 0; i < up2 + (wide - 1 - inner); i++) cells.push([c, ++d, 'tr_ns']);
      }
      cells.push([c, ++d, 'tr_sV']);
      lanes.push(cells);
    }
    const all = lanes.flat();
    if (!all.every(([cc, dd]) => cc >= 1 && cc <= 14 && g.get(cc, dd).startsWith('floor'))) continue;
    if (new Set(all.map(([cc, dd]) => `${cc},${dd}`)).size !== all.length) continue;
    for (const [cc, dd, name] of all) g.set(cc, dd, name);
    made++;
  }
}

/** A vertical run of the data bus from d0 to d1 at column c (4 lanes). */
function bus(g: Grid, c: number, d0: number, d1: number): void {
  for (let d = d0; d <= d1; d++) g.set(c, d, 'bus_ns');
}

function chip(g: Grid, c: number, d: number, h: number, label = 0): void {
  for (let r = 0; r < h; r++) {
    const pr = r === 0 ? 0 : r === h - 1 ? 2 : 1;
    const dd = d + (h - 1 - r);
    g.set(c, dd, `chip${pr}0`)
      .set(c + 1, dd, pr === 1 && r === 1 ? `chipL${label}` : `chip${pr}1`)
      .set(c + 2, dd, `chip${pr}2`);
  }
}

/** A stack of n identical swoopers in one column: they wake one after another (a conga line). */
function conga(g: Grid, c: number, d: number, n: number, name: string): void {
  for (let i = 0; i < n; i++) g.mon(c, d + i, name);
}

function heavyBomb(g: Grid, c: number, d: number): void {
  g.mon(c - 1, d, 'clawL')
    .mon(c, d, 'bomb')
    .mon(c + 1, d, 'clawR');
}

function legA(g: Grid): void {
  // the bus runs up the middle of the board, branching around the chips
  bus(g, 7, 1, 30);
  g.set(7, 31, 'bus_se');
  g.stamp(1, 4, 'capB', 2, 2).stamp(13, 9, 'capG', 2, 2).set(12, 3, 'ledR').set(3, 14, 'resV').set(12, 15, 'resH');
  conga(g, 8, 12, 4, 'mothR');
  for (const c of [4, 6, 8, 10]) g.pickup(c, 19, 'bit');
  g.mon(4, 24, 'biter').mon(11, 25, 'biter');
  chip(g, 1, 27, 5, 0);
  g.turret(12, 30, 'down');
  g.stamp(10, 33, 'xtal', 2, 1);
  conga(g, 7, 35, 4, 'mothL');
  g.pickup(8, 41, 'nova');
  for (let c = 8; c < 15; c++) g.set(c, 31, c === 14 ? 'bus_nw' : 'bus_ew');
  bus(g, 14, 32, 40);
  g.stamp(2, 44, 'cs', 4, 4);
  g.hatch(7, 46);
  g.set(6, 49, 'ledG').set(1, 50, 'ledR');
  g.mon(5, 52, 'biter').mon(10, 53, 'biter').mon(8, 55, 'biter');
  g.turret(3, 58, 'sweep').turret(12, 59, 'sweep');
  chip(g, 11, 61, 4, 2);
  for (const [c, d] of [
    [3, 63],
    [7, 65],
    [10, 64],
    [5, 68],
  ])
    g.mon(c, d, 'cluster');
  g.pickup(8, 69, 'bit').pickup(9, 69, 'bit');
  heavyBomb(g, 8, 72);
  g.pickup(3, 74, 'repair');
  g.stamp(12, 75, 'capB', 2, 2);
  conga(g, 7, 78, 3, 'mothR');
  conga(g, 9, 79, 3, 'mothL');
  g.mon(4, 83, 'biter').mon(12, 83, 'biter');
  bus(g, 7, 76, LENGTH - 1);
}

/**
 * Somebody's breadboard 6502 computer, plugged in between the bus lines: the 6502 straddles
 * the channel, a jumper runs to the 555 clock, and the clock LED blinks with the A firewalls
 * (both are ntime chains of the same length that start together, so they never drift).
 * Wires from the bus lines on either side feed it power and data.
 */
function breadboard(g: Grid, c: number, d: number): void {
  g.rect(c, d, 10, 14, (cc) => (cc === c || cc === c + 9 ? 'bbR' : cc === c + 3 ? 'bbC' : 'bbH'));
  // top, label, five middles, bottom
  [0, 1, 2, 2, 2, 2, 2, 3].forEach((r, i) => {
    for (let k = 0; k < 3; k++) g.set(c + 2 + k, d + 10 - i, `m65${r}${k}`);
  });
  g.stamp(c + 6, d + 7, 't555', 2, 2);
  g.set(c + 5, d + 7, 'jwH')
    .set(c + 7, d + 6, 'jwV')
    .set(c + 7, d + 5, 'clkOn')
    .set(c + 6, d + 5, 'runStep');
  // wired to the bus lines either side, so it is part of the computer
  g.set(c - 2, d + 9, 'hkBusL')
    .set(c - 1, d + 9, 'hkFloorL')
    .set(c, d + 9, 'hkRailL')
    .set(c + 1, d + 9, 'hkPinL');
  g.set(c + 11, d + 3, 'hkBusR')
    .set(c + 10, d + 3, 'hkFloorR')
    .set(c + 9, d + 3, 'hkRailR');
}

function legB(g: Grid): void {
  bus(g, 1, 1, 20);
  bus(g, 14, 1, 20);
  breadboard(g, 3, 3);
  g.turret(8, 9, 'sweep');
  conga(g, 8, 13, 5, 'mothSL');
  g.fence(2, 13, 18, 'A');
  g.pickup(7, 21, 'nova').pickup(8, 21, 'bit');
  chip(g, 1, 23, 6, 1);
  chip(g, 12, 25, 6, 3);
  g.hatch(5, 26).hatch(10, 28);
  g.mon(7, 31, 'biter').mon(9, 32, 'biter');
  g.stamp(6, 35, 'cs', 4, 4);
  g.turret(4, 36, 'sweep').turret(11, 37, 'sweep');
  conga(g, 8, 42, 5, 'mothZ');
  g.fence(1, 7, 47, 'A').fence(8, 14, 49, 'B');
  for (const [c, d] of [
    [4, 52],
    [11, 53],
    [7, 55],
  ])
    g.mon(c, d, 'cluster');
  heavyBomb(g, 8, 57);
  g.pickup(12, 58, 'repair');
  g.turret(2, 61, 'seeker');
  for (let i = 0; i < 4; i++) g.mon(5 + i * 2, 63 + (i % 2), 'mothD');
  g.stamp(12, 64, 'capB', 2, 2).set(1, 65, 'ledG');
  chip(g, 1, 67, 4, 4);
  conga(g, 7, 69, 4, 'mothSR');
  conga(g, 9, 69, 4, 'mothSL');
  g.turret(13, 73, 'sweep').turret(5, 74, 'down');
  g.pickup(9, 76, 'life');
  g.mon(4, 79, 'biter').mon(8, 80, 'biter').mon(12, 79, 'biter');
  g.fence(1, 14, 83, 'B');
  bus(g, 8, 84, LENGTH - 1);
}

export function stage1(): Stage {
  const pal = buildPalette('board');
  const art = boardArt(pal);
  const opts = { mite: 'mite', turretEvery: 14, seekerEvery: 50, hatchShut: 50, hatchOpen: 30, hatchEvery: 10, fenceOn: 30, fenceOff: 30 };
  const scroll = () =>
    kit(
      art,
      (bs) => boardTiles(bs, art, { on: opts.fenceOn, off: opts.fenceOff }),
      (b) => virus1(b, pal),
      opts,
    );
  const ka = scroll();
  const kb = ka;
  const a = strip(ka.bs, ka.beasts, art, 101);
  legA(a);
  a.sprinkle(
    [
      ['capB', 2, 2],
      ['capG', 2, 2],
      ['resH', 1, 1],
      ['resV', 1, 1],
      ['ledR', 1, 1],
      ['ledG', 1, 1],
      ['xtal', 2, 1],
      ['capC', 1, 1],
      ['q3', 1, 1],
      ['q7', 1, 1],
    ],
    18,
  );
  wires(a, 111, 26);
  const b = strip(kb.bs, kb.beasts, art, 102);
  legB(b);
  b.sprinkle(
    [
      ['capB', 2, 2],
      ['capG', 2, 2],
      ['resH', 1, 1],
      ['resV', 1, 1],
      ['ledR', 1, 1],
      ['ledG', 1, 1],
      ['xtal', 2, 1],
      ['capC', 1, 1],
      ['q3', 1, 1],
      ['q7', 1, 1],
    ],
    18,
  );
  wires(b, 112, 26);
  b.cardAt = 8;
  return {
    n: 1,
    id: 'board',
    title: 'The Motherboard',
    theme: 'board',
    pal,
    art,
    song: 'board.cmf',
    bossSong: 'boss.cmf',
    legs: [
      {
        file: 's1a',
        kitFile: 's1',
        title: 'The Data Bus',
        kind: 'scroll',
        grid: a,
        kit: ka,
        card: ['Follow the data bus north.', 'Every move fires the guns.', 'UP: faster  DOWN: brake', 'SPACE: Nova Bomb'],
      },
      {
        file: 's1b',
        kitFile: 's1',
        title: 'The Chipset',
        kind: 'scroll',
        grid: b,
        kit: kb,
        card: ['Turrets sweep, firewalls', 'blink. Shoot the collars', 'off the turrets!', 'Red 555 LED? Beam is ON.'],
      },
      bossBIOS(art),
    ],
  };
}
