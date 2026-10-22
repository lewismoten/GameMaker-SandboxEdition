// A headless copy of PLAYGAME's play() and playscene() loops (web/src/engine/game.ts and
// scene.ts) that plays the built Depth Perception disk, so a bot can roll the whole game. Each
// scene seeds its monsters' random numbers afresh (the walkthrough's rand per 'scene'), and the
// keys pressed are kept per scene, counted from the tick play entered it, as walkthrough
// segments are. snapshot()/restore() let a bot try a move ahead and take it back.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { moveChars } from '../../../web/src/engine/character';
import { simKeyPress } from '../../../web/src/engine/keys';
import { blockBirthMonsters, moveAllMonsters } from '../../../web/src/engine/monsters';
import { updateCharDrawState } from '../../../web/src/engine/render';
import { changeScroll, drawScroll, initScroll } from '../../../web/src/engine/scroll';
import { changeBlocks, startSceneInits } from '../../../web/src/engine/scene';
import { getTouchBlocks } from '../../../web/src/engine/touch';
import { BACKBL, LASTMM, MLEN, bgBlock, createWorld, newCharInfo, padBlocks, type CharInfo, type World } from '../../../web/src/engine/world';
import { parseBlocks, BACKBL as NBACK, MONBL as NMON, CHARBL as NCHR } from '../../../web/src/formats/blocks';
import { parseCharacter } from '../../../web/src/formats/character';
import { parseMonsters } from '../../../web/src/formats/monster';
import { parseMap } from '../../../web/src/formats/map';
import { MAXSCENELINKS, NOSCENE, parseGame, type Game } from '../../../web/src/formats/game';
import type { RecordedKey } from '../../../web/src/formats/recording';

const diskDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'disk');

export function readDisk(): Map<string, Uint8Array> {
  const files = new Map<string, Uint8Array>();
  for (const n of readdirSync(diskDir)) files.set(n.toLowerCase(), new Uint8Array(readFileSync(join(diskDir, n))));
  return files;
}

/** The walkthrough runtime's seeded() (mulberry32), with its state out where a snapshot can keep it. */
class Rand {
  constructor(public a: number) {}
  next = (): number => {
    this.a = (this.a + 0x6d2b79f5) >>> 0;
    let t = this.a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Keys pressed in one scene, timed from the tick play entered it. */
export interface SceneKeys {
  scene: number;
  keys: RecordedKey[];
}

interface State {
  w: World;
  rand: number;
  scene: number;
  prev: number;
  link: number;
  ticks: number;
  clock: number;
  lastKeyTick: number;
  held: number[];
  pending: number[];
  doScroll: boolean;
  ended: GameSim['ended'];
  deaths: number;
  trail: number[];
  segments: SceneKeys[];
}

export class GameSim {
  readonly game: Game;
  ci: CharInfo = newCharInfo();
  w!: World;
  scene = 0;
  prev = 0;
  link = 0;
  /** Scenes entered, in order (a death enters the same scene again). */
  trail: number[] = [];
  /** Game ticks since play entered the current scene (a segment's clock). */
  ticks = 0;
  /** Keys per scene entered (a scene entered again after a death keeps counting on). */
  segments: SceneKeys[] = [];
  private lastKeyTick = 0;
  private held = new Set<number>();
  private pending: number[] = [];
  private doScroll = false;
  /** TimerCounter: it runs on across scenes. */
  private clock = 1;
  private rand = new Rand(0);
  ended: 'won' | 'lost' | undefined;
  deaths = 0;

  constructor(
    readonly files: Map<string, Uint8Array> = readDisk(),
    readonly seed = 1,
  ) {
    this.game = parseGame(files.get([...files.keys()].find((n) => n.endsWith('.gam'))!)!);
    // StartGameInits
    this.ci.hitpts = -1;
    this.ci.lives = -1;
    this.ci.score = 0;
    this.ci.inv.fill(BACKBL + 1);
    this.ci.meter.fill(-1);
    this.enter(this.game.scenes[0].links[0].toScene, 0, 0);
  }

  private file(scene: number, slot: number): Uint8Array | undefined {
    const name = this.game.scenes[scene].files[slot];
    return name ? this.files.get(name) : undefined;
  }

  /** loadscene + StartSceneInits, as playScene does them. */
  private enter(scene: number, prev: number, link: number, again = false): void {
    this.scene = scene;
    this.prev = prev;
    this.link = link;
    this.trail.push(scene);
    if (!again) {
      this.segments.push({ scene, keys: [] });
      this.ticks = 0;
      this.lastKeyTick = 0;
    }
    const f = (slot: number) => this.file(scene, slot);
    this.rand = new Rand(this.seed);
    const w = createWorld(parseMap(f(1)!), { play: () => true }, this.rand.next);
    w.bg = padBlocks(parseBlocks(f(2)!, NBACK), NBACK);
    w.mblk = padBlocks(f(4) ? parseBlocks(f(4)!, NMON) : undefined, NMON);
    w.cblk = padBlocks(parseBlocks(f(6)!, NCHR), NCHR);
    w.mon = f(3) ? parseMonsters(f(3)!) : [];
    w.noMons = !f(3) || !f(4);
    w.chr = parseCharacter(f(5)!);
    w.ci = this.ci;
    w.clock = this.clock;
    this.w = w;
    startSceneInits(w, this.game.scenes[prev].links[link].to);
    // moveCharGrav(reset) and handleJoystick(reset)
    w.gclk = w.clock;
    w.joyOldTime = w.clock;
    initScroll(w, this.game.scenes[scene].scroll);
    this.doScroll = false;
    this.held.clear();
    this.pending = [];
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

  releaseAll(): void {
    for (const k of [...this.held]) this.release(k);
  }

  isHeld(scan: number): boolean {
    return this.held.has(scan);
  }

  private event(k: number): void {
    // once the game is won there is nothing left to press keys in
    if (this.ended) return;
    this.pending.push(k);
    // a key recorded at tick t is played on the segment's t-th tick: the next one
    const at = this.ticks + 1;
    this.segments[this.segments.length - 1].keys.push({ delta: at - this.lastKeyTick, key: k });
    this.lastKeyTick = at;
  }

  /** One game tick; returns 'link' (into another scene), 'dead' or 'end'. */
  async tick(): Promise<'link' | 'dead' | 'end' | undefined> {
    if (this.ended) return 'end';
    const w = this.w;
    this.ticks++;
    this.clock++;
    for (let i = 0; i < 8; i++) if (this.doScroll) drawScroll(w);
    w.clock = this.clock;
    if (!w.noMons) {
      blockBirthMonsters(w);
      moveAllMonsters(w);
    }
    const chr = w.chr;
    if (this.pending.length && (!chr.sequences[chr.cseq].ground || chr.cframe === 0)) for (const k of this.pending.splice(0)) simKeyPress(w, k);
    let dead = false;
    let guard = 0;
    do {
      if (await moveChars(w, async () => -1)) dead = true;
    } while (w.chr.cframe === -1 && !dead && guard++ < 50);
    changeBlocks(w);
    updateCharDrawState(w);
    this.doScroll = changeScroll(w) !== 0;
    w.monsolid = 0;
    w.mmSolid = LASTMM;
    const t = getTouchBlocks(w);
    const links = this.game.scenes[this.scene].links;
    let taken = MAXSCENELINKS;
    for (let l = 0; l < MAXSCENELINKS && taken === MAXSCENELINKS; l++) {
      const link = links[l];
      if (!link || link.toScene === NOSCENE) continue;
      for (let i = 0; i < 6; i++) if (link.from.x === t.blks[i][0] && link.from.y === t.blks[i][1]) taken = l;
    }
    if (dead) {
      this.deaths++;
      if (this.ci.lives > 0) {
        this.ci.lives--;
        this.ci.hitpts = -1;
        this.enter(this.scene, this.prev, this.link, true);
      } else this.ended = 'lost';
      return 'dead';
    }
    if (taken !== MAXSCENELINKS) {
      const to = links[taken].toScene;
      if (to === 1) {
        this.ended = 'won';
        return 'end';
      }
      this.enter(to, this.scene, taken);
      return 'link';
    }
    return undefined;
  }

  /** Ray's block and the pixels past it. */
  get pos(): { x: number; y: number; sx: number; sy: number } {
    const c = this.w.chr;
    return { x: c.x[0], y: c.y[0], sx: c.x[1], sy: c.y[1] };
  }

  meter(i: number): number {
    return this.ci.meter[i];
  }

  /** The block number at (x, y) as it is now (a taken photon is a new block number). */
  blockAt(x: number, y: number): number {
    return this.w.map[y * MLEN + x];
  }

  /** The block's attributes as shown now (timed blocks change by themselves). */
  shown(x: number, y: number) {
    return bgBlock(this.w, this.w.blkmap[this.blockAt(x, y)] ?? 0);
  }

  solidAt(x: number, y: number): boolean {
    return this.shown(x, y).solid !== 0;
  }

  snapshot(): State {
    return {
      w: copyWorld(this.w),
      rand: this.rand.a,
      scene: this.scene,
      prev: this.prev,
      link: this.link,
      ticks: this.ticks,
      clock: this.clock,
      lastKeyTick: this.lastKeyTick,
      held: [...this.held],
      pending: [...this.pending],
      doScroll: this.doScroll,
      ended: this.ended,
      deaths: this.deaths,
      trail: [...this.trail],
      segments: this.segments.map((s) => ({ scene: s.scene, keys: s.keys.slice() })),
    };
  }

  restore(s: State): void {
    this.rand = new Rand(s.rand);
    const w = copyWorld(s.w);
    w.rand = this.rand.next;
    this.w = w;
    this.ci = w.ci;
    this.scene = s.scene;
    this.prev = s.prev;
    this.link = s.link;
    this.ticks = s.ticks;
    this.clock = s.clock;
    this.lastKeyTick = s.lastKeyTick;
    this.held = new Set(s.held);
    this.pending = [...s.pending];
    this.doScroll = s.doScroll;
    this.ended = s.ended;
    this.deaths = s.deaths;
    this.trail = [...s.trail];
    this.segments = s.segments.map((x) => ({ scene: x.scene, keys: x.keys.slice() }));
  }
}

/** A copy of everything in a World that play changes: the blocks, monster types and the
 * character's sequences are only read, so the copy shares them. */
function copyWorld(w: World): World {
  const { sound, rand, joystick, bg, mblk, cblk, mon, palette, chr, ...rest } = w;
  const out = copy(rest) as Omit<World, 'chr'>;
  return { ...out, sound, rand, joystick, bg, mblk, cblk, mon, palette, chr: { ...chr, x: [...chr.x], y: [...chr.y] } } as World;
}

function copy<T>(v: T): T {
  if (v === null || typeof v !== 'object') return v;
  if (ArrayBuffer.isView(v)) return (v as unknown as Uint8Array).slice() as T;
  if (Array.isArray(v)) return v.map(copy) as T;
  const o: Record<string, unknown> = {};
  for (const k in v) o[k] = copy((v as Record<string, unknown>)[k]);
  return o as T;
}
