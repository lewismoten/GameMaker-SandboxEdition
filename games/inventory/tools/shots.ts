// Pictures of the lessons (never on the disk), for the progress shots: the real engine plays the walkthrough
// (headless) and the screen is saved at the key moments: the pack with crates in it, the stair, the pack with a flame
// and a star, a flame and a star flying. Also each level's whole map.
//   cd web && npx vite-node ../games/inventory/tools/shots.ts <outDir>
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { headlessCanvas, WalkRun } from '../../../web/src/walkthrough/runtime';
import type { Walkthrough } from '../../../web/src/walkthrough/format';
import { ORIGIN } from '../../kit/starter/map';
import { diskFiles } from '../../kit/walkthrough';
import { finishMonsterPictures, monsterPictures, monsterSet, FLAME, STAR } from '../src/monsters';
import { buildLevels } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });

// each level's whole map
const { book, pal, levels } = buildLevels();
const mb = monsterPictures(pal);
const bbl = book.finish();
const mbl = finishMonsterPictures(mb);
const set = monsterSet(mb);
levels.forEach((l, i) =>
  writePng(join(out, `level-${i + 1}.png`), renderRegion(l.map.done(), bbl, mbl, set, ORIGIN, ORIGIN, l.map.width, l.map.height), pal.pal, 2),
);

// the real engine's screen at the key moments of the walkthrough
const walk = JSON.parse(readFileSync(new URL('../walkthrough.json', import.meta.url), 'utf8')) as Walkthrough;
const run = new WalkRun(headlessCanvas(), diskFiles('inventory'), 'inv.gam', walk);
await run.start();
const s = run.session!;
const BACKBL = 150;
const save = (name: string) => {
  const m = run.m;
  const p = new Pixels(320, 200, 0);
  p.px.set(m.screen.pixels);
  // writePng takes the VGA's 6-bit palette, as the screen keeps it
  writePng(join(out, `${name}.png`), p, Uint8Array.from(m.screen.palette), 2);
  console.log(`  ${name}`);
};
const wanted = new Map<string, number>(); // name -> frames to wait before saving
const done = new Set<string>();
const ask = (name: string, wait: number) => {
  if (!done.has(name) && !wanted.has(name)) wanted.set(name, wait);
};
let pickerOpen = 0;
let lastPoll = -99;
const orig = run.m.keyPollOnce;
run.m.keyPollOnce = () => {
  if (run.frame - lastPoll > 3) {
    pickerOpen++;
    if (pickerOpen === 1) save('one-2-the-pack-holds-three-crates');
    if (pickerOpen === 4) save('two-2-the-pack-holds-a-flame-and-a-star');
  }
  lastPoll = run.frame;
  return orig?.() ?? [];
};
s.onFrame = (w) => {
  const packed = [...w.ci.inv].filter((b) => b !== BACKBL).length;
  if (packed === 1) ask('one-1-a-crate-in-the-pack', 12);
  if (packed === 0 && pickerOpen === 3) ask('one-3-a-stair-of-crates', 60);
  if (w.mm.some((m) => m.monnum === FLAME)) ask('two-1-a-flame-flies', 3);
  if (w.mm.some((m) => m.monnum === STAR)) ask('two-3-a-star-flies', 3);
  for (const [name, wait] of wanted) {
    if (wait <= 0) {
      save(name);
      wanted.delete(name);
      done.add(name);
    } else wanted.set(name, wait - 1);
  }
};
while (await run.step(true));
run.stop();
console.log(`shots in ${out}`);
