import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PLAYED, copyOut, editedFiles, readTree, stamp } from './playedFiles';

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

describe('save backups', () => {
  it('stamp is a folder name', () => expect(stamp(new Date('2026-11-14T03:05:09Z'))).toBe('2026-11-14-03-05-09'));

  it('copyOut keeps every file and never overwrites one already there', () => {
    const to = scratch();
    put(to, 'A/GAME0.SAV', 'earlier');
    const n = copyOut(
      new Map([
        ['A/GAME0.SAV', Buffer.from('later')],
        ['B/X.HIS', Buffer.from('hi')],
      ]),
      to,
    );
    expect(n).toBe(2);
    expect(readFileSync(join(to, 'A/GAME0.SAV'), 'utf8')).toBe('earlier');
    expect(readFileSync(join(to, 'A/GAME0.SAV.1'), 'utf8')).toBe('later');
    expect(readdirSync(join(to, 'B'))).toEqual(['X.HIS']);
  });

  it('readTree finds played files in nested folders', () => {
    const d = scratch();
    put(d, 'GAMES/SANDBOX/REALM/REALM.SAV', 's');
    put(d, 'GAMES/SANDBOX/REALM/REALM.GAM', 'g');
    expect([...readTree(d, (n) => PLAYED.test(n)).keys()]).toEqual([join('GAMES/SANDBOX/REALM/REALM.SAV')]);
  });

  it('editedFiles lists a changed or added file, not an identical one or a played one', () => {
    const oldDir = scratch();
    const fresh = scratch();
    put(oldDir, 'GM/SAME.GAM', 'same');
    put(fresh, 'GM/SAME.GAM', 'same');
    put(oldDir, 'GM/MINE.GAM', 'my own game');
    put(oldDir, 'GM/EDIT.MAP', 'edited');
    put(fresh, 'GM/EDIT.MAP', 'original');
    put(oldDir, 'GM/GAME0.SAV', 'save');
    put(oldDir, 'DOSBOX.command', 'old path');
    const out = editedFiles(readTree(oldDir), fresh);
    expect([...out.keys()].sort()).toEqual([join('GM/EDIT.MAP'), join('GM/MINE.GAM')]);
  });
});
