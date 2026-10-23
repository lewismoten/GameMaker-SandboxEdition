// The quick switcher's ranking and the recent files it remembers in the companion file.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../../project/files';
import { Project } from '../core/project';
import { newGame, emptyScene, serializeGame, ADVTYPE } from '../../formats/game';
import { quickHits, noteOpened, recentFiles } from './quickOpen';
import { deleteMessage } from './usedBy';

function project(): Project {
  const game = newGame('Test');
  const lvl = emptyScene(ADVTYPE);
  lvl.desc = 'Meadow';
  lvl.files[1] = 'one.map';
  game.scenes.push(lvl);
  const files = new GameFiles([
    ['test.gam', serializeGame(game)],
    ['one.map', new Uint8Array(1)],
    ['forest.bbl', new Uint8Array(1)],
    ['for.pal', new Uint8Array(1)],
  ]);
  return new Project('t', 'Test', 'test.gam', files);
}

describe('quick switcher', () => {
  it('ranks names that start with the query first, then words, then scenes', () => {
    const p = project();
    expect(quickHits(p, 'for').map((x) => x.file).sort()).toEqual(['for.pal', 'forest.bbl']);
    expect(quickHits(p, 'meadow')).toEqual([{ file: 'one.map', note: 'Used by Meadow' }]);
    expect(quickHits(p, 'palettes').map((x) => x.file)).toEqual(['for.pal']);
  });

  it('lists recent files first, kept in the companion only', () => {
    const p = project();
    const before = p.files.entries().map(([n, b]) => [n, b.slice()]);
    noteOpened(p, 'one.map');
    noteOpened(p, 'forest.bbl');
    expect(recentFiles(p)).toEqual(['forest.bbl', 'one.map']);
    expect(quickHits(p, '').slice(0, 2).map((x) => x.file)).toEqual(['forest.bbl', 'one.map']);
    expect(p.files.entries()).toEqual(before);
  });

  it('names what uses a file before deleting it', () => {
    const p = project();
    expect(deleteMessage(p, 'one.map')).toMatch(/still used by: Meadow · map/);
    expect(deleteMessage(p, 'forest.bbl')).toMatch(/No scene/);
  });
});
