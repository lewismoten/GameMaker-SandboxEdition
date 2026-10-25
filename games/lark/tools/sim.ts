// The headless player (kit/gameSim.ts, PLAYGAME's play loop on a built disk) pointed at this
// game's disk/, so the bot can play it scene after scene and write the walkthrough.
import { diskSim } from '../../kit/gameSim';

export const GameSim = diskSim(new URL('../disk', import.meta.url));
export type GameSim = InstanceType<typeof GameSim>;
