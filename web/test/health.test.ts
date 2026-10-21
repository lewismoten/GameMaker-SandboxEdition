// Tests: The game health check (project/health.ts): missing files, bad links and names.
import { describe, expect, it } from 'vitest';
import { checkGame, validDosName, worstSeverity } from '../src/project/health';
import { GameFiles } from '../src/project/files';
import { ADVTYPE, emptyScene, newGame, serializeGame } from '../src/formats/game';
import { textBytes } from '../src/formats/binary';

function game() {
  const g = newGame('Test');
  const level = emptyScene(ADVTYPE);
  level.desc = 'Level 1';
  level.files[0] = 'test.pal';
  level.files[1] = 'test.map';
  g.scenes.push(level);
  g.scenes[0].files[0] = 'title.lst';
  return g;
}

describe('game health check', () => {
  it('finds missing files a scene or slide list names', () => {
    const files = new GameFiles([
      ['test.gam', serializeGame(game())],
      ['test.pal', new Uint8Array(768)],
      ['title.lst', textBytes('title.gif 3\r\nlogo.fli\r\n')],
      ['title.gif', new Uint8Array([1])],
    ]);
    const issues = checkGame(files, 'test.gam');
    const msgs = issues.map((i) => i.message).join('\n');
    expect(msgs).toMatch(/test\.map is missing \(scene 2 “Level 1”, map\)/);
    expect(msgs).toMatch(/logo\.fli is missing \(shown by the slide list title\.lst\)/);
    expect(msgs).not.toMatch(/title\.gif is missing/);
    expect(worstSeverity(issues)).toBe('error');
  });

  it('reports links into missing scenes, bad names, empty files and no game file', () => {
    const g = game();
    g.scenes[2].numLinks = 1;
    g.scenes[2].links[0] = { toScene: 40, from: { x: 1, y: 1 }, to: { x: 2, y: 2 } };
    const files = new GameFiles([
      ['test.gam', serializeGame(g)],
      ['test.pal', new Uint8Array(768)],
      ['test.map', new Uint8Array(0)],
      ['title.lst', textBytes('')],
    ]);
    const kinds = checkGame(files, 'test.gam').map((i) => i.kind);
    expect(kinds).toContain('link');
    expect(kinds).toContain('empty');
    expect(checkGame(new GameFiles(), undefined)[0].message).toMatch(/no \.gam file/);
    expect(validDosName('level1.map')).toBe(true);
    expect(validDosName('a_j.bkd')).toBe(true);
    expect(validDosName('much-too-long.map')).toBe(false);
  });

  it('deep check reads every file; unused unreadable files are only warnings', () => {
    const files = new GameFiles([
      ['test.gam', serializeGame(game())],
      ['test.pal', new Uint8Array(768)],
      ['test.map', new Uint8Array(10)],
      ['title.lst', textBytes('title.gif\r\n')],
      ['title.gif', textBytes('not a gif')],
      ['spare.gif', textBytes('not a gif')],
    ]);
    const issues = checkGame(files, 'test.gam', { deep: true }).filter((i) => i.kind === 'unreadable');
    expect(issues.find((i) => i.file === 'title.gif')?.severity).toBe('error');
    expect(issues.find((i) => i.file === 'spare.gif')?.severity).toBe('warning');
    expect(checkGame(files, 'test.gam').some((i) => i.kind === 'unreadable')).toBe(false);
  });
});
