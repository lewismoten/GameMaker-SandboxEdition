// The big furniture of the Library's room (libraryRoom.ts), drawn as boxes in roomGeo.ts's perspective, so each
// has a front, a top and (off to a side of the room) a side face that recede to the room's vanishing point:
// the card catalog, the copier and the circulation desk. `place` stands a flat picture (Joe, the trash can,
// the notebook, a visitor) on the floor at the same depth, sized in meters.
import { box, pctX, pctY, pts, scaleAt, proj, type Faces, type Pt } from './roomGeo';
import { BOARD, BOARDS, svgOf } from './roomArt';

export interface Spot {
  svg: SVGSVGElement;
  /** Where it goes in the room, percent of its width and height. */
  l: number;
  t: number;
  w: number;
  h: number;
}

const LINE = 'stroke="var(--wood-dark)" stroke-width="1.5" stroke-linejoin="round"';
const mix = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

/** A rectangle on a box's front face, `fx`/`fy` as fractions of its width and height from the lower left. */
function onFront(f: Faces, fx0: number, fy0: number, fx1: number, fy1: number): { x: number; y: number; w: number; h: number } {
  const [bl, br, , tl] = f.front;
  const x0 = mix(bl, br, fx0)[0];
  const x1 = mix(bl, br, fx1)[0];
  const yb = mix(bl, tl, fy0)[1];
  const yt = mix(bl, tl, fy1)[1];
  return { x: x0, y: yt, w: x1 - x0, h: yb - yt };
}
const rect = (r: { x: number; y: number; w: number; h: number }, attrs: string) =>
  `<rect x="${r.x.toFixed(1)}" y="${r.y.toFixed(1)}" width="${r.w.toFixed(1)}" height="${r.h.toFixed(1)}" ${attrs}/>`;

/** One box as drawn faces: the front, top and side in the given fills (the side a little darker). */
function faces(f: Faces, front: string, top: string, side?: string): string {
  return (
    (f.side ? `<polygon points="${pts(f.side)}" fill="${side ?? front}" ${LINE}/><polygon points="${pts(f.side)}" fill="#000" opacity=".28"/>` : '') +
    `<polygon points="${pts(f.front)}" fill="${front}" ${LINE}/>` +
    (f.top ? `<polygon points="${pts(f.top)}" fill="${top}" ${LINE}/>` : '')
  );
}

/** Wraps drawn parts in an SVG that fits their bounds (a floor shadow included) and says where that is in the room. */
function spot(body: string, all: Pt[], shadow: Pt[]): Spot {
  const xs = [...all, ...shadow].map((p) => p[0]);
  const ys = [...all, ...shadow].map((p) => p[1]);
  const x0 = Math.min(...xs) - 2;
  const y0 = Math.min(...ys) - 2;
  const x1 = Math.max(...xs) + 2;
  const y1 = Math.max(...ys) + 2;
  const svg = svgOf(
    `<svg viewBox="${x0.toFixed(1)} ${y0.toFixed(1)} ${(x1 - x0).toFixed(1)} ${(y1 - y0).toFixed(1)}" >` +
      `<polygon points="${pts(shadow)}" fill="rgba(0,0,0,.4)"/>${body}</svg>`,
  );
  return { svg, l: pctX(x0), t: pctY(y0), w: pctX(x1 - x0), h: pctY(y1 - y0) };
}

/** The floor under a box, a little bigger than the box. */
const footprint = (x0: number, x1: number, z0: number, z1: number): Pt[] => [
  proj(x0 - 0.08, 0, z0 - 0.08),
  proj(x1 + 0.08, 0, z0 - 0.08),
  proj(x1 + 0.08, 0, z1 + 0.08),
  proj(x0 - 0.08, 0, z1 + 0.08),
];

/** The card catalog, standing against the left of the room: six drawers with label cards and brass pulls. */
export function catalogArt(): Spot {
  const [x0, x1, z0, z1, h] = [-3.7, -2.8, 1.5, 2.1, 1.35];
  const f = box(x0, x1, z0, z1, 0, h);
  let drawers = '';
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 2; c++) {
      const d = onFront(f, 0.07 + c * 0.47, 0.06 + r * 0.31, 0.46 + c * 0.47, 0.34 + r * 0.31 - 0.03);
      drawers +=
        rect(d, `fill="var(--wood-hi)" ${LINE}`) +
        rect({ x: d.x + d.w * 0.2, y: d.y + d.h * 0.18, w: d.w * 0.6, h: d.h * 0.32 }, 'fill="var(--paper)"') +
        rect({ x: d.x + d.w * 0.38, y: d.y + d.h * 0.62, w: d.w * 0.24, h: d.h * 0.13 }, 'rx="1" fill="var(--brass)"');
    }
  }
  return spot(
    faces(f, 'var(--wood)', 'var(--wood-hi)', 'var(--wood-lo)') + drawers,
    [...f.front, ...(f.top ?? []), ...(f.side ?? [])],
    footprint(x0, x1, z0, z1),
  );
}

/** The copier, standing against the right of the room: a cabinet with doors, a body with a green display and a lid. */
export function copierArt(): Spot {
  const [x0, x1, z0, z1] = [2.7, 3.8, 1.5, 2.15];
  const low = box(x0, x1, z0, z1, 0, 0.7);
  const up = box(x0, x1, z0, z1, 0.7, 1.2);
  const doors = [0, 1].map((i) => rect(onFront(low, 0.07 + i * 0.47, 0.1, 0.46 + i * 0.47, 0.9), `fill="#8d8363" ${LINE}`)).join('');
  const display = rect(onFront(up, 0.08, 0.3, 0.5, 0.55), 'fill="#31413a"') + rect(onFront(up, 0.08, 0.3, 0.28, 0.55), 'fill="#6fd08a"');
  const button = rect(onFront(up, 0.62, 0.25, 0.9, 0.6), `rx="2" fill="#2f6f45" ${LINE}`);
  return spot(
    faces(low, '#a89d7d', '#b9ad8c', '#a89d7d') + doors + faces(up, '#d8ceb2', '#e6dec6', '#d8ceb2') + display + button,
    [...low.front, ...(up.top ?? []), ...(up.side ?? []), ...up.front],
    footprint(x0, x1, z0, z1),
  );
}

/** Where the circulation desk stands: the middle of the room. Measures are meters. */
export const DESK = { x: 0, z: 0, w: 1.7, d: 0.75, h: 0.86 };

/** The circulation desk in the middle of the room: a front of panels and a wide top. */
export function deskArt(): Spot {
  const { x, z, w, d, h } = DESK;
  const body = box(x - w / 2 + 0.06, x + w / 2 - 0.06, z - d / 2 + 0.05, z + d / 2 - 0.05, 0, h - 0.06);
  const slab = box(x - w / 2, x + w / 2, z - d / 2, z + d / 2, h - 0.06, h);
  const panels = [0, 1, 2]
    .map(
      (i) =>
        rect(onFront(body, 0.05 + i * 0.32, 0.12, 0.3 + i * 0.32, 0.88), `fill="var(--wood-lo)" ${LINE}`) +
        rect(onFront(body, 0.14 + i * 0.32, 0.55, 0.21 + i * 0.32, 0.62), 'fill="var(--brass)"'),
    )
    .join('');
  return spot(
    faces(body, 'var(--wood)', 'var(--wood-hi)') + panels + faces(slab, 'var(--wood-hi)', 'var(--wood-hi)'),
    [...slab.front, ...(slab.top ?? []), ...body.front],
    footprint(x - w / 2, x + w / 2, z - d / 2, z + d / 2),
  );
}

/** A reading table to the left of the desk, with an open book on it: a slab on four legs, drawn back to front. */
const TABLE = { x0: -2.0, x1: -1.15, z0: 0.0, z1: 0.6, h: 0.74 };

export function tableArt(): Spot {
  const { x0, x1, z0, z1, h } = TABLE;
  const leg = 0.07;
  const legs = [
    [x0 + 0.06, z1 - 0.06 - leg],
    [x1 - 0.06 - leg, z1 - 0.06 - leg],
    [x0 + 0.06, z0 + 0.06],
    [x1 - 0.06 - leg, z0 + 0.06],
  ].map(([lx, lz]) => faces(box(lx, lx + leg, lz, lz + leg, 0, h - 0.05), 'var(--wood-lo)', 'var(--wood)'));
  const slab = box(x0, x1, z0, z1, h - 0.05, h);
  const mx = (x0 + x1) / 2;
  const book = box(mx - 0.2, mx + 0.2, z0 + 0.15, z0 + 0.45, h, h + 0.03);
  return spot(
    legs.join('') + faces(slab, 'var(--wood)', 'var(--wood-hi)') + faces(book, '#a33d5f', '#f4f1e6'),
    [...slab.front, ...(slab.top ?? []), ...(book.top ?? []), proj(x0 + 0.06, 0, z0 + 0.06), proj(x1 - 0.06, 0, z0 + 0.06)],
    footprint(x0 + 0.05, x1 - 0.05, z0 + 0.05, z1 - 0.05),
  );
}

/** Two stools left of the reading table, a floor lamp beside them and a book cart on the right: plain props, clear of the desk and the lane in front of it. */
const STOOLS: [number, number][] = [
  [-1.85, -0.72],
  [-1.4, -0.72],
];
const LAMP = { x: 1.8, z: 0.25 };
const CART = { x0: 2.15, x1: 2.8, z0: -1.2, z1: -0.92 };

export function stoolsArt(): Spot {
  const body = STOOLS.map(([cx, cz]) => {
    const r = 0.13;
    const legs = [
      [cx - r + 0.02, cz - r + 0.02],
      [cx + r - 0.06, cz - r + 0.02],
      [cx - r + 0.02, cz + r - 0.06],
      [cx + r - 0.06, cz + r - 0.06],
    ].map(([lx, lz]) => faces(box(lx, lx + 0.04, lz, lz + 0.04, 0, 0.38), 'var(--wood-lo)', 'var(--wood)'));
    const seat = box(cx - r, cx + r, cz - r, cz + r, 0.38, 0.44);
    return { svg: legs.join('') + faces(seat, '#a33d5f', '#c4577a', '#7e2c47'), seat, cx, cz, r };
  });
  return spot(
    body.map((b) => b.svg).join(''),
    body.flatMap((b) => [...b.seat.front, ...(b.seat.top ?? [])]),
    body.flatMap((b) => footprint(b.cx - b.r, b.cx + b.r, b.cz - b.r, b.cz + b.r)),
  );
}

export function lampArt(): Spot {
  const { x, z } = LAMP;
  const base = box(x - 0.14, x + 0.14, z - 0.14, z + 0.14, 0, 0.05);
  const pole = box(x - 0.025, x + 0.025, z - 0.025, z + 0.025, 0.05, 0.72);
  const shade = box(x - 0.2, x + 0.2, z - 0.2, z + 0.2, 0.67, 0.9);
  const glow = rect(onFront(shade, 0.1, 0.1, 0.9, 0.9), 'fill="#ffe7a8" opacity=".75"');
  return spot(
    faces(base, 'var(--wood-lo)', 'var(--wood)') + faces(pole, 'var(--brass)', 'var(--brass)') + faces(shade, '#e9c46a', '#fff1c4') + glow,
    [...base.front, ...pole.front, ...shade.front, ...(shade.top ?? [])],
    footprint(x - 0.14, x + 0.14, z - 0.14, z + 0.14),
  );
}

export function cartArt(): Spot {
  const { x0, x1, z0, z1 } = CART;
  const w = x1 - x0;
  const post = (px: number, pz: number) => faces(box(px, px + 0.04, pz, pz + 0.04, 0.08, 0.36), 'var(--wood-lo)', 'var(--wood)');
  const posts = post(x0 + 0.02, z1 - 0.06) + post(x1 - 0.06, z1 - 0.06) + post(x0 + 0.02, z0 + 0.02) + post(x1 - 0.06, z0 + 0.02);
  const wheel = (px: number) => faces(box(px, px + 0.08, z0 + 0.1, z0 + 0.2, 0, 0.08), '#2b2b2b', '#444');
  const shelf = (y: number) => box(x0, x1, z0, z1, y, y + 0.04);
  const shelves = [0.14, 0.36].map(shelf);
  const colors = ['#a33d5f', '#3d6fa3', '#d9a441', '#4f8a5b', '#8b5a9e'];
  const books = (y: number, n: number) =>
    Array.from({ length: n }, (_, i) => {
      const bx = x0 + 0.06 + (i * (w - 0.14)) / n;
      return faces(box(bx, bx + (w - 0.14) / n - 0.015, z0 + 0.08, z1 - 0.08, y + 0.04, y + 0.04 + 0.1 + (i % 2) * 0.03), colors[i % colors.length], '#f4f1e6');
    }).join('');
  return spot(
    wheel(x0 + 0.03) +
      wheel(x1 - 0.11) +
      posts +
      faces(shelves[0], 'var(--wood)', 'var(--wood-hi)') +
      books(0.14, 5) +
      faces(shelves[1], 'var(--wood)', 'var(--wood-hi)'),
    [...shelves[1].front, ...(shelves[1].top ?? []), ...shelves[0].front],
    footprint(x0, x1, z0, z1),
  );
}

/** Stands a flat picture `widthM` meters wide with its feet on the floor (or on a surface `y` high) at plan point (x, z). */
export function place(el: HTMLElement, x: number, z: number, widthM: number, y = 0): void {
  const [sx, sy] = proj(x, y, z);
  const w = widthM * scaleAt(z);
  el.style.setProperty('--l', `${pctX(sx - w / 2)}%`);
  el.style.setProperty('--b', `${100 - pctY(sy)}%`);
  el.style.setProperty('--w', `${pctX(w)}%`);
}

/** A run of the far wall's shelf, either side of Joe, where the open drawer's spines stand on the two shelves at eye level. */
export function spineBox(left: boolean): { l: number; t: number; w: number; h: number; gap: number } {
  const [inner, outer] = [1.65, 3.2];
  const x0 = proj(left ? -outer : inner, 0, 8)[0];
  const x1 = proj(left ? -inner : outer, 0, 8)[0];
  const top = proj(0, BOARDS[2] - BOARD, 8)[1];
  const bottom = proj(0, BOARDS[0], 8)[1];
  return { l: pctX(x0), t: pctY(top), w: pctX(x1 - x0), h: pctY(bottom - top), gap: (BOARD / (BOARDS[2] - BOARD - BOARDS[0])) * 100 };
}
