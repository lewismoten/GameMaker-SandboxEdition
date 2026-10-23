// The headless player (kit/gameSim.ts, PLAYGAME's play loop on a built disk) pointed at
// Snowbound's disk/, so the bot can walk the whole game (Gale Street, the sled run, Bowden
// Drive and LaVale Mall) and write the walkthrough.
import { diskSim } from '../../kit/gameSim';

export const GameSim = diskSim(new URL('../disk', import.meta.url));
export type GameSim = InstanceType<typeof GameSim>;
