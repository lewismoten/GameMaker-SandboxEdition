// Renders two top-down photos of the Phone of the Future board (front and back) from the 3D viewer
// data in games/year2000/phone/viewer (parts.json + parts.bin): a small z-buffer rasterizer with flat
// shading. They are taped into Dex Dynamo's science report (manual/printables/dexReport*.ts).
// Run: npx vite-node scripts/phoneBoardPhotos.ts   (writes src/manual/printables/dexReport/board-front.png and board-back.png)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pngFromRgb } from '@lewismoten/gamemaker-sandbox-tools/kit/laserPreview';

const DIR = new URL('../../games/year2000/phone/viewer/', import.meta.url);
const OUT = new URL('../src/manual/printables/dexReport/', import.meta.url);
interface Part {
  kind: string;
  side: string;
  color: number[];
  pos: { offset: number; count: number };
  idx: { offset: number; count: number };
}
const meta = JSON.parse(readFileSync(new URL('parts.json', DIR), 'utf8')) as { floats: number; parts: Part[] };
const bin = readFileSync(new URL('parts.bin', DIR));
const f32 = new Float32Array(bin.buffer.slice(bin.byteOffset, bin.byteOffset + meta.floats * 4));
const rest = bin.subarray(meta.floats * 4);
const u32 = new Uint32Array(rest.buffer.slice(rest.byteOffset, rest.byteOffset + rest.length));

const PX = 8; // pixels per mm
const W = 99 * PX + 16;
const H = 99 * PX + 16;

function render(back: boolean): Uint8Array {
  const rgb = new Uint8Array(W * H * 3);
  const zb = new Float32Array(W * H).fill(-1e9);
  for (let i = 0; i < W * H; i++) {
    rgb[i * 3] = 0x2b;
    rgb[i * 3 + 1] = 0x2a;
    rgb[i * 3 + 2] = 0x26;
  }
  const L = [-0.35, -0.55, 0.75]; // light, toward the viewer
  const ln = Math.hypot(...L);
  for (const p of meta.parts) {
    // front view looks down from +y: higher y is nearer. The back view looks up: lower y is nearer, and x mirrors.
    const v = (k: number): [number, number, number] => {
      const o = p.pos.offset + k * 3;
      const x = f32[o],
        y = f32[o + 1],
        z = f32[o + 2];
      return [8 + (back ? 99 - x : x) * PX, 8 + z * PX, back ? -y : y];
    };
    for (let t = 0; t < p.idx.count; t += 3) {
      const a = v(u32[p.idx.offset + t]),
        b = v(u32[p.idx.offset + t + 1]),
        c = v(u32[p.idx.offset + t + 2]);
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl;
      ny /= nl;
      nz /= nl;
      if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const shade = 0.55 + 0.45 * Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / ln);
      const col = p.color.map((q) => Math.min(255, Math.round(255 * Math.pow(q, 0.8) * shade)));
      const minx = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]))), maxx = Math.min(W - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
      const miny = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]))), maxy = Math.min(H - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
      const den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
      if (Math.abs(den) < 1e-9) continue;
      for (let y = miny; y <= maxy; y++)
        for (let x = minx; x <= maxx; x++) {
          const px = x + 0.5, py = y + 0.5;
          const w0 = ((b[1] - c[1]) * (px - c[0]) + (c[0] - b[0]) * (py - c[1])) / den;
          const w1 = ((c[1] - a[1]) * (px - c[0]) + (a[0] - c[0]) * (py - c[1])) / den;
          const w2 = 1 - w0 - w1;
          if (w0 < -0.001 || w1 < -0.001 || w2 < -0.001) continue;
          const z = w0 * a[2] + w1 * b[2] + w2 * c[2];
          const k = y * W + x;
          if (z > zb[k]) {
            zb[k] = z;
            rgb[k * 3] = col[0];
            rgb[k * 3 + 1] = col[1];
            rgb[k * 3 + 2] = col[2];
          }
        }
    }
  }
  return rgb;
}

mkdirSync(OUT, { recursive: true });
for (const back of [false, true]) writeFileSync(new URL(back ? 'board-back.png' : 'board-front.png', OUT), pngFromRgb(W, H, render(back)));
console.log('done', W, H);
