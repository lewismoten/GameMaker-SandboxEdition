// Water: the moat, fords, bridges that crumble a step at a time (each touch swaps in the
// next, weaker bridge block), hose streams that are gravity currents pushing the knight
// along, and the tides: animated blocks whose next/ntime chains make a wave roll up the beach
// and the tidal flat flood and ebb on a timer.
import { GRASS, OCHRE, SAND, WATER, WOOD, YELLOW } from '../art/palette';
import { CTR, MON } from '../rules';
import { Pixels, bevel, rng, sandTexture, shade, shadowOnSand, tile } from '../art/draw';
import { DOWN, LEFT, RIGHT, SOLID, UP, bg, sand } from './common';

export function addWater(): void {
  // ---------------------------------------------------------------- water: moat, fords, crumbling bridges
  function water(frame: number, seed = 101, deep = 2): Pixels {
    const p = tile();
    return p.map((x, y) => {
      const w = Math.sin((x + frame * 3) / 3) + Math.sin((y * 1.3 - frame * 2 + x * 0.5) / 2.5);
      let c = deep + (w > 1.2 ? 2 : w > 0.6 ? 1 : 0);
      if (w > 1.75) c = deep + 4;
      if (((x * 13 + y * 7 + seed) % 23 === 0 && frame) || ((x * 11 + y * 5 + seed) % 29 === 0 && !frame)) c = deep + 5;
      return shade(WATER, c);
    });
  }
  bg.add('water', water(0), { solid: SOLID, next: 'water2', ntime: 9 });
  bg.add('water2', water(1), { solid: SOLID, next: 'water', ntime: 9 });
  {
    // A ford: stakes mark where sand can fill the water.
    const p = water(0, 103, 3);
    for (const x of [3, 9, 15]) {
      p.rect(x, 4, 3, 3, WOOD[2])
        .rect(x, 4, 3, 1, WOOD[5])
        .set(x, 7, WATER[6])
        .set(x + 2, 7, WATER[6]);
      p.rect(x, 13, 3, 3, WOOD[2])
        .rect(x, 13, 3, 1, WOOD[5])
        .set(x, 16, WATER[6])
        .set(x + 2, 16, WATER[6]);
    }
    bg.add('ford', p, { solid: SOLID, effect: CTR.sand, eamt: -1, score: 20, touch: 'causeway' });
  }
  {
    const p = sandTexture(104, 3, OCHRE, 0.25);
    p.rect(0, 0, 20, 1, WATER[6]).rect(0, 19, 20, 1, WATER[4]);
    for (const x of [3, 9, 15]) p.rect(x, 1, 3, 2, WOOD[4]).rect(x, 17, 3, 2, WOOD[3]);
    bg.add('causeway', p);
  }
  function bridge(stage: number): Pixels {
    const p = water(0, 105, 2);
    bevel(p, 0, 2, 20, 16, SAND, 6, 1);
    const r = rng(106);
    for (let k = 0; k < 12; k++) p.set(1 + Math.floor(r() * 18), 3 + Math.floor(r() * 14), SAND[r() > 0.5 ? 5 : 7]);
    // Cracks spread as it is walked on.
    const cracks = [
      [4, 5, 8, 9],
      [8, 9, 6, 13],
      [12, 3, 14, 8],
      [14, 8, 17, 10],
      [6, 13, 3, 16],
      [14, 8, 12, 15],
      [2, 7, 6, 8],
      [16, 12, 13, 16],
    ];
    for (let k = 0; k < Math.min(cracks.length, stage * 2); k++) {
      const [a, b, c, d] = cracks[k];
      p.line(a, b, c, d, SAND[2]);
    }
    if (stage >= 3) {
      p.rect(0, 2, 20, 1, WATER[4]).rect(5, 17, 6, 1, WATER[3]);
    }
    return p;
  }
  const CRUMBLE = 7;
  for (let s = 0; s < CRUMBLE; s++) bg.add(`bridge${s}`, bridge(Math.floor((s * 4) / CRUMBLE)), { touch: s + 1 < CRUMBLE ? `bridge${s + 1}` : 'rubble' });
  {
    const p = water(1, 107, 2);
    const r = rng(108);
    for (let k = 0; k < 7; k++) {
      const x = 1 + Math.floor(r() * 16);
      const y = 1 + Math.floor(r() * 16);
      p.rect(x, y, 2 + Math.floor(r() * 2), 2, SAND[4]).set(x, y, SAND[6]);
    }
    bg.add('rubble', p, { solid: SOLID });
  }

  // ---------------------------------------------------------------- hose streams (gravity currents)
  function stream(dir: number, frame: number): Pixels {
    const p = tile();
    // Draw flowing right, then rotate.
    const q = tile().map((x, y) => {
      const ph = (x - frame * 5 + 40) % 10;
      const wave = Math.sin(y / 2.2 + x / 4);
      let c = 4 + (wave > 0.7 ? 1 : 0);
      const chevron = Math.abs(y - 9.5) / 2 + 1;
      if (Math.abs(ph - chevron) < 0.8 && y > 3 && y < 16) c = 7;
      else if (Math.abs(ph - chevron - 1) < 0.8 && y > 3 && y < 16) c = 6;
      return shade(WATER, c);
    });
    return p.map((x, y) => {
      if (dir === RIGHT) return q.get(x, y);
      if (dir === LEFT) return q.get(19 - x, y);
      if (dir === DOWN) return q.get(y, x);
      return q.get(19 - y, x);
    });
  }
  for (const [name, dir] of [
    ['right', RIGHT],
    ['left', LEFT],
    ['up', UP],
    ['down', DOWN],
  ] as const) {
    bg.add(`flow_${name}`, stream(dir, 0), { grav: dir, next: `flow_${name}2`, ntime: 3 });
    bg.add(`flow_${name}2`, stream(dir, 1), { grav: dir, next: `flow_${name}`, ntime: 3 });
  }
  function hose(vertical: boolean, nozzle: boolean): Pixels {
    const p = sand(111);
    const q = tile(255);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const a = vertical ? x : y;
        if (a < 4 || a > 15) continue;
        const t = (a - 4) / 11;
        q.set(x, y, shade(GRASS, 6 - t * 5 + (t < 0.2 ? -1 : 0)));
      }
    if (nozzle) {
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++) {
          const a = vertical ? x : y;
          const b = vertical ? y : x;
          if (b > 9 && a >= 5 && a <= 14) q.set(x, y, shade(YELLOW, 4 - (a - 5) / 3));
          if (b > 16 && a >= 7 && a <= 12) q.set(x, y, YELLOW[0]);
        }
    }
    shadowOnSand(p, (x, y) => q.get(x - 1, y - 2) >= 0 && q.get(x - 1, y - 2) !== 255 && q.get(x, y) === 255);
    return p.blit(q, 0, 0, 255);
  }
  bg.add('hoseH', hose(false, false), { solid: SOLID });
  bg.add('hoseV', hose(true, false), { solid: SOLID });
  bg.add('nozzle', hose(false, true), { solid: SOLID, birthMon: MON.droplet, birthTime: 22 });
  {
    const p = sand(112);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const dx = (x - 10) / 8.5;
        const dy = (y - 10) / 6;
        const d = dx * dx + dy * dy + Math.sin(x * 1.3) * 0.08;
        if (d < 1) p.set(x, y, d > 0.75 ? OCHRE[3] : shade(WATER, 4 + (dx < -0.3 && dy < -0.2 ? 2 : 0)));
      }
    bg.add('puddle', p);
  }

  // ---------------------------------------------------------------- tides
  // Traveling waves: eight phases of one cycle. Rows of the beach start at different phases,
  // so a crest rolls up the sand; the surf pushes the knight inland (gravity up).
  function surf(phase: number): Pixels {
    const p = sandTexture(121 + phase, [6, 4, 4, 3, 3, 3, 4, 4][phase], phase === 0 ? SAND : OCHRE, 0.18);
    const level = [0, 0, 0.35, 0.8, 1, 0.8, 0.35, 0][phase];
    if (phase === 0) return p;
    if (phase === 1 || phase === 7) return sandTexture(122, 3, OCHRE, 0.2);
    return p.map((x, y, c) => {
      const edge = 20 - level * 20 + Math.sin(x / 2.5 + phase) * 1.5;
      if (y < edge - 1) return c;
      if (y < edge + 1) return WATER[9];
      const foam = (x * 7 + y * 3 + phase) % 11 === 0;
      return foam ? WATER[8] : shade(WATER, phase === 4 ? 5 : 6) + 0;
    });
  }
  for (let k = 0; k < 8; k++)
    bg.add(`surf${k}`, surf(k), {
      next: `surf${(k + 1) % 8}`,
      ntime: 5,
      grav: k === 4 ? UP : 0,
      hp: k === 4 ? -1 : 0,
    });
  // The tidal flat floods all at once on a long cycle: low, wet, flooded (the current shoves
  // you back to shore), ebbing.
  {
    const low = sandTexture(131, 3, OCHRE, 0.2);
    for (let k = 0; k < 3; k++) low.line(2 + k * 6, 4 + k * 5, 8 + k * 5, 6 + k * 5, OCHRE[5]);
    bg.add('flat', low, { next: 'flatWet', ntime: 150 });
    const wet = low.crop(0, 0, 20, 20).map((x, y, c) => ((x + y * 3) % 7 === 0 ? WATER[5] : c === OCHRE[3] ? OCHRE[2] : c));
    bg.add('flatWet', wet, { next: 'flatSea', ntime: 25 });
    bg.add('flatSea', water(0, 133, 3), { next: 'flatEbb', ntime: 110, grav: UP, hp: -1 });
    const ebb = water(1, 134, 4).map((x, y, c) => ((x * 3 + y * 5) % 4 === 0 ? OCHRE[3] : c));
    bg.add('flatEbb', ebb, { next: 'flat', ntime: 25, grav: UP });
  }
}
