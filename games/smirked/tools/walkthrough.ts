// Writes games/smirked/walkthrough.json: the bot plays the whole game on the built disk (one key
// segment a level, each level's monsters seeded afresh), and games/kit/walkthrough.ts checks the
// run on the real engine (title, story, all four levels, the ending, the credits).
//   cd web && npx vite-node ../games/smirked/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = { 2: 'Level 1: Mild Scares for All Ages', 3: 'Level 2: GET DOWN!', 4: 'Level 3: Strategic Repositioning', 5: 'Level 4: The Emergency Exit Sign' };
await writeSimWalkthrough('smirked', sim, SEED, titles);
