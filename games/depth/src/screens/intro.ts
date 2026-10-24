// INTRO.FLI: the render of the century, as a cartoon. The picture ray traces line by line,
// Count Polygon swoops through it turning spheres into polyhedra, Ray's bands light up, and
// the DEPTH PERCEPTION logo spins in out of the distance with a lens flare. The camera never
// moves within a shot, so an FLI frame only stores what changed.
import { encodeFli } from '../../../../web/src/formats/fli';
import { bloom, flare, type Picture } from '../render/image';
import { MAT } from '../render/look';
import { Matcher, medianCut, putColors } from '../render/quant';
import { Sphere, hull, mix, rgb, type Shape, type V } from '../render/tracer';
import { toBytes } from '../render/image';
import * as C from '../models/cast';
import { rayModel } from '../models/ray';
import { NEAR_COL } from '../tiles/cells';
import { centered, text } from './draw';
import { logoShapes, SKY, TITLE_EYE, TITLE_LOOK, titleSet } from './title';
import { cam, stage, still, H, W } from './stage';
import { place } from './pictures';

const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** An icosahedron's corners (the low-poly version of a sphere). */
function lowPoly(c: V, r: number, mat = MAT.gold): Shape {
  const phi = (1 + Math.sqrt(5)) / 2;
  const pts: V[] = [];
  for (const a of [-1, 1]) for (const b of [-phi, phi]) pts.push([0, a, b], [a, b, 0], [b, 0, a]);
  const n = Math.hypot(1, phi);
  return hull(
    pts.map((p) => [c[0] + (p[0] / n) * r, c[1] + (p[1] / n) * r, c[2] + (p[2] / n) * r] as V),
    (f) => ({ ...mat, color: mix(rgb(255, 196, 92), rgb(150, 100, 40), ((f * 7) % 5) / 5) }),
  );
}

/** Ray's bands, from cold grey to lit amber. */
const band = (k: number) => mix(rgb(70, 70, 80), NEAR_COL, k);

interface Frame {
  pic: Picture;
}

export function introFrames(): { frames: Picture[]; speed: number } {
  const frames: Picture[] = [];
  const camera = cam(TITLE_EYE, TITLE_LOOK, 0.78);
  const rayAt: V = [2.1, -2.4, 0.62];
  const goldAt: V = [-2.6, -1.6, 0.35];
  const world = (extra: Shape[], lit = 1, gold = true, rollA = 0.5) =>
    stage(titleSet([...rayModel('y', rollA, band(lit), rayAt, 0.62), gold ? new Sphere(goldAt, 0.35, MAT.gold) : lowPoly(goldAt, 0.4), ...extra]), {
      env: SKY,
    });

  // A: the render comes in line by line, as it did overnight
  const full = still(world([], 0), camera, 4, 20, 21);
  const LINES = 14;
  for (let f = 1; f <= LINES; f++) {
    const rows = Math.round((H * f) / LINES);
    const pic: Picture = { w: W, h: H, rgb: new Float32Array(W * H * 3) };
    pic.rgb.set(full.rgb.subarray(0, rows * W * 3));
    // the scanline being traced
    if (rows < H) for (let x = 0; x < W; x++) pic.rgb.set([0.9, 0.95, 1], (rows * W + x) * 3);
    text(pic, 4, 190, `RAYTRACE  LINE ${String(Math.min(rows, H)).padStart(3)} OF 200`, rgb(150, 230, 255));
    frames.push(pic);
  }
  for (let f = 0; f < 4; f++) frames.push(full);

  // B: Count Polygon swoops through; the gold sphere goes low-poly as he passes
  const SWOOP = 14;
  for (let f = 0; f < SWOOP; f++) {
    const t = f / (SWOOP - 1);
    const x = 6 - 10 * t;
    const y = -1.2 + Math.sin(t * Math.PI) * -0.8;
    const z = 2.6 - Math.sin(t * Math.PI) * 1.4;
    const count = place(C.count(0, f % 2), x, y, 3.2, Math.PI, z);
    const pic = still(world(count, 0, x > goldAt[0] + 0.5), camera, 4, 20, 21);
    if (f > SWOOP / 2) centered(pic, 12, 'COUNT POLYGON', rgb(255, 120, 200), 2, { outline: rgb(30, 0, 40) });
    frames.push(pic);
  }
  // C: Ray wakes up: his bands light, and he rolls a little toward us
  for (let f = 0; f < 6; f++) {
    const k = (f + 1) / 6;
    const pic = still(world([], k, false, 0.5 + f * 0.25), camera, 4, 20, 21);
    if (f >= 2) centered(pic, 12, 'RAY', rgb(255, 210, 120), 2, { outline: rgb(40, 20, 0) });
    frames.push(pic);
  }
  // D: the logo spins in from the distance, then a highlight sweeps it
  const FLY = 12;
  for (let f = 0; f < FLY; f++) {
    const e = easeOut(f / (FLY - 1));
    const logo = logoShapes([0, 0.4 + 40 * (1 - e), 1.0 + 1.2 * (1 - e)], 1.45, -Math.PI * 2 * (1 - e), -0.38);
    frames.push(still(world([logo], 1, false, 2), camera, 4, 20, 21));
  }
  const rest = frames[frames.length - 1];
  const SWEEP = 6;
  for (let f = 0; f < SWEEP; f++) {
    const pic: Picture = { w: W, h: H, rgb: rest.rgb.slice() };
    const fx = 70 + (f / (SWEEP - 1)) * 190;
    flare(pic, fx, 52 + Math.sin(f) * 4, Math.sin((Math.PI * (f + 0.5)) / SWEEP) * 0.8);
    frames.push(pic);
  }
  const last: Picture = { w: W, h: H, rgb: rest.rgb.slice() };
  bloom(last, 0.9, 2.5, 0.5);
  centered(last, 184, 'NO GLASSES REQUIRED.', rgb(255, 255, 255), 1, { outline: rgb(20, 16, 50) });
  for (let f = 0; f < 10; f++) frames.push(last);
  return { frames, speed: 7 };
}

/** The frames as an FLI: one palette for all of them, ordered dither so still parts stay still. */
export function toFli(frames: Picture[], speed: number, fadeIn = 3, fadeOut = 4): Uint8Array {
  const byPic = new Map<Picture, Uint8Array>();
  const bytes = frames.map((p) => {
    let b = byPic.get(p);
    if (!b) byPic.set(p, (b = toBytes(p)));
    return b;
  });
  // only the distinct frames choose the colors
  const distinct = [...byPic.values()];
  const pal = new Uint8Array(768);
  putColors(pal, 0, medianCut(distinct, 256));
  const m = new Matcher(
    pal,
    Array.from({ length: 256 }, (_, i) => i),
  );
  const cache = new Map<Uint8Array, Uint8Array>();
  const indexed = bytes.map((b) => {
    let v = cache.get(b);
    if (!v) cache.set(b, (v = m.ordered(b, W, H, 6)));
    return v;
  });
  const palettes = indexed.map((_, f) => {
    const k = f < fadeIn ? (f + 1) / (fadeIn + 1) : f >= indexed.length - fadeOut ? (indexed.length - 1 - f) / fadeOut : 1;
    return pal.map((v) => Math.round(v * k));
  });
  return encodeFli(indexed, pal, { speed, palettes });
}

export type { Frame };
