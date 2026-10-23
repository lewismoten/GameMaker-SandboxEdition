// Writes games/mustard/walkthrough.json: the bot plays the whole game on the built disk (one
// key segment a level, each level's monsters seeded afresh), and games/kit/walkthrough.ts
// checks the run on the real engine (title, story, all four levels, the ending, the credits).
//   cd web && npx vite-node ../games/mustard/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = { 2: 'Level 1: The Mound', 3: 'Level 2: Deep Down in the Dust', 4: 'Level 3: The Mountain', 5: "Level 4: The Palm of God's Hand" };
await writeSimWalkthrough('mustard', sim, SEED, titles);
