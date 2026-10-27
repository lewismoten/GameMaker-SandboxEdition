// The level check's color 0 check (colorZero.ts) on the tiny game in testGame.ts, given a level
// palette and a menu picture.
import { describe, expect, it } from 'vitest';
import { textBytes } from '../../../formats/binary';
import { serializeGame } from '../../../formats/game';
import { encodeGif } from '../../../formats/gif';
import { GameFiles } from '../../../project/files';
import { runChecks } from '../report';
import { testGame } from '../testGame';
import { blackAtZero, colorZero } from './colorZero';

const ROWS = ['##########', '#........#', '#E.S.....#', '##########'];

/** A palette with `zero` at color 0, a red at 12 and a blue at 9. */
function palette(zero: [number, number, number]): Uint8Array {
  const pal = new Uint8Array(768);
  pal.set(zero, 0);
  pal.set([60, 8, 8], 12 * 3);
  pal.set([8, 8, 60], 9 * 3);
  pal.set([63, 63, 63], 15 * 3);
  return pal;
}

function game(levelZero: [number, number, number], menu?: { zero: [number, number, number]; card: string }) {
  const t = testGame(ROWS);
  t.game.scenes[2].files[0] = 'test.pal';
  t.files.set('test.pal', palette(levelZero));
  if (menu) {
    t.game.scenes[0].files[2] = 'menu.gif';
    t.game.scenes[2].files[9] = menu.card;
    t.files.set('menu.gif', encodeGif({ width: 320, height: 200, pixels: new Uint8Array(64000).fill(15), palette: palette(menu.zero) }));
    t.files.set(menu.card, textBytes('LEVEL 1\nFind the exit.'));
  }
  t.files.set('test.gam', serializeGame(t.game));
  return t;
}

describe('the color 0 check', () => {
  it('counts black and near black as black', () => {
    expect(blackAtZero(palette([0, 0, 0]))).toBe(true);
    expect(blackAtZero(palette([3, 2, 5]))).toBe(true);
    expect(blackAtZero(palette([0, 0, 8]))).toBe(false);
    expect(blackAtZero(palette([33, 33, 33]))).toBe(false);
  });

  it('finds a level palette whose color 0 is gray, naming the red and blue matched on it', () => {
    const t = game([33, 33, 33]);
    const f = colorZero(t.game, t);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ check: 'color-zero', severity: 'warning', where: { scene: 2, file: 'test.pal' } });
    expect(f[0].title).toBe('Color 0 of test.pal isn’t black (33, 33, 33)');
    expect(f[0].detail).toContain('high-score name prompt');
    expect(f[0].detail).toContain('red is color 12 (60, 8, 8)');
    expect(f[0].detail).toContain('blue color 9 (8, 8, 60)');
    expect(colorZero(game([0, 0, 0]).game, game([0, 0, 0]))).toEqual([]);
  });

  it('matches with the project’s DOS player colors', () => {
    const t = game([33, 33, 33]);
    // the name prompt looking for the high-score green instead finds nothing closer than gray
    const f = colorZero(t.game, t, { 'color.select.hsPrompt': 'hsGreen' });
    expect(f[0].detail).toContain('red is color 0 (33, 33, 33)');
  });

  it('finds the menu picture only when the first level’s card is a text page alone', () => {
    const t = game([0, 0, 0], { zero: [20, 20, 40], card: 'card1.txt' });
    const f = colorZero(t.game, t);
    expect(f.map((x) => x.where.file)).toEqual(['menu.gif']);
    expect(f[0].detail).toContain('card1.txt');
    const pic = game([0, 0, 0], { zero: [20, 20, 40], card: 'card1.gif' });
    expect(colorZero(pic.game, pic)).toEqual([]);
  });

  it('is part of the level check’s report', async () => {
    const t = game([33, 33, 33]);
    const r = await runChecks(new GameFiles(t.files), { play: false });
    expect(r.findings.filter((x) => x.check === 'color-zero')).toHaveLength(1);
  });
});
