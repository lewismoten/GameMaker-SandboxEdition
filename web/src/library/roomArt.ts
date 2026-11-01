// Pictures for the Library's room (libraryRoom.ts), drawn here as SVG: the octagonal room in perspective
// (every point goes through roomGeo.ts's `proj`, so floor, walls, books, ceiling beams, window, the L-Space
// gap and the objects of roomObjects.ts share one vanishing point) and the small icons for the notebook,
// the trash can and the stacks. Plain drawings made for this site; the fills use the Library's wood and
// brass colors.
import { APOTHEM, HALF_SIDE, HORIZON, VB_H, VB_W, WALL_H, pctX, pctY, proj, pts, type Pt } from './roomGeo';

const NS = 'http://www.w3.org/2000/svg';
const SPINES = ['#8c2f2a', '#2f5d8c', '#3f7a4a', '#c8a23a', '#6a4a8c', '#b5632c', '#2b6f6f', '#a33d5f', '#58606b'];
/** Heights of the shelf boards, in meters; books stand on a board and reach the next. */
export const BOARDS = [0.3, 1.0, 1.7, 2.4];
/** Thickness of a board. */
export const BOARD = 0.05;

/** Parses a fixed piece of SVG markup into an element. */
export function svgOf(markup: string): SVGSVGElement {
  const doc = new DOMParser().parseFromString(markup.replace('<svg ', `<svg xmlns="${NS}" aria-hidden="true" focusable="false" `), 'image/svg+xml');
  return document.importNode(doc.documentElement, true) as unknown as SVGSVGElement;
}

/** Deterministic little number stream, so the books are the same every visit. */
function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

type Plan = [number, number];
/** A span of shelf that stays bare: the window in the stacks, the gap that leads to L-Space. */
interface Hole {
  /** Meters along the wall. */
  u: [number, number];
  /** Shelves at or above this level are bare there. */
  from: number;
}

/** One wall of the octagon, from plan point `a` to `b`, with shelves of books on it. `shade` darkens walls turned from the lamp. */
function wall(a: Plan, b: Plan, seed: number, shade: number, holes: Hole[]): string {
  const rand = rng(seed);
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const P = (u: number, h: number): Pt => proj(a[0] + ((b[0] - a[0]) * u) / L, h, a[1] + ((b[1] - a[1]) * u) / L);
  const quad = (u0: number, u1: number, h0: number, h1: number) => pts([P(u0, h0), P(u1, h0), P(u1, h1), P(u0, h1)]);
  const bare = (k: number, u0: number, u1: number) => holes.some((o) => k >= o.from && u1 > o.u[0] && u0 < o.u[1]);
  const out: string[] = [`<polygon points="${quad(0, L, 0, WALL_H)}" fill="var(--room-wall-wood)"/>`];
  out.push(`<polygon points="${quad(0.06, L - 0.06, 0.1, WALL_H - 0.08)}" fill="var(--room-shelf-back)"/>`);
  BOARDS.forEach((hb, k) => {
    const hn = k < BOARDS.length - 1 ? BOARDS[k + 1] - BOARD : WALL_H - 0.12;
    let u = 0.1;
    while (u < L - 0.14) {
      const u2 = Math.min(L - 0.1, u + 0.05 + rand() * 0.08);
      const height = (hn - hb) * (0.6 + rand() * 0.34);
      const color = SPINES[Math.floor(rand() * SPINES.length)];
      if (!bare(k, u, u2)) {
        out.push(`<polygon points="${quad(u, u2, hb, hb + height)}" fill="${color}" stroke="rgba(0,0,0,.4)" stroke-width=".4"/>`);
      }
      u = u2 + (rand() < 0.1 ? 0.06 : 0);
    }
    out.push(`<polygon points="${quad(0.04, L - 0.04, hb - BOARD, hb)}" fill="var(--room-board)" stroke="rgba(0,0,0,.5)" stroke-width=".6"/>`);
  });
  out.push(`<polygon points="${quad(0, L, 0, WALL_H)}" fill="#000" opacity="${shade}"/>`);
  return out.join('');
}

const FAR_L: Plan = [-HALF_SIDE, APOTHEM];
const FAR_R: Plan = [HALF_SIDE, APOTHEM];
const SIDE_L: Plan = [-APOTHEM, HALF_SIDE];
const SIDE_R: Plan = [APOTHEM, HALF_SIDE];
const DIAG = Math.hypot(APOTHEM - HALF_SIDE, APOTHEM - HALF_SIDE);
/** The gap leading to L-Space: on the left diagonal wall, just short of its corner with the far wall. */
const GAP_U: [number, number] = [DIAG - 1.5, DIAG - 0.8];
const GAP_H = 2.1;
const WIN_U: [number, number] = [2.2, 3.8];
const WIN_H: [number, number] = [1.85, 2.75];

/** A point on the left diagonal wall (u meters from the side-wall end), and on the right one (u from the far-wall end). */
const onLeft = (u: number, h: number): Pt => {
  const k = u / DIAG;
  return proj(SIDE_L[0] + (FAR_L[0] - SIDE_L[0]) * k, h, SIDE_L[1] + (FAR_L[1] - SIDE_L[1]) * k);
};
const onRight = (u: number, h: number): Pt => {
  const k = u / DIAG;
  return proj(FAR_R[0] + (SIDE_R[0] - FAR_R[0]) * k, h, FAR_R[1] + (SIDE_R[1] - FAR_R[1]) * k);
};

/** The gap between two stacks that leads to L-Space: a dark, faintly glowing doorway in the wall. */
function lspaceGap(): string {
  const [u0, u1] = GAP_U;
  const frame = pts([onLeft(u0 - 0.08, 0), onLeft(u1 + 0.08, 0), onLeft(u1 + 0.08, GAP_H + 0.1), onLeft(u0 - 0.08, GAP_H + 0.1)]);
  const hole = pts([onLeft(u0, 0), onLeft(u1, 0), onLeft(u1, GAP_H), onLeft(u0, GAP_H)]);
  return (
    `<polygon points="${frame}" fill="var(--room-beam)"/>` + `<polygon points="${hole}" fill="url(#lr-gap)" stroke="rgba(150,160,255,.35)" stroke-width="1"/>`
  );
}

/** Where the L-Space doorway is, as percent of the room (for its button). */
export function lspaceBox(): { l: number; t: number; w: number; h: number } {
  const [u0, u1] = GAP_U;
  const p = [onLeft(u0, 0), onLeft(u1, 0), onLeft(u1, GAP_H), onLeft(u0, GAP_H)];
  const xs = p.map((q) => q[0]);
  const ys = p.map((q) => q[1]);
  return { l: pctX(Math.min(...xs)), t: pctY(Math.min(...ys)), w: pctX(Math.max(...xs) - Math.min(...xs)), h: pctY(Math.max(...ys) - Math.min(...ys)) };
}

/** The small window in the right-hand wall's top shelves, with a slice of daylight falling from it to the floor. */
function windowAndDaylight(): string {
  const [u0, u1] = WIN_U;
  const [h0, h1] = WIN_H;
  const frame = pts([onRight(u0 - 0.1, h0 - 0.1), onRight(u1 + 0.1, h0 - 0.1), onRight(u1 + 0.1, h1 + 0.1), onRight(u0 - 0.1, h1 + 0.1)]);
  const pane = pts([onRight(u0, h0), onRight(u1, h0), onRight(u1, h1), onRight(u0, h1)]);
  const mid = (h: number) => onRight((u0 + u1) / 2, h);
  // the light lands on the floor 2.2 m toward the middle of the room, in both plan directions
  const fall = (u: number): Pt => {
    const k = u / DIAG;
    return proj(FAR_R[0] + (SIDE_R[0] - FAR_R[0]) * k - 2.2, 0, FAR_R[1] + (SIDE_R[1] - FAR_R[1]) * k - 2.2);
  };
  const beam = pts([onRight(u0, h0), onRight(u1, h0), fall(u1), fall(u0)]);
  return (
    `<polygon points="${frame}" fill="#2c1d10"/>` +
    `<polygon points="${pane}" fill="#cfe3e8"/>` +
    `<path d="M${mid(h0)[0].toFixed(1)} ${mid(h0)[1].toFixed(1)}L${mid(h1)[0].toFixed(1)} ${mid(h1)[1].toFixed(1)}" stroke="#2c1d10" stroke-width="3"/>` +
    `<polygon points="${beam}" fill="url(#lr-day)"/>`
  );
}

/** How far a beam or board can run inside the octagon at a given x (or z). */
const limit = (v: number) => Math.min(APOTHEM, 2 * APOTHEM - HALF_SIDE - Math.abs(v));

/** The ceiling: planks running to the far wall and cross beams, with a pendant lamp over the middle of the room. */
function ceiling(): string {
  const roof: Pt[] = [
    [-300, -300],
    [1300, -300],
    proj(APOTHEM, WALL_H, HALF_SIDE),
    proj(HALF_SIDE, WALL_H, APOTHEM),
    proj(-HALF_SIDE, WALL_H, APOTHEM),
    proj(-APOTHEM, WALL_H, HALF_SIDE),
  ];
  const line = (a: Pt, b: Pt, w: number) =>
    `<path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}" stroke="var(--room-beam)" stroke-width="${w}" stroke-linecap="round"/>`;
  const beams = [-6, -3, 0, 3, 6].map((x) => line(proj(x, WALL_H, limit(x)), proj(x, WALL_H, -4.9), x === 0 ? 7 : 5));
  for (const z of [-2, 1.5, 5]) beams.push(line(proj(-limit(z), WALL_H, z), proj(limit(z), WALL_H, z), 6));
  const lamp = proj(0, 2.3, 0);
  const top = proj(0, WALL_H, 0);
  return (
    `<polygon points="${pts(roof)}" fill="var(--room-ceiling)"/>` +
    beams.join('') +
    `<ellipse cx="${lamp[0]}" cy="${lamp[1]}" rx="190" ry="60" fill="url(#lr-lamp)"/>` +
    `<path d="M${lamp[0]} ${top[1]}V${lamp[1] - 12}" stroke="#2c1d10" stroke-width="3"/>` +
    `<path d="M${lamp[0] - 26} ${lamp[1]}q26-24 52 0z" fill="#6b4a1c" stroke="#2c1d10" stroke-width="2"/>` +
    `<ellipse cx="${lamp[0]}" cy="${lamp[1] + 1}" rx="18" ry="4" fill="#ffe7a8"/>`
  );
}

/** The floor: boards running away from the camera, a round runner and the lamp's pool of light. */
function floor(): string {
  let lines = '';
  for (let x = -7; x <= 7; x++) {
    const a = proj(x, 0, limit(x));
    const b = proj(x, 0, -4.9);
    lines += `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
  }
  const ring = (r: number): string => pts(Array.from({ length: 24 }, (_, i) => proj(Math.cos((i * Math.PI) / 12) * r, 0, Math.sin((i * Math.PI) / 12) * r)));
  return (
    `<rect width="${VB_W}" height="${VB_H}" fill="var(--room-floor)"/>` +
    `<path d="${lines}" stroke="rgba(0,0,0,.22)" stroke-width="1.2" fill="none"/>` +
    `<polygon points="${ring(3.4)}" fill="var(--room-runner)" stroke="rgba(0,0,0,.4)" stroke-width="2"/>` +
    `<polygon points="${ring(2.6)}" fill="none" stroke="rgba(255,225,160,.25)" stroke-width="2"/>` +
    `<polygon points="${ring(5)}" fill="url(#lr-pool)"/>`
  );
}

/** The octagon seen from just inside the door: the far wall and the two beside it, a beamed ceiling, a lamp's glow and a high window. */
export function aisle(): SVGSVGElement {
  return svgOf(
    `<svg viewBox="0 0 ${VB_W} ${VB_H}" preserveAspectRatio="xMidYMid slice" class="lib-room-bg" data-horizon="${HORIZON}">` +
      `<defs>` +
      `<radialGradient id="lr-lamp"><stop offset="0" stop-color="#ffd98a" stop-opacity=".75"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="lr-pool"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".6"/><stop offset=".6" stop-color="#ffb85a" stop-opacity=".2"/><stop offset="1" stop-color="#ffb85a" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="lr-dim" gradientUnits="userSpaceOnUse" cx="500" cy="300" r="620" gradientTransform="translate(0 300) scale(1 .6) translate(0 -300)"><stop offset=".3" stop-color="#0c0602" stop-opacity="0"/><stop offset=".7" stop-color="#0c0602" stop-opacity=".45"/><stop offset="1" stop-color="#0c0602" stop-opacity=".85"/></radialGradient>` +
      `<linearGradient id="lr-day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0c0" stop-opacity=".4"/><stop offset="1" stop-color="#fff0c0" stop-opacity=".05"/></linearGradient>` +
      `<linearGradient id="lr-gap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030208"/><stop offset="1" stop-color="#1a1a3a"/></linearGradient>` +
      `</defs>` +
      floor() +
      wall(SIDE_L, FAR_L, 31, 0.2, [{ u: GAP_U, from: 0 }]) +
      wall(FAR_R, SIDE_R, 43, 0.2, [{ u: WIN_U, from: 2 }]) +
      wall(FAR_L, FAR_R, 55, 0, []) +
      lspaceGap() +
      ceiling() +
      windowAndDaylight() +
      `<rect width="${VB_W}" height="${VB_H}" fill="url(#lr-dim)" style="opacity:var(--room-dim)"/>` +
      `</svg>`,
  );
}

const STROKE = 'stroke="var(--wood-dark)" stroke-width="2" stroke-linejoin="round"';

/** The icon for each object in the room, a viewBox of 80 x 80 (the card catalog is taller than wide). */
export const ICONS = {
  stacks: `<svg viewBox="0 0 80 80"><rect x="6" y="6" width="68" height="68" rx="3" fill="var(--wood)" ${STROKE}/>${[0, 1, 2]
    .map(
      (r) =>
        `<rect x="10" y="${10 + r * 21}" width="60" height="18" fill="var(--wood-back)"/>` +
        [0, 1, 2, 3, 4, 5, 6]
          .map((i) => `<rect x="${12 + i * 8}" y="${14 + r * 21 + (i % 3)}" width="6" height="${14 - (i % 3)}" fill="${SPINES[(i + r * 3) % SPINES.length]}"/>`)
          .join(''),
    )
    .join('')}</svg>`,
  notebook: `<svg viewBox="0 0 80 40"><ellipse cx="40" cy="34" rx="36" ry="4" fill="rgba(0,0,0,.4)"/><path d="M10 30 L20 8 H70 L62 30Z" fill="#25252b" ${STROKE}/><path d="M10 30 L20 8 L22 8 L13 32Z" fill="#111"/><path d="M26 24 L32 12 H58 L53 24Z" fill="#f4f1e6" stroke="#25252b" stroke-width="1.5"/><path d="M33 17h22M32 20h20" stroke="#6b6b73" stroke-width="1.5"/></svg>`,
} as const;

/** The trash can, with crumpled reviews sticking out of it when it has any. */
export const trashIcon = (full: boolean) =>
  `<svg viewBox="0 0 80 84"><ellipse cx="40" cy="76" rx="22" ry="4" fill="rgba(0,0,0,.45)"/><path d="M22 28 L26 72 H54 L58 28Z" fill="#8f98a3" ${STROKE}/><path d="M32 34v32M40 34v32M48 34v32" stroke="#69727d" stroke-width="2"/>${full ? '<g fill="#f6edd2" stroke="#4d2f16" stroke-width="1.5" stroke-linejoin="round"><path d="M26 28 L30 10 L42 14 L38 28Z"/><path d="M40 28 L44 8 L56 14 L52 28Z"/><path d="M33 28 L38 14 L48 18 L44 28Z" fill="#fffaf0"/></g><path d="M32 16l7 2M46 14l6 2" stroke="#9b8d6d" stroke-width="1.5"/>' : ''}<path d="M16 28h48" stroke="var(--wood-dark)" stroke-width="5" stroke-linecap="round"/></svg>`;
