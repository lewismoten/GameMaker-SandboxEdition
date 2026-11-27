// Exercise the scanner entry point without building the game's maps.
import { afterEach, expect, it, vi } from 'vitest';
import { buildLevels } from '../src/levels';

vi.mock('../src/levels', () => ({ buildLevels: vi.fn(() => ({ pal: { c: () => 0 }, levels: [] })) }));
const argv = process.argv;

afterEach(() => {
  process.argv = argv;
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.resetModules();
});

it.each(['3px', '0', '21', '1.5'])('rejects %s before building levels', async (threshold) => {
  process.argv = [...argv.slice(0, 2), threshold];
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('scanner exited');
  });
  await expect(import('./seams')).rejects.toThrow('scanner exited');
  expect(exit).toHaveBeenCalledWith(1);
  expect(error).toHaveBeenCalledWith(expect.stringMatching(/usage:.*1.*20/i));
  expect(buildLevels).not.toHaveBeenCalled();
});

it.each([[], ['1'], ['20']])('scans with a valid threshold (%s)', async (...args) => {
  process.argv = [...argv.slice(0, 2), ...args];
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  await import('./seams');
  expect(buildLevels).toHaveBeenCalledOnce();
  expect(log).toHaveBeenCalledWith('0 suspect cells');
});
