// The level check's explorer: plays one scene on the real engine (sim.ts) from where the
// hero enters, trying every move (inputs.ts) from every place the hero comes to rest. Places
// are bucketed by cell, a half cell across, what the hero carries and which doors are open
// (and, near lifts and timed blocks, by the second they were reached), so each is tried once.
// On the way it keeps where the hero went (the heat map), what it touched, and what went
// wrong as it played: deaths, falls the player can't see, hurts that hold the hero, scoring
// that never stops. stuck.ts then finds the places with no way out.
import { BACKBL, BLEN, type Block } from '../../formats/blocks';
import { DIESEQ, HURTSEQ } from '../../formats/character';
import { MLEN, MWID } from '../../formats/map';
import { LASTMM, LASTMON, type CharInfo, type World } from '../../engine/world';
import { keyRoles, movesFor, type Move } from './inputs';
import { SceneSim, changedCells, type FileSource, type Snap } from './sim';
import { driveMove } from './drive';
import { getsAway } from './escape';
import type { Game, Link } from '../../formats/game';

const CELLS = MLEN * MWID;

export interface ExploreOptions {
  /** Stop after this long (ms of work); the result says it was cut short. */
  budgetMs?: number;
  maxNodes?: number;
  /** Told now and then how far it has got; return true to stop. */
  progress?: (nodes: number, queued: number) => boolean | void;
  now?: () => number;
  /** Move every monster every tick, however far away (slower). */
  exact?: boolean;
  /** Only these of the character's moves (a bot's style: walk and hop, walk only…). */
  moveFilter?: (m: Move) => boolean;
  /** Wait at every place, not only near lifts and timed blocks. */
  waitEverywhere?: boolean;
  /** Cells to head for: places nearer them are tried first. */
  goal?: number[];
  /** Stop as soon as a link this accepts is taken (a bot after the next scene). */
  stopAt?: (link: number, toScene: number) => boolean;
  /** Start partway through the scene: a snapshot of this scene from the same entry. */
  start?: Snap;
}

/** Where the hero comes into the scene, and with what. */
export interface Entry {
  start: { x: number; y: number };
  ci: CharInfo;
  clock: number;
  prev?: World;
}

/** How a place was first reached: from `parent`, by move `move`, `ticks` ticks into it. */
export interface Via {
  parent: number;
  move: number;
  ticks: number;
}

/** A resting place (a node of the graph). */
export interface Place {
  cell: number;
  /** Undefined for the place the hero enters at. */
  via?: Via;
  /** Lifts or timed blocks are near: the explorer also waits here. */
  waits: boolean;
  /** Every move was tried from here (false where the budget ran out first). */
  done: boolean;
  /** Ticks since the hero entered the scene. */
  tick: number;
  hp: number;
  snap?: Snap;
  out: number[];
  /** Links it leads to directly. */
  exits: number[];
  /** The move that brought the hero here fell more than two blocks. */
  dropIn?: number;
  /** What the hero has gathered by here: things carried, counters and score (a bot that collects). */
  worth: number;
  /** Every move tried from here ended in a death: the hero is doomed here, not stuck. */
  doomed?: boolean;
}

export interface ExitReach {
  link: number;
  toScene: number;
  tick: number;
  hp: number;
  ci: CharInfo;
  clock: number;
  to: { x: number; y: number };
  world: World;
  /** The place and move that first took the hero there. */
  via: Via;
}

/** Something that went wrong in play, where it happened. */
export interface Incident {
  kind: 'death' | 'blind-drop' | 'hazard-landing' | 'hurt-lock' | 'every-tick-score' | 'every-tick-heal';
  cell: number;
  /** Where it started (a drop's edge). */
  from?: number;
  detail: string;
  /** What did it: 'block <n>' or 'monster <n>'. */
  source?: string;
}

export interface Exploration {
  scene: number;
  places: Place[];
  /** Ticks of play spent on each cell (the heat map) and the first tick it was reached (-1 never). */
  heat: Uint32Array;
  first: Int32Array;
  /** Placed monster slots the hero came within reach of. */
  monsters: Set<number>;
  exits: ExitReach[];
  incidents: Incident[];
  /** True when every place was tried before the budget ran out. */
  complete: boolean;
  ticks: number;
  ms: number;
  /** The scene's gravity pulls somewhere (a platform game, not a top-down one). */
  gravity: boolean;
  /** The moves tried (Via.move indexes them). */
  moves: Move[];
  /** The scene's links, from the .gam file. */
  links: Link[];
}

/** Block numbers whose animation changes how they hold, push or hurt the hero (timed doors, lifts). */
export function timedBlocks(bg: Block[]): Set<number> {
  const out = new Set<number>();
  for (let n = 0; n < BACKBL; n++) {
    const b = bg[n];
    if (!b || b.ntime <= 0 || b.nextBl === n) continue;
    let k = b.nextBl;
    for (let i = 0; i < 20 && k !== n && k < BACKBL; i++) {
      const c = bg[k];
      if (c.solid !== b.solid || c.grav !== b.grav || Math.sign(c.chHitPt) !== Math.sign(b.chHitPt)) {
        out.add(n);
        break;
      }
      k = c.nextBl;
    }
  }
  return out;
}

export async function explore(game: Game, scene: number, files: FileSource, entry: Entry, opt: ExploreOptions = {}): Promise<Exploration> {
  const now = opt.now ?? (() => performance.now());
  const t0 = now();
  const budget = opt.budgetMs ?? 10_000;
  const maxNodes = opt.maxNodes ?? 100_000;
  const sim = new SceneSim(game, scene, files, entry.start, entry.ci, entry.clock, entry.prev);
  // monsters a screen and a half away hold still (sim.ts freezeBeyond)
  sim.freezeBeyond = opt.exact ? { x: 0, y: 0 } : { x: 24, y: 15 };
  if (opt.start) sim.restore(opt.start);
  const w = sim.w;
  const bg = w.bg;
  const gravity = bg.some((b) => b.grav !== 0);
  const moves = movesFor(keyRoles(w.chr, gravity), gravity).filter((m) => !opt.moveFilter || opt.moveFilter(m));
  const goal = opt.goal?.map((c) => ({ x: c % MLEN, y: Math.floor(c / MLEN) }));
  /** Blocks from the nearest goal cell (wrapping as the map does). */
  const distance = (cell: number) => {
    const x = cell % MLEN;
    const y = Math.floor(cell / MLEN);
    let best = Infinity;
    for (const g of goal ?? []) {
      const dx = Math.abs(g.x - x);
      const dy = Math.abs(g.y - y);
      best = Math.min(best, Math.min(dx, MLEN - dx) + Math.min(dy, MWID - dy));
    }
    return best;
  };
  const heap = new PlaceHeap();
  let reachedStop = false;
  const timed = timedBlocks(bg);
  // blocks that refuse a touch while a counter is short (locks), and the counters they read
  const gateCounters = [...new Set(bg.filter((b) => (b.effect >= 20 || b.effect === 3) && b.eamt < 0).map((b) => b.effect))];
  const limitedSeqs = w.chr.sequences.flatMap((s, i) => (i >= 5 && s.key && w.chr.meter[i] < 32767 ? [i] : []));
  const solidMonster = (n: number) => {
    const m = w.mon[n];
    if (!m) return false;
    for (const [p] of m.pic) if (p < 100 && w.mblk[p]?.solid) return true;
    return false;
  };
  const lifts = new Set<number>();
  for (let n = 0; n < LASTMON; n++) if (solidMonster(n)) lifts.add(n);
  const startClock = w.clock;
  const heat = new Uint32Array(CELLS);
  const first = new Int32Array(CELLS).fill(-1);
  const monsters = new Set<number>();
  const exits = new Map<number, ExitReach>();
  const incidents: Incident[] = [];
  const seenIncident = new Set<string>();
  const note = (i: Incident) => {
    const k = `${i.kind}:${i.cell}:${i.source ?? ''}`;
    if (seenIncident.has(k)) return;
    seenIncident.add(k);
    incidents.push(i);
  };
  const baseMap = w.map.slice();
  const places: Place[] = [];
  const index = new Map<string, number>();
  const visitsAt = new Map<string, number>();
  // places whose move found new ground are tried first, so a run cut short still covers the most
  const fresh: number[] = [];
  const queue: number[] = [];
  let head = 0;
  let ticks = 0;
  let newCells = 0;
  let via: Via | undefined;
  let moveTicks = 0;
  const touch = new Int32Array(6);

  const cellOf = () => w.chr.y[0] * MLEN + w.chr.x[0];
  /** Something that moves or changes with time is near the hero: waiting can matter here. */
  const nearTimed = () => {
    const cx = w.chr.x[0];
    const cy = w.chr.y[0];
    for (let l = 0; l < LASTMM; l++) {
      const mm = w.mm[l];
      if (mm.monnum >= LASTMON || !lifts.has(mm.monnum)) continue;
      const mi = w.mi[l];
      if (Math.abs(mi.curx[0] - cx) <= 8 && Math.abs(mi.cury[0] - cy) <= 8) return true;
    }
    if (timed.size)
      for (let y = Math.max(0, cy - 5); y <= Math.min(MWID - 1, cy + 5); y++)
        for (let x = Math.max(0, cx - 6); x <= Math.min(MLEN - 1, cx + 6); x++) if (timed.has(w.map[y * MLEN + x])) return true;
    return false;
  };
  /** What the hero carries and which doors stand open: places differ by it. */
  const signature = () => {
    const ci = w.ci;
    let s = ci.inv.filter((b) => b < BACKBL).join('.');
    for (const e of gateCounters) s += `|${e}:${ci.meter[e] > 0 ? Math.min(ci.meter[e], 9) : 0}`;
    for (const q of limitedSeqs) s += `|q${Math.min(ci.meter[q], 3)}`;
    const d = changedCells(baseMap, w.map);
    for (let i = 0; i < d.length; i += 2) {
      const a = bg[baseMap[d[i]]];
      const b = bg[d[i + 1]];
      if (a.solid !== b.solid || a.grav !== b.grav) s += `|${d[i]}`;
    }
    return s;
  };
  const addPlace = (dropIn?: number): number => {
    const c = w.chr;
    const timedHere = nearTimed();
    // half a block across matters for where a jump starts; up and down the hero rests on floors
    const spot = `${c.x[0]},${c.y[0]},${gravity && c.x[1] >= BLEN / 2 ? 1 : 0},${signature()}`;
    let key = spot;
    if (timedHere) {
      const v = visitsAt.get(spot) ?? 0;
      key = `${spot}@${Math.floor((w.clock - startClock) / 18)}`;
      if (index.has(key)) return index.get(key)!;
      if (v >= 8) return index.get(`${spot}#first`) ?? -1;
      visitsAt.set(spot, v + 1);
    }
    const had = index.get(key);
    if (had !== undefined) return had;
    const id = places.length;
    places.push({
      cell: cellOf(),
      via: via && { ...via, ticks: moveTicks },
      waits: timedHere,
      done: false,
      tick: w.clock - startClock,
      hp: w.ci.hitpts,
      worth: worthOf(w.ci),
      snap: sim.snapshot(),
      out: [],
      exits: [],
      dropIn,
    });
    index.set(key, id);
    if (timedHere && !index.has(`${spot}#first`)) index.set(`${spot}#first`, id);
    if (goal) heap.push(id, distance(cellOf()) * 1000 + (w.clock - startClock) / 100);
    else (newCells ? fresh : queue).push(id);
    return id;
  };

  /** Hurt-lock tests run (by cell and culprit; -1 once one found a lock), and how many more may run. */
  const lockTests = new Map<string, number>();
  let lockTestsLeft = 150;
  /** One tick, with everything the checks watch for. Returns 'dead', a link, or undefined. */
  const hurtRun = { n: 0, at: -1, x: 0, y: 0 };
  const scoreRun = { n: 0, heal: 0 };
  let fall: { from: number; my: number; maxDy: number; blind: boolean } | undefined;
  let landedAt = -1;
  let landedTick = 0;
  const step = async (): Promise<'dead' | number | undefined> => {
    const hp = w.ci.hitpts;
    const score = w.ci.score;
    const before = sim.px;
    const t = await sim.tick();
    // the death sequence has started: nothing the player does stops it (touch.ts sets it at 0 hit points)
    const r = t === undefined && w.chr.cseq === DIESEQ ? 'dead' : t;
    ticks++;
    moveTicks++;
    const tick = w.clock - startClock;
    const nt = sim.touching(touch);
    for (let i = 0; i < nt; i++) {
      const c = touch[i];
      heat[c]++;
      if (first[c] < 0) newCells++;
      if (first[c] < 0 || tick < first[c]) first[c] = tick;
    }
    const pos = sim.px;
    // monsters within reach (a block either way; the hero is two blocks tall)
    for (let l = 0; l < LASTMM; l++) {
      if (w.mm[l].monnum >= LASTMON) continue;
      const mi = w.mi[l];
      const mx = mi.curx[0] * BLEN + mi.curx[1];
      const my = mi.cury[0] * BLEN + mi.cury[1];
      if (Math.abs(mx - pos.x) < BLEN + 4 && my - pos.y < BLEN + 4 && pos.y - my < BLEN * 2 + 4) monsters.add(l);
    }
    // hurt on tick after tick without getting away: something may hold the hero while it hurts.
    // PLAYGAME hurts on every tick of a touch, so a bot standing in a foe's way is hurt as long as
    // it stands there; it is only a lock when none of the moves gets the hero away (escape.ts).
    if (w.ci.hitpts < hp && w.chr.cseq !== DIESEQ) {
      if (hurtRun.n === 0) Object.assign(hurtRun, { at: cellOf(), x: pos.x, y: pos.y });
      hurtRun.n++;
      if (hurtRun.n === 8 && Math.abs(pos.x - hurtRun.x) < BLEN && Math.abs(pos.y - hurtRun.y) < BLEN) {
        const source = culprit(w, sim, 'hurt');
        const k = `${hurtRun.at}:${source ?? ''}`;
        const tried = lockTests.get(k) ?? 0;
        if (tried >= 0 && tried < 3 && lockTestsLeft > 0) {
          lockTestsLeft--;
          const away = await getsAway(sim, moves);
          lockTests.set(k, away ? tried + 1 : -1);
          if (!away)
            note({
              kind: 'hurt-lock',
              cell: hurtRun.at,
              detail: 'Something holds the hero while it hurts: no key gets him away',
              source,
            });
        }
      }
    } else if (w.chr.cseq !== HURTSEQ) hurtRun.n = 0;
    // points or health every tick: a touch that never uses itself up
    if (w.ci.score > score) scoreRun.n++;
    else scoreRun.n = 0;
    if (w.ci.hitpts > hp) scoreRun.heal++;
    else scoreRun.heal = 0;
    if (scoreRun.n === 18) note({ kind: 'every-tick-score', cell: cellOf(), detail: 'Scored on every tick for a second', source: culprit(w, sim, 'score') });
    if (scoreRun.heal === 18) note({ kind: 'every-tick-heal', cell: cellOf(), detail: 'Healed on every tick for a second', source: culprit(w, sim, 'heal') });
    // falls: how far, how fast, and whether the player could see where they end
    const dy = pos.y - before.y;
    if (gravity && w.ci.gravy > 0 && dy > 0) {
      if (!fall) fall = { from: Math.floor(before.y / BLEN) * MLEN + Math.floor(before.x / BLEN), my: w.my, maxDy: 0, blind: false };
      fall.maxDy = Math.max(fall.maxDy, dy);
      // feet in the bottom block row of the screen while still falling: nothing below is shown
      if (w.ci.nexty > 200 - BLEN * 2 && dy >= 8) fall.blind = true;
    } else if (fall && w.ci.gravy === 0) {
      const fromY = Math.floor(fall.from / MLEN);
      const height = w.chr.y[0] - fromY;
      if (height > 3) {
        // the view's rows are my..my+9: a landing a whole block below them was out of sight
        const offView = w.chr.y[0] > fall.my + 10;
        if (fall.blind || offView)
          note({
            kind: 'blind-drop',
            cell: cellOf(),
            from: fall.from,
            detail: `A ${height}-block fall${offView ? ' to a landing that was off the screen when it began' : ''}, ${Math.round(fall.maxDy)} px a tick at the end`,
          });
        landedAt = cellOf();
        landedTick = tick;
      }
      fall = undefined;
    }
    if (landedAt >= 0 && tick - landedTick <= 3 && (w.ci.hitpts < hp || r === 'dead')) {
      note({ kind: 'hazard-landing', cell: landedAt, detail: 'A long fall ends on something that hurts', source: culprit(w, sim, 'hurt') });
      landedAt = -1;
    }
    if (r === 'dead') {
      note({ kind: 'death', cell: cellOf(), detail: 'The hero died here', source: culprit(w, sim, 'hurt') });
      return 'dead';
    }
    if (r) {
      const link = r.link;
      const l = game.scenes[scene].links[link];
      const had = exits.get(link);
      if (!had || w.ci.hitpts > had.hp)
        exits.set(link, {
          link,
          toScene: l.toScene,
          tick: had ? Math.min(had.tick, tick) : tick,
          hp: w.ci.hitpts,
          ci: { ...w.ci, inv: w.ci.inv.slice(), meter: w.ci.meter.slice(), seqon: w.ci.seqon.slice() },
          clock: w.clock,
          to: l.to,
          world: w,
          via: had?.via ?? { ...via!, ticks: moveTicks },
        });
      if (opt.stopAt?.(link, l.toScene)) reachedStop = true;
      return link;
    }
    return undefined;
  };

  /** Plays one move from the place restored. Returns the places it ended in, and links reached. */
  const play = async (m: Move): Promise<{ to: number[]; exits: number[]; dead?: boolean }> => {
    const to: number[] = [];
    const startY = w.chr.y[0];
    fall = undefined;
    landedAt = -1;
    hurtRun.n = 0;
    scoreRun.n = scoreRun.heal = 0;
    newCells = 0;
    moveTicks = 0;
    const r = await driveMove(sim, m, { tick: step, carried: () => to.push(addPlace()) });
    if (typeof r.end === 'number') return { to, exits: [r.end] };
    if (r.end === 'dead') return { to, exits: [], dead: true };
    const drop = w.chr.y[0] - startY > 2 ? w.chr.y[0] - startY : undefined;
    to.push(addPlace(drop));
    return { to, exits: [] };
  };

  addPlace();
  let stopped = false;
  let lastReport = now();
  for (;;) {
    const id = goal ? heap.pop() : fresh.length ? fresh.shift()! : head < queue.length ? queue[head++] : -1;
    if (id < 0 || reachedStop) break;
    if (places.length >= maxNodes || now() - t0 > budget) {
      stopped = true;
      break;
    }
    const p = places[id];
    let tried = 0;
    let deaths = 0;
    for (const [mi, m] of moves.entries()) {
      if (m.waits && !p.waits && !opt.waitEverywhere) continue;
      sim.restore(p.snap!);
      via = { parent: id, move: mi, ticks: 0 };
      const r = await play(m);
      tried++;
      if (r.dead) deaths++;
      for (const t of r.to) if (t >= 0 && t !== id && !p.out.includes(t)) p.out.push(t);
      for (const e of r.exits) if (!p.exits.includes(e)) p.exits.push(e);
      if (reachedStop) break;
    }
    // a place is tried once: its snapshot (a few kilobytes) is no longer needed
    p.snap = undefined;
    p.done = true;
    if (tried && deaths === tried && !reachedStop) p.doomed = true;
    if (now() - lastReport > 200) {
      lastReport = now();
      if (opt.progress?.(places.length, queue.length - head + fresh.length + heap.size)) {
        stopped = true;
        break;
      }
    }
  }
  for (const p of places) p.snap = undefined;
  return {
    scene,
    places,
    heat,
    first,
    monsters,
    exits: [...exits.values()],
    incidents,
    complete: !stopped && !reachedStop,
    ticks,
    ms: now() - t0,
    gravity,
    moves,
    links: game.scenes[scene].links,
  };
}

/** What the hero is touching that would do this: a block in its cells, else the monster nearest. */
function culprit(w: World, sim: SceneSim, what: 'hurt' | 'score' | 'heal'): string | undefined {
  const fits = (b: Block | undefined) => !!b && (what === 'hurt' ? b.chHitPt < 0 : what === 'heal' ? b.chHitPt > 0 : b.scorePts > 0);
  const cells = new Int32Array(6);
  const nt = sim.touching(cells);
  for (const c of cells.subarray(0, nt)) {
    const n = w.blkmap[w.map[c]];
    if (fits(w.bg[n])) return `block ${n}`;
  }
  const p = sim.px;
  let best: string | undefined;
  let bestD = Infinity;
  for (let l = 0; l < LASTMM; l++) {
    const mm = w.mm[l];
    if (mm.monnum >= LASTMON) continue;
    const mi = w.mi[l];
    const pic = mi.curPic >= 0 && mi.curPic < 20 ? w.mon[mm.monnum]?.pic[mi.curPic]?.[0] : undefined;
    if (pic === undefined || pic >= 100 || !fits(w.mblk[pic])) continue;
    const d = Math.abs(mi.curx[0] * BLEN + mi.curx[1] - p.x) + Math.abs(mi.cury[0] * BLEN + mi.cury[1] - p.y);
    if (d < bestD && d < BLEN * 3) {
      bestD = d;
      best = `monster ${mm.monnum}`;
    }
  }
  return best;
}

/** Places by priority, lowest first (a binary heap). */
class PlaceHeap {
  private ids: number[] = [];
  private keys: number[] = [];
  get size(): number {
    return this.ids.length;
  }
  push(id: number, key: number): void {
    let i = this.ids.length;
    this.ids.push(id);
    this.keys.push(key);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.keys[p] <= key) break;
      this.ids[i] = this.ids[p];
      this.keys[i] = this.keys[p];
      i = p;
    }
    this.ids[i] = id;
    this.keys[i] = key;
  }
  pop(): number {
    if (!this.ids.length) return -1;
    const top = this.ids[0];
    const id = this.ids.pop()!;
    const key = this.keys.pop()!;
    if (this.ids.length) {
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        if (l >= this.ids.length) break;
        const c = l + 1 < this.ids.length && this.keys[l + 1] < this.keys[l] ? l + 1 : l;
        if (this.keys[c] >= key) break;
        this.ids[i] = this.ids[c];
        this.keys[i] = this.keys[c];
        i = c;
      }
      this.ids[i] = id;
      this.keys[i] = key;
    }
    return top;
  }
}

/** Things carried count most, then counters (money and the ten special ones), then score. */
export function worthOf(ci: CharInfo): number {
  let counters = 0;
  for (let i = 20; i < 30; i++) counters += Math.max(0, ci.meter[i] ?? 0);
  return ci.inv.filter((b) => b < BACKBL).length * 1e6 + (counters + Math.max(0, ci.meter[3] ?? 0)) * 1e3 + ci.score;
}
