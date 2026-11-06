// Checks the seven palettes and how the scenes use them, on the built disk:
//   - the three door scenes of a level load the same map and block file, and only the palette differs
//   - the seven .PAL files on the disk are the ones built, they all differ, and they differ only in
//     the four ramps made to change (carpet, paper, roof, cloth): every other slot, the designer and
//     text colors included, is the same in all of them
//   - Kit's orange and teal keep some contrast against each palette's wall and floor (a suggestion)
//   cd web && npx vite-node ../games/same-house/tools/paletteCheck.ts
import { readFileSync } from 'node:fs';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { PAL_NAMES, buildLevels } from '../src/levels';
import { hubScene, roomScene } from '../src/game';

const disk = new URL('../disk/', import.meta.url);
const read = (f: string) => new Uint8Array(readFileSync(new URL(f, disk)));
const game = parseGame(read('samehs.gam'));
const { pal, pals, levels } = buildLevels();
let bad = 0;
const fail = (msg: string) => {
  console.error(`paletteCheck: ${msg}`);
  bad++;
};

levels.forEach((l, i) => {
  const first = game.scenes[roomScene(i, 0)].files;
  l.room.pals.forEach((name, k) => {
    const f = game.scenes[roomScene(i, k)].files;
    if (f[0] !== `${name}.pal`) fail(`scene ${roomScene(i, k)} should load ${name}.pal, not ${f[0]}`);
    if (f[1] !== first[1] || f[2] !== first[2]) fail(`scene ${roomScene(i, k)} should load the same map and blocks as its level's first door`);
  });
  const hub = game.scenes[hubScene(i)].files;
  if (hub[0] !== 'street.pal') fail(`hub scene ${hubScene(i)} should load street.pal, not ${hub[0]}`);
});

const changing = new Set(pals.changing);
for (const a of PAL_NAMES) {
  const bytes = read(`${a}.pal`);
  for (let b = 0; b < 768; b++) if (bytes[b] !== pals.files[a][b]) fail(`${a}.pal on the disk differs from the palette at byte ${b}`);
  for (const other of PAL_NAMES) {
    if (other <= a) continue;
    const o = pals.files[other];
    let same = true;
    for (let s = 0; s < 256; s++) {
      const diff = [0, 1, 2].some((j) => pals.files[a][s * 3 + j] !== o[s * 3 + j]);
      if (diff && !changing.has(s)) fail(`${a}.pal and ${other}.pal differ in slot ${s}, which is not one of the four ramps`);
      if (diff) same = false;
    }
    if (same) fail(`${a}.pal and ${other}.pal are the same`);
  }
}

// suggestions: contrast of Kit's hoodie and beanie with the wall and the floor
const lum = (bytes: Uint8Array, s: number): number => {
  const [r, g, b] = [0, 1, 2].map((j) => {
    const v = (bytes[s * 3 + j] * 255) / 63 / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (bytes: Uint8Array, a: number, b: number): number => {
  const [x, y] = [lum(bytes, a), lum(bytes, b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
for (const name of PAL_NAMES) {
  const bytes = pals.files[name];
  for (const [kit, kslot] of [
    ['orange', pal.c('orange', 2)],
    ['teal', pal.c('teal', 2)],
  ] as const)
    for (const [what, slot] of [
      ['wall', pal.c('paper', 1)],
      ['floor', pal.c('carpet', 2)],
    ] as const) {
      const r = ratio(bytes, kslot, slot);
      if (r < 1.3) console.log(`paletteCheck: suggestion: in ${name}.pal Kit's ${kit} is close to the ${what} (contrast ${r.toFixed(2)})`);
    }
}
if (bad) process.exit(1);
console.log(`paletteCheck ok: ${PAL_NAMES.length} palettes, ${changing.size} slots that change, a level's doors share one map and one block file`);
