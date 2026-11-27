// Exercise the demo check's verdict when replay fails after playing the expected trail.
import { expect, it, vi } from 'vitest';

const { error } = vi.hoisted(() => ({ error: new Error('replay failed') }));
vi.mock('node:fs', () => ({ readFileSync: () => new Uint8Array() }));
vi.mock('@lewismoten/gamemaker-sandbox-engine/formats/recording', () => ({ parseRecording: () => [] }));
vi.mock('../../kit/walkthrough', () => ({ replay: () => ({ scenes: [2, 3, 4, 4, 1], keysLeft: 0, error }) }));

it('propagates a replay error even with the expected scenes and every key played', async () => {
  await expect(import('./demoCheck')).rejects.toBe(error);
});
