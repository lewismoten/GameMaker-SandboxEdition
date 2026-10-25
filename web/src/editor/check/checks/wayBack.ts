// The level check's findings about ways back and ways through, from the explorer's graph of
// resting places (explore.ts): one-way spots (places the hero reaches but can't get back to the
// start from, though the scene goes on), things left behind (a whole-game run that carries the
// least it can into each scene can no longer finish one the ordinary run finished), and steady
// hands (a run with one key at a time and unhurried changes can't get through a scene the
// ordinary run got through, and where it stops).
import { BACKBL } from '../../../formats/blocks';
import { scanName } from '../../../input/scancodes';
import { MLEN } from '../../../formats/map';
import type { CharInfo } from '../../../engine/world';
import { at, type Finding } from '../findings';
import type { Exploration, ExitReach } from '../explore';
import type { Move } from '../inputs';
import type { Playtest, SceneRun } from '../playtest';
import type { SceneData } from '../sceneData';
import { canLeave } from '../stuck';
import { TICK_S } from './blockChecks';

/** One-way findings shown at most per scene, the first the hero comes to. */
const MAX_ONE_WAY = 3;

/**
 * The cells that count as where the scene began: round the entry, and round where a hero who
 * comes in in mid-air lands (places the first moves reach straight below it).
 */
function startCells(ex: Exploration): Set<number> {
  const out = new Set<number>();
  const around = (c: number) => {
    const x = c % MLEN;
    const y = Math.floor(c / MLEN);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) out.add((y + dy) * MLEN + ((x + dx + MLEN) % MLEN));
  };
  const first = ex.places[0];
  if (!first) return out;
  around(first.cell);
  for (const t of first.out) {
    const c = ex.places[t].cell;
    if (Math.abs((c % MLEN) - (first.cell % MLEN)) <= 1 && c > first.cell + MLEN) around(c);
  }
  return out;
}

/** Places from which the hero can get back to the start, or take a link back to the scene he came from. */
function canReturn(ex: Exploration, cameFrom: number): Uint8Array {
  const n = ex.places.length;
  const ok = new Uint8Array(n);
  const back: number[][] = Array.from({ length: n }, () => []);
  ex.places.forEach((p, i) => p.out.forEach((t) => back[t].push(i)));
  const start = startCells(ex);
  const q: number[] = [];
  ex.places.forEach((p, i) => {
    if (start.has(p.cell) || p.exits.some((l) => ex.links[l]?.toScene === cameFrom)) {
      ok[i] = 1;
      q.push(i);
    }
  });
  while (q.length) for (const pr of back[q.pop()!]) if (!ok[pr]) ((ok[pr] = 1), q.push(pr));
  return ok;
}

/**
 * One-way spots: a move from a place with a way back to one without, where the scene still goes
 * on (an exit can be reached; a place with none is a stuck spot, stuck.ts) and every place beyond
 * was tried (a run cut short can't tell).
 */
export function oneWay(run: SceneRun, d: SceneData | undefined): Finding[] {
  const ex = run.ex;
  if (!ex.places.length) return [];
  const ret = canReturn(ex, run.from.scene);
  const leave = canLeave(ex);
  const n = ex.places.length;
  // places that might yet have a way back: not every move from them (or beyond) was tried
  const maybe = new Uint8Array(n);
  const back: number[][] = Array.from({ length: n }, () => []);
  ex.places.forEach((p, i) => p.out.forEach((t) => back[t].push(i)));
  const q: number[] = [];
  ex.places.forEach((p, i) => {
    if (!p.done && !ret[i]) ((maybe[i] = 1), q.push(i));
  });
  while (q.length) for (const pr of back[q.pop()!]) if (!maybe[pr] && !ret[pr]) ((maybe[pr] = 1), q.push(pr));
  const oneway = (i: number) => !ret[i] && !maybe[i] && leave[i] && !ex.places[i].doomed;
  const edges: { from: number; to: number; tick: number }[] = [];
  ex.places.forEach((p, i) => {
    if (!ret[i]) return;
    for (const t of p.out) if (oneway(t)) edges.push({ from: i, to: t, tick: ex.places[t].tick });
  });
  edges.sort((a, b) => a.tick - b.tick);
  const out: Finding[] = [];
  const shown: number[] = [];
  const near = (a: number, b: number) => Math.abs((a % MLEN) - (b % MLEN)) <= 2 && Math.abs(Math.floor(a / MLEN) - Math.floor(b / MLEN)) <= 2;
  for (const e of edges) {
    const from = ex.places[e.from].cell;
    if (shown.some((c) => near(c, from))) continue;
    shown.push(from);
    const to = ex.places[e.to];
    const beyond = ex.places.filter((_, i) => oneway(i)).length;
    out.push({
      check: 'one-way',
      severity: 'warning',
      title: `One-way at ${at(from)}: the hero can’t get back to the start from ${at(to.cell)}`,
      detail: `${to.dropIn ? `A ${to.dropIn}-block drop` : 'The move'} from here leaves the way back to where the scene began behind (${beyond} resting place${beyond === 1 ? '' : 's'} beyond it have none). Fine when it is meant and plain to see, like a chute; if not, a ladder, a step or a link back helps.`,
      where: { scene: run.scene, map: d?.names.map, cell: from, cells: [from, to.cell] },
    });
    if (out.length >= MAX_ONE_WAY) break;
  }
  return out;
}

/** Exits of a run that lead on: not back to the scene the hero came from, nor into itself. */
const onward = (run: SceneRun, exits: ExitReach[]) => exits.filter((e) => e.toScene !== run.from.scene && e.toScene !== run.scene && e.toScene !== 0);

/** What `rich` carries that `poor` doesn't: things (background blocks) and counters short. */
export function leftBehind(rich: CharInfo, poor: CharInfo): string[] {
  const out: string[] = [];
  const has = (ci: CharInfo, b: number) => ci.inv.filter((x) => x === b).length;
  for (const b of new Set(rich.inv)) if (b < BACKBL && has(rich, b) > has(poor, b)) out.push(`block ${b}`);
  for (const k of [3, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29]) {
    const short = (rich.meter[k] ?? 0) - (poor.meter[k] ?? 0);
    if (short > 0) out.push(k === 3 ? `${short} money` : `${short} on counter ${k}`);
  }
  return out;
}

/**
 * Things left behind: the leave-behind run (playtest.ts leaveBehind) can't finish a scene the
 * ordinary run went on from. The first such scene is where a player who skipped something is
 * stranded; the finding says what was missing and where it could be left.
 */
export function softlocks(main: Playtest, poor: Playtest, scenes: SceneData[], sceneName: (n: number) => string): Finding[] {
  if (!main.won || poor.won || poor.cancelled) return [];
  for (const p of poor.runs) {
    const m = main.runs.find((r) => r.scene === p.scene);
    if (!m || !onward(m, m.ex.exits).length || onward(p, p.ex.exits).length) continue;
    // a run cut short may just not have got there
    if (!p.ex.complete) return [];
    const missing = leftBehind(m.entry.ci, p.entry.ci);
    const d = scenes.find((s) => s.scene === p.scene);
    const entry = p.entry.start.y * MLEN + p.entry.start.x;
    const from = p.from.scene >= 0 ? sceneName(p.from.scene) : 'the scene before';
    return [
      {
        check: 'softlock',
        severity: 'warning',
        title: `Coming in with less, the hero can’t finish ${sceneName(p.scene)}: ${missing.length ? `without ${missing.join(', ')}` : 'carrying less'}`,
        detail: `A player can leave ${from} (by its link ${p.from.link + 1}) ${missing.length ? `without ${missing.join(', ')}` : 'with less'}, and then this scene has no way on (the ordinary run, carrying more, found one). Keep that way out shut until it is collected (a door, a sign saying what is needed), or keep a way back open.`,
        where: { scene: p.scene, map: d?.names.map, cell: entry },
      },
    ];
  }
  return [];
}

/** A move in words, as a hand would play it: the keys, and what a steady hand can't do. */
export function describeMove(m: Move, minTicks: number): string {
  const name = (k: number) => scanName(k).split(' / ')[0];
  const both = m.steps.find((s) => s.keys.length > 1);
  if (both) return `${both.keys.map(name).join(' and ')} held together`;
  const quick = m.steps.find((s, i) => s.keys.length && s.until === 'ticks' && s.max < minTicks && i < m.steps.length - 1);
  if (quick) return `${name(quick.keys[0])} held only ${(quick.max * TICK_S).toFixed(2)} s before the next key`;
  const change = m.steps.findIndex((s, i) => i > 0 && s.keys.length && m.steps[i - 1].keys.length && s.keys[0] !== m.steps[i - 1].keys[0]);
  if (change > 0) return `a change from ${name(m.steps[change - 1].keys[0])} straight to ${name(m.steps[change].keys[0])}`;
  return m.steps
    .filter((s) => s.keys.length)
    .map((s) => name(s.keys[0]))
    .join(' then ');
}

/** The places from the start to place `i` (the moves that found it), first to last. */
function chainTo(ex: Exploration, i: number): number[] {
  const out: number[] = [];
  for (let p: number | undefined = i; p !== undefined; p = ex.places[p].via?.parent) out.unshift(p);
  return out;
}

/**
 * Steady hands: the ordinary run got through the scene and the steady run (playtest.ts
 * steadyTicks) didn't. The spot is the last place on the ordinary run's way through that the
 * steady run reached, and the move the ordinary run made there.
 */
export function steadyFindings(main: SceneRun, steady: SceneRun, d: SceneData | undefined, minTicks: number): Finding[] {
  const ways = onward(main, main.ex.exits).sort((a, b) => a.tick - b.tick);
  if (!ways.length || onward(steady, steady.ex.exits).length) return [];
  const e = ways[0];
  const chain = [...chainTo(main.ex, e.via.parent)];
  let spot = chain[chain.length - 1];
  let move = main.ex.moves[e.via.move];
  for (let k = 1; k < chain.length; k++)
    if (!steady.ex.heat[main.ex.places[chain[k]].cell]) {
      spot = chain[k - 1];
      move = main.ex.moves[main.ex.places[chain[k]].via!.move];
      break;
    }
  const cell = main.ex.places[spot].cell;
  const ms = Math.round(minTicks * TICK_S * 1000);
  return [
    {
      check: 'steady',
      severity: steady.ex.complete ? 'warning' : 'info',
      title: `With steady hands the bot can’t get past ${at(cell)}`,
      detail: `Playing one key at a time with at least ${ms} ms between changes, it found no way on${steady.ex.complete ? '' : ' in the time it had'}. The ordinary bot went on from here with ${describeMove(move, minTicks)}. A jump that already carries sideways, a step to climb, a wider ledge or a lift that waits makes it kinder.`,
      where: { scene: main.scene, map: d?.names.map, cell },
    },
  ];
}
