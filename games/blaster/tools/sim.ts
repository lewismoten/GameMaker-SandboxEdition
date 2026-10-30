// A headless copy of PLAYGAME's main loop (web/src/engine/scene.ts playScene/tick) so the
// build can fly its own stages: check the auto-scroll, let a bot play each stage, and
// record the title-screen demo.
import { moveChars } from '@lewismoten/gamemaker-sandbox-engine/engine/character';
import { simKeyPress } from '@lewismoten/gamemaker-sandbox-engine/engine/keys';
import { blockBirthMonsters, moveAllMonsters } from '@lewismoten/gamemaker-sandbox-engine/engine/monsters';
import { updateCharDrawState } from '@lewismoten/gamemaker-sandbox-engine/engine/render';
import { changeScroll, drawScroll, initScroll } from '@lewismoten/gamemaker-sandbox-engine/engine/scroll';
import { getTouchBlocks } from '@lewismoten/gamemaker-sandbox-engine/engine/touch';
import {
  BACKBL,
  CHARBL,
  LASTMM,
  LASTMON,
  MLEN,
  MWID,
  createWorld,
  newCharInfo,
  padBlocks,
  type CharInfo,
  type World,
} from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { MONBL, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Character } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import type { GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';

interface SimScene {
  map: GameMap;
  bbl: Block[];
  mbl: Block[];
  mon: Monster[];
  chr: Character;
  cbl: Block[];
  start: { x: number; y: number };
  links: { x: number; y: number }[];
  scroll: { up: number; down: number; left: number; right: number };
  /** Monster names by number. */
  names: string[];
}

export class Sim {
  readonly w: World;
  private held = new Set<number>();
  private doScroll = false;
  sounds: number[] = [];
  ticks = 0;
  onKey?: (key: number) => void;
  link = -1;
  dead = false;
  private pending: number[] = [];

  constructor(
    readonly scene: SimScene,
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
    startSceneInits(w, scene.start);
    initScroll(w, scene.scroll);
    w.gclk = w.clock;
    w.joyOldTime = w.clock;
  }

  /** A copy that can be played ahead without touching this one (for a bot looking ahead). */
  fork(): Sim {
    const f = Object.create(Sim.prototype) as Sim;
    const w = this.w;
    const copy: World = {
      ...w,
      map: w.map.slice(),
      mapMon: w.mapMon.slice(),
      ci: structuredClone(w.ci),
      mi: structuredClone(w.mi),
      mm: w.mm.map((m) => ({ ...m })),
      blkMon: w.blkMon.map((b) => ({ ...b })),
      birthFlag: w.birthFlag.slice(),
      nxtchg: w.nxtchg.slice(),
      blkmap: w.blkmap.slice(),
      scroll: structuredClone(w.scroll),
      keydn: w.keydn.slice(),
      keystack: w.keystack.map((k) => ({ ...k })),
      chr: { ...w.chr, x: [...w.chr.x], y: [...w.chr.y] },
      sound: { play: () => true },
      rand: () => 0.5,
    };
    Object.assign(f, {
      scene: this.scene,
      w: copy,
      held: new Set(this.held),
      doScroll: this.doScroll,
      sounds: [],
      ticks: this.ticks,
      link: this.link,
      dead: this.dead,
      pending: [...this.pending],
    });
    return f;
  }

  press(scan: number): void {
    if (this.held.has(scan)) return;
    this.held.add(scan);
    this.event(scan);
  }

  release(scan: number): void {
    if (!this.held.has(scan)) return;
    this.held.delete(scan);
    this.event(scan | 0x80);
  }

  /** Releases every held key but `keep`. */
  only(keep?: number): void {
    for (const k of [...this.held]) if (k !== keep) this.release(k);
    if (keep !== undefined) this.press(keep);
  }

  get holding(): number[] {
    return [...this.held];
  }

  private event(k: number): void {
    this.pending.push(k);
    this.onKey?.(k);
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
      if (this.link < 0 && t.blks.some(([x, y]) => x === l.x && y === l.y)) this.link = i;
    });
  }

  async run(ticks: number, each?: (t: number) => void | boolean): Promise<void> {
    for (let t = 0; t < ticks; t++) {
      await this.tick();
      if (each?.(t) === true) break;
      if (this.dead || this.link >= 0) break;
    }
  }

  /** Live monsters (name, block position, pixel position). */
  live(): { slot: number; name: string; x: number; y: number; px: number; py: number }[] {
    const out: { slot: number; name: string; x: number; y: number; px: number; py: number }[] = [];
    this.w.mm.forEach((m, i) => {
      if (m.monnum >= LASTMON) return;
      const mi = this.w.mi[i];
      out.push({
        slot: i,
        name: this.scene.names[m.monnum] ?? `#${m.monnum}`,
        x: mi.curx[0],
        y: mi.cury[0],
        px: mi.curx[0] * 20 + mi.curx[1],
        py: mi.cury[0] * 20 + mi.cury[1],
      });
    });
    return out;
  }

  /** The ship in map pixels (top-left of its block). */
  get pos(): { x: number; y: number; bx: number; by: number } {
    const c = this.w.chr;
    return { x: c.x[0] * 20 + c.x[1], y: c.y[0] * 20 + c.y[1], bx: c.x[0], by: c.y[0] };
  }

  /** The ship on screen. */
  get screen(): { x: number; y: number } {
    return { x: this.w.ci.nextx, y: this.w.ci.nexty };
  }
}

export { MLEN, MWID };

import { legacySceneInits as startSceneInits, changeBlocks } from '@lewismoten/gamemaker-sandbox-tools/kit/sceneInit';
