// Anthills (plug them with sand to stop the ants coming out: the hill is a block that
// gives birth to a monster, and touching it spends sand and swaps in one that does not) and the sand
// castles: brick walls, towers with waving flags, portcullises that open with the right
// counter, and the dashed outlines where Teddy packs a new wall from his bucket.
import { OCHRE, RED, SAND, STEEL, WATER, WOOD, YELLOW } from '../art/palette';
import { CTR, MON } from '../rules';
import { Pixels, bevel, rng, sandTexture, shade, tile } from '../art/draw';
import { SOLID, bg, sand } from './common';

export function addCastles(): void {
  // ---------------------------------------------------------------- anthills
  function anthill(plugged: boolean): Pixels {
    const p = sand(81);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const dx = (x - 10) / 9;
        const dy = (y - 11) / 8;
        const d = dx * dx + dy * dy;
        if (d > 1) continue;
        p.set(x, y, shade(OCHRE, 4 - dx * 1.4 - dy * 1.6 + (((x * 7 + y * 3) % 5) - 2) * 0.3));
      }
    if (plugged) {
      p.disc(10, 10, 3.5, SAND[7]).disc(9, 9, 2, SAND[8]);
      p.set(14, 4, RED[4]).line(14, 5, 14, 9, WOOD[5]).set(15, 4, RED[4]).set(15, 5, RED[3]);
    } else p.disc(10, 10, 2.8, OCHRE[0]).disc(10, 11, 1.5, 0).set(8, 8, OCHRE[6]).set(12, 8, OCHRE[5]);
    return p;
  }
  // The hill gives birth to an ant every 70 ticks. Walking into it spends a scoop of sand,
  // pays 150 and swaps in 'plugged', which births nothing.
  bg.add('anthill', anthill(false), { solid: SOLID, effect: CTR.sand, eamt: -1, score: 150, touch: 'plugged', birthMon: MON.ant, birthTime: 70 });
  bg.add('plugged', anthill(true), { solid: SOLID });

  // ---------------------------------------------------------------- castles of sand
  function bricks(seed: number, merlon: boolean): Pixels {
    const p = tile(SAND[3]);
    const r = rng(seed);
    for (let row = 0; row < 4; row++) {
      const y = row * 5;
      const off = row % 2 ? 5 : 0;
      for (let bx = -1; bx < 3; bx++) {
        const x = bx * 10 + off;
        const s = 6 + Math.floor(r() * 2);
        p.rect(x + 1, y + 1, 9, 4, SAND[s]);
        p.rect(x + 1, y + 1, 9, 1, SAND[s + 1]);
        p.rect(x + 1, y + 4, 9, 1, SAND[s - 2]);
      }
    }
    if (merlon) {
      p.rect(0, 0, 20, 6, SAND[2]);
      for (const x of [1, 11]) bevel(p, x, 0, 8, 6, SAND, 7);
    }
    return p;
  }
  bg.add('wall', bricks(91, false), { solid: SOLID });
  bg.add('merlon', bricks(92, true), { solid: SOLID });
  {
    // Tower foundation: a ring drawn in the sand with a stake, waiting for sand.
    const p = tile(SAND[4]);
    p.blit(sandTexture(93, 4, SAND, 0.1), 0, 0);
    for (let a = 0; a < 40; a++) {
      if (a % 4 === 3) continue;
      const t = (a / 40) * Math.PI * 2;
      p.set(10 + Math.cos(t) * 8, 10 + Math.sin(t) * 8, SAND[1]);
      p.set(10 + Math.cos(t) * 8.6, 10 + Math.sin(t) * 8.6, SAND[6]);
    }
    p.line(10, 4, 10, 11, WOOD[4]).rect(11, 4, 4, 3, RED[4]).set(11, 4, RED[6]);
    bg.add('found', p, { solid: SOLID, effect: CTR.sand, eamt: -1, touch: 'scaffold' });
    bg.add('found2', p, { solid: SOLID, effect: CTR.sand, eamt: -1, touch: 'scaffold2' });
  }
  function tower(flagFrame: number, built: number): Pixels {
    const p = tile(SAND[2]);
    p.blit(sandTexture(94, 5, SAND, 0.15), 0, 0);
    const R = built ? 9.5 : 8;
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const dx = x - 9.5;
        const dy = y - 9.5;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > R) continue;
        const rim = d > R - 2.5;
        const notch = rim && Math.floor((Math.atan2(dy, dx) + Math.PI) / (Math.PI / 4)) % 2 === 0;
        let c = rim ? (notch ? 3 : 7) : 5;
        if (rim && !notch) c += (-dx - dy) / 8;
        if (!rim) c += (dx + dy) / 10;
        p.set(x, y, shade(SAND, c));
      }
    if (!built) {
      p.rect(5, 6, 4, 3, SAND[8]).rect(11, 11, 3, 3, SAND[3]);
      p.line(10, 3, 10, 10, WOOD[4]).rect(11, 3, 4, 3, RED[4]);
      return p;
    }
    // The flag on top flutters: a little thirteen-star flag, red and white stripes and a
    // blue canton, the kind every Fourth of July sandcastle flies.
    p.line(9, 1, 9, 10, WOOD[2]).line(10, 1, 10, 10, WOOD[5]).set(9, 0, YELLOW[3]).set(10, 0, YELLOW[4]);
    for (let col = 0; col < 7; col++) {
      const dy = flagFrame ? (col >= 3 && col <= 5 ? 1 : 0) : col >= 5 ? 1 : 0;
      for (let row = 0; row < 5; row++) {
        const canton = col < 3 && row < 3;
        const c = canton ? ((col + row) % 2 === 1 ? STEEL[7] : WATER[1]) : row % 2 === 0 ? RED[4] : STEEL[7];
        p.set(11 + col, 2 + row + dy, c);
      }
    }
    return p;
  }
  bg.add('scaffold', tower(0, 0), { solid: SOLID, effect: CTR.flags, eamt: 1, score: 300, touch: 'tower' });
  bg.add('scaffold2', tower(0, 0), { solid: SOLID, effect: CTR.flags2, eamt: 1, score: 300, touch: 'tower' });
  bg.add('tower', tower(0, 1), { solid: SOLID, next: 'towerB', ntime: 6 });
  bg.add('towerB', tower(1, 1), { solid: SOLID, next: 'tower', ntime: 6 });
  function portcullis(open: boolean): Pixels {
    const p = tile(SAND[1]);
    p.rect(0, 0, 20, 20, open ? OCHRE[2] : OCHRE[0]);
    if (open) {
      p.blit(sandTexture(95, 4, SAND, 0.1), 0, 4);
      p.rect(0, 0, 20, 4, WOOD[1]);
      for (let x = 1; x < 20; x += 4) p.rect(x, 0, 2, 4, WOOD[4]);
      p.rect(0, 0, 2, 20, SAND[6]).rect(18, 0, 2, 20, SAND[3]);
      return p;
    }
    for (let x = 1; x < 20; x += 4) p.rect(x, 0, 2, 20, WOOD[4]).rect(x, 0, 1, 20, WOOD[6]);
    for (let y = 3; y < 20; y += 5) p.rect(0, y, 20, 2, WOOD[3]).rect(0, y, 20, 1, WOOD[5]);
    for (let x = 1; x < 20; x += 4) p.set(x, 18, STEEL[5]).set(x + 1, 19, STEEL[3]);
    return p;
  }
  bg.add('gate', portcullis(false), { solid: SOLID, effect: CTR.flags, eamt: -4, score: 500, touch: 'gateOpen' });
  bg.add('gate2', portcullis(false), { solid: SOLID, effect: CTR.flags2, eamt: -2, score: 500, touch: 'gateOpen' });
  bg.add('gateOpen', portcullis(true));
  {
    // The lagoon's sea gate opens for three golden shells (its emblem shows one).
    const p = portcullis(false);
    p.rect(6, 5, 8, 9, OCHRE[0]);
    for (let y = 6; y < 13; y++)
      for (let x = 7; x < 13; x++) {
        const dx = (x - 9.5) / 3;
        const dy = (y - 9.5) / 3.5;
        if (dx * dx + dy * dy <= 1) p.set(x, y, shade(YELLOW, 3 - dx - dy + (Math.sin(x * 2 + y) > 0.5 ? 1 : 0)));
      }
    bg.add('shellGate', p, { solid: SOLID, effect: CTR.shells, eamt: -3, score: 500, touch: 'gateOpen' });
  }
  {
    // The keep's doorway: walk in to leave the castle.
    const p = bricks(96, false);
    for (let y = 3; y < 20; y++)
      for (let x = 3; x < 17; x++) {
        const dx = (x - 9.5) / 6.5;
        const dy = (y - 9) / 6;
        if (y < 9 && dx * dx + dy * dy > 1) continue;
        p.set(x, y, y > 16 ? OCHRE[1] : 0);
      }
    for (let x = 4; x < 16; x++) p.set(x, 18, OCHRE[3]);
    p.set(9, 8, YELLOW[4]).set(10, 8, YELLOW[4]).set(9, 9, YELLOW[2]).set(10, 9, YELLOW[2]);
    bg.add('door', p);
  }
  // Dashed outline: walk into it with your bucket to pack a wall of wet sand.
  {
    const p = sand(97);
    for (let i = 0; i < 18; i++) {
      if (i % 4 === 3) continue;
      for (const [x, y] of [
        [1 + i, 1],
        [1 + i, 18],
        [1, 1 + i],
        [18, 1 + i],
      ])
        p.set(x, y, OCHRE[2]);
    }
    p.rect(7, 7, 6, 6, OCHRE[4]).rect(8, 8, 4, 4, OCHRE[5]);
    bg.add('outline', p, { effect: CTR.bucket, eamt: -1, score: 25, touch: 'packed' });
  }
  {
    const p = tile();
    const r = rng(98);
    bevel(p, 0, 0, 20, 20, OCHRE, 4, 2);
    for (let k = 0; k < 30; k++) p.set(2 + Math.floor(r() * 16), 2 + Math.floor(r() * 16), OCHRE[r() > 0.5 ? 3 : 5]);
    p.rect(4, 4, 12, 1, OCHRE[6]);
    bg.add('packed', p, { solid: SOLID });
  }
}
