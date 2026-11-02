// A headless copy of PLAYGAME's play() and playscene() loops (web/src/engine/game.ts and
// scene.ts) that plays Sandcastle Knight's built disk, so a bot can play the whole game.
// Each scene's monsters get their own random numbers (rng(seed), started over as the scene
// loads, as a walkthrough with rand per 'scene' does), and the keys are kept one segment a
// scene entered, counted in game ticks from the moment the scene began.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { moveChars } from '@lewismoten/gamemaker-sandbox-engine/engine/character';
import { simKeyPress } from '@lewismoten/gamemaker-sandbox-engine/engine/keys';
import { blockBirthMonsters, moveAllMonsters } from '@lewismoten/gamemaker-sandbox-engine/engine/monsters';
import { updateCharDrawState } from '@lewismoten/gamemaker-sandbox-engine/engine/render';
import { changeScroll, drawScroll, initScroll } from '@lewismoten/gamemaker-sandbox-engine/engine/scroll';
import { getTouchBlocks } from '@lewismoten/gamemaker-sandbox-engine/engine/touch';
import {
  BACKBL,
  LASTMM,
  MLEN,
  MWID,
  bgBlock,
  createWorld,
  newCharInfo,
  padBlocks,
  type CharInfo,
  type World,
} from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { parseBlocks, BACKBL as NBACK, MONBL as NMON, CHARBL as NCHR } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { parseMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { MAXSCENELINKS, NOSCENE, parseGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { RecordedKey } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';

/** The built disk's files (lower-case names). */
export function loadDisk(): Map<string, Uint8Array> {
  const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'disk');
  const files = new Map<string, Uint8Array>();
  for (const n of readdirSync(dir)) files.set(n.toLowerCase(), new Uint8Array(readFileSync(join(dir, n))));
  return files;
}

/** Key events for one stretch of play, from entering `scene` until the next scene. */
interface SimSegment {
  scene: number;
  keys: RecordedKey[];
}

export class GameSim {
  readonly game: Game;
  ci: CharInfo = newCharInfo();
  w!: World;
  scene = 0;
  prev = 0;
  link = 0;
  /** Scenes visited, in order. */
  trail: number[] = [];
  /** Game ticks since the current scene began (the segment's clock). */
  ticks = 0;
  /** Game ticks in all. */
  total = 0;
  segments: SimSegment[] = [];
  private lastKeyTick = 0;
  private held = new Set<number>();
  private pending: number[] = [];
  private doScroll = false;
  private clock = 1;
  ended: 'won' | 'lost' | undefined;
  deaths = 0;
  sounds: number[] = [];

  constructor(
    readonly files: Map<string, Uint8Array>,
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

  /** loadscene + StartSceneInits; starts a new key segment. */
  enter(scene: number, prev: number, link: number): void {
    this.scene = scene;
    this.prev = prev;
    this.link = link;
    this.trail.push(scene);
    this.segments.push({ scene, keys: [] });
    this.ticks = 0;
    this.lastKeyTick = 0;
    const f = (slot: number) => this.file(scene, slot);
    const map = parseMap(f(1)!);
    const w = createWorld(map, { play: (n) => (this.sounds.push(n), true) }, rng(this.seed));
    w.bg = padBlocks(parseBlocks(f(2)!, NBACK), NBACK);
    w.mblk = padBlocks(f(4) ? parseBlocks(f(4)!, NMON) : undefined, NMON);
    w.cblk = padBlocks(parseBlocks(f(6)!, NCHR), NCHR);
    w.mon = f(3) ? parseMonsters(f(3)!) : [];
    w.noMons = !f(3) || !f(4);
    w.chr = parseCharacter(f(5)!);
    w.ci = this.ci;
    w.clock = this.clock;
    this.w = w;
    const start = this.game.scenes[prev].links[link].to;
    startSceneInits(w, start);
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

  isHeld(scan: number): boolean {
    return this.held.has(scan);
  }

  private event(k: number): void {
    this.pending.push(k);
    // PLAYGAME plays a key back on the tick after it was pressed
    const at = this.ticks + 1;
    this.segments[this.segments.length - 1].keys.push({ delta: at - this.lastKeyTick, key: k });
    this.lastKeyTick = at;
  }

  /** One game tick; returns 'link', 'dead' or 'end'. Moves to the next scene by itself. */
  async tick(): Promise<'link' | 'dead' | 'end' | undefined> {
    if (this.ended) return 'end';
    const w = this.w;
    this.ticks++;
    this.total++;
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
    if (dead) {
      this.deaths++;
      if (this.ci.lives > 0) {
        this.ci.lives--;
        this.ci.hitpts = -1;
        this.enter(this.scene, this.prev, this.link);
      } else this.ended = 'lost';
      return 'dead';
    }
    const t = getTouchBlocks(w);
    const links = this.game.scenes[this.scene].links;
    for (let l = 0; l < MAXSCENELINKS; l++) {
      const link = links[l];
      if (!link || link.toScene === NOSCENE) continue;
      if (t.blks.some(([x, y]) => x === link.from.x && y === link.from.y)) {
        if (link.toScene === 1) {
          this.ended = 'won';
          return 'end';
        }
        this.enter(link.toScene, this.scene, l);
        return 'link';
      }
    }
    return undefined;
  }

  /** Teddy's block position and the pixels past it. */
  get pos(): { x: number; y: number; sx: number; sy: number } {
    const c = this.w.chr;
    return { x: c.x[0], y: c.y[0], sx: c.x[1], sy: c.y[1] };
  }

  meter(i: number): number {
    return this.ci.meter[i];
  }

  /** The block on the map at (x, y). */
  blockAt(x: number, y: number): number {
    return this.w.map[y * MLEN + x];
  }

  solidAt(x: number, y: number): boolean {
    return bgBlock(this.w, this.w.blkmap[this.blockAt(x, y)] ?? 0).solid !== 0;
  }
}

export { MWID };

import { initializeScene as startSceneInits, changeBlocks } from '@lewismoten/gamemaker-sandbox-tools/kit/sceneInit';
