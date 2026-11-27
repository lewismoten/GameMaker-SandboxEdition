// Conflicting card formats must fail before the exporter touches either card.
import { expect, it, vi } from 'vitest';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';

vi.mock('node:fs', async (load) => ({
  ...(await load<typeof import('node:fs')>()),
  existsSync: vi.fn(() => true),
  readdirSync: vi.fn((path: string) => (path === 'gmp/pocket/' ? ['notes.txt'] : [])),
  mkdirSync: vi.fn(),
  rmSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

it('rejects --out and --gmp together before accessing either card', async () => {
  const argv = process.argv;
  process.argv = ['node', 'pocketData', '--out', 'loose', '--gmp', 'gmp'];
  try {
    await expect(import('./pocketData')).rejects.toThrow(/--out and --gmp/);
    expect(rmSync).not.toHaveBeenCalled();
    expect(mkdirSync).not.toHaveBeenCalled();
    expect(writeFileSync).not.toHaveBeenCalled();
    expect(existsSync).not.toHaveBeenCalled();
    expect(readdirSync).not.toHaveBeenCalled();
  } finally {
    process.argv = argv;
  }
});
