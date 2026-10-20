// A play-testing pilot for the headless simulator. Every couple of ticks it tries each
// stick position (and the Nova Bomb) on a copy of the game a few ticks ahead and keeps the
// one that loses the least energy and scores the most. It plays every leg in the checks
// and flies the title-screen demo.
import { SCAN, SEQ } from './ids';
import type { Sim } from './sim';

const MOVES: (number | undefined)[] = [undefined, SCAN.left, SCAN.right, SCAN.up, SCAN.down, SCAN.kp7, SCAN.kp9, SCAN.kp1, SCAN.kp3];

const HARMLESS = /^(shot|nova|spark|wreck|boom|bigBoom|turretBoom)/;

export interface BotResult {
  ok: boolean;
  dead: boolean;
  ticks: number;
  hpLost: number;
  score: number;
  log: string[];
}

function danger(s: Sim): number {
  const { x, y } = s.pos;
  let worst = 0;
  for (const m of s.live()) {
    if (HARMLESS.test(m.name)) continue;
    const dx = Math.abs(m.px - x);
    const dy = Math.abs(m.py - y);
    const d = Math.max(dx, dy);
    if (d < 44) worst += (44 - d) * (44 - d);
  }
  return worst;
}

function evaluate(f: Sim, before: { hp: number; score: number; novas: number }, goal?: { x: number; y: number }): number {
  const ci = f.w.ci;
  let v = 0;
  if (f.dead || ci.hitpts <= 0) v -= 100000;
  if (f.link >= 0) v += 50000;
  v -= (before.hp - ci.hitpts) * 400;
  v += (ci.score - before.score) * 0.6;
  v -= (before.novas - ci.meter[SEQ.nova]) * 120;
  v -= danger(f) * 0.08;
  // stay off the screen's sides and keep some room below
  const sx = f.screen.x;
  if (sx < 30 || sx > 270) v -= 200;
  if (goal) v -= (Math.abs(f.pos.x - goal.x) + Math.abs(f.pos.y - goal.y)) * 3;
  return v;
}

export async function fly(
  sim: Sim,
  o: { maxTicks?: number; horizon?: number; every?: number; goal?: (s: Sim) => { x: number; y: number } | undefined; until?: (s: Sim) => boolean } = {},
): Promise<BotResult> {
  const horizon = o.horizon ?? 10;
  const every = o.every ?? 2;
  const log: string[] = [];
  let current: number | undefined;
  let lost = 0;
  let lastHp = sim.w.ci.hitpts;
  for (let t = 0; t < (o.maxTicks ?? 3000); t++) {
    if (t % every === 0) {
      const before = { hp: sim.w.ci.hitpts, score: sim.w.ci.score, novas: sim.w.ci.meter[SEQ.nova] };
      const goal = o.goal?.(sim);
      let best = -Infinity;
      let choice = current;
      const tries: (number | undefined)[] = [...MOVES];
      if (before.novas > 0) tries.push(SCAN.space);
      for (const a of tries) {
        const f = sim.fork();
        if (a === SCAN.space) {
          f.only(undefined);
          f.press(SCAN.space);
        } else f.only(a);
        for (let k = 0; k < horizon && !f.dead && f.link < 0; k++) {
          await f.tick();
          if (a === SCAN.space && k === 1) f.release(SCAN.space);
        }
        let v = evaluate(f, before, goal);
        if (a === current) v += 25;
        if (v > best) {
          best = v;
          choice = a;
        }
      }
      if (choice === SCAN.space) {
        sim.only(undefined);
        sim.press(SCAN.space);
        current = undefined;
      } else {
        sim.only(choice);
        current = choice;
      }
    }
    await sim.tick();
    if (sim.holding.includes(SCAN.space)) sim.release(SCAN.space);
    const hp = sim.w.ci.hitpts;
    if (hp < lastHp) {
      lost += lastHp - hp;
      log.push(`t${sim.ticks} hit ${lastHp}->${hp} at ${sim.pos.bx},${sim.pos.by}`);
    }
    lastHp = hp;
    if (sim.dead || sim.link >= 0 || o.until?.(sim)) break;
  }
  sim.only(undefined);
  return { ok: sim.link >= 0, dead: sim.dead, ticks: sim.ticks, hpLost: lost, score: sim.w.ci.score, log };
}
