// The headless player (kit/gameSim.ts, PLAYGAME's play loop on a built disk) pointed at
// I SCREAMED, SHE SMIRKED's disk/, so the bot can play the fog hall, the zombie parade, the fake
// woods and the last hall in a row and write the walkthrough.
import { diskSim } from '../../kit/gameSim';

export const GameSim = diskSim(new URL('../disk', import.meta.url));
export type GameSim = InstanceType<typeof GameSim>;
