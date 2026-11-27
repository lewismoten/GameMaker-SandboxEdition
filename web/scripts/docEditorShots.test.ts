// Exercise the screenshot command with a partial encoder output and an existing tour image.
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it, vi } from 'vitest';

const { arg, launch, encode } = vi.hoisted(() => ({ arg: vi.fn(), launch: vi.fn(), encode: vi.fn() }));
vi.mock('./perfLib', () => ({ arg, launch }));
vi.mock('./forceTheme', () => ({ forceTheme: vi.fn(), assertTheme: vi.fn() }));
vi.mock('node:child_process', () => ({ execFileSync: encode }));

it('keeps the previous editor image and removes temporary files if encoding fails', async () => {
  const scratch = resolve(import.meta.dirname, '../../.tmp');
  mkdirSync(scratch, { recursive: true });
  const out = mkdtempSync(resolve(scratch, 'shots-'));
  try {
    mkdirSync(resolve(out, 'editor'));
    const image = resolve(out, 'editor/07-hero.webp');
    writeFileSync(image, 'previous');
    arg.mockImplementation((key: string) => ({ url: 'http://localhost', out, only: '07-hero' })[key as 'url' | 'out' | 'only']);
    const page = {
      emulateMedia: vi.fn(),
      goto: vi.fn(),
      waitForTimeout: vi.fn(),
      getByRole: () => ({ click: vi.fn() }),
      url: () => 'http://localhost/#/p/copy/game.gam',
      screenshot: ({ path }: { path: string }) => writeFileSync(path, 'png'),
    };
    launch.mockResolvedValue({ newContext: () => ({ newPage: () => page }), close: vi.fn() });
    encode.mockImplementation((_command: string, args: string[]) => {
      writeFileSync(args[args.indexOf('-o') + 1], 'partial');
      throw new Error('encoding failed');
    });
    await expect(import('./docEditorShots')).rejects.toThrow('encoding failed');
    expect(readdirSync(out)).toEqual(['editor']);
    expect(readdirSync(resolve(out, 'editor'))).toEqual(['07-hero.webp']);
    expect(readFileSync(image, 'utf8')).toBe('previous');
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
