// Pictures for the progress shots (never on the disk): the night hill, a throw, a pop with confetti,
// a lit house, a spam bot and the Big Repo, each in its level's sky.
//   cd web && npx vite-node ../games/stick-man-stars/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { recordCamera } from '@lewismoten/gamemaker-sandbox-tools/kit/cameraLog';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { heroPicture } from '../../kit/starter/hero';
import { buildStickBlocks } from '../src/stick';
import { ORIGIN } from '../../kit/starter/map';
import { finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';
import { GROUND, buildLevels } from '../src/levels';
import { play } from './play';
import { GameSim } from './sim';

// where the screen really was on the bot's way through the game (it rests in a new place after a climb or a drop)
const cam = await recordCamera(GameSim, () => play());
const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = book.finish();
const mb = monsterPictures(pal);
const mbl = finishMonsterPictures(mb);
const set = monsterSet(mb);
const hero = buildStickBlocks(pal);

type Sprite = { pixels: Uint8Array; x: number; y: number };
/** Stick Man standing in column `col` (in the level), `lift` blocks off the ground, in `pose`, as two sprites for renderRegion. */
const man = (pose: [string, string], col: number, lift = 0): Sprite[] => {
  const h = heroPicture(hero, pose[0], pose[1]);
  return [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + GROUND - 2 - lift },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + GROUND - 1 - lift },
  ];
};
/** A monster picture standing in column `col`, on the ground. */
const thing = (name: string, col: number): Sprite => ({ pixels: Uint8Array.from(mbl[mb.n(name)].pixels), x: ORIGIN + col, y: ORIGIN + GROUND - 1 });
/** The level's map with its monsters taken out (the picture adds the ones to show). */
const empty = (level: number) => {
  const m = levels[level].map.done();
  if (level) m.monsters = [];
  return m;
};
const save = (name: string, level: number, col: number, extra: Sprite[], w = 16, scale = 3, jump = false) =>
  writePng(
    join(out, name),
    renderRegion(empty(level), bbl, mbl, set, ORIGIN + col, jump ? ORIGIN + 2 : cam.top(level, extra), w, 10, extra),
    levels[level].pal.pal,
    scale,
  );

save('1-hill-night.png', 0, 10, man(['up.top', 'jumpup'], 17, 1), 24, 3, true);
save('2-throw.png', 1, 8, [...man(['cheer.top', 'throw1'], 12), thing('star0', 14), thing('cottage0', 17)]);
save('3-confetti.png', 1, 13, [...man(['stand.top', 'throw2'], 14), thing('confetticottage0', 17), thing('cottage0', 22)], 12, 5);
save('4-lit.png', 1, 13, [...man(['cheer2.top', 'cheer'], 14), thing('litcottage0', 17), thing('cottage0', 22)], 12, 5);
save('5-shy-tower.png', 2, 15, [...man(['cheer.top', 'throw1'], 19), thing('star1', 21), thing('tower0', 24)]);
save('6-spam-bot.png', 3, 26, [...man(['cheer.top', 'throw1'], 28), thing('star0', 30), thing('bot0', 33), thing('fake0', 35)]);
save('9-gate-sign.png', 0, 40, man(['stand.top', 'stand'], 42), 16);
save('7-big-repo.png', 3, 43, [...man(['stand.top', 'throw2'], 45), thing('big20', 56)]);
console.log(`shots in ${out}`);
