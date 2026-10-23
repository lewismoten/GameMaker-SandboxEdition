// A headless copy of PLAYGAME's main loop (web/src/engine/scene.ts playScene/tick) for one
// scene at a time, built from a game's blocks, map, monsters and character as the build
// makes them (no disk needed). A game's tools play their levels on it: measure hops, check
// that every trick or part does its job, let a bot walk a level from its start to its exit,
// and record the title demo (onKey sees every key event); snapshot()/restore() let a bot
// try a move a few ticks ahead and take it back. Used by Teddy's Little Big and
// Little Bigger Adventures, Ohm Sweet Ohm and KEEP IT BRIEF!; games that play the built disk
// scene after scene use gameSim.ts instead.
import { moveChars } from '../../web/src/engine/character';
import { simKeyPress } from '../../web/src/engine/keys';
import { blockBirthMonsters, moveAllMonsters } from '../../web/src/engine/monsters';
import { updateCharDrawState } from '../../web/src/engine/render';
import { changeBlocks, startSceneInits } from '../../web/src/engine/scene';
import { changeScroll, drawScroll, initScroll } from '../../web/src/engine/scroll';
import { getTouchBlocks } from '../../web/src/engine/touch';
import { CHARBL, BACKBL, LASTMM, createWorld, newCharInfo, padBlocks, type CharInfo, type World } from '../../web/src/engine/world';
import { MONBL, type Block } from '../../web/src/formats/blocks';
import type { Character } from '../../web/src/formats/character';
import type { GameMap } from '../../web/src/formats/map';
import type { Monster } from '../../web/src/formats/monster';

export interface SimScene {
  map: GameMap;
  bbl: Block[];
  mbl?: Block[];
  mon?: Monster[];
  chr: Character;
  cbl: Block[];
  links?: { from: { x: number; y: number }; to: { x: number; y: number } }[];
  /** Monster names by number (for bots that look for one). */
  names?: string[];
}

/** What Sim.snapshot() keeps. */
export interface SimState {
  w: Omit<World, 'sound' | 'rand' | 'joystick' | 'bg' | 'mblk' | 'cblk' | 'mon' | 'palette' | 'chr'>;
  chr: Character;
  randA: number;
  held: number[];
  pending: number[];
  doScroll: boolean;
  sounds: number;
  ticks: number;
  link: number;
  dead: boolean;
}

/** A deep copy of plain data (typed arrays sliced). */
function copy<T>(v: T): T {
  if (v === null || typeof v !== 'object') return v;
  if (ArrayBuffer.isView(v)) return (v as unknown as Uint8Array).slice() as T;
  if (Array.isArray(v)) return v.map(copy) as T;
  const o: Record<string, unknown> = {};
  for (const k in v) o[k] = copy((v as Record<string, unknown>)[k]);
  return o as T;
}

export class Sim {
  readonly w: World;
  private held = new Set<number>();
  private doScroll = false;
  sounds: number[] = [];
  /** Ticks played so far. */
  ticks = 0;
  /** Called with every key event (scan, bit 7 = released), e.g. to record a demo. */
  onKey?: (key: number) => void;
  /** Link index reached (-1 = none yet). */
  link = -1;
  dead = false;

  constructor(
    readonly scene: SimScene,
    start: { x: number; y: number },
    ci: CharInfo = newCharInfo(),
    seed = 1,
    /** False for games whose scenes never scroll (one screen each): the scroll window is shut. */
    scroll = true,
  ) {
    this.randA = seed >>> 0;
    const w = createWorld(scene.map, { play: (n) => (this.sounds.push(n), true) }, () => this.rand());
    w.bg = padBlocks(scene.bbl, BACKBL);
    w.mblk = padBlocks(scene.mbl, MONBL);
    w.cblk = padBlocks(scene.cbl, CHARBL);
    w.mon = scene.mon ?? [];
    w.noMons = !scene.mon;
    // A private copy: the engine edits the character record as it plays.
    w.chr = structuredClone(scene.chr);
    w.ci = ci;
    w.clock = 1;
    this.w = w;
    startSceneInits(w, start);
    const edge = scroll ? 0xff : 0;
    initScroll(w, { up: edge, down: edge, left: edge, right: edge });
    // moveCharGrav(reset) and handleJoystick(reset)
    w.gclk = w.clock;
    w.joyOldTime = w.clock;
  }

  /** kit/pixels.ts rng() (mulberry32), with its state out where a snapshot can keep it. */
  private randA: number;
  private rand(): number {
    this.randA = (this.randA + 0x6d2b79f5) >>> 0;
    let t = this.randA;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Everything that changes as the scene plays, to try a move and take it back with restore(). */
  snapshot(): SimState {
    const { sound, rand, joystick, bg, mblk, cblk, mon, palette, chr, ...rest } = this.w;
    return {
      w: copy(rest),
      chr: { ...chr, x: [...chr.x], y: [...chr.y] },
      randA: this.randA,
      held: [...this.held],
      pending: [...this.pending],
      doScroll: this.doScroll,
      sounds: this.sounds.length,
      ticks: this.ticks,
      link: this.link,
      dead: this.dead,
    };
  }

  restore(s: SimState): void {
    const { ci, ...rest } = copy(s.w);
    // the character info stays the same object (a game's tools carry it on to the next level)
    Object.assign(this.w, rest, { chr: { ...s.chr, x: [...s.chr.x], y: [...s.chr.y] } });
    Object.assign(this.w.ci, ci);
    this.randA = s.randA;
    this.held = new Set(s.held);
    this.pending = [...s.pending];
    this.doScroll = s.doScroll;
    this.sounds.length = s.sounds;
    this.ticks = s.ticks;
    this.link = s.link;
    this.dead = s.dead;
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

  private pending: number[] = [];
  private event(k: number): void {
    this.pending.push(k);
    this.onKey?.(k);
  }

  /** One 18.2 Hz game tick (8 scroll steps + tick()). */
  async tick(): Promise<void> {
    const w = this.w;
    this.ticks++;
    for (let i = 0; i < 8; i++) if (this.doScroll) drawScroll(w);
    w.clock++;
    if (!w.noMons) {
      blockBirthMonsters(w);
      moveAllMonsters(w);
    }
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
    if (this.scene.links) {
      const t = getTouchBlocks(w);
      this.scene.links.forEach((l, i) => {
        if (this.link < 0 && t.blks.some(([x, y]) => x === l.from.x && y === l.from.y)) this.link = i;
      });
    }
  }

  async run(ticks: number, each?: (t: number) => void | boolean): Promise<void> {
    for (let t = 0; t < ticks; t++) {
      await this.tick();
      if (each?.(t) === true) break;
      if (this.dead || this.link >= 0) break;
    }
  }

  /** Live monsters called `name`, with their block positions. */
  monsters(name: string): { x: number; y: number }[] {
    const n = this.scene.names?.indexOf(name) ?? -1;
    return this.w.mm.flatMap((m, i) => (m.monnum === n ? [{ x: this.w.mi[i].curx[0], y: this.w.mi[i].cury[0] }] : []));
  }

  /** Character position in pixels (x of its column, y of its bottom block). */
  get pos(): { x: number; y: number; bx: number; by: number } {
    const c = this.w.chr;
    return { x: c.x[0] * 20 + c.x[1], y: c.y[0] * 20 + c.y[1], bx: c.x[0], by: c.y[0] };
  }
}
