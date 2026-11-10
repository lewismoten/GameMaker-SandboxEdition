// A route a person would play, for the walkthrough bot only (never the Level check): take the
// treasure, power-ups and foes worth points that are in sight, nearest first, then go to the
// way on. Each leg is the level check's explorer heading for the next thing, with steady hands
// (at least 3 ticks between key changes, 3 or 4 by turns so no two stretches are keyed alike) and
// no waiting about. A leg that finds no way is dropped and the next thing tried. The bot's other
// styles (autoWalk.ts) play the scene when this finds no way on.
import { BACKBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { LASTMM, LASTMON, type CharInfo, type World } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import type { Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { explore, type Entry } from '../explore';
import { SceneSim, type FileSource } from '../sim';
import { BASIC_KEYS } from '../keyLimit';
import type { Move } from '../inputs';
import { pathTo, replayPath, type Replay } from './replayPath';

/** How far from the hero (blocks across, down) a thing is still "in sight": about a screen. */
const SIGHT = { x: 20, y: 12 };
const MOST_LEGS = 14;
const MOST_MISSES = 3;

const have = (ci: CharInfo) =>
  ci.inv.filter((b) => b < BACKBL).length * 1000 +
  ci.meter.slice(3).reduce((sum, n) => sum + Math.max(0, n), 0) +
  Math.max(0, ci.score) +
  Math.max(0, ci.hitpts);

/** Cells holding what a player would walk to: pickups that score or heal, and foes worth points. */
function wanted(w: World): number[] {
  const out: number[] = [];
  for (let c = 0; c < w.map.length; c++) {
    const b = w.bg[w.blkmap[w.map[c]]];
    if (b && !b.solid && (b.scorePts > 0 || b.chHitPt > 0 || (b.effect >= 3 && b.eamt > 0))) out.push(c);
  }
  for (let l = 0; l < LASTMM; l++) {
    const mm = w.mm[l];
    if (mm.monnum >= LASTMON || !(w.mon[mm.monnum]?.upscore > 0)) continue;
    out.push(w.mi[l].cury[0] * MLEN + w.mi[l].curx[0]);
  }
  return out;
}

/**
 * Plays the scene as above until a link in `ways` is taken; the Replay of the whole route
 * (keys tick by tick), or undefined if it finds none in `budgetMs`.
 */
export async function humanRoute(
  game: Game,
  files: FileSource,
  scene: number,
  entry: Entry,
  goal: number[],
  ways: ReadonlySet<number>,
  budgetMs: number,
  seed = 1,
  paths?: ReadonlySet<number>,
): Promise<Replay | undefined> {
  const start = new SceneSim(game, scene, files, entry.start, entry.ci, entry.clock, entry.prev).w;
  let targets = wanted(start);
  let from: { snap: NonNullable<Replay['snap']>; ticks: number } | undefined;
  let events: Replay['events'] = [];
  const t0 = performance.now();
  const left = () => budgetMs - (performance.now() - t0);
  // Prefer arrows, Space and Enter for the person's route; fallback styles
  // still try the character's extra keys when this route cannot get through.
  const moveFilter = (m: Move) => !m.waits && m.steps.every((step) => step.keys.every((key) => BASIC_KEYS.has(key)));
  let at = { x: entry.start.x, y: entry.start.y };
  let base = have(start.ci);
  let misses = 0;
  for (let leg = 0; leg < MOST_LEGS && misses < MOST_MISSES && targets.length && left() > 0; leg++) {
    const near = targets
      .map((c) => ({ c, dx: Math.abs((c % MLEN) - at.x), dy: Math.abs(Math.floor(c / MLEN) - at.y) }))
      .filter((t) => t.dx <= SIGHT.x && t.dy <= SIGHT.y)
      .sort((a, b) => a.dx + a.dy - (b.dx + b.dy))[0];
    if (!near) break;
    targets = targets.filter((c) => c !== near.c);
    const ex = await explore(game, scene, files, entry, {
      goal: [near.c],
      steerAirborne: true,
      steadyTicks: 3 + (leg % 2),
      steadySteering: true,
      moveFilter,
      budgetMs: Math.min(left(), budgetMs / 6),
      start: from?.snap,
      stopWhen: (w) => have(w.ci) > base,
      stopAt: (l) => ways.has(l),
    });
    const p = ex.reached !== undefined ? ex.places[ex.reached] : undefined;
    // a way on found on the way is as good as a leg
    const exit = ex.exits.filter((e) => ways.has(e.link)).sort((a, b) => a.tick - b.tick)[0];
    if (!p?.via && !exit) {
      misses++;
      continue;
    }
    const r = await replayPath(game, files, scene, entry, ex.moves, pathTo(ex, p?.via ?? exit.via), seed, from, paths);
    if (!r) {
      misses++;
      continue;
    }
    events = [...events, ...r.events];
    if (r.link >= 0) return ways.has(r.link) ? { ...r, events } : undefined;
    from = { snap: r.snap!, ticks: r.ticks };
    base = have(r.ci);
    at = { x: r.world.chr.x[0], y: r.world.chr.y[0] };
  }
  // then the way on, with the same steady hands
  const ex = await explore(game, scene, files, entry, {
    goal,
    steerAirborne: true,
    steadyTicks: 3,
    steadySteering: true,
    moveFilter,
    budgetMs: Math.max(1000, left()),
    start: from?.snap,
    stopAt: (l) => ways.has(l),
  });
  for (const e of ex.exits.filter((x) => ways.has(x.link)).sort((a, b) => a.tick - b.tick)) {
    const r = await replayPath(game, files, scene, entry, ex.moves, pathTo(ex, e.via), seed, from, paths);
    if (r && ways.has(r.link)) return { ...r, events: [...events, ...r.events] };
  }
  return undefined;
}
