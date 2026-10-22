// The headless player (kit/gameSim.ts, PLAYGAME's play loop on a built disk) pointed at
// Snowbound's disk/, so the bot can walk the whole game (Gale Street, the sled run, Bowden
// Drive and LaVale Mall) and write the walkthrough.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameSim as DiskSim, readDisk } from '../../kit/gameSim';

const diskDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'disk');

export class GameSim extends DiskSim {
  constructor(files = readDisk(diskDir), seed = 1) {
    super(files, seed);
  }
}
