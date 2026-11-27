// Starter map pictures with their surroundings, as the player sees them: each level of the
// Starters drawn with the sky, the ground and any walls around it (9 blocks at the sides, 5 above),
// as PNGs. Used to look for walls that are not drawn.
//   cd web && npx vite-node ../games/kit/starter/mapShots.ts <outDir> [id ...]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { finishMonsterPictures, monsterPictures, monsterSet } from '../../meet-the-monsters/src/monsters';
import type { Book } from './book';
import type { Pal } from './palette';
import { ORIGIN, type StarterMap } from './map';
import { buildMonsterBlocks, buildMonsters } from './monsters';

type ShotLevel = { file: string; map: StarterMap };
type LevelModule = { buildLevels(): { book: Book; pal: Pal; levels?: ShotLevel[]; rooms?: ShotLevel[] } };

function monsterAssets(id: string, pal: Pal) {
  if (id === 'meet-the-monsters') {
    const mb = monsterPictures(pal);
    return { mbl: finishMonsterPictures(mb), monsters: monsterSet(mb) };
  }
  const mb = buildMonsterBlocks(pal);
  return { mbl: mb.finish(), monsters: buildMonsters(mb) };
}

const LOADERS: Record<string, () => Promise<LevelModule>> = {
  'first-steps': () => import('../../first-steps/src/levels'),
  'keys-and-doors': () => import('../../keys-and-doors/src/levels'),
  'meet-the-monsters': () => import('../../meet-the-monsters/src/levels'),
  'room-to-room': () => import('../../room-to-room/src/levels'),
  'coins-and-score': () => import('../../coins-and-score/src/levels'),
  'watch-your-step': () => import('../../watch-your-step/src/levels'),
};

const out = process.argv[2];
if (!out) throw new Error('Usage: mapShots.ts <outDir> [id ...]');
const only = process.argv.slice(3);
for (const id of only) if (!Object.hasOwn(LOADERS, id)) throw new Error(`Unknown Starter ID: ${id}`);
mkdirSync(out, { recursive: true });
for (const id of Object.keys(LOADERS).filter((s) => !only.length || only.includes(s))) {
  const mod = await LOADERS[id]();
  const { book, pal, levels, rooms } = mod.buildLevels();
  const bbl = book.finish();
  const { mbl, monsters } = monsterAssets(id, pal);
  for (const l of levels ?? rooms ?? []) {
    const m = l.map.done();
    const pic = renderRegion(m, bbl, mbl, monsters, ORIGIN - 9, ORIGIN - 5, l.map.width + 18, l.map.height + 5);
    writePng(join(out, `${id}-${l.file}.png`), pic, pal.pal, 1);
  }
}
