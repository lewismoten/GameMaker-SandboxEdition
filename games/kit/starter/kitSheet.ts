// The Kit design sheet (v3): every side-view pose for Kit and every helper at 1x, Kit's poses at 4x, the slim
// top-down and diagonal facings, and the size ladder (near, far, very far). A design preview, never part of a disk.
//   cd web && npx vite-node ../games/kit/starter/kitSheet.ts <out.png>
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';
import { crc32 } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { helperPalettes, KIT_LOOK, nameBlock, nameBlockIds, recolor } from './heroLook';
import { atSize, type Size } from './kitSizes';
import { sidePoses, wholePose } from './kitPoses';
import { SLIM_FACINGS, slimPose } from './kitSlim';
import { buildStarterPalette } from './palette';

const W = 1140;
const H = 1290;
const BG = [236, 238, 246];
const px = new Uint8Array(W * H * 3);
for (let i = 0; i < W * H; i++) px.set(BG, i * 3);
const dot = (x: number, y: number, rgb: readonly number[]) => {
  if (x >= 0 && y >= 0 && x < W && y < H) px.set(rgb, (y * W + x) * 3);
};
const rgbAt = (pal: Uint8Array, c: number) => [0, 1, 2].map((k) => (pal[c * 3 + k] << 2) | (pal[c * 3 + k] >> 4));
/** Draws a picture through a palette at a scale; clear pixels show the sheet. */
function put(img: Pixels, pal: Uint8Array, x: number, y: number, s: number): void {
  for (let j = 0; j < img.h; j++)
    for (let i = 0; i < img.w; i++) {
      const c = img.get(i, j);
      if (c === 255) continue;
      const rgb = rgbAt(pal, c);
      for (let b = 0; b < s * s; b++) dot(x + i * s + (b % s), y + j * s + Math.floor(b / s), rgb);
    }
}
function text(s: string, x: number, y: number): void {
  [...s].forEach((ch, i) => {
    for (let j = 0; j < 8; j++) for (let k = 0; k < 8; k++) if (FONT8X8[ch.charCodeAt(0) * 8 + j] & (1 << k)) dot(x + i * 8 + k, y + j, [30, 30, 50]);
  });
}

const pal = buildStarterPalette();
const ink = pal.c('ink', 0);
const people = [{ name: 'KIT', look: KIT_LOOK }, ...helperPalettes];
const palettes = people.map((h) => recolor(pal, h.look));
const poses = sidePoses(pal);

// A: every pose, every person, 1x (the palette changes; the blocks don't)
let y = 8;
text('ALL POSES, ALL HELPERS (1X)', 10, y);
y += 12;
people.forEach((h, row) => {
  nameBlockIds(h.name).forEach((id, j) => put(nameBlock(pal, id), palettes[row], 4 + j * 20, y + row * 44, 1));
  poses.forEach((p, i) => put(wholePose(p), palettes[row], 50 + i * 22, y + row * 44, 1));
});
y += people.length * 44 + 6;
const names = poses.map((p) => p.name.toUpperCase());
text(names.slice(0, 13).join(' '), 10, y);
text(names.slice(13).join(' '), 10, y + 10);
y += 24;

// B: Kit and one helper at 4x
text('KIT AT 4X', 10, y);
y += 12;
const per = 13;
for (let r = 0; r * per < poses.length; r++) {
  poses.slice(r * per, (r + 1) * per).forEach((p, i) => put(wholePose(p), palettes[0], 10 + i * 84, y, 4));
  y += 166;
}
text('NOVA (GREEN ALIEN) AT 4X', 10, y);
y += 12;
poses.slice(0, per).forEach((p, i) => put(wholePose(p), palettes[6], 10 + i * 84, y, 4));
y += 166;

// C: slim facings: stand and a stride, 3x
text('SLIM FACINGS: DOWN UP RIGHT LEFT, DR DL UR UL (STAND, STEP) 3X', 10, y);
y += 12;
SLIM_FACINGS.forEach((f, i) => {
  put(slimPose(pal, f, 2), palettes[0], 10 + i * 140, y, 3);
  put(slimPose(pal, f, 0), palettes[0], 10 + i * 140 + 64, y, 3);
});
y += 66;
SLIM_FACINGS.forEach((f, i) => {
  put(slimPose(pal, f, 2), palettes[6], 10 + i * 140, y, 1);
  put(slimPose(pal, f, 0), palettes[1], 10 + i * 140 + 24, y, 1);
});
y += 26;

// D: the size ladder, 1x and 4x
text('NEAR, FAR, VERY FAR (1X THEN 4X)', 10, y);
y += 12;
let x = 10;
for (const [pi, who] of [
  [0, 0],
  [0, 6],
  [4, 0],
] as const) {
  for (const size of ['near', 'far', 'veryFar'] as Size[]) {
    const pic = atSize(wholePose(poses[pi === 4 ? 4 : 0]), size, ink);
    put(pic, palettes[who], x, y + 120, 1);
    put(pic, palettes[who], x + 22, y, 4);
    x += 106;
  }
}
const cap = (s: string) => text(s, 10, y + 130);
cap('');

// write the RGB PNG
const raw = new Uint8Array((W * 3 + 1) * H);
for (let r = 0; r < H; r++) raw.set(px.subarray(r * W * 3, (r + 1) * W * 3), r * (W * 3 + 1) + 1);
const chunk = (type: string, data: Uint8Array) => {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
};
const ihdr = new Uint8Array(13);
new DataView(ihdr.buffer).setUint32(0, W);
new DataView(ihdr.buffer).setUint32(4, H);
ihdr.set([8, 2, 0, 0, 0], 8);
const parts = [Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', new Uint8Array(0))];
writeFileSync(process.argv[2], Buffer.concat(parts));
console.log('wrote', process.argv[2], 'poses', poses.length);
