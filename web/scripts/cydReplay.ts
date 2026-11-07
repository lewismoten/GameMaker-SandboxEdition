// Probe this repository's recorded routes with the existing engine-backed disk simulator.
import { GameSim, TICKS_PER_SECOND } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { decodeKeys, type Walkthrough } from '../src/walkthrough/format';
import { SOLBOT } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { CydMetrics } from './cydScore';

type Event = { tick: number; key: number };
const DIRECTIONS = new Set([71, 72, 73, 75, 77, 79, 80, 81]);
export interface JumpProbe {
  scene: number;
  tick: number;
  key: number;
  earlyLimitTicks: number;
  earlySlackTicks: number;
  lateSlackTicks: number;
  capped: boolean;
  landingWidthBlocks: number | null;
}

function event(sim: GameSim, key: number): void {
  if (key & 128) sim.release(key & 127);
  else sim.press(key);
}

function support(sim: GameSim): { x: number; y: number; width: number } | undefined {
  const c = sim.w.chr;
  const x = Math.floor((c.x[0] * 20 + c.x[1] + 10) / 20);
  // The engine origin is the lower sprite block; the optional top half is one row above.
  const y = Math.ceil((c.y[0] * 20 + c.y[1] + 20) / 20);
  if (c.y[1] !== 0) return;
  if (x < 0 || x >= 100 || y < 0 || y >= 100 || !(sim.shown(x, y).solid & SOLBOT)) return;
  let left = x,
    right = x;
  while (left > 0 && sim.shown(left - 1, y).solid & SOLBOT) left--;
  while (right < 99 && sim.shown(right + 1, y).solid & SOLBOT) right++;
  return { x, y, width: right - left + 1 };
}

/** Only a completed upward flight followed by solid support counts as a landing. */
async function flight(sim: GameSim, events: Event[], start: number, key: number, delay: number, jumpAt = start) {
  const scene = sim.scene;
  const startY = sim.w.chr.y[0] * 20 + sim.w.chr.y[1];
  let airborne = false;
  let previousY = startY;
  let released = false;
  for (let dt = 0; dt < 90; dt++) {
    const tick = start + dt;
    for (const e of events.filter((e) => e.tick === tick)) {
      if (e.key === key && tick === jumpAt) {
        if (delay === 0) sim.press(key);
        continue;
      }
      if (e.key === (key | 128) && !released) {
        released = true;
        if (delay === 0) sim.release(key);
        continue;
      }
      event(sim, e.key);
    }
    if (delay !== 0 && tick === jumpAt + delay) sim.press(key);
    const release = events.find((e) => e.tick >= jumpAt && e.key === (key | 128));
    if (delay !== 0 && release && tick === release.tick + delay) sim.release(key);
    const result = await sim.tick();
    if (result || sim.scene !== scene) return undefined;
    const y = sim.w.chr.y[0] * 20 + sim.w.chr.y[1];
    if (y < startY - 2) airborne = true;
    const land = support(sim);
    if (airborne && y === previousY && sim.w.ci.gravy >= 0 && land) return land;
    previousY = y;
  }
  return undefined;
}

export async function measureCyd(files: Map<string, Uint8Array>, walk: Walkthrough, jumpKeys: Set<number>, walkPaths: Record<string, number[]> = {}) {
  if (walk.rand.per !== 'scene') throw new Error('Per-game random seed is not supported by the disk simulator');
  const sim = new GameSim(files, walk.rand.seed);
  const probes: JumpProbe[] = [];
  let onPathTicks = 0,
    offPathTicks = 0;
  let presses = 0,
    buttons = 0,
    extras = 0,
    jumps = 0,
    ticks = 0,
    changes = 0,
    peak = 0;
  const extraKeys = new Map<number, number>();
  const warnings: string[] = [];
  let segment = 0;
  while (segment < walk.segments.length && !sim.ended) {
    const seg = walk.segments[segment];
    if (sim.scene !== seg.scene) throw new Error(`Route scene mismatch at segment ${segment + 1}`);
    let at = 0;
    const events = decodeKeys(seg.keys).map((e) => ({ tick: (at += e.delta), key: e.key }));
    const last = events.at(-1)?.tick ?? 0;
    let index = 0;
    let clock = 0;
    const recent: number[] = [];
    const beforeJumps = new Map<number, { state: ReturnType<GameSim['snapshot']>; tick: number }>();
    while (!sim.ended && clock < last + 600) {
      clock++;
      ticks++;
      // Keep a checkpoint up to six ticks before each upcoming jump, so a recorded
      // late start is not mistaken for a genuinely narrow two-sided timing window.
      for (const e of events.slice(index)) {
        if (e.tick > clock + 6) break;
        if (e.tick >= clock && !(e.key & 128) && jumpKeys.has(e.key) && !beforeJumps.has(e.tick))
          beforeJumps.set(e.tick, { state: sim.snapshot(), tick: clock });
      }
      let changed = false;
      while (index < events.length && events[index].tick <= clock) {
        const e = events[index++];
        const key = e.key & 127;
        if (!(e.key & 128)) {
          presses++;
          if (key === 57 || key === 28) buttons++;
          else if (!DIRECTIONS.has(key)) {
            extras++;
            extraKeys.set(key, (extraKeys.get(key) ?? 0) + 1);
          }
          if (jumpKeys.has(key)) {
            jumps++;
            const saved = sim.snapshot();
            const before = beforeJumps.get(e.tick) ?? { state: saved, tick: clock };
            beforeJumps.delete(e.tick);
            const rest = events.filter((event) => event.tick >= before.tick && event.tick < clock + 100);
            sim.restore(before.state);
            const base = await flight(sim, rest, before.tick, key, 0, clock);
            sim.restore(saved);
            if (base) {
              const slack = async (direction: -1 | 1) => {
                let n = 0;
                const limit = direction === -1 ? Math.min(6, clock - before.tick) : 6;
                for (let shift = 1; shift <= limit; shift++) {
                  sim.restore(before.state);
                  const land = await flight(sim, rest, before.tick, key, direction * shift, clock);
                  sim.restore(saved);
                  if (!land || land.y !== base.y || Math.abs(land.x - base.x) > 1) break;
                  n = shift;
                }
                return n;
              };
              const earlySlackTicks = await slack(-1);
              const lateSlackTicks = await slack(1);
              probes.push({
                scene: sim.scene,
                tick: clock,
                key,
                earlyLimitTicks: Math.min(6, clock - before.tick),
                earlySlackTicks,
                lateSlackTicks,
                capped: earlySlackTicks === Math.min(6, clock - before.tick) || lateSlackTicks === 6,
                landingWidthBlocks: base.width,
              });
            }
          }
        }
        changed ||= e.key & 128 ? sim.isHeld(key) : !sim.isHeld(key);
        event(sim, e.key);
      }
      if (changed) {
        changes++;
        recent.push(clock);
      }
      while (recent.length && recent[0] <= clock - TICKS_PER_SECOND) recent.shift();
      peak = Math.max(peak, recent.length);
      const bbl = sim.game.scenes[sim.scene].files.find((name) => name.endsWith('.bbl'));
      const path = bbl ? walkPaths[bbl.toLowerCase()] : undefined;
      if (path?.length) {
        if (path.includes(sim.blockAt(sim.pos.x, sim.pos.y))) onPathTicks++;
        else offPathTicks++;
      }
      const result = await sim.tick();
      if (result === 'dead') throw new Error('Recorded route lost a life in the disk simulator');
      if (sim.scene === walk.segments[segment + 1]?.scene) break;
    }
    segment++;
  }
  if (sim.ended !== 'won') throw new Error('Recorded route did not reach the ending in the disk simulator');
  if (probes.length < jumps) warnings.push(`${jumps - probes.length} jump presses had no completed local flight; timing is unknown for those presses`);
  const metrics: CydMetrics = {
    presses,
    spaceEnterShare: presses ? buttons / presses : 0,
    extraShare: presses ? extras / presses : 0,
    changesPerSecond: ticks ? (changes * TICKS_PER_SECOND) / ticks : 0,
    peakChangesPerSecond: peak,
    jumps,
    narrowJumps: probes.filter((p) => p.earlySlackTicks + p.lateSlackTicks < 3 && !p.capped).length,
    narrowLandings: probes.filter((p) => (p.landingWidthBlocks ?? 100) <= 2).length,
  };
  return { metrics, probes, extraKeys: Object.fromEntries(extraKeys), warnings, ticks, walkingPaths: { onPathTicks, offPathTicks } };
}
