// Pictures of the lessons (never on the disk), for the progress shots: in level 1 Kit stopped at
// the three-slot gate with two tokens, then the third token on its ledge; in level 2 the five-slot
// gate that is the exit.
//   cd web && npx vite-node ../games/word-lock/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { buildLevels } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const GROUND = 10;
const { book, pal, levels } = buildLevels();
const bbl = book.finish();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(pal);

type Sprite = { pixels: Uint8Array; x: number; y: number };
/** Kit standing in column `col` (in the level) in `pose`, as two sprites for renderRegion. */
const kit = (pose: [string, string], col: number): Sprite[] => {
  const h = heroPicture(hero, pose[0], pose[1]);
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + GROUND - 2 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + GROUND - 1 },
  ];
};
const region = (level: number, col: number, row: number, w: number, extra: Sprite[]) =>
  renderRegion(levels[level].map.done(), bbl, mbl, set, ORIGIN + col, ORIGIN + row, w, 8, extra);
const save = (name: string, pic: ReturnType<typeof region>) => writePng(join(out, name), pic, pal.pal, 3);

save('1-two-tokens-shut.png', region(0, 8, 4, 22, kit(['stand.top', 'stand'], 26)));
save('2-third-token.png', region(0, 14, 0, 16, kit(['cheer.top', 'jump'], 22)));
save('3-five-slot-exit.png', region(1, 26, 4, 18, kit(['stand.top', 'stand'], 38)));
