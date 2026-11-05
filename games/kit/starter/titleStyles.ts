// The title looks of the Starters' groups (web/src/project/starter.ts STARTER_GROUPS): each group's
// titles share a sky, lettering colors and frame, so a player can tell by the picture roughly how
// much game making a Starter asks. 'meadow' (The Basics) is the sunny scene in screens.ts and is not
// drawn here. Every look uses only the Starter palette's ramps, so any Starter can wear any of them.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { gradient, pool } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Pal } from './palette';

/** The group looks: meadow (The Basics), sunset (Game Feel), stage (Telling a Story), workbench (Putting It Together), atlas (Bigger Worlds), neon (Showcase Tricks). */
export type GroupStyle = 'meadow' | 'sunset' | 'stage' | 'workbench' | 'atlas' | 'neon';

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
  ({ sunset, stage, workbench, atlas, neon })[style](p, pal);
  return p;
}

/** The lettering and ribbon colors of a look. */
export function lookOf(pal: Pal, style: Exclude<GroupStyle, 'meadow'>): Look {
  const c = pal.c;
  return {
    sunset: { fill: c('gold', 5), outline: c('purple', 0), shadow: c('purple', 1), ribbon: 'parch', ribbonText: c('purple', 0), floorShadow: c('purple', 0) },
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
  gradient(p, 0, 0, W, 60, pal.r('purple'), 0, 3);
  gradient(p, 0, 60, W, 50, pal.r('pink'), 0, 3);
  gradient(p, 0, 110, W, 50, pal.r('orange'), 1, 4);
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

/** A theater: red curtains and a fringed valance, a spotlit back wall and a wooden stage. */
function stage(p: Pixels, pal: Pal): void {
  const c = pal.c;
  gradient(p, 0, 0, W, GROUND, pal.r('purple'), 0, 2);
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
  gradient(p, 0, 0, W, GROUND, pal.r('parch'), 3, 5);
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
  gradient(p, 0, 70, W, 90, pal.r('purple'), 0, 2);
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
