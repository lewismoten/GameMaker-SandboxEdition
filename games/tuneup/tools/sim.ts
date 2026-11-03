// The headless player (kit/gameSim.ts, PLAYGAME's play loop on a built disk) pointed at
// TUNE-UP's disk/, so the bot can play the levels in a row and write the walkthrough.
import { pathToFileURL } from 'node:url';
import { diskSim } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';

export const GameSim = diskSim(process.env.GAME_DISK_OUT ? pathToFileURL(`${process.env.GAME_DISK_OUT}/`) : new URL('../disk', import.meta.url));
export type GameSim = InstanceType<typeof GameSim>;
