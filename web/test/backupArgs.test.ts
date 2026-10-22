// Tests: BACKUP.EXE's command line on the desk PC (retro/hacks/backupArgs.ts) and how games are
// found by what was typed (retro/hacks/saveGames.ts findGame, catalogDosName).
import { describe, expect, it } from 'vitest';
import { parseBackupArgs } from '../src/retro/hacks/backupArgs';
import { catalogDosName, findGame, type HackGame } from '../src/retro/hacks/saveGames';

describe('parseBackupArgs', () => {
  it('no words: the menus', () => expect(parseBackupArgs([])).toEqual({ kind: 'ui' }));
  it('help', () => {
    expect(parseBackupArgs(['/?'])).toEqual({ kind: 'help' });
    expect(parseBackupArgs(['TEDDY', '/?'])).toEqual({ kind: 'help' });
  });
  it('every game', () => {
    expect(parseBackupArgs(['*'])).toEqual({ kind: 'all' });
    expect(parseBackupArgs(['*.*'])).toEqual({ kind: 'all' });
    expect(parseBackupArgs(['*', 'TEDDY'])).toEqual({ kind: 'error', message: 'Too many parameters' });
  });
  it('named games', () => expect(parseBackupArgs(['teddy', 'ORB'])).toEqual({ kind: 'games', games: ['teddy', 'ORB'] }));
  it('list', () => {
    expect(parseBackupArgs(['/L'])).toEqual({ kind: 'list' });
    expect(parseBackupArgs(['/l', 'teddy'])).toEqual({ kind: 'list', game: 'teddy' });
    expect(parseBackupArgs(['-L', '*'])).toEqual({ kind: 'list' });
    expect(parseBackupArgs(['/L', 'A', 'B'])).toEqual({ kind: 'error', message: 'Too many parameters' });
  });
  it('restore', () => {
    expect(parseBackupArgs(['/R', 'TEDDY'])).toEqual({ kind: 'restore', game: 'TEDDY', n: undefined });
    expect(parseBackupArgs(['/r', 'TEDDY', '3'])).toEqual({ kind: 'restore', game: 'TEDDY', n: 3 });
    expect(parseBackupArgs(['/R:TEDDY', '2'])).toEqual({ kind: 'restore', game: 'TEDDY', n: 2 });
    expect(parseBackupArgs(['/R'])).toEqual({ kind: 'error', message: 'Required parameter missing' });
    expect(parseBackupArgs(['/R', 'TEDDY', '0'])).toEqual({ kind: 'error', message: 'Invalid parameter - 0' });
    expect(parseBackupArgs(['/R', 'TEDDY', 'x'])).toEqual({ kind: 'error', message: 'Invalid parameter - x' });
  });
  it('delete needs a number', () => {
    expect(parseBackupArgs(['/D', 'TEDDY', '2'])).toEqual({ kind: 'delete', game: 'TEDDY', n: 2 });
    expect(parseBackupArgs(['/D', 'TEDDY'])).toEqual({ kind: 'error', message: 'Required parameter missing' });
  });
  it('bad switches', () => {
    expect(parseBackupArgs(['/X'])).toEqual({ kind: 'error', message: 'Invalid switch - /X' });
    expect(parseBackupArgs(['/R', '/L', 'TEDDY'])).toEqual({ kind: 'error', message: 'Too many parameters' });
  });
});

describe('findGame', () => {
  const games: HackGame[] = [
    { save: 'game:teddy', id: 'teddy', dos: 'TEDDY', title: "Teddy's Adventure" },
    { save: 'game:orb', id: 'orb', dos: 'ORB', title: 'Orb' },
    { save: 'project:abc-1', id: 'abc-1', dos: 'MYGAME', title: 'My Game' },
  ];
  it('by DOS name, id or save id, any case', () => {
    expect(findGame(games, 'teddy')?.id).toBe('teddy');
    expect(findGame(games, 'ORB.EXE')?.id).toBe('orb');
    expect(findGame(games, 'abc-1')?.dos).toBe('MYGAME');
    expect(findGame(games, 'game:orb')?.id).toBe('orb');
    expect(findGame(games, 'nope')).toBeUndefined();
    expect(findGame(games, '')).toBeUndefined();
  });
  it('DOS names come from the program, then the .gam', () => {
    expect(catalogDosName({ id: 'orb', exe: 'ORB.EXE', gam: 'orb.gam' })).toBe('ORB');
    expect(catalogDosName({ id: 'teddy', gam: 'teddy.gam' })).toBe('TEDDY');
    expect(catalogDosName({ id: 'longername', gam: null })).toBe('LONGERNA');
  });
});
