// Snowbound's Plowed Street box (laser kit): every dimension in millimeters, the street maze, and the check that the lock works.
// Interior frame, seen from above: X left to right (0..Wi), Y from the back wall (0) to the front wall (Di); z up from the
// base's top face. Plates are 3 mm; most of this scales from `T`.
//
// The lock ("twin-stem street maze"): the lid is a street map with the plowed streets cut out as slots. Two knobs stand
// on a loose plate under the lid, one in each of two identical street maps, so the plate can slide to any place the
// streets allow but cannot turn. The drawer's back panel has a small tab (the lug) that rises through the shelf into
// the plate's layer. The plate has a bay for the lug and one narrow channel out of the bay's front. Slide the plate
// by the streets to LaVale Mall, the only place on the map where the channel lines up, and the lug can leave: the
// drawer opens. Everywhere else the plate's front lip stops the lug (the drawer opens at most about 2 cm).

export const T = 3;
export const COLS = 7;
export const ROWS = 3;
export const PITCH = 9;
export const STREET = 6; // street slot width, before kerf
export const STEM = 5; // knob stem diameter
type Street = readonly [col0: number, row0: number, col1: number, row1: number];
/** Open streets between cells. A tree: no loops, so every piece of the lid stays attached. Start is (0,0); LaVale Mall is (6,2). */
export const STREETS: readonly Street[] = [
  [0, 0, 1, 0],
  [1, 0, 2, 0],
  [2, 0, 2, 1],
  [2, 1, 2, 2],
  [2, 2, 3, 2],
  [3, 2, 4, 2],
  [4, 2, 4, 1],
  [4, 1, 4, 0],
  [4, 0, 5, 0],
  [5, 0, 5, 1],
  [5, 1, 5, 2],
  [5, 2, 6, 2],
  // dead ends (snow drifts)
  [0, 0, 0, 1],
  [0, 1, 0, 2],
  [0, 2, 1, 2],
  [2, 0, 3, 0],
  [3, 0, 3, 1],
];
export const START: readonly [number, number] = [0, 0];
export const MALL: readonly [number, number] = [6, 2];

export const Wi = 136;
export const Di = 96;
export const Wo = Wi + 2 * T;
export const Do = Di + 2 * T;
export const drawer = { x0: 8, w: 120, len: 60, z0: 3, h: 22 };
export const zShelf = [26, 29] as const; // the shelf under the plate
export const Hi = 33.7; // the lid's underside
export const Ho = Hi + 2 * T;
/** The drawer's lug: x center, width, y center (the drawer's back panel), and top z. */
export const lug = { x: 67, w: 5, y: Di + T - drawer.len + T / 2, top: 31.7 };
export const maze = { kx0: 41, ky0: 12, dyTwin: 42 };
export const plate = { w: 76, d: 54, bay: [6.3, 12.5, 68.5, 36.5] as const, q1: [38, 5] as const, q2: [38, 47] as const, channelHalf: 3.7 };
export const cellX = (c: number) => maze.kx0 + PITCH * c;
export const cellY = (r: number) => maze.ky0 + PITCH * r;
/** Where the plate's channel sits in plate coordinates: the lug's place when the stem is at LaVale Mall. */
export const channelX = lug.x + plate.q1[0] - cellX(MALL[0]);

/** The street slots of one map as rectangles in interior coordinates, shifted down by `dy`. */
export function streetRects(dy = 0): [number, number, number, number][] {
  const h = STREET / 2;
  return STREETS.map(([c0, r0, c1, r1]) => [
    cellX(Math.min(c0, c1)) - h,
    cellY(Math.min(r0, r1)) + dy - h,
    cellX(Math.max(c0, c1)) + h,
    cellY(Math.max(r0, r1)) + dy + h,
  ]);
}

export interface Check {
  startReachesMall: boolean;
  /** Cells "col,row" where the lug could leave the plate's bay. */
  openCells: string[];
  /** The longest the drawer can open while locked, mm. */
  maxRattle: number;
  /** The lug stays in the bay and the plate stays inside the box at every place the knobs can reach. */
  alwaysContained: boolean;
  /** Streets between start and mall, shortest way. */
  shortest: number;
  /** Play of a stem in a street slot, mm. */
  stemPlay: number;
}

/** Walk every place the knob can reach (0.1 mm grid, square stem), and test the gate at each. */
export function checkLock(kerf = 0.2, step = 0.1): Check {
  const slot = STREET - kerf;
  const rects = streetRects().map(([a, b, c, d]) => [
    a + (STREET - slot) / 2 + STEM / 2,
    b + (STREET - slot) / 2 + STEM / 2,
    c - (STREET - slot) / 2 - STEM / 2,
    d - (STREET - slot) / 2 - STEM / 2,
  ]);
  const x0 = Math.min(...rects.map((r) => r[0]));
  const y0 = Math.min(...rects.map((r) => r[1]));
  const W = Math.round((Math.max(...rects.map((r) => r[2])) - x0) / step) + 1;
  const H = Math.round((Math.max(...rects.map((r) => r[3])) - y0) / step) + 1;
  const free = new Uint8Array(W * H);
  for (const r of rects)
    for (let i = Math.round((r[0] - x0) / step); i <= Math.round((r[2] - x0) / step); i++)
      for (let j = Math.round((r[1] - y0) / step); j <= Math.round((r[3] - y0) / step); j++) free[j * W + i] = 1;
  const seen = new Uint8Array(W * H);
  const start = Math.round((cellY(START[1]) - y0) / step) * W + Math.round((cellX(START[0]) - x0) / step);
  const stack = [start];
  seen[start] = 1;
  const [bx0, by0, bx1, by1] = plate.bay;
  const open = new Set<string>();
  let rattle = 0;
  let contained = true;
  let mallReached = false;
  while (stack.length) {
    const n = stack.pop()!;
    const i = n % W;
    const j = (n - i) / W;
    const kx = x0 + i * step;
    const ky = y0 + j * step;
    // the lug in plate coordinates (the plate's first stem sits at q1)
    const lx = lug.x + plate.q1[0] - kx;
    const ly = lug.y + plate.q1[1] - ky;
    if (lx - lug.w / 2 < bx0 || lx + lug.w / 2 > bx1 || ly - T / 2 < by0 || ly + T / 2 > by1) contained = false;
    const px = kx - plate.q1[0];
    const py = ky - plate.q1[1];
    if (px < 0.5 || px + plate.w > Wi - 0.5 || py < 0.5 || py + plate.d > Di - 0.5) contained = false;
    // the channel through the front lip (the kerf takes half off each side of the part, so the lug grows and the channel widens)
    const through =
      lx - lug.w / 2 - kerf / 2 >= channelX - plate.channelHalf - kerf / 2 && lx + lug.w / 2 + kerf / 2 <= channelX + plate.channelHalf + kerf / 2;
    if (through) {
      const c = Math.round((kx - cellX(0)) / PITCH);
      const r = Math.round((ky - cellY(0)) / PITCH);
      open.add(`${c},${r}`);
      if (c === MALL[0] && r === MALL[1]) mallReached = true;
    } else rattle = Math.max(rattle, by1 - (ly + T / 2));
    for (const [di, dj] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const ni = i + di;
      const nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= W || nj >= H) continue;
      const m = nj * W + ni;
      if (free[m] && !seen[m]) {
        seen[m] = 1;
        stack.push(m);
      }
    }
  }
  const adj = new Map<string, string[]>();
  for (const [a, b, c, d] of STREETS) {
    adj.set(`${a},${b}`, [...(adj.get(`${a},${b}`) ?? []), `${c},${d}`]);
    adj.set(`${c},${d}`, [...(adj.get(`${c},${d}`) ?? []), `${a},${b}`]);
  }
  const dist = new Map<string, number>([[`${START}`, 0]]);
  const q = [`${START}`];
  while (q.length) {
    const c = q.shift()!;
    for (const nb of adj.get(c) ?? [])
      if (!dist.has(nb)) {
        dist.set(nb, dist.get(c)! + 1);
        q.push(nb);
      }
  }
  return {
    startReachesMall: mallReached,
    openCells: [...open].sort(),
    maxRattle: rattle,
    alwaysContained: contained,
    shortest: dist.get(`${MALL}`) ?? -1,
    stemPlay: slot - STEM,
  };
}
