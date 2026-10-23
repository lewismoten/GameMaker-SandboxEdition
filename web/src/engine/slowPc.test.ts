import { describe, expect, it } from 'vitest';
import { TICK_RATE } from '../audio/cmfPlayer';
import { scrollCost, SlowCpu, tickCost, TURBO_OFF, type PcCosts } from './slowPc';

const INT_MS = 1000 / TICK_RATE;

/**
 * playscene's loop over `seconds` of NewTimer interrupts, as scene.ts runs it: returns the
 * game ticks processed and the DrawScroll passes made per second.
 */
function run(pc: PcCosts | undefined, monsters: number, scrolling: boolean, seconds = 10) {
  const cpu = new SlowCpu(INT_MS);
  let timer = 0;
  let oldClock = 0;
  let snd = 0;
  let ticks = 0;
  let passes = 0;
  const n = Math.round(seconds * TICK_RATE);
  for (let i = 0; i < n; i++) {
    if ((snd & 7) === 0) timer++;
    snd++;
    if (pc && cpu.busy()) continue;
    if (scrolling) {
      passes++;
      if (pc) cpu.spend(scrollCost(pc, 1)); // about a strip per pass at full scroll speed
    }
    if (oldClock < timer) {
      oldClock = timer;
      ticks++;
      if (pc) cpu.spend(tickCost(pc, monsters));
    }
  }
  return { ticks: ticks / seconds, passes: passes / seconds };
}

describe('slow PC (turbo off)', () => {
  it('loses only the interrupts it is still busy for', () => {
    const cpu = new SlowCpu(10);
    expect(cpu.busy()).toBe(false);
    cpu.spend(25);
    expect([cpu.busy(), cpu.busy(), cpu.busy(), cpu.busy()]).toEqual([true, true, false, false]);
  });

  it('turbo processes every tick and every scroll step', () => {
    const r = run(undefined, 10, true);
    expect(r.ticks).toBeCloseTo(18.2, 0);
    expect(r.passes).toBeCloseTo(145.6, 0);
  });

  it('keeps full game pace standing still and while scrolling a normal screen', () => {
    expect(run(TURBO_OFF, 5, false).ticks).toBeCloseTo(18.2, 0);
    const r = run(TURBO_OFF, 10, true);
    expect(r.ticks).toBeCloseTo(18.2, 0);
    // the passes the game tick keeps busy lose their scroll steps
    expect(r.passes).toBeGreaterThan(60);
    expect(r.passes).toBeLessThan(120);
  });

  it('only a crowded scrolling screen drops ticks, and only some', () => {
    expect(run(TURBO_OFF, 30, false).ticks).toBeCloseTo(18.2, 0);
    const r = run(TURBO_OFF, 40, true);
    expect(r.ticks).toBeLessThan(18);
    expect(r.ticks).toBeGreaterThan(12);
  });
});
