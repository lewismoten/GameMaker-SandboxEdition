// Exercise the built-demo checker with replay outcomes and observed hero positions.
import { afterEach, expect, it, vi } from 'vitest';
import { ORIGIN } from '../../kit/starter/map';
import { POWER } from '../src/hero';
import { CANYON_FLOOR, GAP_FROM, GROUND, LEDGE_FROM } from '../src/levels';

const replay = vi.hoisted(() => vi.fn());
vi.mock('../../kit/walkthrough', () => ({ replay }));
vi.mock('node:fs', async (load) => ({ ...(await load<typeof import('node:fs')>()), readFileSync: () => new Uint8Array() }));
vi.mock('@lewismoten/gamemaker-sandbox-engine/formats/recording', () => ({ parseRecording: () => [] }));

afterEach(() => vi.restoreAllMocks());

function worldAt(x: number, y: number) {
  const meter = { [POWER.highJump]: 0, [POWER.fastRight]: 0 };
  return { chr: { x: [ORIGIN + x, 0], y: [ORIGIN + y, 0] }, ci: { meter } };
}

it.each(['replay error', 'unfinished replay', 'no ledge jump', 'jump without landing', 'walk into canyon', 'no canyon fall', 'complete demo'])(
  '%s',
  async (scenario) => {
    vi.resetModules();
    replay.mockImplementation((_id, _walk, options: { onWorld?: (world: ReturnType<typeof worldAt>, scene: number) => void }) => {
      const observe = (scene: number, x: number, y: number) => options.onWorld?.(worldAt(x, y), scene);
      observe(2, LEDGE_FROM + 2, GROUND - 1);
      if (scenario !== 'no ledge jump') observe(2, LEDGE_FROM + 2, GROUND - 4);
      if (scenario !== 'jump without landing') observe(2, LEDGE_FROM + 2, GROUND - 1);
      if (scenario !== 'walk into canyon') observe(3, GAP_FROM, GROUND - 3);
      if (scenario !== 'no canyon fall') observe(3, GAP_FROM + 3, CANYON_FLOOR - 1);
      return {
        scenes: [2, 3, 1],
        keysLeft: 0,
        won: scenario !== 'unfinished replay',
        error: scenario === 'replay error' ? new Error('interrupted') : undefined,
      };
    });
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('demo rejected');
    });
    if (scenario === 'complete demo') await import('./demoCheck');
    else {
      await expect(import('./demoCheck')).rejects.toThrow('demo rejected');
      expect(exit).toHaveBeenCalledWith(1);
    }
  },
);
