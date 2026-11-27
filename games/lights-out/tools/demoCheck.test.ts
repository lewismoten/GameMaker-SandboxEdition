// Exercise the title-demo check with independent replay outcomes.
import { beforeEach, expect, it, vi } from 'vitest';

const result = vi.hoisted(() => ({ scenes: [2, 3], keysLeft: 0, error: undefined as Error | undefined }));
vi.mock('../../kit/walkthrough', () => ({ replay: () => result }));
vi.mock('node:fs', () => ({ readFileSync: () => new Uint8Array() }));
vi.mock('@lewismoten/gamemaker-sandbox-engine/formats/recording', () => ({ parseRecording: () => [] }));

beforeEach(() => {
  vi.resetModules();
  result.scenes = [2, 3];
  result.error = undefined;
});

it('propagates an engine error after the final key', async () => {
  result.error = new Error('unexpected scene');
  await expect(import('./demoCheck')).rejects.toBe(result.error);
});

it('rejects an extra scene after level 2 starts', async () => {
  result.scenes = [2, 3, 4];
  await expect(import('./demoCheck')).rejects.toThrow(/got 2 3 4/);
});
