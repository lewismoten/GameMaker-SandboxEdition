// Laser nesting: hollow parts (rings, plates) are cut from the empty middles of other parts so a sheet holds more.
// Every part is treated as its bounding circle (round parts and washers are close to one); a guest keeps NEST_GAP mm of
// wood between its cut and the host hole. nestProblems re-tests every placed pair, so a layout change cannot slip through.
import type { Part } from './laserLayout';

export const NEST_GAP = 2;

export interface Hole {
  /** hole center in the host part's own coordinates, and the radius of the biggest circle inside the hole (millimeters, nominal) */
  cx: number;
  cy: number;
  r: number;
}
export interface Guest {
  key: string;
  part: Part;
  /** radius of the circle round the part's center (its middle), nominal */
  rb: number;
}
export interface Nested {
  host: number;
  guest: Guest;
  /** the guest's center from the hole's center */
  dx: number;
  dy: number;
}

/** First-fit circle packing: each guest, biggest first, goes where it fits in the first host that has room. */
export function nest(holes: readonly Hole[], guests: readonly Guest[], kerf: number): { placed: Nested[]; left: Guest[] } {
  const placed: Nested[] = [];
  let left = [...guests].sort((a, b) => b.rb - a.rb);
  holes.forEach((hole, host) => {
    const here: Nested[] = [];
    const rest: Guest[] = [];
    for (const g of left) {
      const need = g.rb + kerf / 2;
      const reach = hole.r - kerf / 2 - NEST_GAP - need;
      let spot: [number, number] | undefined;
      if (reach >= 0)
        for (let rad = 0; rad <= reach + 1e-9 && !spot; rad += 0.5)
          for (let a = 0; a < (rad === 0 ? 1 : 72) && !spot; a++) {
            const dx = rad * Math.cos((a * Math.PI) / 36);
            const dy = rad * Math.sin((a * Math.PI) / 36);
            if (here.every((o) => Math.hypot(o.dx - dx, o.dy - dy) >= o.guest.rb + g.rb + kerf + NEST_GAP)) spot = [dx, dy];
          }
      if (spot) here.push({ host, guest: g, dx: spot[0], dy: spot[1] });
      else rest.push(g);
    }
    placed.push(...here);
    left = rest;
  });
  return { placed, left };
}

/** Problems with a set of placements: a guest too near its hole's edge or another guest. */
export function nestProblems(holes: readonly Hole[], placed: readonly Nested[], kerf: number): string[] {
  const out: string[] = [];
  placed.forEach((n, i) => {
    const h = holes[n.host];
    const edge = h.r - kerf / 2 - (Math.hypot(n.dx, n.dy) + n.guest.rb + kerf / 2);
    if (edge < NEST_GAP - 1e-6) out.push(`${n.guest.key} is ${edge.toFixed(2)} mm from the hole it nests in`);
    placed.slice(i + 1).forEach((o) => {
      if (o.host !== n.host) return;
      const gap = Math.hypot(o.dx - n.dx, o.dy - n.dy) - o.guest.rb - n.guest.rb - kerf;
      if (gap < NEST_GAP - 1e-6) out.push(`${n.guest.key} and ${o.guest.key} are ${gap.toFixed(2)} mm apart`);
    });
  });
  return out;
}

/** The radius of a part's cut outline about the center of its box. */
export function boundingRadius(part: Part): number {
  const first = part.sheet.items.find((i) => i.op === 'cut')!;
  const cx = part.w / 2 + (part.size.w - part.w) / 2;
  const cy = part.h / 2 + (part.size.h - part.h) / 2;
  if (first.k === 'circle') return first.r - part.kerf / 2;
  if (first.k !== 'poly') return 0;
  return Math.max(...first.pts.map(([x, y]) => Math.hypot(x - cx, y - cy))) - part.kerf / 2;
}
