// Writes games/snowbound/walkthrough.json: the bot plays the whole game on the built disk
// (tools/route.ts: the paper route and the driveways of Gale Street, the sled run, Bowden
// Drive, LaVale Mall's lot and the pink box), one key segment a level with each level's
// monsters seeded afresh, and games/kit/walkthrough.ts checks the run on the real engine
// (title, story, all four levels, the ending, the credits).
//   cd web && npx vite-node ../games/snowbound/tools/walkthrough.ts
import { encodeKeys, type WalkChapterMark, type WalkSegment } from '../../../web/src/walkthrough/format';
import { writeWalkthrough } from '../../kit/walkthrough';
import { Bot } from './bot';
import { bowdenDrive, galeStreet, jamieStreet, lavaleMall } from './route';
import { GameSim } from './sim';

const SEED = 1;
const sim = new GameSim(undefined, SEED);
const bot = new Bot(sim);
for (const level of [galeStreet, jamieStreet, bowdenDrive, lavaleMall]) {
  await level(bot);
  console.log(`${level.name}: ${bot.log[bot.log.length - 1]}`);
}
if (sim.ended !== 'won') throw new Error('The bot did not win');
if (sim.deaths) throw new Error(`The bot lost ${sim.deaths} lives`);
const titles: Record<number, string> = { 2: 'Level 1: Gale Street', 3: 'Level 2: Jamie Street', 4: 'Level 3: Bowden Drive', 5: 'Level 4: LaVale Mall' };
const segments: WalkSegment[] = sim.segments.map((s) => ({ scene: s.scene, keys: encodeKeys(s.keys) }));
const chapters: WalkChapterMark[] = sim.segments.map((s) => ({ scene: s.scene, title: titles[s.scene] }));
const r = await writeWalkthrough('snowbound', { rand: { seed: SEED, per: 'scene' }, segments, chapters });
console.log(`engine: scenes ${r.scenes.join(' ')}, ${r.keysLeft} keys unplayed; the bot threw ${bot.throws} snowballs`);
