// The level check's headless player: one scene of a game played on the real engine
// (engine/scene.ts loadScene, startSceneInits and the body of playscene's game tick), with
// no screen, sound or timers, and a snapshot small enough to keep thousands of. The
// explorer (explore.ts) tries moves from a snapshot and takes them back. Nothing here
// changes how the engine plays: it only calls it.
import { moveCharGrav, moveChars, handleJoystick } from '../../engine/character';
import { simKeyPress } from '../../engine/keys';
import { blockBirthMonsters, moveAllMonsters } from '../../engine/monsters';
import { updateCharDrawState } from '../../engine/render';
import { loadScene, startSceneInits } from '../../engine/scene';
import { changeBlocks } from '../../engine/scene';
import { changeScroll, drawScroll, initScroll } from '../../engine/scroll';
import { getTouchBlocks } from '../../engine/touch';
import { LASTMM, LASTMON, MLEN, newCharInfo, type CharInfo, type MonInfo, type World } from '../../engine/world';
import { BACKBL } from '../../formats/blocks';
import { MAXSCENELINKS, NOSCENE, type Game } from '../../formats/game';

/** Where a scene's files come from (a GameFiles, or a plain map of names). */
export interface FileSource {
  get(name: string): Uint8Array | undefined;
}

/** PLAYGAME's game clock. */
export const TICKS_PER_SECOND = 18.2;

/** What a tick ended in: a link taken (its index), a death, or nothing. */
export type TickResult = { link: number } | 'dead' | undefined;

/** Everything that changes while a scene plays, packed small. */
export interface Snap {
  /** map and mapMon cells that differ from the scene as loaded: index, value pairs. */
  mapDiff: Uint16Array;
  monDiff: Uint16Array;
  /** Live monster slots: [slot, monnum, ...the MonInfo numbers] each. */
  mons: Float64Array;
  firstEmptyMM: number;
  blkmap: Uint8Array;
  nxtchg: Float64Array;
  blkMon: { blnum: number; nexttime: number }[];
  num: Float64Array;
  keydn: Uint8Array;
  keystack: { key: number; seq: number; frame: number }[];
  ci: CharInfo;
  scroll: World['scroll'];
  held: number[];
  pending: number[];
  randA: number;
  doScroll: boolean;
}

/** The numbers of a MonInfo, in a fixed order. */
const MI_LEN = 23;
function packMon(mi: MonInfo, out: Float64Array, o: number): void {
  out[o] = mi.fromchar;
  out[o + 1] = mi.delta.x;
  out[o + 2] = mi.delta.y;
  out[o + 3] = mi.curx[0];
  out[o + 4] = mi.curx[1];
  out[o + 5] = mi.cury[0];
  out[o + 6] = mi.cury[1];
  out[o + 7] = mi.target.x;
  out[o + 8] = mi.target.y;
  out[o + 9] = mi.offl;
  out[o + 10] = mi.offs;
  out[o + 11] = mi.curMarch;
  out[o + 12] = mi.curPic;
  out[o + 13] = mi.orient;
  out[o + 14] = mi.picDrawn ? 1 : 0;
  out[o + 15] = mi.scrPos.x;
  out[o + 16] = mi.scrPos.y;
  out[o + 17] = mi.oldPos.x;
  out[o + 18] = mi.oldPos.y;
  out[o + 19] = mi.dest;
  out[o + 20] = mi.nextAni;
  out[o + 21] = mi.nextMove;
  out[o + 22] = mi.birthTime;
}
function unpackMon(mi: MonInfo, a: Float64Array, o: number): void {
  mi.fromchar = a[o];
  mi.delta = { x: a[o + 1], y: a[o + 2] };
  mi.curx = [a[o + 3], a[o + 4]];
  mi.cury = [a[o + 5], a[o + 6]];
  mi.target = { x: a[o + 7], y: a[o + 8] };
  mi.offl = a[o + 9];
  mi.offs = a[o + 10];
  mi.curMarch = a[o + 11];
  mi.curPic = a[o + 12];
  mi.orient = a[o + 13];
  mi.picDrawn = a[o + 14] === 1;
  mi.scrPos = { x: a[o + 15], y: a[o + 16] };
  mi.oldPos = { x: a[o + 17], y: a[o + 18] };
  mi.dest = a[o + 19];
  mi.nextAni = a[o + 20];
  mi.nextMove = a[o + 21];
  mi.birthTime = a[o + 22];
}

/** Cells of `now` that differ from `base`, as index, value pairs. */
export function changedCells(base: Uint8Array, now: Uint8Array): Uint16Array {
  const out: number[] = [];
  // four cells at a time where both arrays are aligned (a map is 10000 cells)
  const words = now.byteOffset % 4 === 0 && base.byteOffset % 4 === 0 ? now.length >> 2 : 0;
  const a = new Uint32Array(now.buffer, now.byteOffset, words);
  const b = new Uint32Array(base.buffer, base.byteOffset, words);
  for (let i = 0; i < words; i++) {
    if (a[i] === b[i]) continue;
    for (let j = i * 4; j < i * 4 + 4; j++) if (now[j] !== base[j]) out.push(j, now[j]);
  }
  for (let i = words * 4; i < now.length; i++) if (now[i] !== base[i]) out.push(i, now[i]);
  return Uint16Array.from(out);
}

function copyCi(ci: CharInfo): CharInfo {
  return { ...ci, inv: ci.inv.slice(), meter: ci.meter.slice(), seqon: ci.seqon.slice() };
}

/** mulberry32, with its state where a snapshot can keep it (as the kit's sims seed monsters). */
function rng(sim: { randA: number }): () => number {
  return () => {
    sim.randA = (sim.randA + 0x6d2b79f5) >>> 0;
    let t = sim.randA;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fresh CharInfo as StartGameInits leaves it, for the first scene of a game. */
export function startCharInfo(): CharInfo {
  const ci = newCharInfo();
  ci.hitpts = -1;
  ci.lives = -1;
  ci.score = 0;
  ci.inv.fill(BACKBL + 1);
  ci.meter.fill(-1);
  return ci;
}

export class SceneSim {
  readonly w: World;
  /** The map and its monster layer as loaded, which snapshots are kept against. */
  private readonly baseMap: Uint8Array;
  private readonly baseMon: Uint8Array;
  readonly held = new Set<number>();
  private pending: number[] = [];
  private doScroll = false;
  randA: number;
  /** Sounds started this tick (slot numbers), for the sound checks. */
  sounds: number[] = [];

  /**
   * Loads `scene` as playscene does (a blank slot keeps `prev`'s), with the character at
   * `start` and the carried-over `ci` (a copy is taken), at game clock `clock`.
   */
  constructor(
    readonly game: Game,
    readonly scene: number,
    files: FileSource,
    start: { x: number; y: number },
    ci: CharInfo = startCharInfo(),
    clock = 1,
    prev?: World,
    seed = 1,
  ) {
    this.randA = seed >>> 0;
    const loaded = loadScene({ game, m: { files } }, scene, prev);
    if (Array.isArray(loaded)) throw new Error(`Missing files: ${loaded.join(', ')}`);
    const w = loaded.world;
    w.rand = rng(this);
    w.sound = { play: (n) => (this.sounds.push(n), true) };
    w.ci = copyCi(ci);
    w.clock = clock;
    this.w = w;
    startSceneInits(w, start);
    moveCharGrav(w, true);
    handleJoystick(w, true);
    initScroll(w, game.scenes[scene].scroll);
    this.baseMap = w.map.slice();
    this.baseMon = w.mapMon.slice();
  }

  /** Told every key event (scan, bit 7 = released), as a walkthrough records them. */
  onKey?: (key: number) => void;

  press(scan: number): void {
    if (this.held.has(scan)) return;
    this.held.add(scan);
    this.pending.push(scan);
    this.onKey?.(scan);
  }

  release(scan: number): void {
    if (!this.held.delete(scan)) return;
    this.pending.push(scan | 0x80);
    this.onKey?.(scan | 0x80);
  }

  /** Holds exactly these keys from now on. */
  hold(keys: readonly number[]): void {
    for (const k of [...this.held]) if (!keys.includes(k)) this.release(k);
    for (const k of keys) this.press(k);
  }

  /** One 18.2 Hz game tick, as playscene's tick() does it. */
  async tick(): Promise<TickResult> {
    const w = this.w;
    this.sounds.length = 0;
    for (let i = 0; i < 8; i++) if (this.doScroll) drawScroll(w);
    w.clock++;
    if (!w.noMons) {
      // BlocBirthMon does nothing on a tick no birth block is due (its scan finds no flag),
      // so it is skipped then: the same play, a good deal faster
      if (w.blkMon.some((b) => b.nexttime <= w.clock)) this.births();
      this.moveMonsters();
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
    if (dead) return 'dead';
    const link = this.linkTouched();
    return link < MAXSCENELINKS ? { link } : undefined;
  }

  /**
   * Monsters farther than this from the hero (blocks across, down) hold still while the
   * explorer plays, their clocks moved on so they pick up where they were; 0 moves them all.
   * Far monsters can't touch the hero (only ones on screen do), so this only shifts when
   * distant lifts and patrols are where they are: the explorer's trade of exactness for speed.
   */
  freezeBeyond = { x: 0, y: 0 };

  private moveMonsters(): void {
    const w = this.w;
    const { x: fx, y: fy } = this.freezeBeyond;
    if (!fx) return moveAllMonsters(w);
    const frozen: number[] = [];
    const cx = w.chr.x[0];
    const cy = w.chr.y[0];
    for (let l = 0; l < LASTMM; l++) {
      const mm = w.mm[l];
      if (mm.monnum >= LASTMON) continue;
      const mi = w.mi[l];
      let dx = Math.abs(mi.curx[0] - cx);
      let dy = Math.abs(mi.cury[0] - cy);
      if (dx > MLEN / 2) dx = MLEN - dx;
      if (dy > 50) dy = 100 - dy;
      if (dx <= fx && dy <= fy) continue;
      frozen.push(l, mm.monnum);
      mm.monnum = LASTMON;
      mi.nextMove++;
      mi.nextAni++;
      mi.birthTime++;
    }
    moveAllMonsters(w);
    for (let i = 0; i < frozen.length; i += 2) w.mm[frozen[i]].monnum = frozen[i + 1];
  }

  /** Engine-exact BlocBirthMon (no flags pass: plain calls), with the fast path below. */
  fastBirths = true;

  /**
   * BlocBirthMon. Many old block sets have every block "give birth" to monster 64 (none) every
   * tick, so the engine's scan calls BirthMon for every cell near the screen, each time only
   * moving FirstEmptyMM to the first empty slot (the slot it fills stays empty, and a real
   * birth later sets every field of it again). When no block due names a real monster this
   * does just that, and the due times, without the scan; otherwise the engine's own runs.
   */
  private births(): void {
    const w = this.w;
    if (!this.fastBirths) return blockBirthMonsters(w);
    const due = w.blkMon.filter((b) => b.nexttime <= w.clock);
    if (due.some((b) => (w.bg[b.blnum].birthMon & 0xff) !== LASTMON)) return blockBirthMonsters(w);
    const flagged = new Set<number>();
    for (const b of due) {
      b.nexttime += w.bg[b.blnum].birthTime;
      flagged.add(b.blnum);
    }
    // the cells the engine scans: the screen and half a screen round it
    let any = false;
    for (let lx = w.mx - 8; lx < w.mx + 24 && !any; lx++)
      for (let ly = w.my - 5; ly < w.my + 15; ly++) {
        const x = (lx + MLEN) % MLEN;
        const y = (ly + 100) % 100;
        if (flagged.has(w.blkmap[w.map[y * MLEN + x]] ?? BACKBL)) {
          any = true;
          break;
        }
      }
    if (!any) return;
    let t = w.firstEmptyMM;
    for (let n = 0; n <= LASTMM; n++) {
      if (t >= 0 && t < LASTMM && w.mm[t].monnum === LASTMON) break;
      t++;
      if (t >= LASTMM) t = 0;
    }
    w.firstEmptyMM = Math.max(0, t);
  }

  /** chklnk: the first of the scene's links whose From cell the character overlaps. */
  linkTouched(): number {
    const t = getTouchBlocks(this.w);
    const links = this.game.scenes[this.scene].links;
    for (let l = 0; l < MAXSCENELINKS; l++) {
      const link = links[l];
      if (!link || link.toScene === NOSCENE) continue;
      for (let i = 0; i < 6; i++) if (link.from.x === t.blks[i][0] && link.from.y === t.blks[i][1]) return l;
    }
    return MAXSCENELINKS;
  }

  snapshot(): Snap {
    const w = this.w;
    let live = 0;
    for (let l = 0; l < LASTMM; l++) if (w.mm[l].monnum < LASTMON) live++;
    const mons = new Float64Array(live * (MI_LEN + 2));
    let o = 0;
    for (let l = 0; l < LASTMM; l++) {
      if (w.mm[l].monnum >= LASTMON) continue;
      mons[o] = l;
      mons[o + 1] = w.mm[l].monnum;
      packMon(w.mi[l], mons, o + 2);
      o += MI_LEN + 2;
    }
    const c = w.chr;
    return {
      mapDiff: changedCells(this.baseMap, w.map),
      monDiff: changedCells(this.baseMon, w.mapMon),
      mons,
      firstEmptyMM: w.firstEmptyMM,
      blkmap: w.blkmap.slice(),
      nxtchg: Float64Array.from(w.nxtchg),
      blkMon: w.blkMon.map((b) => ({ ...b })),
      num: Float64Array.of(w.mx, w.my, w.clock, w.keystkptr, w.curkey, w.gclk, w.joyOldTime, w.joyOldBut, c.x[0], c.x[1], c.y[0], c.y[1], c.cframe, c.cseq),
      keydn: w.keydn.slice(),
      keystack: w.keystack.map((k) => ({ ...k })),
      ci: copyCi(w.ci),
      scroll: { ...w.scroll, bx: { ...w.scroll.bx }, by: { ...w.scroll.by } },
      held: [...this.held],
      pending: [...this.pending],
      randA: this.randA,
      doScroll: this.doScroll,
    };
  }

  restore(s: Snap): void {
    const w = this.w;
    w.map.set(this.baseMap);
    for (let i = 0; i < s.mapDiff.length; i += 2) w.map[s.mapDiff[i]] = s.mapDiff[i + 1];
    w.mapMon.set(this.baseMon);
    for (let i = 0; i < s.monDiff.length; i += 2) w.mapMon[s.monDiff[i]] = s.monDiff[i + 1];
    for (let l = 0; l < LASTMM; l++) w.mm[l].monnum = LASTMON;
    for (let o = 0; o < s.mons.length; o += MI_LEN + 2) {
      const l = s.mons[o];
      w.mm[l].monnum = s.mons[o + 1];
      unpackMon(w.mi[l], s.mons, o + 2);
    }
    w.firstEmptyMM = s.firstEmptyMM;
    w.blkmap.set(s.blkmap);
    for (let i = 0; i < s.nxtchg.length; i++) w.nxtchg[i] = s.nxtchg[i];
    w.blkMon = s.blkMon.map((b) => ({ ...b }));
    const n = s.num;
    [w.mx, w.my, w.clock, w.keystkptr, w.curkey, w.gclk, w.joyOldTime, w.joyOldBut] = [n[0], n[1], n[2], n[3], n[4], n[5], n[6], n[7]];
    const c = w.chr;
    c.x = [n[8], n[9]];
    c.y = [n[10], n[11]];
    c.cframe = n[12];
    c.cseq = n[13];
    w.keydn.set(s.keydn);
    w.keystack = s.keystack.map((k) => ({ ...k }));
    w.ci = copyCi(s.ci);
    w.scroll = { ...s.scroll, bx: { ...s.scroll.bx }, by: { ...s.scroll.by } };
    w.monsolid = 0;
    w.mmSolid = LASTMM;
    this.held.clear();
    for (const k of s.held) this.held.add(k);
    this.pending = [...s.pending];
    this.randA = s.randA;
    this.doScroll = s.doScroll;
  }

  /** The character's position in map pixels: x of its column, y of its bottom block. */
  get px(): { x: number; y: number } {
    const c = this.w.chr;
    return { x: c.x[0] * 20 + c.x[1], y: c.y[0] * 20 + c.y[1] };
  }

  /** The map cells the character overlaps now (GetTouchbl's cells), into `out`; returns how many. */
  touching(out: Int32Array): number {
    const { chr, ci } = this.w;
    const x0 = chr.x[0];
    const y0 = chr.y[0];
    const x1 = (x0 + 1) % MLEN;
    const y1 = (y0 + 1) % 100;
    let n = 0;
    if (ci.topthere) {
      const top = y0 - 1 < 0 ? y0 + 99 : y0 - 1;
      out[n++] = top * MLEN + x0;
      if (chr.x[1] > 0) out[n++] = top * MLEN + x1;
    }
    out[n++] = y0 * MLEN + x0;
    if (chr.x[1] > 0) out[n++] = y0 * MLEN + x1;
    if (chr.y[1] > 0) out[n++] = y1 * MLEN + x0;
    if (chr.x[1] > 0 && chr.y[1] > 0) out[n++] = y1 * MLEN + x1;
    return n;
  }
}
