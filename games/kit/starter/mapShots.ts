// Starter map pictures with their surroundings, as the player sees them: each level of the
// Starters drawn with the sky, the ground and any walls around it (9 blocks at the sides, 5 above),
// as PNGs. Used to look for walls that are not drawn.
//   cd web && npx vite-node ../games/kit/starter/mapShots.ts <outDir> [id ...]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN, type StarterMap } from './map';
import { buildMonsterBlocks, buildMonsters } from './monsters';

const LOADERS: Record<string, () => Promise<unknown>> = {
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
mkdirSync(out, { recursive: true });
for (const id of Object.keys(LOADERS).filter((s) => !only.length || only.includes(s))) {
  const mod = (await LOADERS[id]()) as {
    buildLevels(): { book: { finish(): never[]; index: Map<string, number> }; pal: { pal: Uint8Array | number[] }; levels?: { file: string; map: StarterMap }[]; rooms?: { file: string; map: StarterMap }[] };
  };
  const { book, pal, levels, rooms } = mod.buildLevels();
  const bbl = book.finish() as never;
  const mb = buildMonsterBlocks(pal as never);
  const mbl = mb.finish();
  for (const l of levels ?? rooms ?? []) {
    const m = l.map.done();
    const pic = renderRegion(m, bbl, mbl, buildMonsters(mb), ORIGIN - 9, ORIGIN - 5, l.map.width + 18, l.map.height + 5);
    writePng(join(out, `${id}-${l.file}.png`), pic, pal.pal as never, 1);
  }
}
void blockSheet;
