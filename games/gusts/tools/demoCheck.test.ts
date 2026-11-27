// Exercise the title demo check with controlled first-scene replay samples.
import { expect, it, vi } from 'vitest';
import { ORIGIN } from '../../kit/starter/map';
import { LEDGE, LEDGE_ROW } from '../src/levels';

const sample = vi.hoisted(() => ({ hp: 5, column: 18, gravity: 0 }));
vi.mock('node:fs', async (original) => ({
  ...(await original<typeof import('node:fs')>()),
  readFileSync: () => new Uint8Array(),
}));
vi.mock('@lewismoten/gamemaker-sandbox-engine/formats/recording', () => ({ parseRecording: () => [] }));
vi.mock('./sim', () => ({
  GameSim: class {
    ci = { hitpts: 5, gravy: 0, score: 0 };
    trail = [1];
    pos = { x: ORIGIN + sample.column, y: ORIGIN + LEDGE_ROW - 1, sy: 0 };
    tick() {
      this.ci.hitpts = sample.hp;
      this.ci.gravy = sample.gravity;
    }
  },
}));

it.each([
  ['permanent damage', 4, LEDGE[0], 0],
  ['missing the ledge', 5, LEDGE[1] + 1, 0],
  ['passing through the ledge', 5, LEDGE[0], -1],
])('rejects %s', async (_name, hp, column, gravity) => {
  Object.assign(sample, { hp, column, gravity });
  vi.resetModules();
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('demo rejected');
  });
  try {
    await expect(import('./demoCheck')).rejects.toThrow('demo rejected');
  } finally {
    exit.mockRestore();
  }
});
