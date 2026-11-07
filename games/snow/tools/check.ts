// Engine-level acceptance and bounded reset checks for Snow Trails's built DOS disk.
import { LASTMON } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { StarterBot } from '../../kit/starter/bot';
import { buildLevels } from '../src/levels';
import { GameSim } from './sim';
import { play } from './play';
import { printsNow } from './route';

const { pal, levels } = buildLevels();
for (const l of levels) assertNoInvisibleWalls({ pal, book: l.book, levels: [l] });
const { sim } = await play();
if (sim.deaths || sim.ended !== 'won') throw new Error('the three lessons did not finish safely');
const { book } = levels[0];
const untouched = new GameSim().w.map.slice();
for (let n = 0; n < 4; n++) {
  const fresh = new GameSim();
  if (!fresh.w.map.every((v, i) => v === untouched[i])) throw new Error('new game retained a map change');
  const bot = new StarterBot(fresh);
  await bot.walk(19);
  const prints = fresh.w.map.filter((v) => v === book.n('footprints')).length;
  if (prints < 8) throw new Error(`expected a visible trail, got ${prints} print tiles`);
  for (let pass = 0; pass < 5; pass++) {
    await bot.walk(5);
    await bot.walk(19);
  }
  if (fresh.w.map.length !== 10000 || fresh.w.mm.some((m) => m.monnum !== LASTMON)) throw new Error('walking grew retained scene state');
  // Exercise PLAYGAME's real death/reload path as well as starting a new game. Nothing in this lesson hurts the hero.
  fresh.ci.hitpts = 0;
  for (let tick = 0; tick < 100 && !fresh.deaths; tick++) await fresh.tick();
  if (!fresh.deaths || !fresh.w.map.every((v, i) => v === untouched[i])) throw new Error('scene reload retained footprints');
}
// Level 3: one long hold of an arrow makes a print a step; they must stay well under the engine's 200 monster slots.
{
  const { sim: field, bot: walker } = await play(1, 2);
  await walker.wait(40);
  field.press(77);
  let most = 0;
  for (let t = 0; t < 200; t++) {
    await walker.tick();
    most = Math.max(most, printsNow(walker).length);
  }
  field.release(77);
  if (most < 20 || most > 100) throw new Error(`a held arrow should keep a trail of dozens of prints, got ${most}`);
}
console.log(
  `snow: falling snow, jump gap, footprints, growing drift, prints facing four ways that fade, win; four new games, repeated walks and four scene reloads reset cleanly`,
);
