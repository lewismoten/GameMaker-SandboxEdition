// Pictures of the lessons (never on the disk), for the progress shots: the four bytes of Play and their
// gate, the two slots of level 2 (START already jammed), the backup gate, and the signs of level 3.
//   cd web && npx vite-node ../games/under-the-hood/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { buildLevels, GROUND, LEDGE } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(pal);

type Sprite = { pixels: Uint8Array; x: number; y: number };
/** The hero standing in column `col` (in the level) on row `ground`, in `pose`, as two sprites for renderRegion. */
const kit = (pose: [string, string], col: number, ground = GROUND): Sprite[] => {
  const h = heroPicture(hero, pose[0], pose[1]);
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + ground - 2 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + ground - 1 },
  ];
};
const region = (level: number, col: number, row: number, w: number, h: number, extra: Sprite[], edit?: (m: ReturnType<StarterMapDone>) => void) => {
  const l = levels[level];
  const m = structuredClone(l.map.done());
  edit?.(m);
  return renderRegion(m, l.book.finish(), mbl, set, ORIGIN + col, ORIGIN + row, w, h, extra);
};
type StarterMapDone = () => ReturnType<(typeof levels)[number]['map']['done']>;
const save = (name: string, pic: ReturnType<typeof region>) => writePng(join(out, name), pic, pal.pal, 3);

save('1-four-bytes.png', region(0, 14, 2, 16, 9, kit(['stand.top', 'stand'], 19)));
save('2-play-gate.png', region(0, 25, 2, 16, 9, kit(['stand.top', 'stand'], 31)));
const jam = levels[1].book.n('jamPlate');
save(
  '3-two-slots.png',
  region(1, 14, 1, 16, 10, kit(['stand.top', 'stand'], 23, LEDGE), (m) => {
    m.blocks[(GROUND - 1 + ORIGIN) * 100 + 25 + ORIGIN] = jam;
  }),
);
save('4-backup-gate.png', region(2, 3, 2, 16, 9, kit(['stand.top', 'stand'], 9)));
save('5-ask-first.png', region(2, 20, 2, 18, 9, kit(['stand.top', 'stand'], 26)));
