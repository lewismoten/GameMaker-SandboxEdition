// Plays the whole case headlessly on the built disk and reports how it went:
//   cd web && npx vite-node ../games/sleuth/tools/check.ts [--quick] [--wrong lila] [--egg] [--walk out.rec] [-v]
// --quick skips the questions and the board; --wrong first accuses the wrong suspect;
// --egg also pushes on the 2 AM green room's prop fireplace;
// --walk writes the run as a .rec recording (replayed in the real engine as a demo, it
// plays the game from start to finish).
import { writeFileSync } from 'node:fs';
import { serializeRecording } from '../../../web/src/formats/recording';
import { loadDisk, playWhole } from './whole';
const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const bot = await playWhole(loadDisk(), { quick: args.includes('--quick'), wrong: opt('--wrong'), egg: args.includes('--egg') });
if (args.includes('-v')) console.log(bot.log.join('\n'));
const s = bot.sim;
console.log(
  `CASE CLOSED in ${s.ticks} ticks (${(s.ticks / 18.2 / 60).toFixed(1)} min of play), ${s.trail.length} scenes entered, score ${s.ci.score}, lives ${s.ci.lives}, strikes ${s.deaths}, ${s.keys.length} key events`,
);
const walk = opt('--walk');
if (walk) writeFileSync(walk, serializeRecording(s.keys));
