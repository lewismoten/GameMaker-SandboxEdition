// Pickups, courier modules and star-shards: transparent 20x20 sprites in shared colors,
// pasted over each block set's own backgrounds (and used as monster loot).
import { Pixels } from '../../../kit/pixels';
import { CLEAR, Mask, fill, outline, shade, sprite } from '../art/draw';
import { OUTLINE, S, SHARD_RAMPS, WHITE, shared } from '../art/palette';
import { MODULES } from '../ids';

const R = (n: string) => shared.get(n)!;

export type PickupId = 'credit' | 'gem' | 'heart' | 'oneup' | 'plasma' | 'nova' | 'shield' | 'mines' | 'medkit' | 'flak';
export const PICKUPS: PickupId[] = ['credit', 'gem', 'heart', 'oneup', 'plasma', 'nova', 'shield', 'mines', 'medkit', 'flak'];

/** A floating pickup; `bob` 0/1 moves it a pixel for animation. */
export function drawPickup(id: PickupId, bob = 0): Pixels {
  const p = sprite();
  const y = bob;
  switch (id) {
    case 'credit': {
      // a hexagonal credit chip with a C
      const m = new Mask().poly([
        [10, 3 + y],
        [16, 6.5 + y],
        [16, 13.5 + y],
        [10, 17 + y],
        [4, 13.5 + y],
        [4, 6.5 + y],
      ]);
      shade(p, m, R('cash'));
      const c = new Mask()
        .ellipse(10, 10 + y, 3.6, 3.6)
        .minus(new Mask().ellipse(10, 10 + y, 2, 2))
        .minus(new Mask().rect(11, 9 + y, 4, 2));
      fill(p, c, S('cash', 0));
      p.set(7, 6 + y, WHITE);
      break;
    }
    case 'gem': {
      const m = new Mask().poly([
        [10, 3 + y],
        [16, 8 + y],
        [10, 17 + y],
        [4, 8 + y],
      ]);
      shade(p, m, R('gold'));
      p.line(4, 8 + y, 16, 8 + y, S('gold', 1));
      p.line(10, 3 + y, 7, 8 + y, S('gold', 4));
      p.set(8, 6 + y, WHITE);
      break;
    }
    case 'heart': {
      const m = new Mask()
        .ellipse(7, 8 + y, 3.6, 3.6)
        .ellipse(13, 8 + y, 3.6, 3.6)
        .poly([
          [3.6, 9 + y],
          [16.4, 9 + y],
          [10, 16.5 + y],
        ]);
      shade(p, m, R('heart'));
      p.set(6, 7 + y, WHITE);
      break;
    }
    case 'oneup': {
      // a little courier helmet in a gold ring: an extra life
      const ring = new Mask().ellipse(10, 10 + y, 8, 8).minus(new Mask().ellipse(10, 10 + y, 6.4, 6.4));
      shade(p, ring, R('gold'));
      const h = new Mask().ellipse(10, 10 + y, 5, 5);
      shade(p, h, R('metal').slice(3));
      const v = new Mask().ellipse(12, 10.5 + y, 2.8, 2.2);
      fill(p, v, S('visor', 1));
      p.set(12, 9 + y, WHITE);
      p.rect(6, 6 + y, 4, 1, S('trim', 3));
      break;
    }
    case 'plasma':
    case 'nova':
    case 'shield':
    case 'mines':
    case 'medkit':
    case 'flak': {
      // an ammo cell: a capsule with a colored core and a symbol
      const ramp = { plasma: 'plasma', nova: 'nova', shield: 'visor', mines: 'flame', medkit: 'heart', flak: 'laser' }[id];
      const body = new Mask()
        .rect(5, 4 + y, 10, 13)
        .ellipse(10, 4 + y, 5, 1.6)
        .ellipse(10, 17 + y, 5, 1.6);
      shade(p, body, R('metal').slice(1, 6));
      const core = new Mask().rect(7, 6 + y, 6, 9);
      shade(p, core, R(ramp));
      p.rect(5, 4 + y, 10, 1, S('metal', 5));
      // symbol
      const s = S(ramp, 0);
      if (id === 'medkit') {
        p.rect(9, 7 + y, 2, 7, WHITE);
        p.rect(7, 9 + y, 6, 2, WHITE);
      } else if (id === 'nova') {
        p.set(10, 8 + y, WHITE)
          .set(10, 12 + y, WHITE)
          .set(8, 10 + y, WHITE)
          .set(12, 10 + y, WHITE)
          .set(10, 10 + y, WHITE);
      } else if (id === 'mines') {
        fill(p, new Mask().ellipse(10, 10.5 + y, 2.2, 2.2), s);
        p.set(10, 7 + y, s).set(10, 14 + y, s);
      } else if (id === 'shield') {
        p.line(8, 8 + y, 12, 8 + y, WHITE)
          .line(8, 8 + y, 10, 13 + y, WHITE)
          .line(12, 8 + y, 10, 13 + y, WHITE);
      } else if (id === 'flak') {
        p.line(10, 7 + y, 10, 13 + y, WHITE)
          .line(8, 9 + y, 10, 7 + y, WHITE)
          .line(12, 9 + y, 10, 7 + y, WHITE);
      } else p.line(8, 13 + y, 12, 7 + y, WHITE);
      break;
    }
  }
  return outline(p, OUTLINE);
}

/** A star-shard: a tall faceted crystal in its own color, with a halo. */
export function drawShard(i: number, glow = 0): Pixels {
  const p = sprite();
  const ramp = R(SHARD_RAMPS[i]);
  const halo = new Mask().ellipse(10, 10, 8.5 + glow, 8.5 + glow).minus(new Mask().ellipse(10, 10, 7.2 + glow, 7.2 + glow));
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (halo.get(x, y) && (x * 3 + y * 5 + glow) % 4 === 0) p.set(x, y, ramp[ramp.length - 1]);
  const m = new Mask().poly([
    [10, 1.5],
    [14.5, 7],
    [12.5, 18.5],
    [7.5, 18.5],
    [5.5, 7],
  ]);
  shade(p, m, [OUTLINE, ...ramp, WHITE]);
  p.line(10, 2, 10, 17, ramp[ramp.length - 1]);
  p.line(10, 2, 7, 8, WHITE);
  p.set(8, 5, WHITE);
  // facet numbering: i+1 notches so colorblind players can tell shards apart
  for (let k = 0; k <= i % 5; k++) p.set(8 + k, 15, i < 5 ? WHITE : OUTLINE);
  return outline(p, OUTLINE);
}

/** A courier module in its capsule (the inventory icon). */
export function drawModule(i: number): Pixels {
  const p = sprite();
  const cap = new Mask().ellipse(10, 10, 9, 9);
  shade(p, cap, [OUTLINE, S('hud', 0), S('hud', 1), S('hud', 2)]);
  const ring = new Mask().ellipse(10, 10, 9, 9).minus(new Mask().ellipse(10, 10, 8, 8));
  fill(p, ring, S('gold', 3));
  const id = MODULES[i].id;
  const g = new Pixels(20, 20, CLEAR);
  switch (id) {
    case 'plasma':
      shade(g, new Mask().rect(4, 9, 12, 3).rect(6, 12, 3, 3), R('metal').slice(2));
      fill(g, new Mask().rect(13, 8, 3, 2), S('plasma', 2));
      break;
    case 'nova':
      shade(g, new Mask().ellipse(10, 10, 4, 4), R('nova'));
      for (let a = 0; a < 8; a++) g.set(10 + Math.round(Math.cos((a * Math.PI) / 4) * 6), 10 + Math.round(Math.sin((a * Math.PI) / 4) * 6), WHITE);
      break;
    case 'dash':
      shade(g, new Mask().rect(6, 7, 4, 7).rect(6, 12, 9, 3), R('trim'));
      g.line(2, 9, 5, 9, S('visor', 3)).line(1, 12, 5, 12, S('visor', 3));
      break;
    case 'shield':
      shade(
        g,
        new Mask().poly([
          [5, 5],
          [15, 5],
          [15, 10],
          [10, 16],
          [5, 10],
        ]),
        R('visor'),
      );
      break;
    case 'hover':
      shade(g, new Mask().rect(6, 5, 8, 8), R('metal').slice(2));
      fill(
        g,
        new Mask().poly([
          [7, 13],
          [13, 13],
          [10, 17],
        ]),
        S('flame', 4),
      );
      break;
    case 'mine':
      shade(g, new Mask().ellipse(10, 11, 4.5, 4.5), R('metal').slice(1, 5));
      g.set(10, 5, S('flame', 4)).set(10, 6, S('flame', 3)).set(5, 11, S('flame', 3)).set(15, 11, S('flame', 3));
      break;
    case 'medkit':
      shade(g, new Mask().rect(5, 6, 10, 9), [S('metal', 4), S('metal', 5), S('metal', 6), WHITE]);
      fill(g, new Mask().rect(9, 7, 2, 7).rect(7, 9, 6, 3), S('heart', 2));
      break;
    case 'flak':
      shade(g, new Mask().rect(8, 7, 4, 9).rect(5, 13, 10, 3), R('metal').slice(2));
      g.line(10, 3, 10, 6, S('laser', 3)).line(6, 4, 8, 6, S('laser', 3)).line(14, 4, 12, 6, S('laser', 3));
      break;
    case 'hydro':
      shade(g, new Mask().ellipse(10, 10, 5, 3), R('gold'));
      g.line(3, 8, 5, 10, S('visor', 3)).line(3, 12, 5, 10, S('visor', 3)).set(16, 10, WHITE);
      break;
    case 'spring':
      for (let k = 0; k < 4; k++) g.line(6, 6 + k * 3, 14, 7 + k * 3, S('cash', 3 - (k & 1)));
      fill(g, new Mask().rect(5, 15, 10, 2), S('metal', 4));
      break;
  }
  outline(g, OUTLINE);
  p.blit(g, 0, 0, CLEAR);
  p.set(6, 4, WHITE);
  return p;
}

/**
 * A felt egg, hand-stitched: midnight-blue felt with silver star stitches, a ringed plum
 * planet on its belly and one long orbit of white chain stitch looping all the way round.
 */
export function drawEgg(): Pixels {
  const p = sprite();
  const cx = 10;
  const cy = 10.5;
  // an egg: narrower at the top
  const egg = new Mask();
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const top = y + 0.5 < cy;
      const dy = (y + 0.5 - cy) / (top ? 8.2 : 7.2);
      const rx = top ? 6 - dy * dy * 1.6 : 6;
      if (((x + 0.5 - cx) / rx) ** 2 + dy * dy <= 1) egg.set(x, y);
    }
  // felt: soft shading with a fuzzy dither between neighboring shades
  shade(p, egg, [S('nova', 0), S('hud', 1), S('nova', 1), S('hud', 2)], { dither: true, seed: 12 });
  // silver star stitches: little crosses and single knots
  for (const [x, y, big] of [
    [8, 4, 1],
    [12, 5, 0],
    [6, 9, 0],
    [14, 12, 0],
    [7, 16, 1],
    [12, 17, 0],
  ] as const) {
    p.set(x, y, big ? WHITE : S('metal', 5));
    if (big) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.set(x + dx, y + dy, S('metal', 4));
  }
  // the ringed planet on its belly: plum felt with a gold ring
  shade(p, new Mask().ellipse(10.5, 13, 2.2, 2.2), [S('plasma', 0), S('plasma', 1), S('plasma', 2)]);
  for (let x = 7; x <= 13; x++) if (x < 9 || x > 11) p.set(x, x < 10 ? 13 : 12, S('gold', 3));
  p.set(9, 13, S('gold', 4)).set(10, 13, S('gold', 4)).set(11, 12, S('gold', 4));
  // the orbit: a tilted loop of white chain stitch; behind the egg it is hidden
  const seen = new Set<number>();
  for (let k = 0; k < 120; k++) {
    const a = (k / 120) * Math.PI * 2;
    const ox = Math.cos(a) * 9;
    const oy = Math.sin(a) * 2.2;
    const x = Math.round(cx - 0.5 + ox * 0.95 + oy * 0.3);
    const y = Math.round(7.5 - 0.5 - ox * 0.3 + oy * 0.95);
    if (Math.sin(a) < 0 && egg.get(x, y)) continue;
    if (seen.has(y * 20 + x)) continue;
    seen.add(y * 20 + x);
    p.set(x, y, seen.size % 3 === 0 ? S('pearl', 1) : WHITE);
  }
  return outline(p, OUTLINE);
}

export { PICKUPS as PICKUP_IDS };
