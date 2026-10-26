// The level check's live view: while a scene is explored, the worker posts what the bot has
// found so far, at most about once a second. Each post carries only the cells whose heat
// changed since the last one (cell, ticks spent, first tick, in one Int32Array), the deaths so
// far, and how far along the run is, with an estimate of when it will end: the scene's time
// budget, or sooner when the places still to try are running out.
import type { ExploreLive } from './explore';

export interface LiveProgress {
  scene: number;
  /** Which scene of the run this is (0 first), and how many the run may check at most. */
  index: number;
  total: number;
  /** Places tried, and places found but not tried yet. */
  tried: number;
  queued: number;
  /** Work on this scene so far, and its budget (ms). */
  elapsedMs: number;
  budgetMs: number;
  /** Changed cells since the last post: [cell, ticks spent, first tick reached] × n. */
  cells: Int32Array;
  /** Every death so far: [cell, tries that ended there] × n. */
  deaths: Int32Array;
  /** Time likely left in the whole run (ms); sure is false when it is only the budget's upper bound. */
  leftMs: number;
  sure: boolean;
  /** How far along the whole run is, 0 to 1. */
  fraction: number;
}

interface Sample {
  ms: number;
  tried: number;
  queued: number;
}

/** How long (ms) the rest of a scene's exploring may take: the budget left, or less when the queue is clearly emptying. */
export function estimateLeft(samples: Sample[], budgetMs: number): { ms: number; sure: boolean } {
  const last = samples[samples.length - 1];
  const budgetLeft = Math.max(0, budgetMs - (last?.ms ?? 0));
  // look back about five seconds: is the queue shrinking, and how fast are places tried?
  const back = samples.find((s) => last && last.ms - s.ms <= 5000);
  if (!last || !back || back === last || last.ms - back.ms < 2000) return { ms: budgetLeft, sure: false };
  const rate = (last.tried - back.tried) / (last.ms - back.ms);
  const shrinking = last.queued < back.queued;
  if (!shrinking || rate <= 0) return { ms: budgetLeft, sure: false };
  const ms = last.queued / rate;
  return ms < budgetLeft ? { ms, sure: true } : { ms: budgetLeft, sure: false };
}

/** Turns an exploration's progress into posts: throttled, and only the cells that changed. */
export class LiveFeed {
  private scene = -1;
  private heat = new Uint32Array(0);
  private samples: Sample[] = [];
  private last = -Infinity;

  constructor(
    private readonly now: () => number,
    private readonly everyMs = 1000,
  ) {}

  /** A post, or undefined when the last one was too recent. */
  update(at: { scene: number; index: number; total: number; nodes: number; queued: number; budgetMs: number }, live: ExploreLive): LiveProgress | undefined {
    if (at.scene !== this.scene || this.heat.length !== live.heat.length) {
      this.scene = at.scene;
      this.heat = new Uint32Array(live.heat.length);
      this.samples = [];
      this.last = -Infinity;
    }
    const tried = Math.max(0, at.nodes - at.queued);
    this.samples.push({ ms: live.ms, tried, queued: at.queued });
    while (this.samples.length > 2 && live.ms - this.samples[1].ms > 6000) this.samples.shift();
    const t = this.now();
    if (t - this.last < this.everyMs) return undefined;
    this.last = t;
    const changed: number[] = [];
    for (let i = 0; i < live.heat.length; i++)
      if (live.heat[i] !== this.heat[i]) {
        changed.push(i, live.heat[i], live.first[i]);
        this.heat[i] = live.heat[i];
      }
    const deaths: number[] = [];
    for (const [c, n] of live.deaths) deaths.push(c, n);
    const left = estimateLeft(this.samples, at.budgetMs);
    const later = Math.max(0, at.total - at.index - 1);
    const sceneDone = Math.min(1, live.ms / Math.max(1, live.ms + left.ms));
    return {
      scene: at.scene,
      index: at.index,
      total: at.total,
      tried,
      queued: at.queued,
      elapsedMs: live.ms,
      budgetMs: at.budgetMs,
      cells: Int32Array.from(changed),
      deaths: Int32Array.from(deaths),
      // later scenes may take their whole budget each: only an upper bound
      leftMs: left.ms + later * at.budgetMs,
      sure: left.sure && later === 0,
      fraction: Math.min(1, (at.index + sceneDone) / Math.max(1, at.total)),
    };
  }
}
