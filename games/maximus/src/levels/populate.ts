// Placing monsters on a map: each planet picks a handful of species from its family
// (so neighbouring worlds feel different), weighted toward tougher ones in the outer
// sectors, and puts each where it lives - walkers on flat ground, bats in caves, flyers
// in the sky, droppers on ceilings. Up to 200 per map (Game-Maker's LASTMM).
import { rng } from '../../../kit/pixels';
import { LASTMM } from '../../../../web/src/formats/map';
import { SOLLEF, SOLRIG, type Block } from '../../../../web/src/formats/blocks';
import { Grid, W, H, wx, wy } from './mapkit';
import type { Creature, MonsterSet, Placement } from '../characters/bestiary';

export interface Spots {
  ground: { x0: number; x1: number; y: number }[];
  cave: { x0: number; x1: number; y: number }[];
  air: { x: number; y: number }[];
  caveAir: { x: number; y: number }[];
  sky: { x: number; y: number }[];
  ceiling: { x: number; y: number }[];
  liquid: { x: number; y: number }[];
  vault?: { x: number; y: number };
  avoid: { x: number; y: number };
  /** Other places the hero comes in (a sector's planets, its jump ring): kept as clear as `avoid`. */
  alsoAvoid?: { x: number; y: number }[];
}

export function tierOf(c: Creature): number {
  if (c.dmg === 0) return 1;
  const t = c.dmg <= 6 ? 1 : c.dmg <= 10 ? 2 : c.dmg <= 15 ? 3 : 4;
  return c.power >= 100 && c.dmg >= 10 ? Math.max(t, 3) : t;
}

/** Path extent of a creature's normal path (max dx). */
function reach(c: Creature): number {
  if (c.move.kind !== 'path') return 0;
  return Math.max(0, ...c.move.corners.map((k) => k[0]));
}

/** A solid-sided creature on a sideways path (a ferry slab). */
const slides = (c: Creature) => reach(c) > 0 && ((c.block?.solid ?? 0) & (SOLLEF | SOLRIG)) !== 0;

export function populate(
  g: Grid,
  bbl: Block[],
  ms: MonsterSet,
  spots: Spots,
  opts: { seed: number; level: number; count: number; species?: number; spacing?: number; rover?: boolean },
): number {
  const r = rng(opts.seed);
  const spacing = opts.spacing ?? 3;
  const open = (x: number, y: number) => {
    const b = bbl[g.get(x, y)];
    return (b.solid & 14) === 0 && b.chHitPt >= 0 && !b.obj && b.effect === 0;
  };
  const wall = (x: number, y: number) => (bbl[g.get(x, y)].solid & (SOLLEF | SOLRIG)) !== 0;
  /** The nearest shift (up to 3 blocks) at which a slab gliding `run` blocks right from x has no
   * wall on its rows (its own and the one above) from a block before it to a block past its turn. */
  const clearShift = (x: number, y: number, run: number) =>
    [0, -1, 1, -2, 2, -3, 3].find((d) => {
      for (let k = -1; k <= run + 1; k++) if (wall(x + d + k, y) || wall(x + d + k, y - 1)) return false;
      return true;
    });
  // clear of every place the hero comes in: out of a chaser's reach (PLAYGAME's 8 blocks
  // across, 5 up or down), and a walker's beat further still on the rows beside it
  const entries = [spots.avoid, ...(spots.alsoAvoid ?? [])];
  const far = (x: number, y: number, beat: number) =>
    entries.every((e) => {
      let dx = Math.abs(x - e.x);
      dx = Math.min(dx, W - dx);
      let dy = Math.abs(y - e.y);
      dy = Math.min(dy, H - dy);
      return dx > 9 + (dy <= 2 ? beat : 0) || dy > 6;
    });
  const byPlace = new Map<Placement, number[]>();
  ms.creatures.forEach((c, i) => {
    if (tierOf(c) > opts.level + 1) return;
    // a rover cannot hop over things that sit on the road and cannot be shot
    if (opts.rover && (c.place === 'ground' || c.place === 'cave' || c.place === 'rare') && (c.move.kind === 'still' || c.power >= 100)) return;
    const list = byPlace.get(c.place) ?? [];
    list.push(i);
    byPlace.set(c.place, list);
  });
  // this planet's species: a few of each kind
  const choose = (place: Placement, n: number) => {
    const list = [...(byPlace.get(place) ?? [])];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list.slice(0, n);
  };
  const species = opts.species ?? 3;
  const pools: Partial<Record<Placement, number[]>> = {
    ground: choose('ground', species),
    cave: choose('cave', species),
    air: choose('air', species),
    sky: choose('sky', species),
    ceiling: choose('ceiling', 2),
    liquid: choose('liquid', 1),
    platform: choose('platform', 2),
    vault: choose('vault', 2),
    rare: choose('rare', opts.level >= 4 ? 2 : 1).filter((i) => opts.level >= 4 || ms.creatures[i].dmg === 0),
  };
  let placed = g.monsters.length;
  const max = Math.min(LASTMM, opts.count);
  const put = (mon: number, x: number, y: number) => {
    x = wx(x);
    y = wy(y);
    if (placed >= max || !open(x, y) || !far(x, y, reach(ms.creatures[mon])) || g.monsterAt(x, y)) return false;
    // keep a little room between monsters so they spread over the whole world
    if (g.monsters.some((m) => Math.min(Math.abs(m.x - x), W - Math.abs(m.x - x)) < spacing && Math.min(Math.abs(m.y - y), H - Math.abs(m.y - y)) < spacing))
      return false;
    if (g.place(mon, x, y)) {
      placed++;
      return true;
    }
    return false;
  };
  const pick = (pool: number[] | undefined) => (pool && pool.length ? pool[Math.floor(r() * pool.length)] : undefined);
  // weights per placement, scaled to the target count
  const plan: [Placement, number][] = [
    ['ground', 0.22],
    ['cave', 0.26],
    ['air', 0.2],
    ['sky', 0.14],
    ['ceiling', 0.08],
    ['liquid', 0.04],
    ['platform', 0.03],
  ];
  // vault guards and rarities first
  if (spots.vault && pools.vault?.length)
    for (let k = 0; k < Math.min(3, opts.level + 1); k++) put(pick(pools.vault)!, spots.vault.x + (k % 2 ? -3 - k : 3 + k), spots.vault.y - 1);
  for (const m of pools.rare ?? []) {
    for (let t = 0; t < 30; t++) {
      const s = spots.ground[Math.floor(r() * spots.ground.length)] ?? spots.cave[Math.floor(r() * spots.cave.length)];
      if (s && put(m, s.x0, s.y)) break;
    }
  }
  for (const [place, weight] of plan) {
    const want = Math.round((max - placed) * weight * 1.4);
    const pool = pools[place];
    if (!pool || !pool.length) continue;
    for (let n = 0, tries = 0; n < want && tries < want * 12; tries++) {
      const mon = pick(pool)!;
      const c = ms.creatures[mon];
      let ok = false;
      if (place === 'ground' || place === 'cave') {
        // walkers on runs long enough for their beat; flyers in cave air
        const runs = place === 'ground' ? spots.ground : spots.cave;
        const reachN = reach(c);
        const fit = runs.filter((rn) => rn.x1 - rn.x0 >= reachN);
        if (c.move.kind === 'path' || c.move.kind === 'still' || place === 'ground') {
          const rn = fit[Math.floor(r() * fit.length)];
          if (rn) ok = put(mon, rn.x0 + Math.floor(r() * Math.max(1, rn.x1 - rn.x0 - reachN + 1)), rn.y);
        } else {
          const s = spots.caveAir[Math.floor(r() * spots.caveAir.length)];
          if (s) ok = put(mon, s.x, s.y);
        }
      } else if (place === 'air') {
        const list = spots.air.length ? spots.air : spots.caveAir;
        const s = list[Math.floor(r() * list.length)];
        if (s) ok = put(mon, s.x, s.y);
      } else if (place === 'sky') {
        const s = spots.sky[Math.floor(r() * spots.sky.length)];
        if (s) ok = put(mon, s.x + Math.floor(r() * 5) - 2, s.y + Math.floor(r() * 3) - 1);
      } else if (place === 'ceiling') {
        const s = spots.ceiling[Math.floor(r() * spots.ceiling.length)];
        if (s) ok = put(mon, s.x, s.y);
      } else if (place === 'liquid') {
        const s = spots.liquid[Math.floor(r() * spots.liquid.length)];
        if (s) ok = put(mon, s.x, s.y - 1);
      } else if (place === 'platform') {
        const s = spots.liquid[Math.floor(r() * spots.liquid.length)] ?? spots.caveAir[Math.floor(r() * spots.caveAir.length)];
        if (s) {
          // a slab that glides sideways turns a block clear of walls: PLAYGAME's side push puts
          // a courier beside it with no wall check, so at a wall it would shove him inside
          const x = s.x - 2 + (slides(c) ? (clearShift(s.x - 2, s.y - 2, reach(c)) ?? NaN) : 0);
          if (!Number.isNaN(x)) ok = put(mon, x, s.y - 2);
        }
      }
      if (ok) n++;
    }
  }
  return placed;
}
