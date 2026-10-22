// Checks that PLAYGAME's text lands on plain paper in a built game (see textfit.ts).
//   cd web && npx vite-node ../games/kit/textfitCheck.ts <id> [--png <dir>] [--all]
// Lists every text line that touches art or reads badly and exits 1 if there are any.
// --png writes each screen as the player sees it (art near text tinted magenta) to <dir>;
// --all writes every screen, not just the ones with issues.
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkTextScreen, H, readDisk, renderRgb, textScreens, W, type TextFitIssue } from './textfit';

/** A plain 24-bit PNG, scaled up `s` times. */
function rgbPng(file: string, rgb: Uint8Array, w: number, h: number, s = 2): void {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const chunk = (type: string, data: Uint8Array) => {
    const out = new Uint8Array(12 + data.length);
    const dv = new DataView(out.buffer);
    dv.setUint32(0, data.length);
    for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
    out.set(data, 8);
    let c = 0xffffffff;
    for (const b of out.subarray(4, 8 + data.length)) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    dv.setUint32(8 + data.length, (c ^ 0xffffffff) >>> 0);
    return out;
  };
  const [sw, sh] = [w * s, h * s];
  const raw = new Uint8Array((sw * 3 + 1) * sh);
  for (let y = 0; y < sh; y++)
    for (let x = 0; x < sw; x++) {
      const i = (Math.floor(y / s) * w + Math.floor(x / s)) * 3;
      raw.set(rgb.subarray(i, i + 3), y * (sw * 3 + 1) + 1 + x * 3);
    }
  const ihdr = new Uint8Array(13);
  new DataView(ihdr.buffer).setUint32(0, sw);
  new DataView(ihdr.buffer).setUint32(4, sh);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const parts = [Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', new Uint8Array(0))];
  writeFileSync(file, Buffer.concat(parts));
}

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--png');
if (!id) {
  console.log('usage: textfitCheck.ts <id> [--png <dir>] [--all]');
  process.exit(2);
}
const pngDir = args.includes('--png') ? args[args.indexOf('--png') + 1] : undefined;
const all = args.includes('--all');
const here = dirname(fileURLToPath(import.meta.url));
const files = readDisk(join(here, '..', id, 'disk'));
const issues: TextFitIssue[] = [];
const screens = textScreens(files);
if (pngDir) mkdirSync(pngDir, { recursive: true });
for (const s of screens) {
  const marks = new Uint8Array(W * H);
  const found = checkTextScreen(s, {}, marks);
  issues.push(...found);
  if (pngDir && (all || found.length)) rgbPng(join(pngDir, `${s.name.replace(/[^a-z0-9.]+/gi, '_')}.png`), renderRgb(s, marks), W, H);
}
for (const i of issues) console.log(`${i.screen}: "${i.text}" at (${i.x},${i.y}): ${i.problems.join(', ')}`);
console.log(`${id}: ${screens.length} text screens, ${issues.length} lines with issues`);
process.exit(issues.length ? 1 : 0);
