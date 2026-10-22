// The headless player (kit/gameSim.ts, PLAYGAME's play loop on a built disk) pointed at Depth
// Perception's disk/, so the bot can roll the whole game, record the title demo and write
// the walkthrough.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameSim as DiskSim, readDisk as readDiskAt } from '../../kit/gameSim';

const diskDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'disk');

/** The built disk's files, by lower-case name. */
export const readDisk = (): Map<string, Uint8Array> => readDiskAt(diskDir);

export class GameSim extends DiskSim {
  constructor(files = readDisk(), seed = 1) {
    super(files, seed);
  }
}
