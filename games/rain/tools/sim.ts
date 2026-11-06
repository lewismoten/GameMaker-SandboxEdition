// The headless player (kit/gameSim.ts, PLAYGAME's play loop on a built disk) pointed at
// Rain on the Path's disk/, so the bot can play the lessons in order and record their keys.
import { diskSim } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';

export const GameSim = diskSim(new URL('../disk', import.meta.url));
export type GameSim = InstanceType<typeof GameSim>;
