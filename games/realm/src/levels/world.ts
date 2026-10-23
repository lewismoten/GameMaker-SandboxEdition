// WORLD.MAP: the Kingdom of Procrastia. Two lands across the Dawdle Flats (a strait of sea
// and tidal mud nobody has ever got around to crossing on foot): Dallydale in the west, with
// Nowish, Laterburg, Someday Harbor, the Snooze Barrows and the Soggy Vaults, and Far Putoff in
// the east, with Eventually Falls, the Putoff Mines and Deadline Keep. Everything is painted
// on block corners (art/corners.ts) with straight, 45-degree and curved edges only.
import { CornerMap, N } from '../art/corners';
import { cellHash } from './ground';
import { rng } from '../../../kit/pixels';

export type Pt = [number, number];

/** Asserts that a polygon or path only runs straight or at exactly 45 degrees. */
function octo(name: string, pts: Pt[], closed = true): Pt[] {
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    if (dx && dy && dx !== dy) throw new Error(`${name}: edge ${pts[i]} -> ${pts[(i + 1) % pts.length]} is neither straight nor diagonal`);
  }
  return pts;
}

/**
 * Breaks the long straight edges of an octilinear polygon into jogs of a corner or two (still
 * only straight and 45-degree steps), so coasts and wood edges wander instead of ruling lines.
 */
export function roughen(pts: Pt[], seed: number, amp = 2, closed = true): Pt[] {
  const r = rng(seed);
  const out: Pt[] = [];
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    out.push(a);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    if (dx && dy) continue;
    const len = Math.abs(dx || dy);
    if (len < 7) continue;
    const s = Math.sign(dx || dy);
    // along: the edge's axis; across: the other one
    const at = (along: number, off: number): Pt => (dx ? [along, a[1] + off] : [a[0] + off, along]);
    const start = dx ? a[0] : a[1];
    const end = dx ? b[0] : b[1];
    let pos = start;
    let off = 0;
    for (;;) {
      const run = 2 + Math.floor(r() * 4);
      if (Math.abs(end - (pos + s * run)) <= Math.abs(off) + 2) break;
      pos += s * run;
      out.push(at(pos, off));
      let next = off + (r() < 0.5 ? -1 : 1) * (r() < 0.7 ? 1 : 2);
      next = Math.max(-amp, Math.min(amp, next));
      if (Math.abs(end - (pos + s * Math.abs(next - off))) <= Math.abs(next) + 2) break;
      pos += s * Math.abs(next - off);
      off = next;
      out.push(at(pos, off));
    }
    if (off) {
      out.push(at(end - s * Math.abs(off), off));
    }
  }
  if (!closed) out.push(pts[pts.length - 1]);
  return octo('rough', out, closed);
}

export const WEST = octo('west', [
  [14, 10],
  [34, 10],
  [38, 14],
  [50, 14],
  [54, 10],
  [58, 10],
  [58, 40],
  [56, 42],
  [56, 58],
  [60, 62],
  [60, 74],
  [54, 80],
  [54, 86],
  [50, 90],
  [30, 90],
  [26, 86],
  [20, 86],
  [16, 90],
  [10, 90],
  [8, 88],
  [8, 70],
  [12, 66],
  [12, 58],
  [8, 54],
  [8, 40],
  [12, 36],
  [12, 22],
  [8, 18],
  [8, 16],
]);

export const EAST = octo('east', [
  [68, 14],
  [86, 14],
  [90, 18],
  [90, 40],
  [92, 42],
  [92, 74],
  [88, 78],
  [88, 90],
  [70, 90],
  [66, 86],
  [66, 60],
  [68, 58],
  [68, 40],
  [66, 38],
  [66, 16],
]);

export interface WorldPlan {
  cm: CornerMap;
  /** Features stamped over the ground: block name prefix and top-left block. */
  stamps: { name: string; x: number; y: number; w: number; h: number }[];
  /** Named spots (block coordinates). */
  spot: Record<string, Pt>;
}

export function planWorld(): WorldPlan {
  const cm = new CornerMap(['land', 'water', 'rock', 'forest', 'road']);
  cm.region('land', roughen(WEST, 1));
  cm.region('land', roughen(EAST, 2));
  // the sea is wherever the land isn't
  cm.paint('water', (x, y) => (cm.in('land', x, y) ? 0 : 1));

  // ---- Dallydale
  // the northern hills (the Snooze Barrows are under them) and the Putoff Range's western foot
  cm.region(
    'rock',
    roughen(
      octo('hills', [
        [30, 14],
        [36, 14],
        [40, 18],
        [48, 18],
        [52, 14],
        [56, 14],
        [56, 22],
        [54, 24],
        [30, 24],
        [26, 20],
        [26, 18],
      ]),
      315,
    ),
  );
  // Lake Later
  cm.region(
    'water',
    roughen(
      octo('lake', [
        [38, 58],
        [42, 58],
        [46, 62],
        [46, 66],
        [42, 70],
        [38, 70],
        [34, 66],
        [34, 62],
      ]),
      568,
    ),
  );
  // the River Dither: from the hills, past Laterburg, into the lake and out to the south sea
  cm.path('water', [
    [32, 25],
    [32, 30],
    [38, 36],
    [38, 50],
    [40, 52],
    [40, 58],
  ]);
  cm.path('water', [
    [42, 70],
    [42, 76],
    [46, 80],
    [46, 90],
  ]);
  // the Whistling Woods east of Laterburg, and the Nowish copse
  cm.region(
    'forest',
    roughen(
      octo('woods', [
        [44, 30],
        [52, 30],
        [54, 32],
        [54, 52],
        [50, 56],
        [46, 52],
        [46, 50],
        [42, 46],
        [42, 32],
      ]),
      627,
    ),
  );
  cm.region(
    'forest',
    roughen(
      octo('copse', [
        [12, 68],
        [16, 68],
        [18, 70],
        [18, 76],
        [14, 80],
        [10, 80],
        [10, 70],
      ]),
      469,
    ),
  );
  cm.region(
    'forest',
    roughen(
      octo('southwood', [
        [28, 78],
        [34, 78],
        [38, 82],
        [38, 86],
        [30, 86],
        [26, 82],
        [26, 80],
      ]),
      254,
    ),
  );
  // roads: Nowish north to Laterburg, Laterburg west to Someday Harbor, north to the Barrows
  cm.path('road', [
    [22, 80],
    [22, 72],
    [26, 68],
    [26, 52],
    [30, 48],
    [31, 48],
  ]);
  cm.path('road', [
    [26, 52],
    [22, 48],
    [16, 48],
  ]);
  cm.path('road', [
    [31, 48],
    [31, 46],
  ]);
  cm.path('road', [
    [31, 48],
    [40, 48],
    [40, 27],
  ]);

  // groves, an outcrop and a pond to break up the meadows
  cm.region(
    'forest',
    roughen(
      octo('nwgrove', [
        [16, 18],
        [22, 18],
        [24, 20],
        [24, 26],
        [22, 28],
        [16, 28],
        [14, 26],
        [14, 20],
      ]),
      71,
    ),
  );
  cm.region(
    'rock',
    roughen(
      octo('outcrop', [
        [16, 34],
        [20, 34],
        [22, 36],
        [22, 38],
        [20, 40],
        [16, 40],
        [14, 38],
        [14, 36],
      ]),
      73,
    ),
  );
  cm.region(
    'forest',
    roughen(
      octo('lakewood', [
        [48, 62],
        [52, 62],
        [54, 64],
        [54, 74],
        [52, 76],
        [50, 76],
        [48, 74],
      ]),
      75,
    ),
  );
  cm.region(
    'water',
    octo('pond', [
      [30, 60],
      [32, 60],
      [33, 61],
      [33, 63],
      [32, 64],
      [30, 64],
      [29, 63],
      [29, 61],
    ]),
  );
  cm.region(
    'forest',
    roughen(
      octo('hillwood', [
        [44, 20],
        [50, 20],
        [52, 22],
        [52, 26],
        [44, 26],
      ]),
      77,
    ),
  );

  // ---- Far Putoff
  // Mount Putoff and its range; the Gloomwood round Deadline Keep
  cm.region(
    'rock',
    roughen(
      octo('putoff', [
        [70, 16],
        [86, 16],
        [88, 18],
        [88, 34],
        [84, 38],
        [76, 38],
        [72, 34],
        [70, 34],
      ]),
      29,
    ),
  );
  cm.region(
    'forest',
    roughen(
      octo('gloom', [
        [70, 66],
        [78, 66],
        [82, 70],
        [86, 70],
        [86, 88],
        [72, 88],
        [68, 84],
        [68, 68],
      ]),
      603,
    ),
  );
  cm.region(
    'forest',
    roughen(
      octo('eastwood', [
        [80, 44],
        [88, 44],
        [90, 46],
        [90, 56],
        [86, 60],
        [80, 54],
      ]),
      541,
    ),
  );
  // the Eventually Falls river from the mountain to the sea
  cm.path('water', [
    [80, 38],
    [80, 46],
    [76, 50],
    [76, 60],
    [72, 64],
    [66, 64],
  ]);
  cm.path('road', [
    [71, 50],
    [74, 50],
    [74, 56],
    [80, 56],
    [80, 59],
  ]);
  cm.path('road', [
    [78, 63],
    [78, 66],
    [80, 68],
    [80, 78],
    [76, 78],
  ]);
  cm.path('road', [
    [74, 50],
    [74, 44],
    [78, 40],
  ]);

  // trails into the woods: to Teddy's clearing in the Whistling Woods, to the Gloomwood glade
  cm.path('road', [
    [40, 42],
    [47, 42],
    [49, 44],
  ]);
  cm.path('road', [
    [76, 70],
    [80, 74],
    [82, 74],
  ]);
  separate(cm);
  // the clearings themselves
  cm.clear('forest', (x, y) => Math.hypot(x - 50, y - 44) < 3.2 || Math.hypot(x - 83, y - 75) < 3.2);
  const stamps: WorldPlan['stamps'] = [];
  const spot: Record<string, Pt> = {};
  const stamp = (name: string, x: number, y: number, w: number, h: number, keep = false) => {
    stamps.push({ name, x, y, w, h });
    if (keep) return;
    // keep the ground under a stamp plain: no layer corners inside it or on its rim
    for (const l of ['water', 'rock', 'forest', 'road']) for (let yy = y; yy <= y + h; yy++) for (let xx = x; xx <= x + w; xx++) cm.setv(l, xx, yy, 0);
  };
  stamp('nowish', 21, 80, 2, 2);
  spot.nowish = [22, 81];
  stamp('laterburg', 30, 43, 3, 3);
  spot.laterburg = [31, 45];
  stamp('harbor', 13, 46, 3, 2);
  spot.harbor = [14, 47];
  stamp('falls', 79, 60, 2, 2);
  spot.falls = [80, 61];
  stamp('keep', 75, 74, 3, 3);
  spot.keep = [76, 76];
  stamp('post', 69, 49, 2, 1);
  spot.post = [69, 49];
  // the Snooze Barrows: a cave in the cliff at the end of the north road
  stamp('cave', 40, 24, 1, 1, true);
  spot.barrows = [40, 24];
  // where the royal hounds and Sir Reginald are found
  spot.teddy = [50, 44];
  spot.gwinn = [15, 61];
  spot.chick = [84, 75];
  // the Putoff Mines: an adit in Mount Putoff's south cliff, at the end of the north road
  stamp('mine', 78, 38, 1, 1, true);
  spot.mines = [78, 38];
  void [N, cellHash];
  return { cm, stamps, spot };
}

/** Keeps layers a corner apart so no block mixes two of them (roads cross water on bridges). */
function separate(cm: CornerMap): void {
  const near = (l: string, x: number, y: number) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (cm.in(l, x + dx, y + dy)) return true;
    return false;
  };
  const order: [string, string[]][] = [
    ['rock', ['water', 'road']],
    ['forest', ['water', 'road', 'rock']],
  ];
  for (const [l, over] of order) cm.clear(l, (x, y) => cm.in(l, x, y) && over.some((o) => near(o, x, y)));
}
