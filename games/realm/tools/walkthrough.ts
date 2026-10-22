// Writes games/realm/walkthrough.json: the bot plays the main quest on the built disk
// (tools/route.ts — no egg, no side quests), a key segment each time play enters a scene,
// with each scene's monsters seeded afresh; games/kit/walkthrough.ts checks the run on the real
// engine (title, story, the whole quest, the ending, the credits) and times its chapters.
//   cd web && npx vite-node ../games/realm/tools/walkthrough.ts
import { encodeKeys, type WalkChapterMark, type WalkSegment } from '../../../web/src/walkthrough/format';
import { writeWalkthrough } from '../../kit/walkthrough';
import { Bot } from './bot';
import { ROUTE } from './route';
import { GameSim } from './sim';

const SEED = 1;
const sim = new GameSim(undefined, SEED);
const bot = new Bot(sim);
for (const [name, step] of ROUTE) {
  await step(bot);
  console.log(`${name}: ${bot.log[bot.log.length - 1]}`);
}
if (sim.ended !== 'won') throw new Error('The bot did not win');
const segments: WalkSegment[] = sim.segments.map((s) => ({ scene: s.scene, keys: encodeKeys(s.keys) }));
// a chapter the first time play enters each of the big places
const chapterOf: Record<string, string> = {
  Nowish: 'Nowish',
  Laterburg: 'Laterburg',
  'The Snooze Barrows': 'The Snooze Barrows',
  'Someday Harbor': 'Someday Harbor',
  'The Soggy Vaults': 'The Soggy Vaults',
  'The Dawdle Flats': 'THE CHEZ and the Dawdle Flats',
  'Eventually Falls': 'Eventually Falls',
  'The Putoff Mines': 'The Putoff Mines',
  'Deadline Keep': 'Deadline Keep',
};
const seen = new Set<number>();
const chapters: WalkChapterMark[] = [];
for (const s of sim.segments) {
  const desc = sim.game.scenes[s.scene].desc;
  if (seen.has(s.scene) || !chapterOf[desc]) continue;
  seen.add(s.scene);
  chapters.push({ scene: s.scene, title: chapterOf[desc] });
}
const r = await writeWalkthrough('realm', { rand: { seed: SEED, per: 'scene' }, segments, chapters });
console.log(`engine: ${r.scenes.length} scenes entered, ${r.keysLeft} keys unplayed`);
