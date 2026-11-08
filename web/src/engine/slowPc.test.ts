// Turbo off: the slower PC skips only the timer ticks it is still busy for, as PLAYGAME did.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TICK_RATE } from '@lewismoten/gamemaker-sandbox-engine/audio/cmfPlayer';
import { LOADGAME_SLOTS, sceneReads } from '@lewismoten/gamemaker-sandbox-engine/engine/scene';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import {
  costsFor,
  sceneLoadMs,
  scrollCost,
  SlowCpu,
  SPEED_PRESETS,
  tickCost,
  TURBO_OFF,
  vocStallMs,
  vocWontFit,
  type PcCosts,
  type SpeedChoice,
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

  describe('IBM PS/1 (286 at 10 MHz, 1 MB, slow disk)', () => {
    const ps1 = SPEED_PRESETS.ps1;

    it('is slower than the 286 in every cost, and its disk far slower', () => {
      const k = SPEED_PRESETS['286'];
      expect(ps1.tickMs).toBeGreaterThan(k.tickMs);
      expect(ps1.monsterMs).toBeGreaterThan(k.monsterMs);
      expect(ps1.cellMs ?? 0).toBeGreaterThan(k.cellMs ?? 0);
      expect(ps1.vocOpenMs ?? 0).toBeGreaterThan((k.vocOpenMs ?? 0) * 2);
      expect(ps1.vocBytesPerMs ?? 0).toBeLessThan((k.vocBytesPerMs ?? 0) / 2);
      expect(costsFor('ps1')).toBe(ps1);
    });

    it("freezes the game for about half a second to read Slow Computers' long pad, a tenth for a short one", () => {
      expect(vocStallMs(ps1, 59568)).toBeGreaterThan(400);
      expect(vocStallMs(ps1, 59568)).toBeLessThan(600);
      expect(vocStallMs(ps1, 2789)).toBeGreaterThan(80);
      expect(vocStallMs(ps1, 2789)).toBeLessThan(130);
    });

    it('loses about nine game ticks to the long pad, then carries on', () => {
      const cpu = new SlowCpu(INT_MS);
      cpu.spend(vocStallMs(ps1, 59568));
      let lost = 0;
      while (cpu.busy()) lost++;
      expect(Math.round(lost / 8)).toBeGreaterThanOrEqual(7);
      expect(Math.round(lost / 8)).toBeLessThanOrEqual(9);
    });

    it('cannot hold a sound bigger than its heap: the read happens, nothing plays', () => {
      expect(vocWontFit(ps1, 59568)).toBe(false);
      expect(vocWontFit(ps1, 150_000)).toBe(true);
      expect(vocWontFit(SPEED_PRESETS['386'], 150_000)).toBe(false);
      expect(vocWontFit(undefined, 150_000)).toBe(false);
      expect(vocStallMs(ps1, 150_000)).toBe(ps1.vocOpenMs);
    });

    it('keeps a quiet room at full speed and loses ticks to a crowd of 15', () => {
      expect(run(ps1, 0, false).ticks).toBeCloseTo(TICK_RATE / 8, 0);
      expect(run(ps1, 15, false).ticks).toBeLessThan(TICK_RATE / 8 - 1);
    });
  });
});

describe('the pause between scenes on each preset (sceneLoadMs of the files loadscene reads)', () => {
  // Donut (cd/gameware/donut), scene 2, its first level: palette, map, three block sets, monsters,
  // character, sound set and song, all named, so loadscene (PLAYGAME.C 4239) opens nine files
  const dir = join(__dirname, '../../../cd/gameware/donut');
  const files = new Map(readdirSync(dir).map((n) => [n.toLowerCase(), new Uint8Array(readFileSync(join(dir, n)))]));
  const s = { game: parseGame(files.get('donut.gam')!), m: { files } };
  const reads = sceneReads(s, 2, true);
  const f6 = sceneReads(s, 2, true, LOADGAME_SLOTS);
  const ms = (choice: SpeedChoice, r: number[]) => Math.round(sceneLoadMs(costsFor(choice), r) * 10) / 10;

  it('reads the files the source loads: nine with a sound card, eight without, seven for F6', () => {
    expect(reads).toEqual([768, 22000, 63000, 19200, 42000, 7568, 21000, 2430, 19479]);
    expect(reads.reduce((a, b) => a + b, 0)).toBe(197_445);
    expect(sceneReads(s, 2, false)).toEqual(reads.slice(0, 8)); // no card: InitMusic is not called
    expect(f6).toEqual([768, 63000, 19200, 42000, 21000, 2430, 19479]); // LoadGame: the save holds map and character
    expect(f6.reduce((a, b) => a + b, 0)).toBe(167_877);
  });

  it('a level change costs each preset its own disk: about 2 s on the PS/1 down to a quarter second on a 486', () => {
    expect(ms('today', reads)).toBe(0);
    expect(ms('486', reads)).toBe(239.6); // 9 x 12 ms + 197,445 / 1500
    expect(ms('386', reads)).toBe(408.8); // 9 x 18 ms + 197,445 / 800
    expect(ms('286', reads)).toBe(763.6); // 9 x 30 ms + 197,445 / 400
    expect(ms('ps1', reads)).toBe(2036.3); // 9 x 80 ms + 197,445 / 150
    expect(sceneLoadMs(TURBO_OFF, reads)).toBe(0); // the desk turbo has no disk figures
  });

  it("F6's LoadGame reads fewer files, so it pauses less", () => {
    expect(ms('today', f6)).toBe(0);
    expect(ms('486', f6)).toBe(195.9);
    expect(ms('386', f6)).toBe(335.8);
    expect(ms('286', f6)).toBe(629.7);
    expect(ms('ps1', f6)).toBe(1679.2);
  });

  it('a blank slot opens nothing', () => {
    const game = parseGame(files.get('donut.gam')!);
    game.scenes[2].files[3] = ''; // no monsters named: loadscene skips the slot (NoMons)
    expect(sceneReads({ game, m: { files } }, 2, true)).toEqual([768, 22000, 63000, 42000, 7568, 21000, 2430, 19479]);
    expect(ms('ps1', sceneReads({ game, m: { files } }, 2, true))).toBe(1828.3);
  });
});
