// Check that both capture streams reach disk while the headless engine is still running.
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it, vi } from 'vitest';

it('writes RGB, picture indices and clocks during playback', async () => {
  const scratch = resolve('../.tmp');
  mkdirSync(scratch, { recursive: true });
  const dir = mkdtempSync(resolve(scratch, 'web-capture-'));
  const out = resolve(dir, 'capture');
  const originalArgv = process.argv;
  const listeners = process.listeners('SIGUSR2');
  const screen = { pixels: new Uint8Array(64000), palette: new Uint8Array(768) };
  type Hooks = {
    onPresent(machine: { screen: typeof screen }, ms: number): void;
    onFrame(world: { clock: number }, session: object, machine: { screen: typeof screen }): void;
  };
  const finished = new Error('capture checked');
  vi.doMock('../../games/kit/cdDemos/headless', () => ({
    loadCdGame: () => ({}),
    runHeadless(_files: unknown, _gam: string, hooks: Hooks) {
      hooks.onPresent({ screen }, 1);
      hooks.onFrame({ clock: 4 }, {}, { screen });
      hooks.onPresent({ screen }, 2);
      screen.palette[0] = 63;
      hooks.onPresent({ screen }, 3);
      const black = Buffer.alloc(192000);
      const red = Buffer.alloc(192000, Buffer.from([255, 0, 0]));
      expect(readFileSync(out + '.rgb').equals(black)).toBe(true);
      expect(readFileSync(out + '.all.rgb').equals(Buffer.concat([black, red]))).toBe(true);
      expect(readFileSync(out + '.all.txt', 'utf8')).toBe('0 1.0 -1 -1\n0 2.0 4 -1\n1 3.0 4 -1');
      expect(readFileSync(out + '.clocks', 'utf8')).toBe('4');
      throw finished;
    },
  }));
  try {
    process.argv = ['node', 'script', 'gameware', 'fixture', '-', out];
    vi.stubEnv('ALL', '1');
    vi.stubEnv('NOFRAMES', '');
    await expect(import('./fidelityWeb')).rejects.toBe(finished);
  } finally {
    process.argv = originalArgv;
    vi.unstubAllEnvs();
    for (const listener of process.listeners('SIGUSR2')) if (!listeners.includes(listener)) process.off('SIGUSR2', listener);
    rmSync(dir, { recursive: true, force: true });
  }
});
