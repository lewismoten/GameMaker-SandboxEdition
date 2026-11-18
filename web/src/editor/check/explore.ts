// Explores scene states with engine-backed moves, recording heat, exits, incidents and graph edges.
import { BACKBL, BLEN, SOLTOP } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { DIESEQ, HURTSEQ } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { bgBlock, shownBlock, LASTMM, LASTMON } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { keyRoles, movesFor, steadyMoves, type Move } from './inputs';
import { keysAllowed } from './keyLimit';
import { SceneSim, changedCells, type FileSource } from './sim';
import { driveMove } from './drive';
import { getsAway } from './escape';
import type { Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { goalDistances } from './goalDistances';
import { continuousFlight, directionalGravity, platformGoals } from './platformGoals';
import { footCell } from './walk/walkPaths';
import type { Entry, Exploration, ExploreOptions, ExitReach, Incident, Place, Via } from './exploreTypes';
import { PlaceHeap, timedBlocks, worthOf } from './exploreSearch';
import { confirmStuck, culprit } from './exploreFindings';

export type { ExploreOptions, ExploreLive, Entry, Via, ExitReach, Incident, Exploration } from './exploreTypes';

const CELLS = MLEN * MWID;

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
  const gravity = opt.steerAirborne ? directionalGravity(w) : bg.some((b) => b.grav !== 0);
  // A scene can mix gravity-driven platforms with corridors where opposing
  // pulls cancel. Those corridors still need precise turns on both axes.
  const turning = opt.steerAirborne && opt.alignTurns;
  const sequencesByKey = new Map<number, number[]>();
  w.chr.sequences.forEach((sequence, index) => {
    const key = sequence.key >> 8;
    if (key) sequencesByKey.set(key, [...(sequencesByKey.get(key) ?? []), index]);
  });
  const flying = opt.steerAirborne && continuousFlight(w);
  const all = movesFor(keyRoles(w.chr, gravity && !flying), gravity && !flying, opt.steerAirborne, flying).filter(
    (m) => keysAllowed(m) && (!opt.moveFilter || opt.moveFilter(m)),
  );
  const moves = opt.steadyTicks ? steadyMoves(all, opt.steadyTicks, opt.steadySteering) : all;
  const goal = opt.goal?.map((c) => ({ x: c % MLEN, y: Math.floor(c / MLEN) }));
  const routeDistance = goal && opt.steerAirborne ? goalDistances(w, opt.goal!) : undefined;
  const footings = goal && opt.steerAirborne && gravity && !flying ? platformGoals(w, opt.goal!) : undefined;
  /** Blocks from the nearest goal cell (wrapping as the map does). */
  const distance = (cell: number) => {
    const x = cell % MLEN;
    const y = Math.floor(cell / MLEN);
    if (routeDistance && routeDistance[cell] !== 0xffff) return routeDistance[cell];
    let best = Infinity;
    for (const g of goal ?? []) {
      const dx = Math.abs(g.x - x);
      const dy = Math.abs(g.y - y);
      best = Math.min(best, Math.min(dx, MLEN - dx) + Math.min(dy, MWID - dy));
    }
    return best;
  };
  const fallbackCost = (field: Uint16Array | undefined) => (field ? field.reduce((max, n) => (n === 0xffff ? max : Math.max(max, n)), 0) * 5 + MLEN + MWID : 0);
  const normalFallback = fallbackCost(footings?.normal),
    boostedFallback = fallbackCost(footings?.boosted);
  const footingDistance = (cell: number) => {
    const boosted = !!footings?.boosted && (w.ci.gravy < 0 || footings.abilities.some((q) => w.ci.seqon[q] && w.ci.meter[q] > 0));
    const field = boosted ? footings.boosted : footings?.normal;
    // Keep unknown routes available, but never make an unsupported shortcut
    // cheaper solely because its fallback uses cells instead of jump counts.
    if (field && field[cell] !== 0xffff) return field[cell] * 5;
    // Rising beside a higher platform does not mean it has been reached.
    // Real footings (or the projected landing below) count as route progress.
    return distance(cell) + (boosted ? boostedFallback : normalFallback);
  };
  const heap = new PlaceHeap();
  const paths = goal && opt.paths?.blocks.size ? opt.paths : undefined;
  const offCost = paths?.offCost ?? 1;
  let reachedStop = false;
  let reached: number | undefined;
  const timed = timedBlocks(bg);
  // blocks that refuse a touch while a counter is short (locks), and the counters they read
  const gateCounters = [...new Set(bg.filter((b) => (b.effect >= 20 || b.effect === 3) && b.eamt < 0).map((b) => b.effect))];
  // a counter matters up to what its dearest gate takes (one over it: money and the special
  // counters are kept one over what they show), so 9 words and 24 aren't the same place
  const gateNeed = new Map(gateCounters.map((e) => [e, Math.max(9, ...bg.filter((b) => b.effect === e && b.eamt < 0).map((b) => -b.eamt + 1))]));
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
  const exits = new Map<number | string, ExitReach>();
  const poorExits = new Map<number, ExitReach>();
  const incidents: Incident[] = [];
  const deathsAt = new Map<number, number>();
  const seenIncident = new Set<string>();
  const note = (i: Incident) => {
    const k = `${i.kind}:${i.cell}:${i.source ?? ''}`;
    if (seenIncident.has(k)) return;
    seenIncident.add(k);
    incidents.push(i);
  };
  const baseMap = w.map.slice();
  const visitsByCell = new Uint32Array(CELLS);
  const baseMonsters = w.mm.map((m) => m.monnum);
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
  let verticalMotion = 0;
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
    for (const e of gateCounters) s += `|${e}:${ci.meter[e] > 0 ? Math.min(ci.meter[e], gateNeed.get(e)!) : 0}`;
    for (const q of limitedSeqs) s += `|q${q}:${Math.min(ci.meter[q], 3)}`;
    s += `|on:${ci.seqon.join('')}`;
    if (opt.steerAirborne && (gravity || turning) && !flying && (sim.held.size || w.chr.cseq !== 0))
      s += `|held:${[...sim.held].sort((a, b) => a - b).join('.')}:${w.chr.cseq},${w.chr.cframe},${ci.nextAni - w.clock}`;
    // Defeating a foe or leaving a shot in flight can open a route without moving the hero.
    // Ignore ordinary enemy motion and duplicate shots in the same cell.
    const shots = new Set<string>();
    for (let l = 0; (opt.resourceSearch || opt.steerAirborne) && l < LASTMM; l++) {
      const n = w.mm[l].monnum;
      const mi = w.mi[l];
      if (baseMonsters[l] < LASTMON && n !== baseMonsters[l]) s += `|m${l}:${n}`;
      if (n < LASTMON && mi.fromchar && Math.abs(mi.curx[0] - w.chr.x[0]) <= 8 && Math.abs(mi.cury[0] - w.chr.y[0]) <= 8)
        shots.add(`${n}:${mi.curx[0]},${mi.cury[0]}`);
    }
    s += `|shots:${[...shots].sort().join(';')}`;
    if (opt.resourceSearch || opt.steerAirborne) s += `|aim:${Math.sign(ci.netx)},${Math.sign(ci.nety)}`;
    const d = changedCells(baseMap, w.map);
    for (let i = 0; i < d.length; i += 2) {
      const a = bgBlock(w, baseMap[d[i]]);
      const b = bgBlock(w, d[i + 1]);
      if (a.solid !== b.solid || a.grav !== b.grav) s += `|${d[i]}:${d[i + 1]}`;
    }
    return s;
  };
  const addPlace = (dropIn?: number): number => {
    const c = w.chr;
    const timedHere = nearTimed();
    // half a block across matters for where a jump starts; up and down the hero rests on floors
    const motion =
      gravity && (opt.resourceSearch || opt.steerAirborne) ? `${c.y[1] >= BLEN / 2 ? 1 : 0}:${Math.round(w.ci.gravx / 4)},${Math.round(w.ci.gravy / 4)}` : '';
    // In a maze, a turn can require exact alignment on either axis.
    // Do not merge a centered corridor position with an overlapping wall edge.
    const alignment = turning ? `${c.x[1]},${c.y[1]}` : `${gravity && c.x[1] >= BLEN / 2 ? 1 : 0}`;
    const spot = `${c.x[0]},${c.y[0]},${alignment},${motion},${signature()}`;
    let key = spot;
    if (timedHere) {
      const v = visitsAt.get(spot) ?? 0;
      key = `${spot}@${Math.floor((w.clock - startClock) / 18)}`;
      if (!index.has(key)) {
        if (v >= 8) return index.get(`${spot}#first`) ?? -1;
        visitsAt.set(spot, v + 1);
      }
    }
    const had = index.get(key);
    if (had !== undefined && w.ci.hitpts <= places[had].hp) return had;
    const id = places.length;
    const cost = paths && (via ? (places[via.parent]?.cost ?? 0) + 1 + (paths.blocks.has(w.map[footCell(w)]) ? 0 : offCost) : 0);
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
      ...(paths ? { cost } : {}),
    });
    index.set(key, id);
    if (id > 0 && reached === undefined && opt.stopWhen?.(w)) {
      reached = id;
      reachedStop = true;
    }
    if (timedHere && !index.has(`${spot}#first`)) index.set(`${spot}#first`, id);
    // (keeping to paths: the way so far and the distance left, and of two as good, the nearer)
    if (goal && paths) heap.push(id, (cost! + distance(cellOf())) * 1000 + distance(cellOf()) * 10 + (w.clock - startClock) / 100);
    else if (goal) {
      const visits = opt.resourceSearch || opt.steerAirborne ? visitsByCell[cellOf()]++ : 0;
      // Maze alignment creates several useful states in a cell. A linear penalty
      // would send the search away from a corridor simply for lining up a turn.
      const crowd = 2 * (turning ? Math.log2(1 + visits) : visits);
      const bearing = footCell(w);
      const bearingX = bearing % MLEN;
      let toward = footingDistance(bearing);
      // Falling past the goal is not progress. Rank a released airborne state by
      // its next footing, where steering can become a useful standing route.
      if (opt.steerAirborne && verticalMotion > 0) {
        for (let dy = 1; dy <= MWID; dy++) {
          const y = (c.y[0] + dy) % MWID;
          const b = shownBlock(w, w.map[y * MLEN + bearingX]);
          if (b.solid & SOLTOP) {
            toward = footingDistance(((y + MWID - 1) % MWID) * MLEN + bearingX) + distance(cellOf()) / 100;
            break;
          }
        }
      }
      heap.push(id, (toward + crowd) * 1000 + (w.clock - startClock) / 100);
    } else (newCells ? fresh : queue).push(id);
    return id;
  };

  /** Hurt-lock tests run (by culprit, else cell; -1 once one found a lock), and how many more may run. */
  const lockTests = new Map<string, number>();
  let lockTestsLeft = 40;
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
    // Gravity can point down while an active sequence moves the hero upward.
    // Use actual wrapped displacement when ranking rising versus falling states.
    verticalMotion = sim.px.y - before.y;
    if (verticalMotion > (MWID * BLEN) / 2) verticalMotion -= MWID * BLEN;
    if (verticalMotion < -(MWID * BLEN) / 2) verticalMotion += MWID * BLEN;
    opt.onTick?.(w);
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
        const k = source ?? `cell ${hurtRun.at}`;
        const tried = lockTests.get(k) ?? 0;
        if (tried >= 0 && tried < 2 && lockTestsLeft > 0) {
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
      deathsAt.set(cellOf(), (deathsAt.get(cellOf()) ?? 0) + 1);
      note({ kind: 'death', cell: cellOf(), detail: 'The hero died here', source: culprit(w, sim, 'hurt') });
      return 'dead';
    }
    if (r) {
      const link = r.link;
      const l = game.scenes[scene].links[link];
      // The same exit reached with different supplies is a different usable route.
      // Keep its path together with its carried state, including later pickups.
      const exitKey = opt.steerAirborne ? `${link}|${w.ci.inv.join(',')}|${w.ci.meter.join(',')}|${w.ci.seqon.join('')}` : link;
      const had = exits.get(exitKey);
      const reach = (prev?: ExitReach): ExitReach => ({
        link,
        toScene: l.toScene,
        tick: prev ? Math.min(prev.tick, tick) : tick,
        hp: w.ci.hitpts,
        ci: { ...w.ci, inv: w.ci.inv.slice(), meter: w.ci.meter.slice(), seqon: w.ci.seqon.slice() },
        clock: w.clock,
        to: l.to,
        world: w,
        via: { ...via!, ticks: moveTicks },
      });
      if (!had || w.ci.hitpts > had.hp) exits.set(exitKey, opt.steerAirborne ? reach() : { ...reach(had), via: had?.via ?? { ...via!, ticks: moveTicks } });
      // carrying the least: fewer things and counters (worth in thousands), then more hit points
      const poor = poorExits.get(link);
      const carry = Math.floor(worthOf(w.ci) / 1000);
      if (!poor || carry < Math.floor(worthOf(poor.ci) / 1000) || (carry === Math.floor(worthOf(poor.ci) / 1000) && w.ci.hitpts > poor.hp))
        poorExits.set(link, reach(poor));
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
    const r = await driveMove(sim, m, {
      tick: step,
      carried: () => to.push(addPlace()),
      active: opt.steerAirborne && (gravity || turning) && !flying ? () => to.push(addPlace()) : undefined,
      airborne: opt.steerAirborne ? () => to.push(addPlace()) : undefined,
    });
    if (typeof r.end === 'number') return { to, exits: [r.end] };
    if (r.end === 'dead') return { to, exits: [], dead: true };
    const drop = w.chr.y[0] - startY > 2 ? w.chr.y[0] - startY : undefined;
    to.push(addPlace(drop));
    return { to, exits: [] };
  };

  opt.onTick?.(w);
  addPlace();
  const startSnap = places[0].snap!;
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
      if (
        opt.steerAirborne &&
        m.steps.some((step) => step.keys.some((key) => !(sequencesByKey.get(key) ?? []).some((seq) => w.ci.seqon[seq] && w.ci.meter[seq] > 0)))
      )
        continue;
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
      if (opt.progress?.(places.length, queue.length - head + fresh.length + heap.size, { heat, first, deaths: deathsAt, ms: now() - t0 })) {
        stopped = true;
        break;
      }
    }
  }
  for (const p of places) p.snap = undefined;
  const ex: Exploration = {
    scene,
    places,
    heat,
    first,
    monsters,
    exits: [...exits.values()],
    poorExits: [...poorExits.values()],
    incidents,
    deaths: deathsAt,
    complete: !stopped && !reachedStop,
    ticks,
    ms: now() - t0,
    gravity,
    moves,
    links: game.scenes[scene].links,
    ...(reached !== undefined ? { reached } : {}),
  };
  await confirmStuck(ex, sim, startSnap, baseMap, bg);
  return ex;
}
