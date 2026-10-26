// The dungeons' block sets: BARROWS.BBL, VAULTS.BBL, MINES.BBL and KEEP.BBL are one design
// painted in four materials (earth and roots; sea-green temple stone; timbered rock over lava;
// black brick and purple flags), so every block has the same number in all four and one map
// maker lays out any of them. Walls and pools are autotile families; the rest are the stairs,
// doors, chests, quest things and the gates.
import { ALL, BlockBook } from './book';
import { addFamily } from './autotiles';
import { Canvas, type RGB, mix, clamp01, tnoise, speck, smooth } from '../art/rgb';
import { shadow } from '../art/buildings';
import { type Shader } from '../art/terrain';
import { gate } from './town';
import { paintEgg } from '../art/egg';
import { C, BLK } from '../ids';

export type Theme = 'barrows' | 'vaults' | 'mines' | 'keep';

interface Mat {
  floor: [RGB, RGB];
  /** Floor pattern: 'dirt', 'flags' (big slabs) or 'brick'. */
  pattern: 'dirt' | 'flags' | 'gravel';
  wallTop: [RGB, RGB];
  face: [RGB, RGB];
  faceKind: 'earth' | 'brick' | 'rock';
  liquid: [RGB, RGB, RGB];
  glow?: boolean;
}

const MATS: Record<Theme, Mat> = {
  barrows: {
    floor: [
      [86, 70, 52],
      [120, 100, 74],
    ],
    pattern: 'dirt',
    wallTop: [
      [26, 20, 16],
      [44, 34, 26],
    ],
    face: [
      [120, 94, 66],
      [70, 54, 40],
    ],
    faceKind: 'earth',
    liquid: [
      [40, 60, 40],
      [70, 96, 60],
      [140, 170, 110],
    ],
  },
  vaults: {
    floor: [
      [64, 92, 96],
      [100, 132, 132],
    ],
    pattern: 'flags',
    wallTop: [
      [14, 30, 36],
      [26, 48, 54],
    ],
    face: [
      [90, 140, 140],
      [50, 90, 96],
    ],
    faceKind: 'brick',
    liquid: [
      [16, 60, 110],
      [40, 120, 160],
      [170, 230, 240],
    ],
  },
  mines: {
    floor: [
      [70, 62, 60],
      [104, 92, 86],
    ],
    pattern: 'gravel',
    wallTop: [
      [20, 16, 18],
      [36, 30, 30],
    ],
    face: [
      [120, 104, 96],
      [66, 56, 54],
    ],
    faceKind: 'rock',
    liquid: [
      [150, 30, 10],
      [240, 110, 20],
      [255, 230, 120],
    ],
    glow: true,
  },
  keep: {
    floor: [
      [56, 40, 70],
      [86, 66, 104],
    ],
    pattern: 'flags',
    wallTop: [
      [10, 6, 14],
      [24, 18, 30],
    ],
    face: [
      [90, 80, 110],
      [50, 44, 64],
    ],
    faceKind: 'brick',
    liquid: [
      [8, 4, 16],
      [36, 20, 60],
      [120, 60, 160],
    ],
  },
};

const bitsOf = (m: number) => [1, 2, 4, 8].filter((b) => m & b).length;

function floorOf(m: Mat): (x: number, y: number) => RGB {
  return (x, y) => {
    const n = tnoise(x, y, 5, 20, 3) * 0.6 + tnoise(x, y, 2.5, 20, 4) * 0.4;
    let c = mix(m.floor[0], m.floor[1], n);
    if (m.pattern === 'flags') {
      const fx = x % 10;
      const fy = (y + (Math.floor(x / 10) % 2) * 5) % 10;
      const slab = speck(Math.floor(x / 10), Math.floor((y + (Math.floor(x / 10) % 2) * 5) / 10), 2, 7);
      c = mix(c, mix(m.floor[0], m.floor[1], slab), 0.4);
      if (fx < 0.7 || fy < 0.7) c = mix(c, [0, 0, 0], 0.45);
      else if (fx < 1.5 || fy < 1.5) c = mix(c, [255, 255, 255], 0.08);
    } else if (m.pattern === 'gravel') {
      const s = speck(x, y, 20, 11);
      if (s > 0.85) c = mix(c, [160, 150, 140], 0.5);
      else if (s < 0.12) c = mix(c, [30, 26, 26], 0.5);
    } else {
      const s = speck(x, y, 20, 12);
      if (s > 0.92) c = mix(c, [150, 130, 100], 0.5);
      if (tnoise(x * 2, y, 2.5, 20, 13) > 0.82) c = mix(c, [60, 44, 30], 0.5);
    }
    return c;
  };
}

/** Walls: the top dark (seen from above), a lit face where the wall looks south, a shadow on the floor. */
function wallShader(m: Mat, floor: (x: number, y: number) => RGB): Shader {
  return (x, y, d, _nx, ny) => {
    const face = clamp01(ny * 1.4 - 0.15);
    const faceH = 10 * face;
    if (d > 0) {
      if (d < faceH) {
        const t = d / Math.max(1, faceH);
        let c = mix(m.face[0], m.face[1], t);
        if (m.faceKind === 'brick') {
          const row = Math.floor(y / 3.3);
          const off = (row % 2) * 3;
          if (y % 3.3 < 0.7 || (x + off) % 6 < 0.7) c = mix(c, [0, 0, 0], 0.5);
        } else if (m.faceKind === 'rock') {
          c = mix(c, [0, 0, 0], tnoise(x * 2, y * 0.5, 2.5, 20, 21) * 0.4);
        } else {
          c = mix(c, [40, 28, 18], tnoise(x * 3, y * 0.4, 2.5, 20, 22) * 0.35);
          if (speck(x, Math.floor(y / 3), 20, 23) > 0.9) c = [150, 120, 80];
        }
        return c;
      }
      const sh = (1 - smooth(faceH, faceH + 5, d)) * Math.max(face, 0.35);
      return mix(floor(x, y), [0, 0, 0], sh * 0.6);
    }
    const rim = 1 - smooth(0, 2, -d);
    const n = tnoise(x, y, 5, 20, 31) * 0.5 + tnoise(x, y, 2.5, 20, 32) * 0.5;
    return mix(mix(m.wallTop[0], m.wallTop[1], n), m.face[0], rim * 0.5);
  };
}

/** Pools: water, lava or the void, with a lip of the floor round them. */
function liquidShader(m: Mat, floor: (x: number, y: number) => RGB): Shader {
  return (x, y, d) => {
    if (d > 2) return floor(x, y);
    if (d > 0) return mix(floor(x, y), [0, 0, 0], 0.5 * (1 - d / 2));
    const depth = clamp01(-d / 8);
    const rip = tnoise(x, y, 5, 20, 41) * 0.6 + tnoise(x, y, 2.5, 20, 42) * 0.4;
    let c = mix(m.liquid[1], m.liquid[0], depth);
    if (rip > 0.72) c = mix(c, m.liquid[2], (rip - 0.72) * 2.5);
    if (-d < 1.2) c = mix(c, m.liquid[2], 0.5);
    return c;
  };
}

export function dungeonBook(theme: Theme): BlockBook {
  const m = MATS[theme];
  const floor = floorOf(m);
  const book = new BlockBook(theme, { [BLK.egg]: 'egg' });
  const onFloor = () => new Canvas(20, 20).shade((x, y) => floor(x, y), 2);
  book.add('floor', onFloor());
  book.add(
    'floor1',
    new Canvas(20, 20).shade((x, y) => (Math.min(x, y, 20 - x, 20 - y) > 4 ? mix(floor(x, y), [0, 0, 0], tnoise(x, y, 5, 20, 51) * 0.25) : floor(x, y)), 2),
  );
  book.add('floor2', decorate(onFloor(), theme));
  addFamily(book, {
    layer: 'wall',
    shader: wallShader(m, floor),
    rough: theme === 'barrows' || theme === 'mines' ? 1.6 : 0.4,
    seed: 61,
    attrs: (k) => (bitsOf(k) >= 2 ? { solid: ALL } : {}),
  });
  addFamily(book, {
    layer: 'pool',
    shader: liquidShader(m, floor),
    rough: 0.8,
    seed: 63,
    attrs: (k) => (bitsOf(k) >= 2 ? { solid: ALL, ...(theme === 'mines' ? { hp: -4 } : {}) } : {}),
  });
  // stairs up (the way out), and a lit torch, a pillar, rubble
  book.add('stairs', stairs(onFloor(), m));
  book.add('torch', torch(onFloor(), m), { solid: ALL });
  book.add('pillar', pillar(onFloor(), m), { solid: ALL });
  book.add('rubble', rubble(onFloor(), m), { solid: ALL });
  // chests: touch to open (gold), then they stay open
  book.add('chest', chest(onFloor(), false), { solid: ALL, effect: C.money, eamt: 25, score: 100, touch: 'chestOpen' });
  book.add('bigchest', chest(onFloor(), false, true), { solid: ALL, effect: C.money, eamt: 75, score: 300, touch: 'chestOpen' });
  book.add('chestOpen', chest(onFloor(), true), { solid: ALL });
  book.add('heartpot', pot(onFloor()), { solid: ALL, hp: 30, touch: 'potBroken' });
  book.add('potBroken', potBroken(onFloor()), {});
  // spikes: they hurt every step
  book.add('spikes', spikes(onFloor()), { hp: -3 });
  // currents and drafts: blocks that push (gravity), one per direction
  for (const [name, g, a] of [
    ['pushN', 1, -Math.PI / 2],
    ['pushE', 2, 0],
    ['pushS', 4, Math.PI / 2],
    ['pushW', 8, Math.PI],
  ] as [string, number, number][])
    book.add(name, arrows(onFloor(), a, m), { grav: g });
  // quest things lying on the floor: walk over to take
  book.add('foghorn', item(onFloor(), 'horn'), { effect: C.fog, eamt: 1, score: 500, touch: 'floor' });
  book.add('tome', item(onFloor(), 'tome'), { effect: C.book, eamt: 1, score: 500, touch: 'floor' });
  // the pieces of the Round Tuit on their pedestal: step on to take (the link there plays the find)
  for (const [k, cnt] of [
    [1, C.p1],
    [2, C.p2],
    [3, C.p3],
  ] as const)
    book.add(`piece${k}`, piece(onFloor(), k), { effect: cnt, eamt: 1, score: 2500 });
  // gates: the Royal Writ seals the Barrows, the Mines want a lamp, the Keep wants all three pieces
  gate(book, 'writdoor', C.writ, 1, door(onFloor(), m, 'seal'), stairsOpen(onFloor()), true);
  gate(book, 'lampdoor', C.lamp, 1, door(onFloor(), m, 'dark'), stairsOpen(onFloor()), true);
  for (const [k, cnt] of [
    [1, C.p1],
    [2, C.p2],
    [3, C.p3],
  ] as const)
    gate(book, `socket${k}`, cnt, 1, socket(onFloor(), k, false), socket(onFloor(), k, true), true);
  // the Round Tuit itself, whole again, in Deadline Keep
  book.add('tuit', tuitBlock(onFloor()), { score: 10000 });
  // birth blocks: hidden vents that let out a foe now and then (the monster is set per dungeon)
  book.add('vent', vent(onFloor(), m), { birthMon: 0, birthTime: 0 });
  book.add('egg', eggOn(onFloor()), { obj: 1, effect: C.egg, eamt: 1 });
  return book;
}

function decorate(cv: Canvas, theme: Theme): Canvas {
  if (theme === 'barrows') {
    for (let k = 0; k < 3; k++) cv.line(3 + k * 5, 4 + k * 4, 9 + k * 3, 8 + k * 5, 0.8, [70, 50, 30]);
    cv.disc(14, 6, 1.4, [200, 196, 170]);
  } else if (theme === 'vaults') {
    cv.ellipse(10, 12, 5, 2.5, [40, 80, 90]);
    cv.disc(6, 6, 1, [210, 180, 160]);
  } else if (theme === 'mines') {
    cv.line(2, 7, 18, 7, 1, [90, 70, 50]).line(2, 13, 18, 13, 1, [90, 70, 50]);
    for (let x = 1; x < 20; x += 4) cv.rect(x, 6, 2, 8, [110, 84, 56]);
  } else {
    cv.rect(4, 0, 12, 20, (x, y) => mix([120, 20, 40], [80, 10, 30], tnoise(x, y, 2.5, 20, 3)));
    cv.rect(4, 0, 1, 20, [200, 160, 60]).rect(15, 0, 1, 20, [200, 160, 60]);
  }
  return cv;
}

function stairs(cv: Canvas, m: Mat): Canvas {
  for (let k = 0; k < 5; k++) cv.rect(3, 2 + k * 3.4, 14, 3, mix(m.face[0], [0, 0, 0], k * 0.15));
  cv.rect(2, 1, 1.2, 18, m.wallTop[1]).rect(16.8, 1, 1.2, 18, m.wallTop[1]);
  return cv;
}

function stairsOpen(cv: Canvas): Canvas {
  return cv;
}

function torch(cv: Canvas, m: Mat): Canvas {
  cv.disc(10, 7, 7, (x, y) => mix(cv.get(Math.floor(x), Math.floor(y)), [255, 200, 90], 0.4 * clamp01(1 - Math.hypot(x - 10, y - 7) / 7)));
  cv.rect(9, 9, 2, 9, [90, 60, 36]);
  cv.ellipse(10, 18, 3, 1, m.wallTop[0]);
  cv.ellipse(10, 6.5, 2.2, 3.4, [255, 140, 40]);
  cv.ellipse(10, 7.5, 1.2, 2, [255, 236, 140]);
  return cv;
}

function pillar(cv: Canvas, m: Mat): Canvas {
  shadow(cv, 4, 4, 12, 15);
  cv.rect(5, 3, 10, 15, (x) => mix(m.face[0], m.face[1], clamp01((x - 5) / 10)));
  cv.rect(4, 1, 12, 3, m.face[0]);
  cv.rect(4, 17, 12, 2, m.face[1]);
  return cv;
}

function rubble(cv: Canvas, m: Mat): Canvas {
  for (const [x, y, r] of [
    [6, 12, 4],
    [13, 9, 3.5],
    [12, 15, 3],
    [5, 6, 2.5],
  ]) {
    cv.disc(x + 0.8, y + 1, r, [0, 0, 0]);
    cv.disc(x, y, r, (px, py) => mix(m.face[0], m.face[1], clamp01((px - x + py - y) / (r * 2) + 0.5)));
  }
  return cv;
}

function chest(cv: Canvas, open: boolean, big = false): Canvas {
  shadow(cv, 3, 6, 15, 12);
  const gold: RGB = [230, 190, 70];
  const wood: RGB = big ? [120, 40, 40] : [140, 90, 46];
  cv.rect(3, 9, 14, 9, (_x, y) => mix(wood, [60, 36, 20], (y - 9) / 14));
  cv.rect(3, 9, 14, 1, gold).rect(3, 17, 14, 1, gold).rect(9, 9, 2, 9, gold);
  if (open) {
    cv.rect(3, 4, 14, 5, [40, 24, 16]);
    cv.rect(4, 7, 12, 2, [20, 14, 10]);
  } else {
    cv.rrect(3, 4, 14, 6, 2, (_x, y) => mix(mix(wood, [255, 255, 255], 0.2), wood, (y - 4) / 6));
    cv.rect(9, 7, 2, 4, gold);
  }
  return cv;
}

function pot(cv: Canvas): Canvas {
  shadow(cv, 5, 6, 10, 12);
  cv.ellipse(10, 12, 5.5, 6, (x, y) => mix([200, 120, 80], [120, 60, 40], clamp01((x - 4) / 12 + (y - 6) / 30)));
  cv.ellipse(10, 6, 3.5, 1.5, [90, 40, 30]);
  cv.disc(10, 12, 2, [230, 60, 70]);
  return cv;
}

function potBroken(cv: Canvas): Canvas {
  for (const [x, y] of [
    [6, 13],
    [12, 14],
    [9, 10],
  ])
    cv.poly(
      [
        [x, y],
        [x + 3, y - 1],
        [x + 2, y + 2],
      ],
      [170, 96, 64],
    );
  return cv;
}

function spikes(cv: Canvas): Canvas {
  for (let r = 0; r < 3; r++)
    for (let k = 0; k < 3; k++) {
      const x = 3.5 + k * 6 + (r % 2) * 2;
      const y = 5 + r * 5.5;
      cv.poly(
        [
          [x - 2, y + 2.5],
          [x, y - 2.5],
          [x + 2, y + 2.5],
        ],
        (px) => mix([230, 232, 240], [110, 114, 130], clamp01((px - x + 2) / 4)),
      );
    }
  return cv;
}

function arrows(cv: Canvas, a: number, m: Mat): Canvas {
  const c = mix(m.liquid[2], [255, 255, 255], 0.3);
  for (const off of [-5, 3]) {
    const cx = 10 + Math.cos(a) * off;
    const cy = 10 + Math.sin(a) * off;
    const pts: [number, number][] = [
      [cx + Math.cos(a) * 3.5, cy + Math.sin(a) * 3.5],
      [cx + Math.cos(a + 2.4) * 3.5, cy + Math.sin(a + 2.4) * 3.5],
      [cx + Math.cos(a - 2.4) * 3.5, cy + Math.sin(a - 2.4) * 3.5],
    ];
    cv.poly(pts, mix(c, cv.get(Math.round(cx), Math.round(cy)), 0.35));
  }
  return cv;
}

function item(cv: Canvas, what: 'horn' | 'tome'): Canvas {
  cv.disc(10, 10, 8, (x, y) => mix(cv.get(Math.floor(x), Math.floor(y)), [255, 236, 160], 0.35 * clamp01(1 - Math.hypot(x - 10, y - 10) / 8)));
  if (what === 'horn') {
    cv.poly(
      [
        [4, 9],
        [14, 5],
        [17, 3],
        [17, 15],
        [14, 13],
        [4, 11],
      ],
      (x) => mix([150, 110, 40], [240, 200, 90], clamp01((x - 4) / 13)),
    );
    cv.ellipse(17, 9, 1.4, 6, [80, 60, 20]);
    cv.rect(3, 9, 2, 2, [80, 60, 20]);
  } else {
    shadow(cv, 4, 5, 13, 11);
    cv.rect(4, 4, 13, 11, [40, 30, 90]);
    cv.rect(5, 5, 11, 9, [70, 60, 140]);
    cv.rect(6, 5, 1, 9, [220, 190, 80]);
    cv.disc(11, 9, 2, [230, 200, 90]);
  }
  return cv;
}

/** A third of the Round Tuit: a wedge of old oak with brass edging, glowing on a little plinth. */
function piece(cv: Canvas, k: number): Canvas {
  cv.disc(10, 10, 9, (x, y) => mix(cv.get(Math.floor(x), Math.floor(y)), [255, 236, 150], 0.55 * clamp01(1 - Math.hypot(x - 10, y - 10) / 9)));
  cv.rect(5, 14, 10, 4, [180, 170, 160]);
  const a0 = (k - 1) * ((Math.PI * 2) / 3) - Math.PI / 2 - Math.PI / 3;
  const pts: [number, number][] = [[10, 9]];
  for (let i = 0; i <= 6; i++) {
    const a = a0 + (i / 6) * ((Math.PI * 2) / 3);
    pts.push([10 + Math.cos(a) * 7, 9 + Math.sin(a) * 7]);
  }
  cv.poly(pts, (x, y) => mix([200, 140, 70], [120, 76, 36], clamp01((x - 4) / 14 + (y - 3) / 20)));
  cv.line(pts[1][0], pts[1][1], pts[7][0], pts[7][1], 0.1, [0, 0, 0]);
  return cv;
}

function door(cv: Canvas, m: Mat, kind: 'seal' | 'dark'): Canvas {
  cv.rect(1, 0, 18, 20, (x, y) => mix(m.face[0], m.face[1], clamp01(y / 30 + tnoise(x, y, 2.5, 20, 5) * 0.2)));
  cv.rrect(4, 4, 12, 16, 5, kind === 'dark' ? [10, 8, 10] : [100, 60, 30]);
  if (kind === 'seal') {
    cv.disc(10, 12, 3.5, [190, 30, 30]);
    cv.disc(10, 12, 2, [230, 70, 60]);
    cv.line(4, 9, 16, 9, 0.8, [230, 200, 120]);
  } else {
    cv.disc(7, 11, 0.9, [255, 230, 120]);
    cv.disc(12, 11, 0.9, [255, 230, 120]);
  }
  return cv;
}

function socket(cv: Canvas, k: number, lit: boolean): Canvas {
  shadow(cv, 3, 3, 14, 15);
  cv.rrect(3, 2, 14, 15, 2, [70, 60, 80]);
  cv.disc(10, 9, 5, lit ? [255, 220, 120] : [20, 14, 26]);
  const a0 = (k - 1) * ((Math.PI * 2) / 3) - Math.PI / 2 - Math.PI / 3;
  const pts: [number, number][] = [[10, 9]];
  for (let i = 0; i <= 6; i++) pts.push([10 + Math.cos(a0 + (i / 6) * 2.094) * 4.5, 9 + Math.sin(a0 + (i / 6) * 2.094) * 4.5]);
  cv.poly(pts, lit ? [170, 110, 50] : [50, 40, 60]);
  return cv;
}

function tuitBlock(cv: Canvas): Canvas {
  cv.disc(10, 10, 10, (x, y) => mix(cv.get(Math.floor(x), Math.floor(y)), [255, 240, 170], 0.7 * clamp01(1 - Math.hypot(x - 10, y - 10) / 10)));
  cv.disc(10, 9, 7, (x, y) => mix([210, 150, 80], [130, 80, 40], clamp01((x - 3) / 14 + (y - 2) / 20)));
  cv.disc(10, 9, 5.6, [190, 130, 64]);
  // T U I T carved round it
  cv.rect(7, 6, 6, 1.2, [80, 48, 20]).rect(9.4, 6, 1.2, 6, [80, 48, 20]);
  return cv;
}

function vent(cv: Canvas, m: Mat): Canvas {
  cv.ellipse(10, 11, 6, 4, mix(m.floor[0], [0, 0, 0], 0.5));
  cv.ellipse(10, 11, 4, 2.5, [0, 0, 0]);
  return cv;
}

function eggOn(cv: Canvas): Canvas {
  paintEgg(cv, 10, 10, 15);
  return cv;
}
