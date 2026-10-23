// The headless player (kit/gameSim.ts, PLAYGAME's play loop on a built disk) pointed at
// WHERE'S THE REMOTE?!'s disk/, so the bot can play the living room, the kitchen, the void
// and the ride in a row and write the walkthrough.
import { diskSim } from '../../kit/gameSim';

export const GameSim = diskSim(new URL('../disk', import.meta.url));
export type GameSim = InstanceType<typeof GameSim>;
