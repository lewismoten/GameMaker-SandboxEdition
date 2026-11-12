// Symlink regressions use ordinary temporary files, never protected repository files.
import { afterEach, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, openSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Roots } from './roots';
import { writeFile } from './safeFiles';

vi.mock('node:fs', async (original) => {
  const fs = await original<typeof import('node:fs')>();
  return { ...fs, openSync: vi.fn(fs.openSync) };
});
import { createGame, openGame } from './session';

const temp: string[] = [];
afterEach(() => {
  for (const p of temp.splice(0)) rmSync(p, { recursive: true, force: true });
});
function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'gm-safe-'));
  temp.push(dir);
  const roots = new Roots([join(dir, 'allowed')]);
  const outside = join(dir, 'outside.txt');
  writeFileSync(outside, 'untouched');
  return { dir, roots, outside };
}

it('refuses linked child files on open and save', async () => {
  const { roots, outside } = setup();
  const game = createGame(roots, 'Tiny');
  game.save(false);
  const notes = join(game.workdir, 'NOTES.TXT');
  symlinkSync(outside, notes);
  await expect(openGame(roots, game.workdir)).rejects.toThrow(/symbolic links|outside/);
  game.ctx.files.put('notes.txt', new Uint8Array([1]));
  game.ctx.dirty.add('notes.txt');
  expect(() => game.save(false)).toThrow(/symbolic links|outside/);
  expect(readFileSync(outside, 'utf8')).toBe('untouched');
});

it('refuses an artifact directory symlink and artifact traversal', async () => {
  const { dir, roots } = setup();
  const game = createGame(roots, 'Tiny');
  game.save(false);
  const outside = join(dir, 'artifacts');
  mkdirSync(outside);
  symlinkSync(outside, join(game.workdir, 'assistant'));
  await expect(game.ctx.saveArtifact!('walk.json', new Uint8Array([1]))).rejects.toThrow(/symbolic links|outside/);
  rmSync(join(game.workdir, 'assistant'));
  await expect(game.ctx.saveArtifact!('../escape.json', new Uint8Array([1]))).rejects.toThrow(/file name/);
});

it('refuses a file replaced by a symlink between validation and open', async () => {
  const { roots, outside } = setup();
  const target = join(roots.scratch, 'notes.txt');
  writeFileSync(target, 'original');
  const fs = await vi.importActual<typeof import('node:fs')>('node:fs');
  vi.mocked(openSync).mockImplementationOnce((path, flags, mode) => {
    unlinkSync(path);
    symlinkSync(outside, path);
    return fs.openSync(path, flags, mode);
  });
  expect(() => writeFile(roots, target, new Uint8Array([1]))).toThrow();
  expect(readFileSync(outside, 'utf8')).toBe('untouched');
});

it('checks the opened file identity before truncating a replaced target', async () => {
  const { roots, outside } = setup();
  const target = join(roots.scratch, 'notes.txt');
  writeFileSync(target, 'original');
  const fs = await vi.importActual<typeof import('node:fs')>('node:fs');
  // Model an open redirected by an ancestor replacement, without any concurrent process.
  vi.mocked(openSync).mockImplementationOnce(() => fs.openSync(outside, 'r+'));
  expect(() => writeFile(roots, target, new Uint8Array([1]))).toThrow(/file changed/);
  expect(readFileSync(outside, 'utf8')).toBe('untouched');
});
