// The paper THE CHEZ's flat pieces. Each Piece knows its cut outline, its fold (score) lines, its cut-out windows, what a laser
// would engrave, and the colored picture for a home printer. The body is a profile (the side view) wrapped by two strips of
// the car's width, one segment per profile edge, with a side panel glued over each long edge; wheels and bumpers are separate.
// Pieces use their own millimeters from the top left of their outline.
import {
  BAND_END,
  BAND_FRONT,
  BUMPER,
  HUB_R,
  JOINT,
  MIN_TAB_EDGE,
  PIN_W,
  PROFILE,
  RIM_R,
  STRIPE_HALF_GAP,
  STRIPE_W,
  STRIP_TOP,
  STRIP_UNDER,
  TAB,
  TIRE_R,
  UNIT,
  WIDTH,
  bandY,
  edgeLen,
  hoodY,
  type Pt,
} from './papercraftDims';

/** One picture shape for the printer. */
export interface Prim {
  pts: Pt[];
  fill?: string;
  stroke?: string;
  w?: number;
  dash?: [number, number];
}
interface Hole {
  label: string;
  pts?: Pt[];
  circle?: [number, number, number];
}
interface Engr {
  label: string;
  polys?: Pt[][];
  circles?: [number, number, number][];
  rings?: [number, number, number, number][];
}
export interface Piece {
  name: string;
  qty: number;
  w: number;
  h: number;
  outline: Pt[];
  folds: [Pt, Pt][];
  holes: Hole[];
  engrave: Engr[];
  art: Prim[];
  /** For strips: the car's width and each segment's profile edge with its length in the net. For panels: the outline's edge lengths in order. */
  meta: { width?: number; segments?: { edge: number; len: number }[]; panelEdges?: number[]; tabs?: number };
}

export const COLOR = {
  red: '#d8402a',
  deep: '#8c1c10',
  roof: '#17171a',
  charcoal: '#3b3b40',
  pin: '#ffffff',
  glass: '#9db8c8',
  under: '#34343a',
  rocker: '#111114',
  tire: '#1c1c1e',
  rim: '#f6f6f2',
  hub: '#b9bcc2',
  lamp: '#ffb62e',
  lens: '#fffdf0',
  tab: '#e4e4e2',
  bumper: '#222226',
};

type Shift = (p: Pt) => Pt;
const pts = (a: readonly Pt[], f: Shift): Pt[] => a.map(f);
const rect = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];
const dedupe = (a: Pt[]): Pt[] => a.filter((p, i) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);

/** Moves a piece drawn anywhere so its outline starts at (0, 0). */
function finish(p: Piece): Piece {
  const xs = p.outline.map((q) => q[0]);
  const ys = p.outline.map((q) => q[1]);
  const dx = -Math.min(...xs);
  const dy = -Math.min(...ys);
  const f: Shift = ([x, y]) => [x + dx, y + dy];
  return {
    ...p,
    w: Math.max(...xs) + dx,
    h: Math.max(...ys) + dy,
    outline: pts(p.outline, f),
    folds: p.folds.map(([a, b]) => [f(a), f(b)]),
    holes: p.holes.map((h) => ({
      ...h,
      pts: h.pts && pts(h.pts, f),
      circle: h.circle && ([h.circle[0] + dx, h.circle[1] + dy, h.circle[2]] as [number, number, number]),
    })),
    engrave: p.engrave.map((e) => ({
      ...e,
      polys: e.polys?.map((q) => pts(q, f)),
      circles: e.circles?.map(([x, y, r]) => [x + dx, y + dy, r] as [number, number, number]),
      rings: e.rings?.map(([x, y, a, b]) => [x + dx, y + dy, a, b] as [number, number, number, number]),
    })),
    art: p.art.map((a) => ({ ...a, pts: pts(a.pts, f) })),
  };
}

/** Sutherland-Hodgman against the half plane where `side(p) >= 0` (keeps a convex polygon convex). */
function clip(poly: Pt[], side: (p: Pt) => number): Pt[] {
  const out: Pt[] = [];
  poly.forEach((a, i) => {
    const b = poly[(i + 1) % poly.length];
    const sa = side(a);
    const sb = side(b);
    if (sa >= 0) out.push(a);
    if (sa >= 0 !== sb >= 0) {
      const t = sa / (sa - sb);
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  });
  return out;
}

/** The racing stripes in the car's own coordinates (facing right): the white band, and the two charcoal stripes as convex slices. */
function stripes(): { band: Pt[][]; mid: Pt[][]; dark: [Pt[][], Pt[][]] } {
  const x0 = BAND_END * UNIT;
  const x1 = BAND_FRONT * UNIT;
  const xs: number[] = [];
  for (let x = x0; x < x1; x += UNIT * 0.5) xs.push(x);
  xs.push(x1);
  // keep the stripes 1.5 mm inside the hood's line
  const inside = (p: Pt) => p[1] - hoodY(p[0]) - 1.5;
  const slices = (a: number, b: number) =>
    xs.slice(0, -1).flatMap((x, i) => {
      const n = xs[i + 1];
      const over = i < xs.length - 2 ? 0.15 : 0; // (a hair of overlap hides the seams between slices)
      const q = clip(
        [
          [x, bandY(x) + a * UNIT],
          [n + over, bandY(n + over) + a * UNIT],
          [n + over, bandY(n + over) + b * UNIT],
          [x, bandY(x) + b * UNIT],
        ],
        inside,
      );
      return q.length >= 3 ? [q] : [];
    });
  const g = STRIPE_HALF_GAP;
  const s = STRIPE_W;
  return { band: slices(-(g + s + PIN_W), g + s + PIN_W), mid: slices(-g, g), dark: [slices(-(g + s), -g), slices(g, g + s)] };
}

const ring = (cx: number, cy: number, r: number, n = 40): Pt[] =>
  Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * 2 * Math.PI), cy + r * Math.sin((i / n) * 2 * Math.PI)] as Pt);

/** Colors of the strips' faces, by profile edge. */
const FACE: Record<number, string> = {
  0: COLOR.roof,
  1: COLOR.red,
  2: COLOR.red,
  3: COLOR.under,
  4: COLOR.under,
  5: COLOR.rocker,
  6: COLOR.under,
  7: COLOR.under,
  8: COLOR.red,
};

/** A strip wrapping the profile edges `edges` in order, left to right, with glue tabs along both long edges and (for the top strip) joint tabs at the ends. */
export function strip(name: string, edges: number[], joints: boolean): Piece {
  const W = WIDTH;
  const segs: { edge: number; x0: number; x1: number }[] = [];
  let x = 0;
  for (const e of edges) {
    segs.push({ edge: e, x0: x, x1: x + edgeLen(e) });
    x += edgeLen(e);
  }
  const Lt = x;
  const hasTab = (s: { x0: number; x1: number }) => s.x1 - s.x0 >= MIN_TAB_EDGE;
  const c = (s: { x0: number; x1: number }) => Math.min(TAB, (s.x1 - s.x0) * 0.35);
  const top: Pt[] = [];
  const bottom: Pt[] = [];
  for (const s of segs) {
    top.push([s.x0, 0]);
    if (hasTab(s)) top.push([s.x0 + c(s), -TAB], [s.x1 - c(s), -TAB]);
    top.push([s.x1, 0]);
  }
  for (const s of [...segs].reverse()) {
    bottom.push([s.x1, W]);
    if (hasTab(s)) bottom.push([s.x1 - c(s), W + TAB], [s.x0 + c(s), W + TAB]);
    bottom.push([s.x0, W]);
  }
  const jt = 3;
  const outline = dedupe([
    ...top,
    ...(joints
      ? ([
          [Lt + JOINT, jt],
          [Lt + JOINT, W - jt],
        ] as Pt[])
      : []),
    ...bottom,
    ...(joints
      ? ([
          [-JOINT, W - jt],
          [-JOINT, jt],
        ] as Pt[])
      : []),
  ]);
  const folds: [Pt, Pt][] = [];
  for (const s of segs.slice(1))
    folds.push([
      [s.x0, 0],
      [s.x0, W],
    ]);
  if (joints)
    folds.push(
      [
        [0, 0],
        [0, W],
      ],
      [
        [Lt, 0],
        [Lt, W],
      ],
    );
  for (const s of segs)
    if (hasTab(s))
      folds.push(
        [
          [s.x0, 0],
          [s.x1, 0],
        ],
        [
          [s.x0, W],
          [s.x1, W],
        ],
      );
  const art: Prim[] = [{ pts: outline, fill: COLOR.tab }];
  const holes: Hole[] = [];
  const engrave: Engr[] = [];
  for (const s of segs) {
    art.push({ pts: rect(s.x0, 0, s.x1, W), fill: FACE[s.edge] });
    if (s.edge === 0) engrave.push({ label: 'roof', polys: [rect(s.x0 + 1.5, 1.5, s.x1 - 1.5, W - 1.5)] });
    if (s.edge === 1) {
      // the windshield (a cut-out; one wiper on the printed glass) and the headlights near the nose
      const win = rect(s.x0 + 7, 9, s.x0 + 50, W - 9);
      holes.push({ label: 'windshield', pts: win });
      art.push(
        { pts: win, fill: COLOR.glass, stroke: '#000', w: 0.3 },
        {
          pts: [
            [s.x0 + 12, W - 12],
            [s.x0 + 45, W - 16],
          ],
          stroke: COLOR.rocker,
          w: 1.1,
        },
      );
      for (const hy of [14, W - 14]) {
        holes.push({ label: 'headlight', circle: [s.x1 - 19.4, hy, 2.6] });
        art.push({ pts: ring(s.x1 - 19.4, hy, 2.6), fill: COLOR.lens, stroke: '#000', w: 0.3 }, { pts: ring(s.x1 - 19.4, hy, 1.2), fill: COLOR.lamp });
      }
    }
    if (s.edge === 8) {
      // the back window, high on the leaning rear, and a red tail lamp each side below it
      const win = rect(s.x1 - 8 - 26, 10, s.x1 - 8, W - 10);
      holes.push({ label: 'back window', pts: win });
      art.push({ pts: win, fill: COLOR.glass, stroke: '#000', w: 0.3 });
      for (const ty of [4, W - 8]) art.push({ pts: rect(s.x0 + 12, ty, s.x0 + 17, ty + 4), fill: COLOR.deep });
    }
  }
  return finish({
    name,
    qty: 1,
    w: 0,
    h: 0,
    outline,
    folds,
    holes,
    engrave,
    art,
    meta: { width: W, segments: segs.map((s) => ({ edge: s.edge, len: s.x1 - s.x0 })), tabs: segs.filter(hasTab).length * 2 + (joints ? 2 : 0) },
  });
}

/** One side panel, outline = the profile. The passenger side is the mirror picture (facing left) and carries the charge port at the rear. */
export function panel(side: 'driver' | 'passenger'): Piece {
  const maxX = Math.max(...PROFILE.map((p) => p[0]));
  const f: Shift = side === 'driver' ? (p) => p : ([x, y]) => [maxX - x, y];
  const outline = pts(PROFILE, f);
  const art: Prim[] = [{ pts: outline, fill: COLOR.red }];
  const holes: Hole[] = [];
  const engrave: Engr[] = [];
  // the door window: the only side window
  const win = pts(
    [
      [12.5, 2.8],
      [18.5, 2.8],
      [24.5, 8.3],
      [13.0, 8.3],
    ].map(([x, y]) => [x * UNIT, y * UNIT] as Pt),
    f,
  );
  holes.push({ label: 'door window', pts: win });
  const st = stripes();
  art.push({ pts: win, fill: COLOR.glass, stroke: '#000', w: 0.3 });
  for (const q of st.band) art.push({ pts: pts(q, f), fill: COLOR.pin });
  // red between the stripes, then the two dark ones beside it
  for (const q of st.mid) art.push({ pts: pts(q, f), fill: COLOR.red });
  for (const half of st.dark) for (const q of half) art.push({ pts: pts(q, f), fill: COLOR.charcoal });
  engrave.push({ label: 'stripe 1', polys: st.dark[0].map((q) => pts(q, f)) }, { label: 'stripe 2', polys: st.dark[1].map((q) => pts(q, f)) });
  // door seams and handle, the amber marker up front and the red one at the back (printed only)
  const u = (x: number, y: number): Pt => f([x * UNIT, y * UNIT]);
  art.push(
    { pts: [u(12.1, 2.2), u(13.33, 14.4)], stroke: COLOR.deep, w: 0.5 },
    { pts: [u(26.1, 8.3), u(26.1, 18.1)], stroke: COLOR.deep, w: 0.5 },
    { pts: [u(14.5, 10.6), u(16.0, 10.6), u(16.0, 11.2), u(14.5, 11.2)], fill: COLOR.hub, stroke: '#000', w: 0.2 },
    { pts: [u(30.4, 10.9), u(31.6, 10.9), u(31.6, 11.7), u(30.4, 11.7)], fill: COLOR.lamp },
    { pts: [u(7.1, 12.4), u(8.3, 12.4), u(8.3, 13.2), u(7.1, 13.2)], fill: COLOR.deep },
  );
  if (side === 'passenger') {
    const port = [u(8.3, 5.2), u(9.4, 5.2), u(9.4, 6.3), u(8.3, 6.3)];
    art.push({ pts: port, fill: COLOR.deep, stroke: '#000', w: 0.2 });
    engrave.push({ label: 'charge port', polys: [port] });
  }
  const edges = outline.map((p, i) => Math.hypot(outline[(i + 1) % outline.length][0] - p[0], outline[(i + 1) % outline.length][1] - p[1]));
  return finish({
    name: side === 'driver' ? 'Driver side panel' : 'Passenger side panel',
    qty: 1,
    w: 0,
    h: 0,
    outline,
    folds: [],
    holes,
    engrave,
    art,
    meta: { panelEdges: edges },
  });
}

/** A wheel: a black tire ring round a white wheel face with a chrome cap (as the side view draws it). On a laser the ring and a small hub dot are engraved and the face is left bare paper. */
export function wheel(): Piece {
  const c = TIRE_R;
  return finish({
    name: 'Wheel',
    qty: 4,
    w: 0,
    h: 0,
    outline: ring(c, c, TIRE_R, 64),
    folds: [],
    holes: [],
    engrave: [
      { label: 'tire', rings: [[c, c, RIM_R + 0.8, TIRE_R - 1.8]] },
      { label: 'hub', circles: [[c, c, 2]] },
    ],
    art: [
      { pts: ring(c, c, TIRE_R, 64), fill: COLOR.tire },
      { pts: ring(c, c, RIM_R, 48), fill: COLOR.rim },
      { pts: ring(c, c, HUB_R, 32), fill: COLOR.hub, stroke: '#777', w: 0.2 },
    ],
    meta: {},
  });
}

/** A bumper: a plain square box as wide as the car (front, two ends, back, with a glue tab and the two caps on tabs). */
export function bumper(): Piece {
  const W = WIDTH;
  const { depth: d, height: h } = BUMPER;
  const t = 4;
  const gl = 6;
  const x0 = 0;
  const xF = d; // front face from d to d+W
  const xR = xF + W;
  const xB = xR + d;
  const xE = xB + W;
  const y0 = d;
  const y1 = y0 + h;
  const outline: Pt[] = [
    [x0, y0],
    [x0 + 2, y0 - t],
    [xF - 2, y0 - t],
    [xF, y0],
    [xF, y0 - d],
    [xR, y0 - d],
    [xR, y0],
    [xR + 2, y0 - t],
    [xB - 2, y0 - t],
    [xB, y0],
    [xE, y0],
    [xE + gl, y0 + 2],
    [xE + gl, y1 - 2],
    [xE, y1],
    [xB, y1],
    [xB - 2, y1 + t],
    [xR + 2, y1 + t],
    [xR, y1],
    [xR, y1 + d],
    [xF, y1 + d],
    [xF, y1],
    [xF - 2, y1 + t],
    [x0 + 2, y1 + t],
    [x0, y1],
  ];
  const faceFold: [Pt, Pt][] = [
    [
      [xF, y0],
      [xF, y1],
    ],
    [
      [xR, y0],
      [xR, y1],
    ],
    [
      [xB, y0],
      [xB, y1],
    ],
    [
      [xF, y0],
      [xR, y0],
    ],
    [
      [xF, y1],
      [xR, y1],
    ],
  ];
  return finish({
    name: 'Bumper',
    qty: 2,
    w: 0,
    h: 0,
    outline,
    folds: faceFold,
    holes: [],
    engrave: [{ label: 'front', polys: [rect(xF + 1.2, y0 + 1.2, xR - 1.2, y1 - 1.2)] }],
    art: [
      { pts: outline, fill: COLOR.tab },
      { pts: rect(xF, y0, xR, y1), fill: COLOR.bumper },
      { pts: rect(x0, y0, xF, y1), fill: COLOR.bumper },
      { pts: rect(xR, y0, xB, y1), fill: COLOR.bumper },
      { pts: rect(xB, y0, xE, y1), fill: COLOR.bumper },
      { pts: rect(xF, y0 - d, xR, y0), fill: COLOR.bumper },
      { pts: rect(xF, y1, xR, y1 + d), fill: COLOR.bumper },
    ],
    meta: {},
  });
}

export function allPieces(): Piece[] {
  return [strip('Underside strip', STRIP_UNDER, false), strip('Top strip', STRIP_TOP, true), panel('driver'), panel('passenger'), wheel(), bumper()];
}
