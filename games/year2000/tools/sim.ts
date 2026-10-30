// A headless copy of PLAYGAME's main loop (web/src/engine/scene.ts playScene/tick), so
// the build can play its own levels: walk a bot through each one and check that every
// door opens, every page can be reached, and the exit can be found.
import { moveChars } from '@lewismoten/gamemaker-sandbox-engine/engine/character';
import { simKeyPress } from '@lewismoten/gamemaker-sandbox-engine/engine/keys';
import { blockBirthMonsters, moveAllMonsters } from '@lewismoten/gamemaker-sandbox-engine/engine/monsters';
import { updateCharDrawState } from '@lewismoten/gamemaker-sandbox-engine/engine/render';
import { changeScroll, drawScroll, initScroll } from '@lewismoten/gamemaker-sandbox-engine/engine/scroll';
import { getTouchBlocks } from '@lewismoten/gamemaker-sandbox-engine/engine/touch';
import { BACKBL, CHARBL, LASTMM, createWorld, newCharInfo, padBlocks, type CharInfo, type World } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { MONBL, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Character } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import type { GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';

export interface SimScene {
  map: GameMap;
  bbl: Block[];
  mbl: Block[];
  mon: Monster[];
  chr: Character;
  cbl: Block[];
  links: { from: { x: number; y: number }; to: { x: number; y: number } }[];
}

export class Sim {
  readonly w: World;
  private held = new Set<number>();
  private doScroll = false;
  private pending: number[] = [];
  sounds: number[] = [];
  ticks = 0;
  /** Every key event with the tick it happened on (for demo recordings). */
  log: [number, number][] = [];
  link = -1;
  dead = false;

  constructor(
    readonly scene: SimScene,
    start: { x: number; y: number },
    ci: CharInfo = newCharInfo(),
    seed = 1,
  ) {
    const w = createWorld(scene.map, { play: (n) => (this.sounds.push(n), true) }, rng(seed));
    w.bg = padBlocks(scene.bbl, BACKBL);
    w.mblk = padBlocks(scene.mbl, MONBL);
    w.cblk = padBlocks(scene.cbl, CHARBL);
    w.mon = scene.mon;
    w.noMons = false;
    w.chr = structuredClone(scene.chr);
    w.ci = ci;
    w.clock = 1;
    this.w = w;
    startSceneInits(w, start);
    initScroll(w, { up: 0xff, down: 0xff, left: 0xff, right: 0xff });
    w.gclk = w.clock;
    w.joyOldTime = w.clock;
  }

  press(scan: number): void {
    if (this.held.has(scan)) return;
    this.held.add(scan);
    this.pending.push(scan);
    this.log.push([this.ticks, scan]);
  }

  release(scan: number): void {
    if (!this.held.has(scan)) return;
    this.held.delete(scan);
    this.pending.push(scan | 0x80);
    this.log.push([this.ticks, scan | 0x80]);
  }

  releaseAll(): void {
    for (const k of [...this.held]) this.release(k);
  }

  isHeld(scan: number): boolean {
    return this.held.has(scan);
  }

  async tick(): Promise<void> {
    const w = this.w;
    this.ticks++;
    for (let i = 0; i < 8; i++) if (this.doScroll) drawScroll(w);
    w.clock++;
    blockBirthMonsters(w);
    moveAllMonsters(w);
    const chr = w.chr;
    if (this.pending.length && (!chr.sequences[chr.cseq].ground || chr.cframe === 0)) {
      for (const k of this.pending.splice(0)) simKeyPress(w, k);
    }
    let guard = 0;
    do {
      if (await moveChars(w, async () => -1)) this.dead = true;
    } while (w.chr.cframe === -1 && !this.dead && guard++ < 50);
    changeBlocks(w);
    updateCharDrawState(w);
    this.doScroll = changeScroll(w) !== 0;
    w.monsolid = 0;
    w.mmSolid = LASTMM;
    const t = getTouchBlocks(w);
    this.scene.links.forEach((l, i) => {
      if (this.link < 0 && t.blks.some(([x, y]) => x === l.from.x && y === l.from.y)) this.link = i;
    });
  }

  get pos(): { x: number; y: number; bx: number; by: number; fx: number; fy: number } {
    const c = this.w.chr;
    return { x: c.x[0] * 20 + c.x[1], y: c.y[0] * 20 + c.y[1], bx: c.x[0], by: c.y[0], fx: c.x[1], fy: c.y[1] };
  }
}

import { legacySceneInits as startSceneInits, changeBlocks } from '@lewismoten/gamemaker-sandbox-tools/kit/sceneInit';
