// Shorten only the wait before Escape and replay the demo on the built game.
import { expect, it, vi } from 'vitest';
import { parseRecording, serializeRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';

vi.mock('node:fs', async (load) => {
  const fs = await load<typeof import('node:fs')>();
  return {
    ...fs,
    readFileSync: (...args: Parameters<typeof fs.readFileSync>) => {
      const bytes = fs.readFileSync(...args);
      if (!(args[0] instanceof URL && args[0].pathname.endsWith('/demo.rec')) || typeof bytes === 'string') return bytes;
      const keys = parseRecording(bytes);
      keys.find((event) => event.key === 1)!.delta = 1;
      return serializeRecording(keys);
    },
  };
});

it('rejects a demo that ends before Kit reaches the door', async () => {
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('demo rejected');
  });
  try {
    await expect(import('./demoCheck')).rejects.toThrow('demo rejected');
    expect(exit).toHaveBeenCalledWith(1);
  } finally {
    exit.mockRestore();
  }
});
