// The headless player (kit/gameSim.ts, PLAYGAME's play loop on a built disk) pointed at
// WHERE'S THE REMOTE?!'s disk/, so the bot can play the living room, the kitchen, the void
// and the ride in a row and write the walkthrough.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameSim as DiskSim, readDisk } from '../../kit/gameSim';

const diskDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'disk');

export class GameSim extends DiskSim {
  constructor(files = readDisk(diskDir), seed = 1) {
    super(files, seed);
  }
}
