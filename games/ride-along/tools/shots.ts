// Pictures of the lessons (never on the disk), for the progress shots: the hero walking up to the parked rocket,
// the rocket at the start of its shaft, held by the first gate of rocks, caught at the funnel to the bay, and the
// canoe among the logs.
//   cd web && npx vite-node ../games/ride-along/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { buildLevels, ROCK_GATES } from '../src/levels';
import { finishRide } from '../src/rideBlocks';
import { canoe, rocket } from '../src/shipArt';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(pal);

type Sprite = { pixels: Uint8Array; x: number; y: number };
/** A 20x40 picture standing with its bottom block on level row `row`, in level column `col`, as two sprites for renderRegion. */
const stand = (p: Pixels, col: number, row: number): Sprite[] => [
  { pixels: Uint8Array.from(p.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + row - 1 },
  { pixels: Uint8Array.from(p.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + row },
];
const region = (level: number, col: number, row: number, w: number, h: number, extra: Sprite[]) => {
  const l = levels[level];
  return renderRegion(l.map.done(), finishRide(l.book), mbl, set, ORIGIN + col, ORIGIN + row, w, h, extra);
};
const save = (name: string, pic: ReturnType<typeof region>) => writePng(join(out, name), pic, pal.pal, 3);

save('1-the-rocket.png', region(0, 24, 1, 16, 10, stand(heroPicture(hero, 'stand.top', 'stand'), 31, 9)));
save('2-lift-off.png', region(1, 0, 61, 16, 10, stand(rocket(pal, true, 0), 7, 69)));
save('3-held-by-rocks.png', region(1, 0, 35, 16, 10, stand(rocket(pal, true, 1), 7, ROCK_GATES[0].y + 2)));
save('4-steering-round.png', region(1, 0, 33, 16, 10, stand(rocket(pal, true, 0), 4, 40)));
save('5-the-bay.png', region(1, 0, 0, 16, 10, stand(rocket(pal, true, 1), 7, 8)));
save('6-the-river.png', region(2, 0, 38, 16, 10, stand(canoe(pal, 1, false), 8, 47)));
save('7-logs.png', region(2, 0, 21, 16, 10, stand(canoe(pal, 0, true), 4, 29)));
