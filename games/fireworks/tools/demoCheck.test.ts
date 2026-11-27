// Each source must produce a rocket during replay, even when every recorded key played.
import { expect, it, vi } from 'vitest';
import { ROCKET, ROCKET_TEAL } from '../src/monsters';
import { SCAN_ENTER } from '../src/hero';

const replay = vi.hoisted(() => vi.fn());
vi.mock('../../kit/walkthrough', () => ({ replay }));
vi.mock('node:fs', () => ({ readFileSync: () => new Uint8Array() }));
vi.mock('@lewismoten/gamemaker-sandbox-engine/formats/recording', () => ({
  parseRecording: () => [SCAN_ENTER, 1, 129].map((key) => ({ key, delta: 1 })),
}));

const rockets = [
  { source: 'pink launcher', monnum: ROCKET, fromchar: 0 },
  { source: 'teal launcher', monnum: ROCKET_TEAL, fromchar: 0 },
  { source: 'player', monnum: ROCKET, fromchar: 1 },
];

it.each(rockets)('rejects a demo missing the $source rocket', async ({ source }) => {
  vi.resetModules();
  const slots = rockets.filter((r) => r.source !== source);
  replay.mockImplementation((_id, _walk, opts) => {
    opts.onWorld?.({ mm: slots, mi: slots }, 2, 0);
    return { scenes: [2], keysLeft: 0 };
  });
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('exit 1');
  });
  try {
    await expect(import('./demoCheck')).rejects.toThrow('exit 1');
    expect(exit).toHaveBeenCalledWith(1);
  } finally {
    exit.mockRestore();
  }
});
