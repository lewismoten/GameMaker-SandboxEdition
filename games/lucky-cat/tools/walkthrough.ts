// Writes games/lucky-cat/walkthrough.json: the bot plays the whole game on the built disk (one key segment a
// level), and games/kit/walkthrough.ts checks the run on the real engine (title, the levels, the ending).
//   cd web && npx vite-node ../games/lucky-cat/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { buildLevels } from '../src/levels';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {};
buildLevels().levels.forEach((l, i) => {
  titles[i + 2] = `Level ${i + 1}: ${l.title}`;
});
await writeSimWalkthrough('lucky-cat', sim, SEED, titles);
