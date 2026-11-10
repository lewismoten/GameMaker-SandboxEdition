// Host-side check of the Pocket Player's level colors (gamemaker-pocket src/main.cpp). Mirrors
// its palette math (VGA 6 bit -> 8 bit -> RGB565 -> panel byte order) and 1.5x block scaling, models
// the ST7796 reading each pushed value's bytes low byte first as big-endian RGB565, and compares
// with the engine's own render of the same cells. Writes expected | new firmware | old firmware
// side by side to a PNG and exits 1 when the new firmware's colors are off.
//   cd web && npx vite-node scripts/pocketColorCheck.ts <out.png>
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { crc32 } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { vga8 } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';

const d = '../games/first-steps/disk/'; // the unpacked files the Pocket Player packs (pocketData.ts)
const map = parseMap(new Uint8Array(readFileSync(d + 'walk.map')));
const bbl = parseBlocks(new Uint8Array(readFileSync(d + 'steps.bbl')), 150);
const pal = new Uint8Array(readFileSync(d + 'steps.pal'));
const OX = 11,
  OY = 12,
  TILE = 30;

// level.h: v8, then 565 (the firmware's `pal[]` values), swapped for the panel in the new firmware.
const c565 = (r: number, g: number, b: number) => ((r & 0xf8) << 8) | ((g & 0xfc) << 3) | (b >> 3);
const swap = (v: number) => ((v << 8) | (v >> 8)) & 0xffff;
const fw = (i: number, swapped: boolean) => {
  const v = c565(vga8(pal[i * 3]), vga8(pal[i * 3 + 1]), vga8(pal[i * 3 + 2]));
  return swapped ? swap(v) : v;
};
// The panel gets the value's bytes low first and reads them as high-then-low RGB565.
const panel = (v: number): number[] => {
  const w = swap(v);
  const r = (w >> 11) & 31,
    g = (w >> 5) & 63,
    b = w & 31;
  return [(r << 3) | (r >> 2), (g << 2) | (g >> 4), (b << 3) | (b >> 2)];
};

const W = 16 * TILE,
  H = 10 * TILE;
const exp = renderRegion(map, bbl, [], [], OX, OY, 16, 10); // 320x200 palette indices
const shots: Uint8Array[] = [0, 1, 2].map(() => new Uint8Array(W * H * 3));
let worst = 0;
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const idx = exp.px[Math.floor((y * 2) / 3) * 320 + Math.floor((x * 2) / 3)];
    const e = [0, 1, 2].map((k) => vga8(pal[idx * 3 + k]));
    const outs = [e, panel(fw(idx, true)), panel(fw(idx, false))];
    outs.forEach((c, s) => shots[s].set(c, (y * W + x) * 3));
    for (let k = 0; k < 3; k++) worst = Math.max(worst, Math.abs(outs[1][k] - e[k]));
  }
// Side by side with 8 px gaps.
const G = 8,
  TW = W * 3 + G * 2;
const img = new Uint8Array(TW * H * 3).fill(40);
shots.forEach((s, n) => {
  for (let y = 0; y < H; y++) img.set(s.subarray(y * W * 3, (y + 1) * W * 3), (y * TW + n * (W + G)) * 3);
});
const raw = new Uint8Array((TW * 3 + 1) * H);
for (let y = 0; y < H; y++) raw.set(img.subarray(y * TW * 3, (y + 1) * TW * 3), y * (TW * 3 + 1) + 1);
const chunk = (t: string, b: Uint8Array) => {
  const o = new Uint8Array(12 + b.length);
  const dv = new DataView(o.buffer);
  dv.setUint32(0, b.length);
  for (let i = 0; i < 4; i++) o[4 + i] = t.charCodeAt(i);
  o.set(b, 8);
  dv.setUint32(8 + b.length, crc32(o.subarray(4, 8 + b.length)));
  return o;
};
const ihdr = new Uint8Array(13);
new DataView(ihdr.buffer).setUint32(0, TW);
new DataView(ihdr.buffer).setUint32(4, H);
ihdr.set([8, 2, 0, 0, 0], 8);
const parts = [Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', new Uint8Array(0))];
writeFileSync(process.argv[2] ?? 'expected-vs-firmware.png', Buffer.concat(parts));
// 565 keeps 5 or 6 bits, so a channel can differ by up to 7 from the 8 bit original.
console.log(`worst channel difference, new firmware vs engine render: ${worst} (565 rounding allows up to 7)`);
process.exit(worst <= 7 ? 0 : 1);
