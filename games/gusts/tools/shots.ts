// Pictures of the lessons (never on the disk), for the progress shots: the shaft calm, fluttering and in a gust, and the tunnel with its windsocks and shelter in the same three moods.
//   cd web && npx vite-node ../games/gusts/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { ORIGIN } from '../../kit/starter/map';
import { GROUND_ONE, GROUND_TWO, HUTS, SHAFT, SOCKS, TUNNEL, buildLevels, finishBlocks, ringBlock, type Level } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(pal);

type Sprite = { pixels: Uint8Array; x: number; y: number };
/** Kit standing in column `col` (in the level), his feet on row `feet`. */
const kit = (col: number, feet: number): Sprite[] => {
  const h = heroPicture(hero, 'stand.top', 'stand');
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + feet - 1 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + feet },
  ];
};

/** The level's map with every ring of `kinds` showing `mood`. */
function at(l: Level, kinds: string[], mood: string) {
  // a fresh copy of the level each time, so one picture's changes stay out of the next
  const m = buildLevels().levels[l.file === 'one' ? 0 : 1].map.done();
  for (const k of kinds)
    for (let i = 0; i < m.blocks.length; i++) if (m.blocks[i] === l.book.n(ringBlock(k, 'calm'))) m.blocks[i] = l.book.n(ringBlock(k, mood as 'calm'));
  return m;
}
const region = (l: Level, m: ReturnType<typeof at>, col: number, row: number, w: number, h: number, extra: Sprite[]) =>
  renderRegion(m, finishBlocks(l), mbl, set, ORIGIN + col, ORIGIN + row, w, h, extra);
const save = (name: string, pic: ReturnType<typeof region>) => writePng(join(out, name), pic, pal.pal, 3);
const [one, two] = levels;
const mid = SHAFT[0] + 1;

save('1-calm.png', region(one, at(one, ['up'], 'calm'), 10, 0, 16, 11, kit(mid, GROUND_ONE - 1)));
save('2-flutter.png', region(one, at(one, ['up'], 'flutter'), 10, 0, 16, 11, kit(mid, GROUND_ONE - 1)));
save('3-gust.png', region(one, at(one, ['up'], 'gust'), 10, 0, 16, 11, kit(mid, 6)));
const x0 = TUNNEL[0] + 2;
save('4-sock-calm.png', region(two, at(two, ['side', 'sock'], 'calm'), x0, 2, 16, 11, kit(HUTS[0] + 1, GROUND_TWO - 1)));
save('5-sock-flutter.png', region(two, at(two, ['side', 'sock'], 'flutter'), x0, 2, 16, 11, kit(HUTS[0] + 1, GROUND_TWO - 1)));
save('6-sock-gust.png', region(two, at(two, ['side', 'sock'], 'gust'), x0, 2, 16, 11, kit(HUTS[0] + 1, GROUND_TWO - 1)));
console.log(`shots in ${out}`);
void SOCKS;
