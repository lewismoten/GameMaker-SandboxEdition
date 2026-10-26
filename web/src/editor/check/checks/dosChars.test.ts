// The level check's "characters DOS can't draw" (dosChars.ts) on the tiny game in testGame.ts,
// and its fix's plain ASCII.
import { describe, expect, it } from 'vitest';
import { serializeGame } from '../../../formats/game';
import { serializeHighScores } from '../../../formats/highscore';
import { GameFiles } from '../../../project/files';
import { Project } from '../../core/project';
import { fixFor } from '../generators/fixes';
import { testGame } from '../testGame';
import { asciiBytes, asciiFor, dosChars } from './dosChars';

const ROWS = ['##########', '#........#', '#E.S.....#', '##########'];
const bytes = (codes: number[]) => Uint8Array.from(codes);
const text = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0));

function game(desc: string, extra: Record<string, Uint8Array>) {
  const t = testGame(ROWS);
  t.game.scenes[0].desc = desc;
  t.game.scenes[0].files[6] = 'help.lst';
  t.files.set('test.gam', serializeGame(t.game));
  for (const [n, b] of Object.entries(extra)) t.files.set(n, b);
  return { game: t.game, files: new GameFiles(t.files) };
}

describe('dosChars', () => {
  it('finds characters 128-255 in a page a slide list shows, the menu name and shipped high scores', () => {
    const { game: g, files } = game('Caf\x82', {
      'help.lst': text('help.txt\r\n'),
      'help.txt': bytes([...text('Press '), 0xc4, 0xc4, ...text(' to go\r\n'), 0x1a, 0x82]),
      'notes.txt': bytes([0x82]), // never shown
      'test.his': serializeHighScores([{ score: 10, name: 'Ren\x82e' }]),
    });
    const found = dosChars(g, files, 'test.gam');
    expect(found.map((f) => f.where.file)).toEqual(['help.txt', 'test.gam', 'test.his']);
    expect(found[0].detail).toContain('─');
    expect(found.every((f) => f.fix === 'dos-ascii')).toBe(true);
  });

  it('fixes each file in plain ASCII, after which nothing is found', () => {
    const { files } = game('Caf\x82', {
      'help.lst': text('help.txt\r\n'),
      'help.txt': bytes([...text('Na'), 0xa4, ...text('o\r\n')]),
      'test.his': serializeHighScores([{ score: 10, name: 'Ren\x82e' }]),
    });
    const project = Project.fromFiles(files);
    for (const f of dosChars(project.game(), project.files, project.gam)) fixFor(f, project)!.apply();
    expect(dosChars(project.game(), project.files, project.gam)).toEqual([]);
    expect(project.files.get('help.txt')).toEqual(text('Nano\r\n'));
    expect(project.game().scenes[0].desc).toBe('Cafe');
  });

  it('passes plain ASCII', () => {
    const { game: g, files } = game('Plain', { 'help.lst': text('help.txt\r\n'), 'help.txt': text('Arrows move.\r\n') });
    expect(dosChars(g, files, 'test.gam')).toEqual([]);
  });

  it('writes each character as a DOS writer would have typed it', () => {
    expect([0x82, 0x91, 0xe1, 0xc4, 0xba, 0xc9, 0xdb, 0xf8].map(asciiFor)).toEqual(['e', 'ae', 'ss', '-', '|', '+', '#', 'o']);
    expect(asciiBytes(bytes([0x41, 0x82, 0x0d, 0x0a]))).toEqual(text('Ae\r\n'));
    for (let c = 0x80; c < 0x100; c++) expect(asciiFor(c), c.toString(16)).toMatch(/^[\x20-\x7e]+$/);
  });
});
