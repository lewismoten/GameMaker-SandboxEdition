// Run the title-demo verdict against tick-by-tick boss stages with enough score to pass the score check.
import { afterEach, expect, it, vi } from 'vitest';
import { PLAIN, POOF } from '../src/monsters';

const replay = vi.hoisted(() => ({ stages: [] as (number | undefined)[] }));
vi.mock('node:fs', async (original) => ({ ...(await original<typeof import('node:fs')>()), readFileSync: () => new Uint8Array() }));
vi.mock('@lewismoten/gamemaker-sandbox-engine/formats/recording', () => ({ parseRecording: () => [] }));
vi.mock('./sim', () => ({
  GameSim: class {
    ci = { hitpts: 10, score: 100 };
    w = { mm: [{ monnum: PLAIN }] };
    tick() {
      this.ci.hitpts = 9;
      if (replay.stages.length) {
        const monnum = replay.stages.shift();
        this.w.mm = monnum === undefined ? [] : [{ monnum }];
      }
    }
  },
}));

afterEach(() => vi.restoreAllMocks());

it.each([
  ['survives', [5, 6, 7, 8, 9, 9], false],
  ['skips a stage', [5, 6, 8, 9, POOF], false],
  ['puffs and disappears', [5, 5, 6, 7, 8, 9, POOF, undefined], true],
] as const)('checks the boss that %s', async (_name, stages, passes) => {
  vi.resetModules();
  replay.stages = [...stages];
  vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('demo failed');
  });
  const result = import('./demoCheck');
  if (passes) await result;
  else await expect(result).rejects.toThrow('demo failed');
});
