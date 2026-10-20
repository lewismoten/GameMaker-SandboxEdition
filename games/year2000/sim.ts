// A headless copy of PLAYGAME's main loop (web/src/engine/scene.ts playScene/tick), so
// the build can play its own levels: walk a bot through each one and check that every
// door opens, every page can be reached, and the exit can be found.
import { moveChars } from '../../web/src/engine/character';
import { simKeyPress, resetKeys } from '../../web/src/engine/keys';
import { birthMon, blockBirthMonsters, moveAllMonsters, resetMonInfo } from '../../web/src/engine/monsters';
import { updateCharDrawState } from '../../web/src/engine/render';
import { changeScroll, drawScroll, initScroll } from '../../web/src/engine/scroll';
import { getTouchBlocks } from '../../web/src/engine/touch';
import {
  BACKBL,
  CHARBL,
  LASTMM,
  MAXINV,
  MAXSEQ,
  MLEN,
  MWID,
  NEVER,
  OFFSCRN,
  SCRNBLEN,
  SCRNBWID,
  bgBlock,
  createWorld,
  newCharInfo,
  padBlocks,
  type CharInfo,
  type World,
} from '../../web/src/engine/world';
import { MONBL, type Block } from '../../web/src/formats/blocks';
import type { Character } from '../../web/src/formats/character';
import type { GameMap } from '../../web/src/formats/map';
import type { Monster } from '../../web/src/formats/monster';
import { rng } from '../kit/pixels';

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

function startSceneInits(w: World, start: { x: number; y: number }): void {
  const { ci, chr } = w;
  if (ci.inv[0] === BACKBL + 1) for (let i = 0; i < MAXINV; i++) ci.inv[i] = chr.inv[i];
  for (let i = 0; i < MAXSEQ; i++) {
    ci.seqon[i] = chr.sequences[i].bloc === BACKBL;
    if (ci.meter[i] === -20000) ci.meter[i] = chr.meter[i];
  }
  for (let i = 0; i < MAXINV; i++) for (let q = 0; q < MAXSEQ; q++) if (chr.sequences[q].bloc === ci.inv[i]) ci.seqon[q] = true;
  if (ci.meter[0] === -1) {
    for (let i = 0; i < 5; i++) ci.meter[i] = chr.meter[i];
    for (let i = 5; i < MAXSEQ; i++) ci.meter[i] = chr.sequences[i].key > 0 ? chr.meter[i] : -20000;
    for (let i = MAXSEQ; i < MAXSEQ + 10; i++) ci.meter[i] = chr.meter[i];
  }
  chr.x[0] = start.x;
  chr.y[0] = start.y;
  chr.x[1] = 0;
  chr.y[1] = 0;
  chr.cseq = 0;
  chr.cframe = -1;
  if (ci.hitpts === -1) ci.hitpts = ci.meter[0];
  if (ci.lives === -1) ci.lives = ci.meter[1];
  ci.netx = 5;
  ci.nety = 0;
  ci.gravx = 0;
  ci.gravy = 0;
  ci.scrx = ci.oldx = ci.nextx = OFFSCRN;
  ci.scry = ci.oldy = ci.nexty = OFFSCRN;
  ci.topthere = false;
  ci.bottomthere = false;
  ci.curtop = CHARBL;
  ci.curbottom = CHARBL;
  ci.nextAni = w.clock;
  w.mx = start.x - SCRNBLEN / 2;
  w.my = start.y - SCRNBWID / 2;
  if (w.mx < 0) w.mx += MLEN;
  if (w.my < 0) w.my += MWID;
  for (let l = 0; l < LASTMM; l++) {
    resetMonInfo(w.mi[l]);
    birthMon(w, l, w.mm[l].monnum, w.mm[l].curx, w.mm[l].cury);
    w.mi[l].fromchar = 0;
  }
  for (let l = 0; l < BACKBL; l++) {
    w.blkmap[l] = l;
    w.nxtchg[l] = w.bg[l].ntime > 0 ? w.clock + w.bg[l].ntime : NEVER;
  }
  w.blkMon = [];
  for (let l = 0; l < BACKBL; l++) if (w.bg[l].birthTime > 0) w.blkMon.push({ blnum: l, nexttime: w.clock + w.bg[l].birthTime });
  resetKeys(w);
  const k = chr.sequences[chr.cseq].key;
  if (k < 128) w.keydn[k] = 1;
}

function changeBlocks(w: World): void {
  for (let lp = 0; lp < BACKBL; lp++) {
    const tmap = w.blkmap[lp];
    const b = bgBlock(w, tmap);
    if (w.nxtchg[lp] <= w.clock && b.nextBl !== tmap) {
      w.blkmap[lp] = b.nextBl;
      w.nxtchg[lp] = b.ntime <= 0 ? 0 : w.nxtchg[lp] + bgBlock(w, w.blkmap[lp]).ntime;
    }
  }
}
