// SYSOP.GIF, the picture waiting in the secret BBS's file area: the SysOp and his corgi on
// a sunny day at the town gazebo, a selfie scanned and touched up the way 1995 GIFs were
// (Lewis in his red polo and violet sunglasses, a sly half-smile; Teddy all ears, grinning,
// on his blue leash). Painted in code in a palette of its own, and shown by sysopFli()
// arriving over the modem as an interlaced GIF.
import { Pixels, dither, rng } from '../../../kit/pixels';
import { PaletteBuilder } from '../../../kit/palette';
import { encodeFli } from '../../../../web/src/formats/fli';
import { text } from './screens';

export const SP = new PaletteBuilder();
SP.color(0, 0, 0);
/** The 16 ANSI colors, for the file listing and the transfer window. */
export const A: number[] = [
  [0, 0, 0],
  [0, 0, 170],
  [0, 170, 0],
  [0, 170, 170],
  [170, 0, 0],
  [170, 0, 170],
  [170, 85, 0],
  [170, 170, 170],
  [85, 85, 85],
  [85, 85, 255],
  [85, 255, 85],
  [85, 255, 255],
  [255, 85, 85],
  [255, 85, 255],
  [255, 255, 85],
  [255, 255, 255],
].map(([r, g, b]) => SP.color(r, g, b));
const SKY = SP.ramp('sky', 5, [112, 160, 226], [236, 244, 252]);
const BRICK = SP.ramp('brick', 6, [60, 18, 14], [214, 128, 104], [150, 58, 42]);
const WHITE = SP.ramp('white', 7, [58, 60, 70], [252, 252, 250], [176, 178, 184]);
const ROOF = SP.ramp('roof', 5, [26, 64, 50], [160, 210, 182], [64, 128, 100]);
const LEAF = SP.ramp('leaf', 5, [40, 56, 26], [196, 206, 150], [104, 124, 62]);
const SKIN = SP.ramp('skin', 8, [92, 46, 36], [255, 226, 206], [222, 156, 128]);
const HAIR = SP.ramp('hair', 7, [30, 26, 24], [214, 206, 196], [112, 100, 90]);
const POLO = SP.ramp('polo', 5, [96, 0, 12], [255, 110, 96], [222, 22, 30]);
const LENS = SP.ramp('lens', 5, [16, 8, 44], [176, 156, 236], [74, 52, 150]);
const FUR = SP.ramp('fur', 8, [84, 34, 10], [255, 222, 160], [206, 128, 58]);
const LEASH = SP.ramp('leash', 3, [24, 48, 96], [110, 160, 220]);
const PLAZA = SP.ramp('plaza', 5, [112, 96, 70], [222, 206, 170]);
const PINK = SP.ramp('pink', 3, [150, 60, 70], [250, 170, 170]);
SP.designerColors();
export const SYSOP_PAL = SP.pal.slice();

const W = 320;
const H = 200;
type Pt = [number, number];

/** A ramp shade at a fractional level, the fraction ordered-dithered. */
function sh(ramp: number[], v: number, x: number, y: number): number {
  const i = Math.floor(v);
  const k = dither(x, y, v - i) ? i + 1 : i;
  return ramp[Math.max(0, Math.min(ramp.length - 1, k))];
}

/** Fills an ellipse; `fill` gets the pixel and its position inside (-1..1 each way). */
function oval(p: Pixels, cx: number, cy: number, rx: number, ry: number, fill: (x: number, y: number, u: number, v: number) => number): void {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const u = (x - cx) / rx;
      const v = (y - cy) / ry;
      if (u * u + v * v <= 1) p.set(x, y, fill(x, y, u, v));
    }
}

/** Fills a polygon (even-odd), coloring each pixel with `fill`. */
function poly(p: Pixels, pts: Pt[], fill: (x: number, y: number) => number): void {
  const ys = pts.map((q) => q[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % pts.length];
      if (y0 === y1 || y + 0.5 < Math.min(y0, y1) || y + 0.5 >= Math.max(y0, y1)) continue;
      xs.push(x0 + ((y + 0.5 - y0) * (x1 - x0)) / (y1 - y0));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) p.set(x, y, fill(x, y));
  }
}

/** A thick line of round dabs. */
function stroke(p: Pixels, pts: Pt[], r: number, c: number | ((x: number, y: number) => number)): void {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let k = 0; k <= n; k++) {
      const x = x0 + ((x1 - x0) * k) / n;
      const y = y0 + ((y1 - y0) * k) / n;
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r * r + 0.5) continue;
          const px = Math.round(x + dx);
          const py = Math.round(y + dy);
          p.set(px, py, typeof c === 'number' ? c : c(px, py));
        }
    }
  }
}

/** Darkens every pixel of `ramp` that `inside` picks by `k` steps. */
function darken(p: Pixels, ramps: number[][], inside: (x: number, y: number) => boolean, k: number): void {
  p.map((x, y, c) => {
    if (!inside(x, y)) return c;
    for (const r of ramps) {
      const i = r.indexOf(c);
      if (i >= 0) return r[Math.max(0, i - k)];
    }
    return c;
  });
}

function background(p: Pixels): void {
  const r = rng(1776);
  // Sky, a few fair-weather clouds.
  for (let y = 0; y < 70; y++) for (let x = 0; x < W; x++) p.set(x, y, sh(SKY, 0.6 + (y / 70) * 2.6, x, y));
  for (const [cx, cy, rx] of [
    [214, 8, 26],
    [252, 4, 18],
    [292, 22, 22],
  ])
    oval(p, cx, cy, rx, rx * 0.32, (x, y, _u, v) => sh(SKY, 4.4 - v * 0.6, x, y));
  // The brick building on the left: three floors of windows over a dark shopfront.
  for (let y = 4; y < 74; y++)
    for (let x = 0; x < 98; x++) {
      const mortar = y % 3 === 0 || (x + (Math.floor(y / 3) % 2) * 3) % 6 === 0;
      p.set(x, y, mortar ? BRICK[1] : sh(BRICK, 2.2 + r() * 0.8, x, y));
    }
  p.rect(0, 2, 98, 3, WHITE[3]).rect(0, 4, 98, 1, WHITE[1]);
  for (let fl = 0; fl < 3; fl++)
    for (let k = 0; k < 4; k++) {
      const x = 6 + k * 23 + (k > 1 ? 4 : 0);
      const y = 9 + fl * 17;
      p.rect(x - 1, y - 2, 12, 2, WHITE[4]);
      p.rect(x, y, 10, 12, WHITE[5]);
      p.rect(x + 1, y + 1, 8, 5, SKY[1]).rect(x + 1, y + 7, 8, 4, SKY[0]);
      p.set(x + 2, y + 2, SKY[4]);
    }
  // A tall blade sign on the corner.
  p.rect(44, 6, 7, 40, WHITE[6]).frame(44, 6, 7, 40, WHITE[2]);
  for (let k = 0; k < 6; k++) p.rect(46, 10 + k * 6, 3, 3, BRICK[1]);
  p.rect(0, 60, 98, 14, WHITE[0]).rect(0, 59, 98, 2, BRICK[0]);
  for (let k = 0; k < 4; k++) p.rect(6 + k * 24, 62, 16, 10, sh(WHITE, 0.6, 0, 0)).rect(7 + k * 24, 63, 6, 4, SKY[0]);
  // A lamp post.
  p.rect(36, 50, 2, 26, WHITE[0]).rect(34, 46, 6, 5, WHITE[0]).rect(35, 47, 4, 3, PLAZA[4]);
  // Trees behind the gazebo, the white house with the red roof to the right.
  for (let k = 0; k < 160; k++) {
    const x = 96 + r() * 120;
    const y = 30 + r() * 34;
    p.disc(x, y, 2 + r() * 3, sh(LEAF, 1 + r() * 3, Math.round(x), Math.round(y)));
  }
  poly(p, [
    [214, 30],
    [236, 16],
    [276, 16],
    [298, 30],
  ], (x, y) => sh(BRICK, 3.4 - (y - 16) / 10, x, y));
  for (let y = 30; y < 70; y++) for (let x = 218; x < 296; x++) p.set(x, y, sh(WHITE, 5.4 - (x - 218) / 60, x, y));
  for (let k = 0; k < 3; k++) p.rect(226 + k * 24, 36, 10, 12, WHITE[1]).rect(227 + k * 24, 37, 8, 10, SKY[1]);
  p.rect(222, 54, 70, 2, WHITE[3]);
  for (let k = 0; k < 120; k++) {
    const x = 290 + r() * 34;
    const y = 6 + r() * 60;
    p.disc(x, y, 2 + r() * 3, sh(LEAF, 0.6 + r() * 2.6, Math.round(x), Math.round(y)));
  }
  // The plaza: tan pebbles, a low brick wall, then red brick pavers with white joints.
  for (let y = 66; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, sh(PLAZA, 1.8 + r() * 1.4 + (y - 66) / 120, x, y));
  for (let y = 74; y < 82; y++) for (let x = 0; x < 130; x++) p.set(x, y, (x + y * 7) % 13 === 0 ? BRICK[1] : sh(BRICK, 2.6, x, y));
  for (let y = 84; y < 116; y++)
    for (let x = 136; x < W; x++) {
      const row = Math.floor((y - 84) / 5);
      const joint = (y - 84) % 5 === 0 || (x + row * 5) % 11 === 0;
      p.set(x, y, joint ? BRICK[1] : sh(BRICK, 2.4 + (row === 0 ? 1 : 0) + (r() - 0.5) * 0.5, x, y));
    }
  p.rect(136, 82, W - 136, 2, BRICK[4]);
  const rowOf = (y: number) => Math.floor(Math.log(1 + Math.max(0, y - 116) / 5) * 4.2);
  for (let y = 120; y < H; y++)
    for (let x = 120; x < W; x++) {
      const row = rowOf(y);
      const bw = 16 + row * 3;
      const hJoint = rowOf(y - 1) !== row;
      const vJoint = (x + row * bw * 0.5) % bw < 1.3;
      p.set(x, y, hJoint || vJoint ? sh(WHITE, 4.6, x, y) : sh(BRICK, 2.5 + (r() - 0.5) * 0.7 + (row % 2) * 0.3, x, y));
    }
}

/** The white octagonal gazebo with its green roof, sunburst brackets and wide steps. */
function gazebo(p: Pixels): void {
  const cx = 150;
  // Roof: a low green dome with a little cupola.
  poly(p, [
    [cx - 56, 20],
    [cx - 30, 4],
    [cx + 30, 4],
    [cx + 56, 20],
  ], (x, y) => sh(ROOF, 3.6 - (y - 4) / 8 + (x < cx ? 0.4 : -0.4), x, y));
  for (let k = -3; k <= 3; k++) p.line(cx + k * 15, 21, cx + k * 9, 4, ROOF[1]);
  p.rect(cx - 6, 0, 12, 5, ROOF[2]).rect(cx - 2, 0, 4, 2, WHITE[6]);
  // Cornice.
  p.rect(cx - 58, 20, 116, 5, WHITE[6]).rect(cx - 58, 24, 116, 1, WHITE[2]).rect(cx - 58, 20, 116, 1, WHITE[4]);
  // Columns, with sunburst fans between their tops.
  const cols = [-50, -32, -12, 12, 32, 50];
  const back = 70;
  p.rect(cx - 52, 25, 104, back - 25, SKY[0]);
  for (let y = 25; y < back; y++) for (let x = cx - 52; x < cx + 52; x++) if (y > 44) p.set(x, y, sh(LEAF, 1.2 + ((x * 3 + y) % 5) / 4, x, y));
  for (let k = 0; k < cols.length - 1; k++) {
    const x0 = cx + cols[k] + 3;
    const x1 = cx + cols[k + 1] - 3;
    const mx = (x0 + x1) / 2;
    p.rect(x0, 25, x1 - x0, 3, WHITE[5]);
    for (let a = 0; a <= 8; a++) {
      const t = (a / 8) * Math.PI;
      p.line(mx, 28, Math.round(mx - Math.cos(t) * (x1 - x0) * 0.5), Math.round(28 + Math.sin(t) * 9), WHITE[6]);
    }
  }
  for (const dx of cols) {
    const x = cx + dx;
    for (let y = 25; y < back + 2; y++) for (let k = -3; k <= 3; k++) p.set(x + k, y, sh(WHITE, 5.6 - Math.abs(k + 1) * 0.6 - (k > 1 ? 1 : 0), x + k, y));
    p.rect(x - 4, back, 9, 3, WHITE[6]).rect(x - 4, 24, 9, 2, WHITE[6]);
  }
  // Railing and the steps down to the plaza.
  p.rect(cx - 52, 58, 104, 2, WHITE[6]);
  for (let x = cx - 50; x < cx + 50; x += 4) p.rect(x, 60, 1, 10, WHITE[5]);
  for (let s = 0; s < 4; s++) {
    const y = 72 + s * 3;
    const w = 60 + s * 8;
    p.rect(cx - w, y, w * 2, 3, sh(PLAZA, 3.4 - s * 0.3, 0, 0)).rect(cx - w, y + 2, w * 2, 1, PLAZA[1]);
  }
}

/** Lewis: the selfie's big friendly face in the lower left. */
function lewis(p: Pixels): void {
  // Red polo shoulders and collar.
  poly(p, [
    [0, 150],
    [40, 158],
    [120, 168],
    [176, 186],
    [184, 200],
    [0, 200],
  ], (x, y) => sh(POLO, 2.6 - (x - 60) / 120 + (y - 160) / 60, x, y));
  poly(p, [
    [44, 156],
    [70, 168],
    [92, 190],
    [60, 196],
    [28, 170],
  ], (x, y) => sh(POLO, 3.4 - (y - 160) / 30, x, y));
  poly(p, [
    [116, 164],
    [138, 168],
    [150, 192],
    [118, 186],
  ], (x, y) => sh(POLO, 1.6, x, y));
  // Neck in shadow.
  poly(p, [
    [58, 140],
    [128, 140],
    [124, 170],
    [64, 166],
  ], (x, y) => sh(SKIN, 3.2 + (60 - x) / 80, x, y));
  // The face: wide and round, lit from the left, the jaw softening into shadow at the right.
  oval(p, 88, 104, 60, 64, (x, y, u, v) => sh(SKIN, 6.1 - u * 1.7 - Math.max(0, v) * 1.2 - (u * u + v * v) * 1.4, x, y));
  // His ear on the left.
  oval(p, 30, 104, 9, 16, (x, y, u) => sh(SKIN, 4.6 + u * 0.8, x, y));
  p.line(30, 94, 28, 112, SKIN[3]);
  // Shaggy grey-brown hair: a bowl cut combed forward, its fringe ragged, strands of grey.
  const inHair = (x: number, y: number) => {
    const u = (x - 90) / 66;
    const v = (y - 76) / 50;
    if (u * u + v * v > 1) return false;
    const side = x < 38 || x > 140;
    return y <= (side ? 94 + Math.sin(x * 0.7) * 3 : 60 + (x - 30) * 0.06 + Math.sin(x / 6) * 2);
  };
  for (let y = 24; y < 100; y++)
    for (let x = 22; x < 160; x++) if (inHair(x, y)) p.set(x, y, sh(HAIR, 2.8 - (x - 90) / 60 - (y - 60) / 70, x, y));
  const hr = rng(1995);
  for (let k = 0; k < 260; k++) {
    // Each strand starts near the crown and falls forward and down, curling a little.
    const a = hr() * Math.PI - Math.PI;
    let x = 92 + Math.cos(a) * hr() * 40;
    let y = 34 + hr() * 14;
    const dir = (x - 92) / 50;
    const len = 18 + hr() * 30;
    const c = hr() < 0.18 ? HAIR[5 + Math.floor(hr() * 2)] : HAIR[1 + Math.floor(hr() * 4)];
    for (let i = 0; i < len; i++) {
      const nx = x + dir * 0.9 + Math.sin(i / 5 + k) * 0.3;
      const ny = y + 0.9;
      if (!inHair(Math.round(nx), Math.round(ny)) && i > 3) {
        if (hr() < 0.5) p.set(Math.round(nx), Math.round(ny), c); // a stray tip over the edge
        break;
      }
      x = nx;
      y = ny;
      p.set(Math.round(x), Math.round(y), c);
    }
  }
  // Violet-tinted wire sunglasses.
  const lens = (cx: number, cy: number, rx: number, ry: number) => {
    oval(p, cx, cy, rx, ry, (x, y, u, v) => sh(LENS, 1.6 - v * 0.9 + (u + v < -0.9 ? 2.2 : 0), x, y));
    for (let a = 0; a < 120; a++) {
      const t = (a / 120) * Math.PI * 2;
      p.set(Math.round(cx + Math.cos(t) * (rx + 0.5)), Math.round(cy + Math.sin(t) * (ry + 0.5)), WHITE[3]);
    }
    p.line(cx - rx + 4, cy - ry + 3, cx - rx + 8, cy - ry + 2, LENS[4]);
  };
  lens(66, 82, 20, 13);
  lens(118, 84, 19, 12);
  p.line(86, 80, 99, 81, WHITE[3]).line(86, 79, 99, 80, WHITE[5]);
  p.line(46, 78, 30, 74, WHITE[3]).line(137, 80, 150, 74, WHITE[2]);
  // Nose, the shadow under it, and a sly half-smile pulling up on his right.
  stroke(p, [
    [92, 96],
    [90, 110],
    [96, 116],
  ], 1, SKIN[3]);
  oval(p, 98, 116, 8, 3, (x, y) => sh(SKIN, 3.2, x, y));
  p.line(84, 115, 88, 117, SKIN[2]).line(104, 116, 108, 114, SKIN[2]);
  stroke(p, [
    [72, 131],
    [86, 133],
    [100, 131],
    [110, 127],
  ], 0.6, SKIN[1]);
  p.line(110, 127, 113, 124, SKIN[2]);
  p.line(74, 136, 98, 136, SKIN[4]);
  // Shadow under the chin.
  darken(p, [SKIN], (x, y) => y > 156 + Math.abs(x - 92) * 0.05 && y < 166, 1);
}

/** Teddy: big upright ears, red-gold coat, the white blaze, a black nose and a grin. */
function teddy(p: Pixels): void {
  // Body behind, back legs with white socks.
  oval(p, 282, 146, 36, 30, (x, y, u, v) => sh(FUR, 4.4 - u * 1.2 - v * 1.2, x, y));
  for (const lx of [298, 312]) {
    p.rect(lx, 160, 9, 34, FUR[3]);
    oval(p, lx + 5, 194, 7, 4, (x, y) => sh(WHITE, 5.6, x, y));
  }
  // Front legs and chest: white, with fur coming round the shoulders.
  for (const lx of [210, 244]) {
    poly(p, [
      [lx, 150],
      [lx + 16, 150],
      [lx + 15, 200],
      [lx + 1, 200],
    ], (x, y) => sh(FUR, 3.6 - (x - lx) / 12, x, y));
    p.rect(lx + 3, 176, 10, 24, WHITE[6]).rect(lx + 11, 176, 2, 24, WHITE[4]);
  }
  oval(p, 232, 150, 28, 36, (x, y, u, v) => sh(WHITE, 6 - u * 0.8 - v * 0.6, x, y));
  oval(p, 206, 136, 12, 30, (x, y, u) => sh(FUR, 4 + u, x, y));
  oval(p, 262, 136, 12, 32, (x, y, u) => sh(FUR, 3.2 - u, x, y));
  // Ears: the tall right one (on our left) straight up, the left one tipped out.
  const ear = (pts: Pt[], inner: Pt[]) => {
    poly(p, pts, (x, y) => sh(FUR, 4.6 - (y - pts[1][1]) / 30, x, y));
    poly(p, inner, (x, y) => sh(PINK, 2.2 - (y - inner[1][1]) / 40, x, y));
  };
  ear(
    [
      [190, 70],
      [196, 2],
      [226, 52],
    ],
    [
      [196, 64],
      [198, 14],
      [218, 54],
    ],
  );
  ear(
    [
      [246, 50],
      [312, 18],
      [272, 82],
    ],
    [
      [254, 52],
      [302, 26],
      [270, 72],
    ],
  );
  // Head.
  oval(p, 230, 82, 38, 34, (x, y, u, v) => sh(FUR, 5 - u * 1.1 - v * 0.7, x, y));
  oval(p, 226, 112, 26, 18, (x, y, u, v) => sh(WHITE, 6 - u * 0.9 - v * 0.6, x, y));
  // The white blaze: a stripe up the middle to his forehead.
  poly(p, [
    [222, 50],
    [230, 50],
    [236, 100],
    [216, 100],
  ], (x, y) => sh(WHITE, 6 - (x - 222) / 18, x, y));
  // Eyes: dark brown, a glint each.
  for (const [ex, ey] of [
    [210, 82],
    [248, 82],
  ] as Pt[]) {
    oval(p, ex, ey, 5, 4, () => FUR[0]);
    p.set(ex - 1, ey - 2, WHITE[6]).set(ex - 2, ey - 1, WHITE[6]);
    p.line(ex - 6, ey - 5, ex + 4, ey - 6, FUR[2]);
  }
  // Nose and the open grin.
  oval(p, 224, 106, 10, 7, (_x, _y, u, v) => (u + v < -0.9 ? WHITE[2] : WHITE[0]));
  p.set(221, 103, WHITE[4]).set(222, 102, WHITE[4]);
  p.line(224, 113, 224, 118, WHITE[1]);
  poly(p, [
    [208, 118],
    [240, 116],
    [232, 128],
    [214, 128],
  ], () => FUR[0]);
  oval(p, 223, 124, 8, 4, (x, y) => sh(PINK, 1.4, x, y));
  p.rect(212, 118, 3, 2, WHITE[6]).rect(233, 117, 3, 2, WHITE[6]);
  // A blue collar under his chin, tags, and the blue leash running out of the picture.
  stroke(p, [
    [206, 128],
    [218, 134],
    [232, 135],
    [252, 128],
  ], 1.6, (x, y) => sh(LEASH, 1 + (y < 132 ? 1 : 0), x, y));
  oval(p, 228, 142, 4, 5, (x, y, u, v) => sh(WHITE, 4.5 - u - v, x, y));
  oval(p, 224, 146, 3, 4, (x, y, u, v) => sh(PLAZA, 3 - u - v, x, y));
  stroke(p, [
    [230, 136],
    [232, 160],
    [229, 200],
  ], 1.2, (x, y) => sh(LEASH, 1.4 + (x % 3 === 0 ? 0.6 : 0), x, y));
}

/** The whole picture, 320x200. */
export function sysopPicture(): Pixels {
  const p = new Pixels(W, H, SKY[2]);
  background(p);
  gazebo(p);
  teddy(p);
  lewis(p);
  return p;
}

// ================================================================= the download
const LISTING: [string, string, string][] = [
  ['SYSOP.GIF', '47K', 'The SysOp and Teddy at'],
  ['', '', 'the town gazebo. VGA!'],
  ['CORGI.GIF', '12K', 'Ears. Just ears.'],
  ['GWIN.GIF', '31K', 'Gwin. Blurry. (Moved.)'],
  ['13STARS.GIF', '9K', 'Flag Resolution, 1777'],
  ['CHICKEN.TXT', '2K', 'Walking a rubber'],
  ['', '', 'chicken on a leash.'],
  ['', '', '      -Dr. Leo, PhD'],
  ['NOISELES.TXT', '3K', 'Typed on a Remington'],
  ['', '', 'Noiseless. Shhh!'],
  ['6502.ASM', '8K', 'Atari 400 sprite demo'],
  ['SANDCAST.ZIP', '412K', 'You already have it!'],
];

/**
 * sysop.fli: the secret BBS's file area. The listing scrolls in at 2400 baud, Teddy's player
 * downloads SYSOP.GIF by Zmodem (with a burst of line noise), and the picture arrives the
 * way an interlaced GIF did: every 8th row first, each row smeared down over the gap, then
 * the rows between, sharper on every pass.
 */
export function sysopFli(): Uint8Array {
  const write = (p: Pixels, x: number, y: number, s: string, c: number) => text(p, x, y, s, c);
  const frames: Uint8Array[] = [];
  const add = (p: Pixels, n = 1) => {
    for (let i = 0; i < n; i++) frames.push(Uint8Array.from(p.px));
  };
  const scr = new Pixels(W, H, 0);
  scr.rect(0, 0, W, 8, A[1]);
  write(scr, 0, 0, ' FILE AREA 3: GIFS, DOGS & ODDITIES'.padEnd(40), A[15]);
  add(scr, 2);
  write(scr, 0, 12, 'NAME         SIZE DESCRIPTION', A[14]);
  write(scr, 0, 20, '------------ ---- ----------------------', A[8]);
  add(scr);
  LISTING.forEach(([name, size, desc], i) => {
    const y = 30 + i * 9;
    write(scr, 0, y, name, A[11]);
    write(scr, 104, y, size.padStart(4), A[10]);
    write(scr, 144, y, desc, name === 'SYSOP.GIF' ? A[15] : A[7]);
    add(scr);
  });
  add(scr, 40);
  // The prompt, typed.
  const type = (x: number, y: number, prompt: string, answer: string, c = A[13]) => {
    write(scr, x, y, prompt, c);
    add(scr, 4);
    for (let k = 1; k <= answer.length; k++) {
      write(scr, x + prompt.length * 8, y, answer.slice(0, k), A[15]);
      add(scr);
    }
    add(scr, 3);
  };
  type(0, 144, '[D]ownload [V]iew [Q]uit: ', 'D');
  type(0, 154, 'File to download: ', 'SYSOP.GIF');
  type(0, 164, 'Protocol [Z]modem: ', 'Z');
  // The Zmodem window.
  const total = 48213;
  const bx = 36;
  const by = 58;
  const win = (got: number, note: string, noteColor = A[7]) => {
    scr.rect(bx, by, 248, 66, A[1]).frame(bx + 2, by + 2, 244, 62, A[11]).frame(bx + 4, by + 4, 240, 58, A[11]);
    scr.rect(bx + 60, by, 136, 8, A[1]);
    write(scr, bx + 64, by, ' ZMODEM RECEIVE ', A[14]);
    write(scr, bx + 12, by + 10, 'File:  SYSOP.GIF', A[15]);
    write(scr, bx + 12, by + 20, `Bytes: ${got.toLocaleString('en-US')} / ${total.toLocaleString('en-US')}`, A[15]);
    const left = Math.round((total - got) / 236);
    write(scr, bx + 12, by + 30, `CPS:   236   ETA ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`, A[15]);
    const bar = Math.round((got / total) * 28);
    for (let k = 0; k < 28; k++) scr.rect(bx + 12 + k * 8, by + 42, 7, 7, k < bar ? A[10] : A[8]);
    scr.rect(bx + 8, by + 52, 232, 8, A[1]);
    write(scr, bx + 12, by + 52, note, noteColor);
  };
  const steps = 20;
  for (let k = 0; k <= steps; k++) {
    const got = Math.round((total * k) / steps);
    win(got, k === 0 ? 'ZRINIT: starting...' : k < steps ? 'Receiving.' + '.'.repeat(k % 3) : 'Transfer complete!');
    if (k === 9) {
      // Somebody picked up the phone.
      for (let n = 0; n < 4; n++) {
        const noise = rng(9 + n);
        win(got, 'CRC error! Retrying...', A[12]);
        let s = '';
        for (let c = 0; c < 26; c++) s += String.fromCharCode(33 + Math.floor(noise() * 90));
        write(scr, bx + 12, by + 52, s, A[12]);
        add(scr, 2);
      }
      win(got, 'MOM! I\'M ONLINE!', A[14]);
      add(scr, 14);
    }
    add(scr, k === steps ? 16 : 2);
  }
  // The GIF, interlaced: pass rows (start, step), each row smeared down until the next known row.
  const pic = sysopPicture();
  const known = new Int16Array(H).fill(-1);
  const view = new Pixels(W, H, 0);
  const paint = () => {
    let src = -1;
    for (let y = 0; y < H; y++) {
      if (known[y] >= 0) src = y;
      for (let x = 0; x < W; x++) view.set(x, y, src >= 0 ? pic.get(x, src) : 0);
    }
  };
  add(view, 3);
  for (const [start, step] of [
    [0, 8],
    [4, 8],
    [2, 4],
    [1, 2],
  ]) {
    const rows: number[] = [];
    for (let y = start; y < H; y += step) rows.push(y);
    const chunk = Math.ceil(rows.length / 4);
    for (let k = 0; k < rows.length; k += chunk) {
      for (const y of rows.slice(k, k + chunk)) known[y] = y;
      paint();
      add(view);
    }
  }
  add(view, 2);
  return encodeFli(frames, SYSOP_PAL, { speed: 6 });
}
