// Writes games/risi/walkthrough.json: the bot plays the whole game on the built disk (one key
// segment a level, each level's monsters seeded afresh), and games/kit/walkthrough.ts checks the
// run on the real engine (title, story, all six levels, the ending, the credits).
//   cd web && npx vite-node ../games/risi/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'I: Canis Meus Flatum Dedit',
  3: 'II: Laudes Ignavi',
  4: 'III: Titus Torquet Lingua',
  5: 'IV: Felis Fortissimus',
  6: 'V: Canit Piscis Aureus',
  7: 'VI: Silentium Ridentium',
};
await writeSimWalkthrough('risi', sim, SEED, titles);
