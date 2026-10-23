// The headless simulator (kit/sceneSim.ts, PLAYGAME's main loop for one scene) set up for
// the library: every scene is one screen and never scrolls, so the scroll window is shut.
// The bot walks Joe from scene to scene on it, carrying his counters.
import { Sim as SceneSim, type SimScene } from '../../kit/sceneSim';
import type { CharInfo } from '../../../web/src/engine/world';

export class Sim extends SceneSim {
  constructor(scene: SimScene, start: { x: number; y: number }, ci?: CharInfo, seed?: number) {
    super(scene, start, ci, seed, false);
  }
}
