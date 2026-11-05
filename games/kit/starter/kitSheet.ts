// The Kit design sheet: old Kit (the hero files at git revision OLD, default 4ce8760c2^) vs new, side and top-down at
// 1x, 2x and 4x, and Kit plus every helper with a name tag (the last is Kit with a coral hoodie).
//   cd web && npx vite-node ../games/kit/starter/kitSheet.ts <outDir> [oldRevision]
import { execSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { buildStarterPalette } from './palette';
import { buildHeroBlocks, heroPicture } from './hero';
import { buildTopHeroBlocks } from './topHero';
import { helperPalettes, nameBlock, nameBlockIds, recolor, NAME_BLOCK_IDS, KIT_LOOK, KIT_CORAL } from './heroLook';

const out = process.argv[2];
const here = dirname(fileURLToPath(import.meta.url));
const rev = process.argv[3] ?? '4ce8760c2^';
const temp = ['hero', 'topHero'].map((f) => join(here, `zzOld${f}.ts`));
['hero', 'topHero'].forEach((f, i) => writeFileSync(temp[i], execSync(`git show ${rev}:games/kit/starter/${f}.ts`, { cwd: here }).toString()));
let oldHero: typeof buildHeroBlocks, oldTop: typeof buildTopHeroBlocks;
try {
  oldHero = (await import(/* @vite-ignore */ temp[0])).buildHeroBlocks;
  oldTop = (await import(/* @vite-ignore */ temp[1])).buildTopHeroBlocks;
} finally {
  temp.forEach((f) => rmSync(f, { force: true }));
}
mkdirSync(out, { recursive: true });
const pal = buildStarterPalette();
// sheet palette: indexed by unique RGB
const sheetPal = new Uint8Array(768);
const idx = new Map<string, number>();
let n = 0;
const col = (r: number, g: number, b: number) => {
  const k = `${r},${g},${b}`;
  let i = idx.get(k);
  if (i === undefined) {
    i = n++;
    if (i > 254) throw new Error('too many colors');
    idx.set(k, i);
    sheetPal.set([r >> 2, g >> 2, b >> 2], i * 3);
  }
  return i;
};
const rgbOf = (p: Uint8Array, c: number) =>
  [(p[c * 3] << 2) | (p[c * 3] >> 4), (p[c * 3 + 1] << 2) | (p[c * 3 + 1] >> 4), (p[c * 3 + 2] << 2) | (p[c * 3 + 2] >> 4)] as const;
const BG = col(236, 238, 246);
const INK = col(30, 30, 50);
const W = 640,
  H = 600;
const sheet = new Pixels(W, H, BG);
const put = (img: Pixels, palette: Uint8Array, x: number, y: number, s: number) => {
  for (let j = 0; j < img.h; j++)
    for (let i = 0; i < img.w; i++) {
      const c = img.get(i, j);
      if (c === 255) continue;
      sheet.rect(x + i * s, y + j * s, s, s, col(...rgbOf(palette, c)));
    }
};
const text = (s: string, x: number, y: number) => {
  [...s].forEach((ch, i) => {
    for (let j = 0; j < 8; j++) {
      const b = FONT8X8[ch.charCodeAt(0) * 8 + j];
      for (let k = 0; k < 8; k++) if (b & (1 << k)) sheet.set(x + i * 8 + k, y + j, INK);
    }
  });
};
const nb = buildHeroBlocks(pal),
  ob = oldHero(pal),
  nt = buildTopHeroBlocks(pal),
  ot = oldTop(pal);
const sideN = heroPicture(nb, 'stand.top', 'stand'),
  sideO = heroPicture(ob, 'stand.top', 'stand');
const cheerN = heroPicture(nb, 'cheer.top', 'jump'),
  cheerO = heroPicture(ob, 'cheer.top', 'jump');
const climbN = heroPicture(nb, 'back.top', 'climb0'),
  climbO = heroPicture(ob, 'back.top', 'climb0');
const tops = ['down.stand', 'up.stand', 'right.stand'];
text('BEFORE', 10, 6);
text('AFTER', 330, 6);
const row = (o: boolean, x: number, y: number, s: number) => {
  const side = o ? [sideO, cheerO, climbO] : [sideN, cheerN, climbN];
  const t = o ? ot : nt;
  let cx = x;
  for (const p of side) {
    put(p, pal.pal, cx, y, s);
    cx += 20 * s + 6;
  }
  for (const k of tops) {
    put(t.pics.get(k)!, pal.pal, cx, y + 20 * s, s);
    cx += 20 * s + 6;
  }
};
// 1x row small, 4x row large
row(true, 10, 18, 1);
row(false, 330, 18, 1);
row(true, 10, 64, 2);
row(false, 330, 64, 2);
text('4X', 10, 200);
text('4X', 330, 200);
put(sideO, pal.pal, 10, 212, 4);
put(t(ot), pal.pal, 100, 292, 4);
function t(b: typeof ot) {
  return b.pics.get('down.stand')!;
}
put(ot.pics.get('right.stand')!, pal.pal, 190, 292, 4);
put(sideN, pal.pal, 330, 212, 4);
put(nt.pics.get('down.stand')!, pal.pal, 420, 292, 4);
put(nt.pics.get('right.stand')!, pal.pal, 510, 292, 4);
// helpers
text('HELPERS: THE SAME BLOCKS, A DIFFERENT PALETTE (LAST: KIT WITH A CORAL HOODIE)', 10, 390);
const all = [{ name: 'KIT', about: '', look: KIT_LOOK }, ...helperPalettes, { name: 'KIT', about: 'coral hoodie', look: KIT_CORAL }];
all.forEach((h, i) => {
  const p2 = recolor(pal, h.look);
  const hp = heroPicture(nb, 'stand.top', 'stand');
  const x = 10 + (i % 5) * 126,
    y = 404 + Math.floor(i / 5) * 98;
  put(hp, p2, x, y, 2);
  put(nt.pics.get('down.stand')!, p2, x + 44, y + 40, 1);
  // name tag from blocks, at 1x
  nameBlockIds(h.name).forEach((id, j) => put(nameBlock(pal, id), pal.pal, x + 44 + j * 20, y, 1));
});
console.log('blocks', NAME_BLOCK_IDS.length, 'colors', n);
const final = new Pixels(W, H, BG);
final.px.set(sheet.px);
writePng(`${out}/kit-sheet.png`, final, sheetPal, 2);
