// The title looks of the Starters' groups (web/src/project/starter.ts STARTER_GROUPS): each group's
// titles share a sky, lettering colors and frame, so a player can tell by the picture roughly how
// much game making a Starter asks. 'meadow' (The Basics) is the sunny scene in screens.ts and is not
// drawn here. Every look uses only the Starter palette's ramps, so any Starter can wear any of them.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { gradient, pool } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Pal } from './palette';

/** The group looks: meadow (The Basics), sunset (Moving and Pushing), breeze (Worlds That Push Back), dressing (Changing Your Hero), arena (Foes and Bosses), circuit (Wiring and Puzzles), stage (Telling a Story), workbench (Putting It Together), atlas (Bigger Worlds), neon (Showcase Tricks). */
export type GroupStyle = 'meadow' | 'sunset' | 'breeze' | 'dressing' | 'arena' | 'circuit' | 'stage' | 'workbench' | 'atlas' | 'neon';

/** Where the hero and door stand on the title. */
const GROUND = 160;
const W = 320;
const H = 200;

/** What a look changes besides the picture behind: the lettering, the tagline ribbon and the hero's shadow. */
export interface Look {
  fill: number;
  outline: number;
  shadow: number;
  /** The tagline ribbon's ramp name, its text color and the hero's shadow on the floor. */
  ribbon: string;
  ribbonText: number;
  floorShadow: number;
}

/** The sky, ground and frame of a non-meadow look, drawn behind the hero and door. */
export function backdrop(pal: Pal, style: Exclude<GroupStyle, 'meadow'>): Pixels {
  const p = new Pixels(W, H);
  ({ sunset, breeze, dressing, arena, circuit, stage, workbench, atlas, neon })[style](p, pal);
  return p;
}

/** The lettering and ribbon colors of a look. */
export function lookOf(pal: Pal, style: Exclude<GroupStyle, 'meadow'>): Look {
  const c = pal.c;
  return {
    sunset: { fill: c('gold', 5), outline: c('purple', 0), shadow: c('purple', 1), ribbon: 'parch', ribbonText: c('purple', 0), floorShadow: c('purple', 0) },
    breeze: { fill: c('white', 3), outline: c('teal', 0), shadow: c('blue', 0), ribbon: 'parch', ribbonText: c('teal', 0), floorShadow: c('blue', 0) },
    dressing: { fill: c('gold', 5), outline: c('purple', 0), shadow: c('ink', 0), ribbon: 'parch', ribbonText: c('purple', 0), floorShadow: c('wood', 0) },
    arena: { fill: c('gold', 5), outline: c('red', 0), shadow: c('ink', 0), ribbon: 'parch', ribbonText: c('red', 0), floorShadow: c('wood', 0) },
    circuit: { fill: c('gold', 5), outline: c('green', 0), shadow: c('ink', 0), ribbon: 'parch', ribbonText: c('green', 0), floorShadow: c('green', 0) },
    stage: { fill: c('gold', 4), outline: c('red', 0), shadow: c('ink', 0), ribbon: 'parch', ribbonText: c('red', 0), floorShadow: c('wood', 0) },
    workbench: { fill: c('white', 3), outline: c('blue', 0), shadow: c('ink', 0), ribbon: 'parch', ribbonText: c('blue', 0), floorShadow: c('wood', 0) },
    atlas: { fill: c('red', 3), outline: c('wood', 0), shadow: c('wood', 2), ribbon: 'wood', ribbonText: c('parch', 5), floorShadow: c('wood', 0) },
    neon: { fill: c('teal', 4), outline: c('purple', 1), shadow: c('pink', 2), ribbon: 'stone', ribbonText: c('white', 3), floorShadow: c('ink', 0) },
  }[style];
}

/** The frame around the whole picture, drawn last. */
export function frameOf(p: Pixels, pal: Pal, style: Exclude<GroupStyle, 'meadow'>): void {
  const c = pal.c;
  const border = (n: number, col: number, inset = 0) => {
    for (let i = 0; i < n; i++) p.frame(inset + i, inset + i, W - 2 * (inset + i), H - 2 * (inset + i), col);
  };
  if (style === 'sunset') {
    border(4, c('orange', 3));
    border(1, c('gold', 5), 4);
    border(1, c('purple', 0), 0);
  } else if (style === 'breeze') {
    border(4, c('teal', 2));
    border(1, c('white', 3), 4);
    border(1, c('teal', 0), 0);
  } else if (style === 'dressing') {
    border(4, c('purple', 2));
    border(1, c('gold', 4), 4);
    border(1, c('purple', 0), 0);
  } else if (style === 'arena') {
    border(4, c('gold', 3));
    border(1, c('gold', 5), 4);
    border(1, c('red', 0), 0);
  } else if (style === 'circuit') {
    border(4, c('green', 1));
    border(1, c('gold', 3), 4);
    border(1, c('green', 0), 0);
  } else if (style === 'stage') {
    border(4, c('wood', 2));
    border(1, c('gold', 4), 4);
    border(1, c('wood', 0), 0);
  } else if (style === 'workbench') {
    border(5, c('stone', 3));
    border(1, c('stone', 1), 5);
    border(1, c('stone', 0), 0);
  } else if (style === 'atlas') {
    border(4, c('wood', 2));
    border(1, c('parch', 4), 4);
    border(1, c('wood', 0), 0);
  } else {
    border(2, c('teal', 3), 2);
    border(1, c('teal', 4), 3);
    border(2, c('pink', 2), 6);
  }
}

/** A sky going from purple through pink to orange, a low sun, long streaks of cloud and dark hills. */
function sunset(p: Pixels, pal: Pal): void {
  const c = pal.c;
  gradient(p, 0, 0, W, 60, pal.r('purple'), 0, 3, true);
  gradient(p, 0, 60, W, 50, pal.r('pink'), 0, 3, true);
  gradient(p, 0, 110, W, 50, pal.r('orange'), 1, 4, true);
  const rand = rng(5);
  for (let i = 0; i < 18; i++) p.set(Math.floor(rand() * W), Math.floor(rand() * 40), c('white', 3));
  p.disc(228, 140, 34, c('gold', 3)).disc(228, 140, 28, c('gold', 4));
  for (let y = 126; y < 160; y += 5) p.rect(190, y, 76, 1 + Math.floor((y - 126) / 9), c('orange', 3));
  for (const [x, y, w] of [
    [20, 66, 70],
    [120, 84, 90],
    [40, 100, 110],
    [210, 72, 80],
  ])
    p.rect(x, y, w, 2, c('pink', 3)).rect(x + 10, y + 2, w - 24, 1, c('orange', 4));
  for (let x = 0; x < W; x++) {
    const far = GROUND - 22 - Math.round(Math.sin(x / 38 + 2) * 12 + Math.sin(x / 11) * 3);
    p.rect(x, far, 1, GROUND - far, c('purple', 1));
    p.set(x, far, c('orange', 2));
  }
  p.rect(0, GROUND, W, H - GROUND, c('purple', 0));
  p.rect(0, GROUND, W, 2, c('orange', 2));
  for (let x = 0; x < W; x += 20) p.rect(x, GROUND + 18, 10, 2, c('purple', 1));
}

/** A windy day: a pale teal sky with streaks of wind, leaves drifting across it, and a wavy blue water line along the bottom. */
function breeze(p: Pixels, pal: Pal): void {
  const c = pal.c;
  gradient(p, 0, 0, W, GROUND + 4, pal.r('teal'), 2, 4, true);
  const rand = rng(11);
  // long curved streaks of wind
  for (const [x, y, w] of [
    [16, 40, 90],
    [150, 28, 110],
    [200, 78, 100],
    [30, 92, 80],
  ])
    for (let i = 0; i < w; i++) p.set(x + i, y + Math.round(Math.sin(i / 12) * 3), c('white', 3));
  // leaves, each tilted a little, with a short stem
  const leaves: [number, number, 'green' | 'gold' | 'orange'][] = [
    [40, 60, 'green'],
    [96, 112, 'gold'],
    [150, 52, 'orange'],
    [238, 100, 'green'],
    [280, 44, 'gold'],
    [60, 130, 'orange'],
    [200, 130, 'gold'],
    [300, 120, 'green'],
  ];
  for (const [x, y, col] of leaves) {
    const tilt = rand() < 0.5 ? 1 : -1;
    for (let k = -4; k <= 4; k++)
      p.rect(
        x + k,
        y + Math.round((k * tilt) / 2) - Math.round(2 - Math.abs(k) / 2),
        1,
        1 + Math.round(3 - Math.abs(k) / 1.5),
        c(col, col === 'green' ? 3 : 4),
      );
    p.line(x - 5, y - Math.round((5 * tilt) / 2), x + 5, y + Math.round((5 * tilt) / 2), c(col, 1));
  }
  // the water: a blue band whose top edge waves, with a white crest
  for (let x = 0; x < W; x++) {
    const top = GROUND + Math.round(Math.sin(x / 9) * 2);
    p.rect(x, top, 1, H - top, c('blue', 3));
    p.set(x, top, c('white', 3));
    p.set(x, top + 1, c('blue', 4));
  }
  for (let y = GROUND + 12; y < H; y += 10) for (let x = ((y / 10) % 2) * 12; x < W; x += 24) p.rect(x, y, 8, 1, c('blue', 4));
  p.rect(0, GROUND + 32, W, H - GROUND - 32, c('blue', 2));
}

/** A dressing room: a purple wall with faint stripes, a mirror in a gold frame, a short rail of hooks with scarves, and wooden floorboards. */
function dressing(p: Pixels, pal: Pal): void {
  const c = pal.c;
  gradient(p, 0, 0, W, GROUND, pal.r('purple'), 1, 3, true);
  for (let x = 0; x < W; x += 24) p.rect(x, 0, 6, GROUND, c('purple', 2));
  // the mirror: an oval of pale glass in a gold frame, with two glints
  const mx = 56;
  const my = 102;
  for (let y = -38; y <= 38; y++) {
    const half = Math.round(26 * Math.sqrt(1 - (y * y) / 1444));
    p.rect(mx - half - 4, my + y, 2 * half + 8, 1, c('gold', 3));
    p.rect(mx - half, my + y, 2 * half, 1, c('blue', 4));
  }
  p.line(mx - 14, my - 22, mx - 6, my - 32, c('white', 3)).line(mx - 18, my - 18, mx - 8, my - 30, c('white', 3));
  // a rail of hooks across the right side, three with scarves
  p.rect(106, 94, 124, 5, c('wood', 2)).rect(106, 94, 124, 1, c('wood', 4));
  const scarf = ['red', 'teal', 'pink'] as const;
  for (let i = 0; i < 5; i++) {
    const x = 116 + i * 26;
    p.rect(x, 99, 2, 5, c('gold', 4)).rect(x, 104, 6, 2, c('gold', 4));
    if (i % 2 === 0) {
      const col = scarf[i / 2];
      const len = 24 + i * 3;
      p.rect(x - 4, 106, 14, len, c(col, 3))
        .rect(x - 4, 106, 3, len, c(col, 4))
        .rect(x - 4, 106 + Math.round(len / 2), 14, 3, c('white', 3));
      for (let f = 0; f < 14; f += 3) p.rect(x - 4 + f, 106 + len, 2, 3, c(col, 2));
    }
  }
  // wooden floorboards
  p.rect(0, GROUND, W, H - GROUND, c('wood', 2));
  for (let y = GROUND; y < H; y += 8) p.rect(0, y, W, 1, c('wood', 1));
  p.rect(0, GROUND, W, 2, c('wood', 4));
}

/** A ring with banners: a red wall with gold pennants and a string of bunting, and a sandy floor inside a gold oval. Bright and cheerful. */
function arena(p: Pixels, pal: Pal): void {
  const c = pal.c;
  gradient(p, 0, 0, W, GROUND, pal.r('red'), 1, 3, true);
  pool(p, 160, 70, 150, 70, pal.r('red'), 3, 4);
  // bunting: a string sagging between the corners, hung with little gold, white and teal flags
  const sag = (x: number) => 10 + Math.round(Math.sin((x / W) * Math.PI) * 14);
  for (let x = 0; x < W; x++) p.set(x, sag(x), c('ink', 0));
  const flags = ['gold', 'white', 'teal'] as const;
  for (let x = 8, i = 0; x < W - 6; x += 14, i++) {
    const col = flags[i % 3];
    const y = sag(x) + 1;
    for (let k = 0; k < 8; k++) p.rect(x - Math.floor((8 - k) / 2), y + k, 8 - k, 1, c(col, col === 'white' ? 3 : 4));
  }
  // two tall pennant banners with a swallowtail, left and right
  for (const bx of [26, W - 48]) {
    p.rect(bx, 40, 22, 62, c('gold', 4))
      .rect(bx, 40, 22, 4, c('gold', 5))
      .rect(bx + 9, 44, 4, 56, c('red', 2));
    for (let k = 0; k < 11; k++) p.rect(bx + k, 102 + k, 1, 1, c('gold', 4)).rect(bx + 21 - k, 102 + k, 1, 1, c('gold', 4));
    p.rect(bx + 10, 102, 2, 11, c('gold', 4)).rect(bx + 10, 102, 2, 1, c('gold', 4));
    p.rect(bx - 1, 38, 24, 2, c('wood', 1))
      .disc(bx - 1, 39, 2, c('gold', 5))
      .disc(bx + 22, 39, 2, c('gold', 5));
  }
  // the sandy floor, with a gold oval drawn on it
  p.rect(0, GROUND, W, H - GROUND, c('parch', 3));
  for (let y = GROUND; y < H; y += 6) p.rect(0, y, W, 1, c('parch', 2));
  for (let a = 0; a < 720; a++) {
    const t = (a / 720) * Math.PI * 2;
    const x = Math.round(160 + Math.cos(t) * 138);
    const y = Math.round(GROUND + 22 + Math.sin(t) * 16);
    if (y >= GROUND && y < H - 2) p.set(x, y, c('gold', 3)).set(x, y + 1, c('gold', 3));
  }
  p.rect(0, GROUND, W, 2, c('red', 0));
}

/** A green circuit board: copper traces with square turns, round solder pads and little black chips with pins, over a darker board floor. */
function circuit(p: Pixels, pal: Pal): void {
  const c = pal.c;
  gradient(p, 0, 0, W, GROUND, pal.r('green'), 0, 2, true);
  const copper = c('gold', 3);
  const shine = c('gold', 4);
  const pad = (x: number, y: number) => p.disc(x, y, 3, copper).disc(x, y, 1, c('green', 0));
  // traces: a long run with square turns, ending in pads
  const runs: [number, number, number, number][] = [
    [8, 84, 70, 84],
    [70, 84, 70, 100],
    [70, 100, 130, 100],
    [190, 96, 250, 96],
    [250, 96, 250, 80],
    [250, 80, 312, 80],
    [20, 122, 20, 146],
    [20, 122, 60, 122],
    [270, 118, 270, 146],
    [236, 118, 270, 118],
  ];
  for (const [x1, y1, x2, y2] of runs) {
    p.rect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1) + 2, Math.abs(y2 - y1) + 2, copper);
    p.rect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1) + 2, 1, shine);
  }
  for (const [x, y] of [
    [9, 85],
    [131, 101],
    [189, 97],
    [311, 81],
    [61, 123],
    [21, 147],
    [237, 119],
    [271, 147],
  ])
    pad(x, y);
  // two black chips with a row of pins either side
  for (const [cx, cy] of [
    [140, 112],
    [10, 50],
  ]) {
    p.rect(cx, cy, 44, 22, c('ink', 0)).rect(cx + 2, cy + 2, 40, 18, c('ink', 1));
    p.disc(cx + 6, cy + 6, 2, c('ink', 2));
    for (let i = 0; i < 6; i++) p.rect(cx + 5 + i * 7, cy - 3, 3, 3, copper).rect(cx + 5 + i * 7, cy + 22, 3, 3, copper);
  }
  // the board's floor: darker green with a copper edge
  p.rect(0, GROUND, W, H - GROUND, c('green', 1));
  p.rect(0, GROUND, W, 2, copper);
  for (let x = 6; x < W; x += 24) p.disc(x, GROUND + 14, 2, c('green', 0)).disc(x, GROUND + 14, 1, copper);
}

/** A theater: red curtains and a fringed valance, a spotlit back wall and a wooden stage. */
function stage(p: Pixels, pal: Pal): void {
  const c = pal.c;
  gradient(p, 0, 0, W, GROUND, pal.r('purple'), 0, 2, true);
  pool(p, 160, 150, 130, 70, pal.r('purple'), 2, 3);
  // wooden stage: planks running across, with their joints staggered
  p.rect(0, GROUND, W, H - GROUND, c('wood', 2));
  for (let y = GROUND; y < H; y += 8) {
    p.rect(0, y, W, 1, c('wood', 1));
    for (let x = ((y / 8) % 2) * 30; x < W; x += 60) p.rect(x, y, 1, 8, c('wood', 1));
  }
  p.rect(0, GROUND, W, 2, c('wood', 4));
  // curtains: folds of red, narrower toward the floor
  for (let y = 0; y < GROUND; y++) {
    const w = 30 + Math.round(16 * (1 - y / GROUND));
    for (let x = 0; x < w; x++) {
      const shade = 1 + Math.floor(1.5 + 1.5 * Math.sin(x * 0.75));
      p.set(x, y, c('red', shade));
      p.set(W - 1 - x, y, c('red', shade));
    }
    p.set(w, y, c('red', 0));
    p.set(W - 1 - w, y, c('red', 0));
  }
  // the valance with a gold fringe
  p.rect(0, 0, W, 9, c('red', 2)).rect(0, 7, W, 2, c('red', 1));
  for (let x = 4; x < W; x += 10) p.disc(x, 10, 3, c('gold', 3)).set(x - 1, 9, c('gold', 5));
}

/** A blueprint: a blue sheet with a grid and a gear drawn on it, over a wooden workbench. */
function workbench(p: Pixels, pal: Pal): void {
  const c = pal.c;
  p.rect(0, 0, W, GROUND, c('blue', 1));
  for (let x = 0; x < W; x += 16) p.rect(x, 0, 1, GROUND, c('blue', x % 80 === 0 ? 3 : 2));
  for (let y = 0; y < GROUND; y += 16) p.rect(0, y, W, 1, c('blue', y % 80 === 0 ? 3 : 2));
  // a gear in thin white lines, and a measuring line with ticks
  const gx = 214;
  const gy = 126;
  p.ring(gx, gy, 14, c('white', 2)).ring(gx, gy, 5, c('white', 2));
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    p.rect(Math.round(gx + Math.cos(a) * 16) - 1, Math.round(gy + Math.sin(a) * 16) - 1, 3, 3, c('white', 2));
  }
  p.rect(100, 126, 80, 1, c('white', 2));
  for (const x of [100, 120, 140, 160, 180]) p.rect(x, 123, 1, 7, c('white', 2));
  // the bench: a top, then the front with a drawer
  p.rect(0, GROUND, W, 8, c('wood', 3))
    .rect(0, GROUND, W, 2, c('wood', 4))
    .rect(0, GROUND + 8, W, H - GROUND - 8, c('wood', 1));
  p.rect(30, GROUND + 14, 100, 20, c('wood', 2))
    .frame(30, GROUND + 14, 100, 20, c('wood', 0))
    .rect(74, GROUND + 22, 12, 4, c('stone', 3));
  p.rect(190, GROUND + 14, 100, 20, c('wood', 2))
    .frame(190, GROUND + 14, 100, 20, c('wood', 0))
    .rect(234, GROUND + 22, 12, 4, c('stone', 3));
}

/** An old atlas: a sheet of parchment ruled in a faint grid, little drawn hills and a compass, over a wooden table. */
function atlas(p: Pixels, pal: Pal): void {
  const c = pal.c;
  gradient(p, 0, 0, W, GROUND, pal.r('parch'), 3, 5, true);
  for (let x = 16; x < W; x += 32) p.rect(x, 0, 1, GROUND, c('parch', 3));
  for (let y = 16; y < GROUND; y += 32) p.rect(0, y, W, 1, c('parch', 3));
  // hills sketched in ink-brown lines: a peak with a snowy line and a shadow side
  for (const [x, y, h] of [
    [106, 150, 18],
    [210, 150, 14],
    [296, 150, 20],
  ]) {
    p.line(x - h, y, x, y - h, c('wood', 0))
      .line(x, y - h, x + h, y, c('wood', 0))
      .line(x - h + 1, y, x, y - h + 1, c('wood', 0))
      .line(x, y - h + 1, x + h - 1, y, c('wood', 0));
    for (let i = 1; i < h; i += 3) p.line(x + i, y - h + i, x + Math.min(h, i + 4), y - Math.max(0, h - i - 4), c('wood', 3));
  }
  // a compass: a ring, four ticks and a needle (red half and white half) tilted a little
  const cx = 168;
  const cy = 128;
  p.disc(cx, cy, 17, c('parch', 5)).ring(cx, cy, 17, c('wood', 0)).ring(cx, cy, 15, c('wood', 2));
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    p.line(
      Math.round(cx + Math.cos(a) * 12),
      Math.round(cy + Math.sin(a) * 12),
      Math.round(cx + Math.cos(a) * 15),
      Math.round(cy + Math.sin(a) * 15),
      c('wood', 0),
    );
  }
  const tilt = (Math.PI * 20) / 180;
  const pt = (len: number, side = 0) => [
    Math.round(cx + Math.sin(tilt) * len + Math.cos(tilt) * side),
    Math.round(cy - Math.cos(tilt) * len + Math.sin(tilt) * side),
  ];
  const half = (tip: number[], col: number) => {
    const [l, r] = [pt(0, -4), pt(0, 4)];
    for (let t = 0; t <= 8; t++) p.line(tip[0], tip[1], l[0] + Math.round(((r[0] - l[0]) * t) / 8), l[1] + Math.round(((r[1] - l[1]) * t) / 8), col);
  };
  half(pt(11), c('red', 2));
  half(pt(-11), c('stone', 3));
  p.disc(cx, cy, 2, c('wood', 0));
  // the table below
  p.rect(0, GROUND, W, H - GROUND, c('wood', 2));
  for (let y = GROUND; y < H; y += 8) p.rect(0, y, W, 1, c('wood', 1));
  p.rect(0, GROUND, W, 2, c('wood', 4));
}

/** Night and neon: a starry sky with a moon, a lit skyline and a glowing grid floor. */
function neon(p: Pixels, pal: Pal): void {
  const c = pal.c;
  p.rect(0, 0, W, H, c('ink', 0));
  gradient(p, 0, 70, W, 90, pal.r('purple'), 0, 2, true);
  const rand = rng(8);
  for (let i = 0; i < 30; i++) p.set(Math.floor(rand() * W), Math.floor(rand() * 60), c('white', 2 + (i % 2)));
  p.disc(284, 50, 11, c('white', 3)).disc(288, 47, 9, c('ink', 0));
  // skyline
  let x = 0;
  while (x < W) {
    const w = 14 + Math.floor(rand() * 14);
    const h = 22 + Math.floor(rand() * 50);
    p.rect(x, GROUND - h, w, h, c('ink', 1));
    for (let wy = GROUND - h + 4; wy < GROUND - 4; wy += 6)
      for (let wx = x + 3; wx < x + w - 3; wx += 5) if (rand() < 0.4) p.rect(wx, wy, 2, 3, [c('teal', 4), c('pink', 3), c('gold', 4)][Math.floor(rand() * 3)]);
    x += w;
  }
  // the grid floor: lines from the horizon's middle, and rows that spread toward us
  p.rect(0, GROUND, W, H - GROUND, c('ink', 0));
  for (let i = -12; i <= 12; i++) p.line(160 + i * 6, GROUND, 160 + i * 34, H - 1, c('purple', 3));
  for (let k = 0; k < 6; k++) p.rect(0, GROUND + Math.round(2 + k * k * 1.2), W, 1, c('pink', 2));
  p.rect(0, GROUND, W, 1, c('teal', 4));
}
