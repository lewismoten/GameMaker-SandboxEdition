// An idle pause at the heart stall must not count as trying to buy it.
import { expect, it, vi } from 'vitest';

vi.mock('@lewismoten/gamemaker-sandbox-engine/formats/recording', async (importOriginal) => {
  const recording = await importOriginal<typeof import('@lewismoten/gamemaker-sandbox-engine/formats/recording')>();
  return {
    ...recording,
    parseRecording(bytes: Uint8Array) {
      const keys = recording.parseRecording(bytes);
      const bump = keys.findIndex((event, i) => event.key === 77 && keys[i + 1]?.key === 205 && keys[i + 1].delta === 30);
      expect(bump).toBeGreaterThan(-1);
      // Release on arrival, before the two final approach ticks against the stall.
      keys[bump - 1].delta -= 2;
      keys[bump].delta += 2;
      keys[bump].key = 205;
      return keys;
    },
  };
});

it('rejects the recorded shopping trip if the hero waits through the failed purchase', async () => {
  await expect(import('./demoCheck')).rejects.toThrow(/unpaid heart stall/);
});
