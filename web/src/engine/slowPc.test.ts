// Turbo off: the slower PC skips only the timer ticks it is still busy for, as PLAYGAME did.
import { describe, expect, it } from 'vitest';
import { TICK_RATE } from '@lewismoten/gamemaker-sandbox-engine/audio/cmfPlayer';
import {
  costsFor,
  scrollCost,
  SlowCpu,
  SPEED_PRESETS,
  tickCost,
  TURBO_OFF,
  vocStallMs,
  type PcCosts,
} from '@lewismoten/gamemaker-sandbox-engine/engine/slowPc';

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

describe('Run like a… presets', () => {
  it('Today charges nothing; the others get slower in order', () => {
    expect(costsFor('today')).toBeUndefined();
    const [a, b, c] = [SPEED_PRESETS['486'], SPEED_PRESETS['386'], SPEED_PRESETS['286']];
    expect(a.tickMs).toBeLessThan(b.tickMs);
    expect(b.tickMs).toBeLessThan(c.tickMs);
    expect(a.monsterMs).toBeLessThan(c.monsterMs);
  });

  it('keeps full pace on a quiet screen except where the machine is too slow', () => {
    for (const k of ['486', '386', '286'] as const) expect(run(SPEED_PRESETS[k], 0, false).ticks).toBeCloseTo(TICK_RATE / 8, 0);
  });

  it('about 20 monsters fill a 286 tick; a 386 and a 486 keep up', () => {
    expect(tickCost(SPEED_PRESETS['286'], 20)).toBeGreaterThan(50); // a tick is 54.9 ms
    expect(run(SPEED_PRESETS['286'], 30, false).ticks).toBeLessThan(15);
    expect(run(SPEED_PRESETS['286'], 40, false).ticks).toBeLessThan(11);
    expect(run(SPEED_PRESETS['386'], 30, false).ticks).toBeCloseTo(TICK_RATE / 8, 0);
    expect(run(SPEED_PRESETS['486'], 50, false).ticks).toBeCloseTo(TICK_RATE / 8, 0);
  });

  it('a voice read stalls in proportion to the file, and not on Today or the desk turbo', () => {
    const k = SPEED_PRESETS['286'];
    expect(vocStallMs(undefined, 50000)).toBe(0);
    expect(vocStallMs(TURBO_OFF, 50000)).toBe(0);
    expect(vocStallMs(k, 40000)).toBeCloseTo(30 + 100, 5);
    expect(vocStallMs(k, 40000)).toBeGreaterThan(vocStallMs(SPEED_PRESETS['386'], 40000));
    expect(vocStallMs(SPEED_PRESETS['386'], 40000)).toBeGreaterThan(vocStallMs(SPEED_PRESETS['486'], 40000));
  });

  it('a long voice costs whole ticks: the game stops, then skips them', () => {
    const cpu = new SlowCpu(INT_MS);
    cpu.spend(vocStallMs(SPEED_PRESETS['286'], 60000)); // 180 ms
    let lost = 0;
    while (cpu.busy()) lost++;
    expect(lost).toBe(Math.floor(180 / INT_MS)); // 26 interrupts, 3 game ticks
  });

  it('a screenful of animated cells slows a 286 a little, and not a 486', () => {
    const k = SPEED_PRESETS['286'];
    expect(tickCost(k, 0, 160)).toBeGreaterThan(50);
    expect(tickCost(k, 0, 160)).toBeLessThan(75);
    expect(tickCost(SPEED_PRESETS['486'], 0, 160)).toBeLessThan(15);
    expect(tickCost(k, 0, 1000)).toBe(tickCost(k, 0, 170)); // at most 170 dirty rectangles
  });
});
