// Autotiles: the transition blocks between two kinds of ground (grass and water, grass and
// forest, grass and road, grass and rock), painted from a signed distance field so shores,
// roads and forest edges curve and run diagonally instead of stepping in 90-degree squares.
//
// The map is laid out on its block CORNERS (art/corners.ts): each corner is "in" or "out" of a
// material, and a block is picked by which of its four corners are in (marching squares).
// Every boundary crosses a block edge at that edge's midpoint and leaves it at right angles
// (quarter circles round the corners, straight lines along the sides), so neighbors always join
// smoothly; the "diag" variants cut a corner with a 45-degree line instead, for coasts and
// roads that run diagonally. The distance field is continuous across block edges, so the bands
// painted at a distance from the boundary (foam, wet sand, shadows, cliff faces) join up too,
// and every texture is tileable noise with a 20 pixel period.
import { Canvas, type RGB, mix, smooth, tnoise, clamp01 } from './rgb';
import { blend, canopyTex, dirtTex, grassTex, rockTex, sandTex, type Sampler } from './textures';

export const TL = 1;
export const TR = 2;
export const BR = 4;
export const BL = 8;
export const B = 20;
const H = B / 2;
const CORNER: Record<number, [number, number]> = { [TL]: [0, 0], [TR]: [B, 0], [BR]: [B, B], [BL]: [0, B] };

export type Variant = 'round' | 'diag';

/** Distance from a corner blob's edge: negative inside the blob that sits on `corner`. */
function blob(corner: number, x: number, y: number, v: Variant): number {
  const [cx, cy] = CORNER[corner];
  if (v === 'round') return Math.hypot(x - cx, y - cy) - H;
  // 45 degree cut through the two edge midpoints next to the corner
  return (Math.abs(x - cx) + Math.abs(y - cy) - H) / Math.SQRT2;
}

const bits = (m: number) => [TL, TR, BR, BL].filter((b) => m & b);

/**
 * The signed distance (pixels) at (x, y) to the boundary of the material in the corners `mask`
 * (negative inside the material).
 */
export function shapeSdf(mask: number, x: number, y: number, v: Variant = 'round'): number {
  const n = bits(mask).length;
  if (n === 0) return 99;
  if (n === 4) return -99;
  if (n === 1) return blob(mask, x, y, v);
  if (n === 3) return -blob(15 & ~mask, x, y, v);
  if (mask === (TL | TR)) return y - H;
  if (mask === (BL | BR)) return H - y;
  if (mask === (TL | BL)) return x - H;
  if (mask === (TR | BR)) return H - x;
  // saddles: the material runs through the middle between two little islands of ground
  const out = 15 & ~mask;
  const [a, b] = bits(out);
  return -Math.min(blob(a, x, y, v), blob(b, x, y, v));
}

/** Configs that have a diagonal variant (one or three corners in, and the two saddles). */
export const DIAG_MASKS = [TL, TR, BR, BL, 15 & ~TL, 15 & ~TR, 15 & ~BR, 15 & ~BL, TL | BR, TR | BL];
/** Every partial config, 1..14. */
export const MASKS = Array.from({ length: 14 }, (_, i) => i + 1);

/**
 * What one block of ground looks like: `d` is the signed distance to the material's edge
 * (negative inside it, already roughened), (nx, ny) the outward normal (toward the ground).
 */
export type Shader = (x: number, y: number, d: number, nx: number, ny: number) => RGB;

/** Paints one transition block with 4x4 supersampling. `rough` roughens the edge (tileable). */
export function paintTile(mask: number, shader: Shader, v: Variant = 'round', rough = 1.2, seed = 5): Canvas {
  const cv = new Canvas(B, B);
  const sdf = (x: number, y: number) => shapeSdf(mask, x, y, v) + (tnoise(x, y, 5, B, seed) - 0.5) * 2 * rough + (tnoise(x, y, 2.5, B, seed + 3) - 0.5) * rough;
  cv.shade((x, y) => {
    const d = sdf(x, y);
    const e = 0.35;
    const gx = sdf(x + e, y) - sdf(x - e, y);
    const gy = sdf(x, y + e) - sdf(x, y - e);
    const l = Math.hypot(gx, gy) || 1;
    return shader(x, y, d, gx / l, gy / l);
  }, 4);
  return cv;
}

// ---------------------------------------------------------------- materials

const GRASS = grassTex(1, [0, 0, 0], 3);
const GRASS_V = [grassTex(2), grassTex(3), grassTex(4)].map((v) => blend(GRASS, v));
const GRASS_DARK = grassTex(1, [-16, -14, -8], 3);
const CANOPY = canopyTex(3);
const CANOPY_V = [canopyTex(11), canopyTex(12), canopyTex(13)].map((v) => blend(CANOPY, v));
const ROCK = rockTex(5);
const ROCK_V = [rockTex(21), rockTex(22), rockTex(23)].map((v) => blend(ROCK, v));
const DIRT = dirtTex(7);
const SAND = sandTex(9);

/** Meadow grass; variant 1..3 differ inside the block only. */
export function grass(x: number, y: number, variant = 0): RGB {
  return (variant ? GRASS_V[(variant - 1) % 3] : GRASS)(x, y);
}

export const grassSampler = (variant = 0): Sampler => (x, y) => grass(x, y, variant);

/** Shore: deep water, shallows, foam, wet sand, dry sand, grass. */
export const shore: Shader = (x, y, d) => {
  if (d > 5.5) return grass(x, y);
  if (d > 3) return mix(SAND(x, y), grass(x, y), smooth(3, 5.5, d + (tnoise(x, y, 2.5, B, 8) - 0.5) * 2));
  if (d > 0.4) return mix([168, 142, 96], SAND(x, y), smooth(0.4, 3, d));
  if (d > -1.6) {
    const f = tnoise(x, y, 2.5, B, 21);
    return mix([150, 196, 206], [236, 248, 248], clamp01(0.4 + f * 0.8 - Math.abs(d + 0.6) * 0.5));
  }
  return water(x, y, -d);
};

export const sand = (x: number, y: number): RGB => SAND(x, y);

/** Open water by depth (pixels from shore), with tileable ripples. */
export function water(x: number, y: number, depth: number, phase = 0): RGB {
  const deep = smooth(1, 9, depth);
  const base = mix([64, 168, 178], [26, 78, 138], deep);
  const r1 = Math.sin(((x + y * 0.5 + phase * 5) / B) * Math.PI * 2 + tnoise(x, y, 5, B, 50 + phase) * 5);
  const rip = tnoise(x + phase * 4, y, 5, B, 60) * 0.7 + 0.3 * (r1 * 0.5 + 0.5);
  let c = mix(base, mix(base, [150, 210, 230], 0.45), clamp01((rip - 0.74) * 2.5));
  if (rip < 0.28) c = mix(c, [18, 56, 110], 0.25 * deep);
  return c;
}

/** Forest canopy: packed crowns, a lit rim, a drop shadow on the grass to the bottom right. */
export const forest: Shader = (x, y, d, nx, ny) => {
  if (d > 0) {
    const sh = clamp01((nx * 0.45 + ny * 0.9) * 1.2) * (1 - smooth(0, 5, d));
    return mix(GRASS_DARK(x, y), [20, 44, 22], sh * 0.75);
  }
  return canopy(x, y, -d);
};

export function canopy(x: number, y: number, inside = 99, variant = 0): RGB {
  let c = (variant ? CANOPY_V[(variant - 1) % 3] : CANOPY)(x, y);
  if (inside < 2.2) c = mix(c, [16, 40, 22], (1 - inside / 2.2) * 0.45);
  return c;
}

/** Dirt road: packed earth, pebbles, a worn rim, grass tufts crowding the edge. */
export const road: Shader = (x, y, d) => {
  if (d > 1.2) return mix([70, 96, 42], grass(x, y), smooth(1.2, 3.5, d));
  if (d > -0.8 && tnoise(x, y, 2.5, B, 81) > 0.6) return GRASS_DARK(x, y);
  return dirt(x, y, -d);
};

export function dirt(x: number, y: number, inside = 99): RGB {
  let c = DIRT(x, y);
  if (inside < 2) c = mix(c, [96, 70, 42], (1 - inside / 2) * 0.5);
  return c;
}

/** Highland rock with a cliff face where the edge looks south and a lit rim where it looks north. */
export const cliff: Shader = (x, y, d, nx, ny) => {
  const face = clamp01(ny * 1.4 - 0.15);
  const faceH = 8 * face;
  void nx;
  if (d > 0) {
    if (d < faceH) {
      const t = d / Math.max(1, faceH);
      const strata = tnoise(x * 2, y * 0.35, 2.5, B, 101);
      const crack = tnoise(x, y, 2.5, B, 102) > 0.7 ? 0.25 : 0;
      return mix(mix([150, 132, 112], [82, 70, 60], t), [52, 44, 40], strata * 0.3 + crack);
    }
    const sh = (1 - smooth(faceH, faceH + 4, d)) * Math.max(face, 0.25);
    return mix(grass(x, y), [30, 40, 28], sh * 0.6);
  }
  const rim = 1 - smooth(0, 2.2, -d);
  return mix(rock(x, y), [226, 214, 188], rim * (0.6 - face * 0.4));
};

export const rock = (x: number, y: number, variant = 0): RGB => (variant ? ROCK_V[(variant - 1) % 3] : ROCK)(x, y);

/** Cobblestones for the towns (tileable: 5 stones a block, offset rows). */
export function cobble(x: number, y: number, tone = 0): RGB {
  const row = Math.floor(y / 5);
  const off = row % 2 ? 2.5 : 0;
  const cx = (((x + off) % 5) + 5) % 5;
  const cy = y % 5;
  const col = ((Math.floor((x + off) / 5) % 4) + 4) % 4;
  const id = col + (row % 4) * 7;
  const edge = Math.min(cx, 5 - cx, cy, 5 - cy);
  const v = tnoise(col * 5, (row % 4) * 5, 5, B, 120) * 0.5 + (((id * 37) % 11) / 11) * 0.3;
  let c = mix([112, 104, 100], [184, 176, 162], clamp01(v + tone));
  if (edge < 0.7) c = [70, 64, 62];
  else if (cy < 1.3 && cx > 1) c = mix(c, [214, 206, 190], 0.35);
  else if (cy > 3.7) c = mix(c, [86, 80, 76], 0.35);
  return c;
}

/** Town street: cobbles with a stone curb into the grass. */
export const street: Shader = (x, y, d) => {
  if (d > 2) return mix([64, 90, 44], grass(x, y), smooth(2, 4, d));
  if (d > 0) return mix([160, 152, 138], [104, 98, 92], d / 2);
  return cobble(x, y);
};

/**
 * A bridge block where a road crosses water: the shore underneath (water corners `wm`), and a
 * plank deck with rails along the road (road corners `rm`) wherever it is over the water or its
 * banks; dirt where it is back on land.
 */
export function paintBridge(wm: number, rm: number): Canvas {
  const cv = new Canvas(B, B);
  const horiz = rm === (TL | TR) || rm === (BL | BR) || (rm & (TL | TR)) === 0 || (rm & (BL | BR)) === 0;
  const across = horiz ? (x: number) => x : (_x: number, y: number) => y;
  cv.shade((x, y) => {
    const dw = shapeSdf(wm, x, y);
    const dr = shapeSdf(rm, x, y) + (horiz ? 0 : 0);
    const under = shore(x, y, dw, 0, 0);
    if (dr > 0.6) {
      // a rail's shadow on the water beside the deck
      if (dr < 2.2 && dw < 4) return mix(under, [10, 30, 50], 0.45);
      return under;
    }
    if (dw > 6) return dirt(x, y, -dr);
    // the deck: boards across the way, a rail on each side
    if (dr > -1.4) return mix([96, 62, 34], [150, 104, 60], dr < -0.6 ? 0.9 : 0.3);
    const board = across(x, y) % 4;
    const grain = tnoise(x, y, 2.5, B, 140);
    let c = mix([150, 108, 62], [196, 152, 98], grain);
    if (board < 0.7) c = [88, 58, 34];
    else if (board < 1.3) c = mix(c, [220, 186, 130], 0.3);
    return c;
  }, 4);
  return cv;
}
