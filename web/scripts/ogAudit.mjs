// Audits a built site's og/*.png preview pictures (scripts/ogImage.ts): 1200 x 630, under 300 KB,
// and a real picture of the game on the card (not the text-only card made when a game has no
// title picture), plus that no secret game has one. Usage: node web/scripts/ogAudit.mjs <dist>
// [secret-ids...]. Exits 1 on a finding. Reads only PNGs the generator writes (RGB, filters Sub/Up).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';

const [dist, ...secret] = process.argv.slice(2);
const MAX = 300 * 1024;
const dir = join(dist, 'og');
const findings = [];
let n = 0;
let total = 0;
for (const f of readdirSync(dir).filter((x) => x.endsWith('.png'))) {
  const buf = readFileSync(join(dir, f));
  n++;
  total += buf.length;
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  if (w !== 1200 || h !== 630) findings.push(`${f}: ${w}x${h}, not 1200x630`);
  if (buf.length > MAX) findings.push(`${f}: ${(buf.length / 1024).toFixed(0)} KB, over 300 KB`);
  const id = f.replace(/\.png$/, '');
  if (secret.includes(id)) findings.push(`${f}: a secret game has a preview picture`);
  if (buf.readUInt8(24) !== 8 || buf.readUInt8(25) !== 2) continue; // not the generator's own RGB PNG
  // rebuild the pixels of the picture area (right half of the card)
  const raw = inflateSync(Buffer.concat(chunks(buf, 'IDAT')));
  const stride = w * 3;
  const px = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)];
    for (let i = 0; i < stride; i++) {
      const v = raw[y * (stride + 1) + 1 + i];
      const left = i >= 3 ? px[y * stride + i - 3] : 0;
      const up = y > 0 ? px[(y - 1) * stride + i] : 0;
      px[y * stride + i] = ft === 0 ? v : ft === 1 ? (v + left) & 255 : ft === 2 ? (v + up) & 255 : -1;
    }
  }
  // a picture's frame and pixels differ from the card's plain background; a text-only card's right half is all background
  const bg = px.readUIntBE(10 * 3, 3);
  let diff = 0;
  let count = 0;
  for (let y = 100; y < 530; y += 2)
    for (let x = 620; x < 1150; x += 2) {
      count++;
      if (px.readUIntBE((y * w + x) * 3, 3) !== bg) diff++;
    }
  if (diff / count < 0.5) findings.push(`${f}: the picture area is ${Math.round((100 * (count - diff)) / count)}% plain background (a text-only card?)`);
}
function chunks(b, type) {
  const out = [];
  for (let at = 8; at < b.length;) {
    const len = b.readUInt32BE(at);
    if (b.toString('latin1', at + 4, at + 8) === type) out.push(b.subarray(at + 8, at + 8 + len));
    at += 12 + len;
  }
  return out;
}
console.log(`${n} pictures, ${(total / 1048576).toFixed(2)} MB, average ${(total / n / 1024).toFixed(0)} KB`);
console.log(findings.length ? findings.join('\n') : 'no findings');
process.exit(findings.length ? 1 : 0);
