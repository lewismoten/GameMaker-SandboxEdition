// What the World Map (worldMap.ts) draws under its places and paths, in the game's theme
// (worldMapThemes.ts): one land with a country round each place in a sea; a starfield with
// each sector a nebula; city blocks in town; rooms with walls inside a house (or a library's
// wings and shelves); a circuit board with its parts outlined; a draftsman's blue grid. Each
// region (worldMapRegions.ts) is drawn as one piece, and little drawings fill the spaces
// between places and paths, never on them. Also what the key shows for it.
import type { Point } from '../../formats/game';
import type { Rect } from './worldMapLayout';
import { el, glyph, TERRAIN_NAMES } from './worldMapArt';
import { INK, PAPER, blobPath, mix, type Terrain } from './worldMapTerrain';
import { decor } from './worldMapDecor';
import { xorshift32 } from '../../seededRandom';
import { grow, maskOf, mid, sprinkle, union, type Ground, type GroundInput, type GroundPlace } from './worldMapGroundKit';
import { board, grid, indoors } from './worldMapIndoors';

export const SPACE = '#1b2342';
const SEA = '#9fc0c4';
const RIPPLE = mix('#3f6f80', PAPER, 0.25);

/** A wobbly coast round a rectangle with rounded corners: points every few units, pushed out a little, joined smoothly. */
function coastAround(r: Rect, out: number, seed: number): string {
  const rand = xorshift32(seed);
  const pts: Point[] = [];
  const c = mid(r);
  const per = 2 * (r.w + r.h);
  const n = Math.max(16, Math.round(per / 5));
  for (let k = 0; k < n; k++) {
    // round the rectangle's outline, then out from the middle by `out` give or take
    const t = (k / n) * per;
    const p =
      t < r.w
        ? { x: r.x + t, y: r.y }
        : t < r.w + r.h
          ? { x: r.x + r.w, y: r.y + t - r.w }
          : t < 2 * r.w + r.h
            ? { x: r.x + r.w - (t - r.w - r.h), y: r.y + r.h }
            : { x: r.x, y: r.y + r.h - (t - 2 * r.w - r.h) };
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const len = Math.hypot(dx, dy) || 1;
    const push = out * (0.6 + rand() * 0.8);
    pts.push({ x: p.x + (dx / len) * push, y: p.y + (dy / len) * push });
  }
  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]];
    const q = (v: number) => v.toFixed(2);
    d += ` C${q(p1.x + (p2.x - p0.x) / 6)},${q(p1.y + (p2.y - p0.y) / 6)} ${q(p2.x - (p3.x - p1.x) / 6)},${q(p2.y - (p3.y - p1.y) / 6)} ${q(p2.x)},${q(p2.y)}`;
  }
  return `${d} Z`;
}

function land(inp: GroundInput): Ground {
  const { places, seed, lines } = inp;
  // one land round every place and road, a country round each place
  const all = [...places.map((p) => p.box), ...lines.flat().map((q) => ({ x: q.x, y: q.y, w: 0, h: 0 }))];
  const x0 = Math.min(...all.map((r) => r.x));
  const y0 = Math.min(...all.map((r) => r.y));
  const whole = { x: x0, y: y0, w: Math.max(...all.map((r) => r.x + r.w)) - x0, h: Math.max(...all.map((r) => r.y + r.h)) - y0 };
  const coastline = (d: number) => coastAround(grow(whole, d), 5, seed);
  const ripples = el(
    'g',
    { fill: 'none', stroke: RIPPLE, 'stroke-width': 0.14 },
    el('path', { d: coastline(4.3) }),
    el('path', { d: coastline(5.6), 'stroke-dasharray': '1.4 0.8' }),
    el('path', { d: coastline(7.4), 'stroke-dasharray': '0.6 1.2' }),
  );
  const coast = el('path', { d: coastline(3), fill: mix('#cdbf8c', PAPER, 0.45), stroke: INK, 'stroke-width': 0.7 });
  const blob = (p: GroundPlace) => {
    const c = mid(p.box);
    return blobPath(c.x, c.y, p.box.w / 2 + 3.5, p.box.h / 2 + 3, seed + p.i * 7919);
  };
  const countries = el('g', { stroke: mix(INK, PAPER, 0.35), 'stroke-width': 0.25, 'stroke-dasharray': '1 0.5 0.2 0.5' });
  for (const p of places) countries.append(el('path', { d: blob(p), fill: p.look.fill }));
  const ground = el('g', {}, coast, countries);
  const mask = maskOf(inp);
  const marks = el('g', {});
  const used = new Set<Terrain>();
  for (const p of places) {
    const c = mid(p.box);
    const inside = (q: Point) => ((q.x - c.x) / (p.box.w / 2 + 3)) ** 2 + ((q.y - c.y) / (p.box.h / 2 + 2.5)) ** 2 < 1;
    const spots = sprinkle(p, places, 7, mask, seed + p.i * 31, inside);
    spots.forEach((s, k) => marks.append(glyph(p.look.terrain, s.x, s.y, p.look.ink, k)));
    if (spots.length) used.add(p.look.terrain);
  }
  return {
    under: [el('rect', { x: 2, y: 2, width: inp.W - 4, height: inp.H - 4, fill: SEA, opacity: 0.5 }), ripples, ground, marks],
    over: [],
    key: [...used].map((t) => ({ draw: (x: number, y: number) => glyph(t, x, y, INK, 1), name: TERRAIN_NAMES[t] })),
    letter: { fill: INK, stroke: PAPER },
  };
}

function space(inp: GroundInput): Ground {
  const { W, H, seed } = inp;
  const rand = xorshift32(seed ^ 0x5bd1e995);
  const under: SVGElement[] = [el('rect', { x: 2, y: 2, width: W - 4, height: H - 4, fill: SPACE })];
  // the chart's rings and bearings round the middle
  const rings = el('g', { fill: 'none', stroke: '#c9d4ff', 'stroke-width': 0.12, opacity: 0.16 });
  const R = Math.hypot(W, H) / 2;
  for (let r = 30; r < R; r += 30) rings.append(el('circle', { cx: W / 2, cy: H / 2, r, 'stroke-dasharray': '0.6 0.8' }));
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    rings.append(
      el('path', {
        d: `M${(W / 2 + Math.cos(a) * 30).toFixed(1)},${(H / 2 + Math.sin(a) * 30).toFixed(1)} L${(W / 2 + Math.cos(a) * R).toFixed(1)},${(H / 2 + Math.sin(a) * R).toFixed(1)}`,
      }),
    );
  }
  under.push(rings);
  // the sectors: a nebula each, in the color of its hub's picture
  const byId = new Map(inp.places.map((p) => [p.i, p]));
  const defs = el('defs', {});
  const nebulae = el('g', {});
  inp.regions.forEach((ids, k) => {
    const ps = ids.map((i) => byId.get(i)!).filter(Boolean);
    if (!ps.length) return;
    const hue = mix(ps[0].look.fill, '#9a7cff', 0.25);
    const id = `wm-neb-${k}`;
    const clip = `wm-nebclip-${k}`;
    defs.append(
      el(
        'radialGradient',
        { id },
        el('stop', { offset: '0%', 'stop-color': hue, 'stop-opacity': 0.55 }),
        el('stop', { offset: '100%', 'stop-color': hue, 'stop-opacity': 0 }),
      ),
      el('clipPath', { id: clip }, ...ps.map((p) => el('rect', { x: p.box.x - 4.5, y: p.box.y - 4.5, width: p.box.w + 9, height: p.box.h + 9, rx: 4 }))),
    );
    nebulae.append(
      ...union(
        ps.map((p) => p.box),
        4.5,
        4,
        { stroke: mix(hue, '#ffffff', 0.4), 'stroke-width': 0.6, opacity: 0.8 },
        { fill: mix(hue, SPACE, 0.78) },
      ),
    );
    const clouds = el('g', { 'clip-path': `url(#${clip})` });
    for (const p of ps) {
      const c = mid(p.box);
      for (let j = 0; j < 2; j++)
        clouds.append(
          el('circle', {
            cx: +(c.x + (rand() - 0.5) * 14).toFixed(1),
            cy: +(c.y + (rand() - 0.5) * 12).toFixed(1),
            r: +(8 + rand() * 8).toFixed(1),
            fill: `url(#${id})`,
          }),
        );
    }
    nebulae.append(clouds);
  });
  // the stars, a scatter of dots and a few bright ones
  const stars = el('g', { fill: '#f6f0dc', stroke: 'none' });
  for (let i = 0, n = Math.round((W * H) / 22); i < n; i++)
    stars.append(
      el('circle', {
        cx: +(2 + rand() * (W - 4)).toFixed(1),
        cy: +(2 + rand() * (H - 4)).toFixed(1),
        r: +(0.05 + rand() ** 3 * 0.22).toFixed(2),
        opacity: +(0.35 + rand() * 0.65).toFixed(2),
      }),
    );
  const bright = el('g', {});
  const mask = maskOf(inp);
  for (let i = 0, n = Math.round((W * H) / 900); i < n; i++) {
    const q = { x: 4 + rand() * (W - 8), y: 4 + rand() * (H - 8) };
    if (mask.free(q, 1.2)) bright.append(decor('star', +q.x.toFixed(1), +q.y.toFixed(1), '#fff6d8', i));
  }
  under.push(defs, stars, nebulae, bright);
  return {
    under,
    over: [],
    key: [
      {
        draw: (x, y) =>
          el('rect', { x: x - 1.3, y: y - 0.9, width: 2.6, height: 1.8, rx: 0.8, fill: mix('#9a7cff', SPACE, 0.55), stroke: '#c9b8ff', 'stroke-width': 0.2 }),
        name: 'A sector',
      },
      { draw: (x, y) => decor('star', x, y, INK, 1), name: 'A star' },
    ],
    letter: { fill: '#e4e9ff', stroke: SPACE },
  };
}

function town(inp: GroundInput): Ground {
  const { places, seed } = inp;
  const under: SVGElement[] = [];
  const edge = '#8c7d62';
  for (const ps of inp.regions.map((r) => places.filter((p) => r.includes(p.i))))
    under.push(
      ...union(
        ps.map((p) => p.box),
        2.3,
        1.4,
        { stroke: edge, 'stroke-width': 0.6 },
        { fill: '#e7dbbd' },
      ),
    );
  const lots = el('g', { stroke: edge, 'stroke-width': 0.2 });
  const green = (t: Terrain) => t === 'grass' || t === 'forest';
  for (const p of places) {
    const r = grow(p.box, 1.4);
    const fill = green(p.look.terrain)
      ? mix('#9cbf7a', PAPER, 0.35)
      : p.look.terrain === 'water'
        ? mix('#8fb8c4', PAPER, 0.3)
        : mix(p.look.fill, '#eadfc4', 0.45);
    lots.append(el('rect', { x: +r.x.toFixed(2), y: +r.y.toFixed(2), width: +r.w.toFixed(2), height: +r.h.toFixed(2), rx: 0.8, fill }));
  }
  under.push(lots);
  const mask = maskOf(inp);
  const marks = el('g', {});
  for (const p of places)
    sprinkle(p, places, 6, mask, seed + p.i * 31).forEach((s, k) =>
      marks.append(decor(green(p.look.terrain) || k % 3 === 2 ? 'tree' : 'house', s.x, s.y, INK, k)),
    );
  under.push(marks);
  return {
    under,
    over: [],
    key: [
      { draw: (x, y) => decor('house', x, y, INK, 1), name: 'Houses' },
      { draw: (x, y) => decor('tree', x, y, INK, 1), name: 'Trees' },
    ],
    letter: { fill: '#5a4a32', stroke: '#f6efdc' },
  };
}

/** The ground for a theme. */
export function ground(inp: GroundInput): Ground {
  switch (inp.theme) {
    case 'space':
      return space(inp);
    case 'town':
      return town(inp);
    case 'rooms':
      return indoors(inp, false);
    case 'library':
      return indoors(inp, true);
    case 'board':
      return board(inp);
    case 'grid':
      return grid(inp);
    default:
      return land(inp);
  }
}
