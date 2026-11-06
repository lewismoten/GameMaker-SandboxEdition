// Pictures of the hurt moment and of level 2 (never on the disk), for the progress shots: Kit
// meeting the snail (before), hurt by it (the hurt pose, the snail dazed and flickering), and the pit.
//   cd web && npx vite-node ../games/meet-the-monsters/tools/hurtShot.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildLevels } from '../src/levels';
import { finishMonsterPictures, monsterPictures, monsterSet, SHELLY_DAZED } from '../src/monsters';

const out = process.argv[2];
if (!out) throw new Error('usage: hurtShot.ts <outDir>');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = book.finish();
const mb = monsterPictures(pal);
const mbl = finishMonsterPictures(mb);
const set = monsterSet(mb);
const hero = buildHeroBlocks(pal);
const GROUND = 10;

// level 1 around the snail: Kit walks up, then is hurt (hurt pose) while the snail turns dazed
const m1 = levels[0].map.done();
const region = (map: typeof m1, mons: typeof set, col: number, w: number, extra: { pixels: Uint8Array; x: number; y: number }[] = []) =>
  renderRegion(map, bbl, mbl, mons, ORIGIN + col, ORIGIN + 4, w, 8, extra);
const kit = (pose: [string, string], col: number) => {
  const h = heroPicture(hero, pose[0], pose[1]);
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + 28 + col, y: ORIGIN + GROUND - 2 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + 28 + col, y: ORIGIN + GROUND - 1 },
  ];
};
writePng(join(out, 'hurt-1-before.png'), region(m1, set, 28, 12, kit(['stand.top', 'stand'], 2)), pal.pal, 3);
writePng(join(out, 'hurt-2-hurt.png'), region(m1, set, 28, 12, kit(['hurt.top', 'hurt'], 5)), pal.pal, 3);
// the same moment with the snail as its dazed twin (what it is for the next three seconds)
const dazed = set.map((s, i) => (i === 2 ? { ...set[SHELLY_DAZED] } : s));
writePng(join(out, 'hurt-3-dazed.png'), region(m1, dazed, 28, 12, kit(['stand.top', 'stand'], 6)), pal.pal, 3);

const m2 = levels[1].map.done();
writePng(join(out, 'level2-pit.png'), renderRegion(m2, bbl, mbl, set, ORIGIN + 8, ORIGIN + 3, 16, 9), pal.pal, 3);
console.log(`shots in ${out}`);
