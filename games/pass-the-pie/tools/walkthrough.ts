// Writes games/pass-the-pie/walkthrough.json: the bot plays the whole game on the built disk (one key segment a
// level), and games/kit/walkthrough.ts checks the run on the real engine (title, the ten levels, the ending).
//   cd web && npx vite-node ../games/pass-the-pie/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Chapter 1: Pumpkin Yard (Rory)',
  3: "Payback, Part 1: Uncle Dale's Lawn (Mr. Plume)",
  4: 'Chapter 2: Gravy Relay (Rory)',
  5: 'Payback, Part 2: Windy Park (Mr. Plume)',
  6: 'Chapter 3: Rooftop Potluck (Rory)',
  7: "Payback, Part 3: Sensei's Dojo (Mr. Plume)",
  8: 'Chapter 4: The Cord (Rory)',
  9: 'Payback, Part 4: The Dog Park (Mr. Plume)',
  10: 'Chapter 5: Aisle Nine (Rory)',
  11: 'Payback, Part 5: Doorbusters (Mr. Plume)',
  12: 'Payback, Part 6: Main Street (Mr. Plume)',
  13: 'Payback, Part 7: Big Gobble (Mr. Plume)',
};
await writeSimWalkthrough('pass-the-pie', sim, SEED, titles);
