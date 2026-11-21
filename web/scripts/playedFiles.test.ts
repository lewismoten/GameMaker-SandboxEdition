// Exercise the production rebuild against disposable mount and backup directories.
import { mkdirSync, mkdtempSync, readFileSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PLAYED, rebuildMount } from './playedFiles';

const dirs: string[] = [];
const scratch = (): string => {
  const d = mkdtempSync(join(tmpdir(), 'played-'));
  dirs.push(d);
  return d;
};
afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));
const put = (root: string, rel: string, text: string): void => {
  mkdirSync(join(root, rel, '..'), { recursive: true });
  writeFileSync(join(root, rel), text);
};

describe('PLAYED', () => {
  it('matches what PLAYGAME and PLAYBACK write, in any case', () => {
    for (const n of ['CONFIG.DAT', 'GAME3.SAV', 'savnames.dat', 'REALM.SAV', 'TUIT.HIS']) expect(PLAYED.test(n), n).toBe(true);
    for (const n of ['REALM.GAM', 'GAME.MAP', 'CONFIG.HLP', 'SAVE.TXT']) expect(PLAYED.test(n), n).toBe(false);
  });
});

const read = (root: string, rel: string) => readFileSync(join(root, rel), 'utf8');

it('keeps the mounted drive intact when staging fails with EISDIR', async () => {
  const mount = join(scratch(), 'dosbox');
  put(mount, 'GM', 'old file');
  put(mount, 'MINE.MAP', 'my map');
  await expect(
    rebuildMount(mount, (stage) => {
      put(stage, 'GM/STOCK.GAM', 'fresh');
      expect(read(mount, 'MINE.MAP')).toBe('my map');
      writeFileSync(join(stage, 'GM'), 'collision');
    }),
  ).rejects.toMatchObject({ code: 'EISDIR' });
  expect(read(mount, 'GM')).toBe('old file');
  expect(read(mount, 'MINE.MAP')).toBe('my map');
});

it('backs up both directions of type changes, unrelated edits and customized launchers', async () => {
  const mount = join(scratch(), 'dosbox');
  for (const rel of ['GM', 'GAME0.SAV', 'DIR/NAME.SAV', 'DIR/MINE.GAM', 'MINE.MAP', 'DOSBOX.command']) put(mount, rel, rel);
  const build = (stage: string) => {
    put(stage, 'GM/STOCK.GAM', 'game');
    put(stage, 'GAME0.SAV/FILE', 'stock');
    put(stage, 'DIR', 'file');
    put(stage, 'DOSBOX.command', 'stock');
  };
  const { edits, saves, restored } = await rebuildMount(mount, build);
  for (const rel of ['GM', 'DIR/MINE.GAM', 'MINE.MAP', 'DOSBOX.command']) expect(read(edits!, rel)).toBe(rel);
  for (const rel of ['GAME0.SAV', 'DIR/NAME.SAV']) expect(read(saves!, rel)).toBe(rel);
  expect(restored).toBe(0);
  expect(read(mount, 'DOSBOX.command')).toBe('stock');
  expect((await rebuildMount(mount, build)).edits).toBeUndefined();
});

it('keeps earlier save and edit backups when a later same-second rebuild finds a stock save', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  try {
    const mount = join(scratch(), 'dosbox');
    const build = (stage: string) => put(stage, 'CONFIG.DAT', 'stock');
    put(mount, 'CONFIG.DAT', 'first');
    put(mount, 'MINE.MAP', 'first');
    const first = await rebuildMount(mount, build);
    expect(read(mount, 'CONFIG.DAT')).toBe('first');
    put(mount, 'CONFIG.DAT', 'stock');
    put(mount, 'OTHER.SAV', 'second');
    put(mount, 'MINE.MAP', 'second');
    const second = await rebuildMount(mount, build);
    expect(read(first.saves!, 'CONFIG.DAT')).toBe('first');
    expect(existsSync(join(second.saves!, 'CONFIG.DAT'))).toBe(false);
    expect(read(second.saves!, 'OTHER.SAV')).toBe('second');
    expect(read(first.edits!, 'MINE.MAP')).toBe('first');
    expect(read(second.edits!, 'MINE.MAP')).toBe('second');
  } finally {
    vi.useRealTimers();
  }
});

it('compares through the last chunk of a multi-chunk file', async () => {
  const mount = join(scratch(), 'dosbox');
  const prefix = 'x'.repeat(1024 * 1024);
  put(mount, 'BIG.MAP', prefix + 'a');
  const { edits } = await rebuildMount(mount, (stage) => put(stage, 'BIG.MAP', prefix + 'b'));
  expect(read(edits!, 'BIG.MAP')).toBe(prefix + 'a');
});

it('leaves the old drive in place when an edit backup cannot be written', async () => {
  const root = scratch();
  const mount = join(root, 'drive');
  put(mount, 'MINE.MAP', 'personal');
  put(root, 'drive-edits', 'already a file');
  await expect(rebuildMount(mount, (stage) => put(stage, 'NEW.GAM', 'stock'))).rejects.toMatchObject({ code: 'EEXIST' });
  expect(read(mount, 'MINE.MAP')).toBe('personal');
  expect(existsSync(join(mount, 'NEW.GAM'))).toBe(false);
});
