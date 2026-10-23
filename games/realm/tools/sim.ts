// The headless player (kit/gameSim.ts, PLAYGAME's play loop on a built disk) pointed at
// Quest for the Round Tuit's disk/, so the bot can play the main quest, the side quests and
// the egg, record the title demo and write the walkthrough.
import { diskSim } from '../../kit/gameSim';

export const GameSim = diskSim(new URL('../disk', import.meta.url));
export type GameSim = InstanceType<typeof GameSim>;
