// The World Map's indoor grounds (worldMapGround.ts picks them): a floor plan, each region one
// room with walls inside the house's outer walls, furniture in the free space and a door where
// a hall leaves a room (a library's plan has shelves); a circuit board with each part outlined
// in white and little parts between; a draftsman's blue grid with spheres and polygons.
import type { Point } from '../../formats/game';
import type { Rect } from './worldMapLayout';
import { el } from './worldMapArt';
import { INK, PAPER, mix } from './worldMapTerrain';
import { decor, type Decor } from './worldMapDecor';
import { grow, gridPattern, inRect, maskOf, rooms, sprinkle, union, type Ground, type GroundInput } from './worldMapGroundKit';

const BOARD = '#2f5e45';

/** The first point along `line` (from its start) that is out of every rectangle, and the way it was going. */
function exitPoint(line: Point[], rs: Rect[]): { at: Point; angle: number } | undefined {
  for (let k = 1; k < line.length; k++) {
    const [a, b] = [line[k - 1], line[k]];
    const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 4);
    for (let i = 1; i <= n; i++) {
      const q = { x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n };
      if (!rs.some((r) => inRect(q, r))) return { at: q, angle: Math.atan2(b.y - a.y, b.x - a.x) };
    }
  }
  return undefined;
}

export function indoors(inp: GroundInput, library: boolean): Ground {
  const { places, seed, W, H } = inp;
  const under: SVGElement[] = gridPattern('wm-plan', W, H, 2, 10, INK, 0.07, 0.12);
  // the outer walls round everything
  const all = [...places.map((p) => p.box), ...inp.lines.flat().map((q) => ({ x: q.x, y: q.y, w: 0, h: 0 }))];
  const x0 = Math.min(...all.map((r) => r.x)) - 5;
  const y0 = Math.min(...all.map((r) => r.y)) - 5;
  const x1 = Math.max(...all.map((r) => r.x + r.w)) + 5;
  const y1 = Math.max(...all.map((r) => r.y + r.h)) + 5;
  under.push(
    el('rect', { x: x0, y: y0, width: x1 - x0, height: y1 - y0, fill: '#f6efdc', stroke: INK, 'stroke-width': 1.3 }),
    el('rect', { x: x0 + 0.9, y: y0 + 0.9, width: x1 - x0 - 1.8, height: y1 - y0 - 1.8, fill: 'none', stroke: INK, 'stroke-width': 0.25 }),
  );
  const groups = rooms(inp);
  const pad = 2.45;
  for (const ps of groups)
    under.push(
      ...union(
        ps.map((p) => p.box),
        pad,
        0,
        { stroke: INK, 'stroke-width': 1.8 },
        { fill: library ? '#e6cfa2' : mix(ps[0].look.fill, PAPER, 0.6) },
      ),
    );
  // furniture (or shelves) in each room's free space
  const mask = maskOf(inp);
  const marks = el('g', {});
  const kinds: Decor[] = library ? ['shelf', 'shelf', 'table'] : ['table', 'rug', 'plant'];
  for (const ps of groups) {
    const rs = ps.map((p) => grow(p.box, pad - 1.4));
    for (const p of ps)
      sprinkle(p, places, 4, mask, seed + p.i * 31, (q) => rs.some((r) => inRect(q, r))).forEach((s, k) =>
        marks.append(decor(kinds[(k + p.i) % 3], s.x, s.y, INK, k)),
      );
  }
  under.push(marks);
  // a door wherever a hall leaves a room
  const roomOf = new Map<number, Rect[]>();
  for (const ps of groups)
    for (const p of ps)
      roomOf.set(
        p.i,
        ps.map((q) => grow(q.box, pad)),
      );
  const doors = el('g', {});
  const ends = (l: Point[]) => [l, [...l].reverse()];
  for (const l of inp.lines)
    for (const side of ends(l)) {
      const p = places.find((q) => Math.hypot(q.c.x - side[0].x, q.c.y - side[0].y) < 8);
      const out = p && exitPoint(side, roomOf.get(p.i) ?? []);
      if (!out) continue;
      const deg = (out.angle * 180) / Math.PI + 90;
      doors.append(el('g', { transform: `translate(${out.at.x.toFixed(2)},${out.at.y.toFixed(2)}) rotate(${deg.toFixed(1)})` }, decor('door', 0, 0, INK)));
    }
  return {
    under,
    over: [doors],
    key: [
      { draw: (x, y) => decor('door', x, y + 0.7, INK), name: 'A door' },
      { draw: (x, y) => decor(kinds[0], x, y, INK, 1), name: library ? 'Shelves' : 'Furniture' },
    ],
    letter: { fill: INK, stroke: '#f6efdc' },
  };
}

export function board(inp: GroundInput): Ground {
  const { places, seed, W, H } = inp;
  const under: SVGElement[] = [
    el('rect', { x: 2, y: 2, width: W - 4, height: H - 4, fill: BOARD }),
    el(
      'defs',
      {},
      el(
        'pattern',
        { id: 'wm-vias', width: 6, height: 6, patternUnits: 'userSpaceOnUse' },
        el('circle', { cx: 3, cy: 3, r: 0.35, fill: 'none', stroke: '#a7cdb0', 'stroke-width': 0.12 }),
      ),
    ),
    el('rect', { x: 2, y: 2, width: W - 4, height: H - 4, fill: 'url(#wm-vias)', opacity: 0.35 }),
  ];
  for (const ps of inp.regions.map((r) => places.filter((p) => r.includes(p.i))))
    under.push(
      ...union(
        ps.map((p) => p.box),
        2.3,
        0.6,
        { stroke: '#f1efe4', 'stroke-width': 0.45 },
        { fill: BOARD },
      ),
    );
  const mask = maskOf(inp);
  const marks = el('g', {});
  const kinds: Decor[] = ['resistor', 'capacitor', 'chip'];
  for (const p of places) sprinkle(p, places, 5, mask, seed + p.i * 31).forEach((s, k) => marks.append(decor(kinds[(k + p.i) % 3], s.x, s.y, '#cfe3d4', k)));
  under.push(marks);
  return {
    under,
    over: [],
    key: [
      { draw: (x, y) => decor('resistor', x, y, INK, 1), name: 'Resistors' },
      { draw: (x, y) => decor('chip', x, y, INK, 1), name: 'Chips' },
    ],
    letter: { fill: '#f1efe4', stroke: BOARD, family: "'Courier New', Courier, monospace" },
  };
}

export function grid(inp: GroundInput): Ground {
  const { places, seed, W, H } = inp;
  const blue = '#284a70';
  const under: SVGElement[] = gridPattern('wm-draft', W, H, 2, 10, '#5b86b8', 0.22, 0.4);
  for (const ps of inp.regions.map((r) => places.filter((p) => r.includes(p.i))))
    under.push(
      ...union(
        ps.map((p) => p.box),
        2.3,
        0,
        { stroke: blue, 'stroke-width': 0.5 },
        { fill: '#e6edf2', opacity: 0.9 },
      ),
    );
  const mask = maskOf(inp);
  const marks = el('g', {});
  for (const p of places) sprinkle(p, places, 4, mask, seed + p.i * 31).forEach((s, k) => marks.append(decor(k % 2 ? 'cube' : 'sphere', s.x, s.y, blue, k)));
  under.push(marks);
  return {
    under,
    over: [],
    key: [
      { draw: (x, y) => decor('sphere', x, y, blue, 1), name: 'Spheres' },
      { draw: (x, y) => decor('cube', x, y, blue, 1), name: 'Polygons' },
    ],
    letter: { fill: blue, stroke: '#f4f1e6' },
  };
}
