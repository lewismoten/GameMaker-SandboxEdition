// The headless player (kit/gameSim.ts, PLAYGAME's play loop on a built disk) pointed at
// CERTIFIED RAT TICKLER's disk/, so the bot can play the levels in a row and write the walkthrough.
import { diskSim } from '../../kit/gameSim';

export const GameSim = diskSim(new URL('../disk', import.meta.url));
export type GameSim = InstanceType<typeof GameSim>;
