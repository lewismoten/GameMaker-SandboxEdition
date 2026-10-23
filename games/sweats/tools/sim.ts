// The headless player (kit/gameSim.ts, PLAYGAME's play loop on a built disk) pointed at
// SHAKESPEARE IN SWEATPANTS's disk/, so the bot can play the scenes in a row and write the
// walkthrough. jumpTo() enters a scene the way the scene before it links in (for trying one
// monologue without playing the evening up to it).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameSim as DiskSim, readDisk } from '../../kit/gameSim';

const diskDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'disk');

export class GameSim extends DiskSim {
  constructor(files = readDisk(diskDir), seed = 1) {
    super(files, seed);
  }

  /** Enters scene `n` through the first link that leads to it. */
  jumpTo(n: number): void {
    for (let p = 0; p < this.game.scenes.length; p++) {
      const k = this.game.scenes[p].links.findIndex((l) => l.toScene === n);
      if (k >= 0) {
        (this as unknown as { enter: (scene: number, prev: number, link: number) => void }).enter(n, p, k);
        return;
      }
    }
    throw new Error(`No link into scene ${n}`);
  }
}
