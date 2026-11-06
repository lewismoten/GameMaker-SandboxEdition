// Checks that PLAYGAME's text lands on plain paper in a built game (see textfit.ts), and that the
// game's own words the player draws in play use no character 128-255, which DOS draws as
// scribbles (the Level check's dos-chars, web/src/editor/check/checks/dosChars.ts). Text pages are
// in the game's own ink when its player.json patches color.rgb.purple.
//   cd web && npx vite-node ../games/kit/textfitCheck.ts <id> [--png <dir>] [--all]
// Lists every text line that touches art, reads badly or DOS can't draw, and exits 1 if there are any.
// --png writes each screen as the player sees it (art near text tinted magenta) to <dir>;
// --all writes every screen, not just the ones with issues.
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cardOverflow,
  checkTextScreen,
  H,
  levelCards,
  readDisk,
  renderRgb,
  textScreens,
  W,
  type TextFitIssue,
} from '@lewismoten/gamemaker-sandbox-tools/kit/textfit';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { asciiFor, gwriteLines, highChars } from '../../web/src/editor/check/checks/dosChars';
import { readPlayer } from './player';

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
// the text pages' ink, when the game's player (player.json) recolors it
const ink = readPlayer(id)['color.rgb.purple'];
const screens = textScreens(files, Array.isArray(ink) ? (ink as [number, number, number]) : undefined);
if (pngDir) mkdirSync(pngDir, { recursive: true });
for (const s of screens) {
  const marks = new Uint8Array(W * H);
  const found = checkTextScreen(s, {}, marks);
  issues.push(...found);
  if (pngDir && (all || found.length)) rgbPng(join(pngDir, `${s.name.replace(/[^a-z0-9.]+/gi, '_')}.png`), renderRgb(s, marks), W, H);
}
// the heading drawn on a plain paper picture (games/kit/starter/screens.ts paper) must stay on the paper:
// its ink (the commonest color in the band that isn't the paper) may not appear beyond the paper's edges (x 22 to 298)
for (const s of screens) {
  const at = (x: number, y: number) => s.pixels[y * W + x];
  if (at(30, 100) !== at(290, 100) || at(30, 100) === at(5, 100)) continue; // not a paper page
  const count = new Map<number, number>();
  for (let y = 4; y < 36; y++) for (let x = 30; x < 290; x++) count.set(at(x, y), (count.get(at(x, y)) ?? 0) + 1);
  const ink = [...count].filter(([c]) => c !== at(30, 100)).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (ink === undefined) continue;
  let out = 0;
  for (let y = 4; y < 36; y++) for (let x = 0; x < W; x++) if ((x < 22 || x >= 298) && at(x, y) === ink) out++;
  if (out > 8) {
    const m: TextFitIssue = {
      screen: s.name,
      text: '(heading)',
      x: 0,
      y: 4,
      artPixels: out,
      contrast: 0,
      problems: [`the heading is wider than its paper (${out} pixels of its ink beyond the edges)`],
    };
    issues.push(m);
  }
}
for (const i of issues) console.log(`${i.screen}: "${i.text}" at (${i.x},${i.y}): ${i.problems.join(', ')}`);
// the pictures shown between levels have their words baked in: they must sit inside their box
// (an animation has no words baked in, and its sky or ground can look like a box to the measure)
const cards = levelCards(files);
for (const c of cards.filter((card) => !card.name.endsWith('.fli')))
  for (const p of cardOverflow(c)) {
    issues.push({ screen: c.name, text: '(card)', x: 0, y: 0, artPixels: 0, contrast: 0, problems: [p] });
    console.log(`${c.name}: (card): ${p}`);
  }
const gam = [...files.keys()].find((f) => f.endsWith('.gam'))!;
const lines = gwriteLines(parseGame(files.get(gam)!), { get: (n) => files.get(n.toLowerCase()) }, gam);
const high = lines.filter((l) => highChars(l.text).length);
for (const l of high)
  console.log(
    `${l.file}: "${l.text}": characters DOS can't draw in the game: ${highChars(l.text)
      .map((c) => `0x${c.toString(16)} (write "${asciiFor(c)}")`)
      .join(', ')}`,
  );
console.log(
  `${id}: ${screens.length} text screens, ${cards.length} level cards, ${issues.length} lines with issues; ${lines.length} lines drawn in play, ${high.length} with characters DOS can't draw`,
);
process.exit(issues.length || high.length ? 1 : 0);
