// A stub machine keeps slide-list tests bounded, with no screen, input or audio devices.
import { afterEach, expect, it, vi } from 'vitest';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import type { Machine } from '@lewismoten/gamemaker-sandbox-engine/engine/machine';
import { showGraphic } from '@lewismoten/gamemaker-sandbox-engine/engine/showGraphic';

afterEach(() => vi.useRealTimers());
function machine(entries: [string, string][]) {
  let calls = 0;
  return {
    files: new GameFiles(entries.map(([n, text]) => [n, new TextEncoder().encode(text)])),
    audio: { stopVoc: vi.fn() },
    checkAbort: vi.fn(),
    need: async () => {
      if (++calls > 100) throw new Error('test safety bound');
    },
    waiting: (fn: () => Promise<boolean>) => fn(),
  } as unknown as Machine;
}

it('rejects direct and indirect case-insensitive slide-list cycles', async () => {
  vi.useFakeTimers();
  for (const entries of [
    [['self.lst', 'SELF.LST\n']],
    [
      ['a.lst', 'b.lst\n'],
      ['b.lst', 'A.LST\n'],
    ],
  ] as [string, string][][]) {
    const result = expect(showGraphic(machine(entries), entries[0][0], { gamePalette: new Uint8Array(768) })).rejects.toThrow(/Cyclic/);
    await vi.runAllTimersAsync();
    await result;
  }
});

it('rejects excessive slide-list nesting', async () => {
  vi.useFakeTimers();
  const entries: [string, string][] = Array.from({ length: 65 }, (_, i) => [`s${i}.lst`, `s${i + 1}.lst\n`]);
  const result = expect(showGraphic(machine(entries), 's0.lst', { gamePalette: new Uint8Array(768) })).rejects.toThrow(/nested/);
  await vi.runAllTimersAsync();
  await result;
});

it('yields between slide entries and checks cancellation', async () => {
  vi.useFakeTimers();
  const m = machine([['show.lst', 'missing.bin\nmissing.bin\n']]);
  const result = expect(showGraphic(m, 'show.lst', { gamePalette: new Uint8Array(768) })).rejects.toThrow('stopped');
  setTimeout(() => {
    m.checkAbort = () => {
      throw new Error('stopped');
    };
  }, 0);
  await vi.runAllTimersAsync();
  await result;
});
