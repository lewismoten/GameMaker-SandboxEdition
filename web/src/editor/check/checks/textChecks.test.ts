// The level check's text-screen checks (helpKeys.ts, textContrast.ts, textScreens.ts) on the tiny
// game in testGame.ts, given instructions, a menu picture and slide lists.
import { describe, expect, it } from 'vitest';
import { textBytes } from '../../../formats/binary';
import { serializeGame } from '../../../formats/game';
import { encodeGif } from '../../../formats/gif';
import { GameFiles } from '../../../project/files';
import { testGame, type TestGame } from '../testGame';
import { textPages } from '../textScreens';
import { helpKeys, namedKeys } from './helpKeys';
import { textContrast } from './textContrast';

const ROWS = ['##########', '#........#', '#E.S.....#', '##########'];

/** A 320 × 200 picture of one color, with a palette of black, white and deep purple. */
function picture(fill: number): Uint8Array {
  const palette = new Uint8Array(768);
  palette.set([63, 63, 63], 3); // 1 white
  palette.set([50, 10, 50], 6); // 2 deep purple: the text color
  palette.set([40, 20, 40], 9); // 3 a mauve as light as the text
  return encodeGif({ width: 320, height: 200, pixels: new Uint8Array(320 * 200).fill(fill), palette });
}

/** The test game with title-scene slots filled (slot: file name) and extra files. */
function withScreens(slots: Record<number, string>, extra: Record<string, Uint8Array>): TestGame & { gf: GameFiles } {
  const t = testGame(ROWS);
  for (const [slot, name] of Object.entries(slots)) t.game.scenes[0].files[Number(slot)] = name;
  t.files.set('test.gam', serializeGame(t.game));
  for (const [n, b] of Object.entries(extra)) t.files.set(n, b);
  return { ...t, gf: new GameFiles(t.files) };
}

describe('the keys the help names', () => {
  it('reads keys written as keys, and leaves words alone', () => {
    const keys = (s: string) => namedKeys(s).map((k) => k.token);
    expect(keys('the way you last moved. P\npicks things up and O drops one.')).toEqual(['P', 'O']);
    expect(keys('Press Z to toot. Hold SPACE to fly.')).toEqual(['Z', 'Space']);
    expect(keys('MODULES\nEach adds a key:\nZ Plasma Lance\nQ/E Dash Boots')).toEqual(['Z', 'Q', 'E']);
    // a legend of prizes is not a legend of keys; a capital A is a word; the number pad is the arrows
    expect(keys('THINGS TO GRAB\n N   Nova Bomb charges\n A seal of light bars the way.')).toEqual([]);
    expect(keys('The number pad 7 and 9 jump.')).toEqual([]);
    expect(keys('Press SPACE to continue')).toEqual([]);
  });

  it('finds a key the instructions name that nothing uses, and passes keys the hero has', () => {
    const t = withScreens({ 6: 'help.txt' }, { 'help.txt': textBytes('Right arrow walks.\r\nP picks things up.\r\nF5 saves.\r\n') });
    const f = helpKeys(t.game, t.gf);
    expect(f.map((x) => x.title)).toEqual(['The instructions name the P key, which nothing in the game uses']);
    expect(f[0].detail).toContain('P picks things up.');
    const ok = withScreens({ 6: 'help.txt' }, { 'help.txt': textBytes('Press F2 for your status.\r\n') });
    expect(helpKeys(ok.game, ok.gf)).toEqual([]);
  });

  it('reads the pages of a slide list', () => {
    const t = withScreens(
      { 6: 'help.lst' },
      { 'help.lst': textBytes('pic.gif\r\nhelp.txt\r\n'), 'pic.gif': picture(1), 'help.txt': textBytes('Press X to fire.\r\n') },
    );
    expect(helpKeys(t.game, t.gf).map((f) => f.title)).toEqual(['The instructions name the X key, which nothing in the game uses']);
  });
});

describe('text-screen contrast', () => {
  it('knows the picture under a page and its text color', () => {
    const t = withScreens(
      { 6: 'help.lst' },
      { 'help.lst': textBytes('pic.gif\r\nhelp.txt\r\n'), 'pic.gif': picture(1), 'help.txt': textBytes('Hello\r\n'.repeat(20)) },
    );
    const pages = textPages(t.game, t.gf);
    expect(pages.map((p) => [p.role, p.page, p.pages, p.color, !!p.under])).toEqual([
      ['instructions', 0, 2, 2, true],
      ['instructions', 1, 2, 2, true],
    ]);
  });

  it('finds purple text over a mauve as light as it, and passes it over white', () => {
    const page = (fill: number) =>
      withScreens(
        { 6: 'help.lst' },
        { 'help.lst': textBytes('pic.gif\r\nhelp.txt\r\n'), 'pic.gif': picture(fill), 'help.txt': textBytes('Find the gold key.\r\n') },
      );
    const dark = page(3);
    const f = textContrast(dark.game, dark.gf);
    expect(f).toHaveLength(1);
    expect(f[0].title).toBe('15 of 15 letters on the instructions are hard to read against the picture');
    const light = page(1);
    expect(textContrast(light.game, light.gf)).toEqual([]);
  });

  it('judges a bare page over the menu picture, and the menu’s own words', () => {
    const t = withScreens({ 2: 'menu.gif', 7: 'credits.txt' }, { 'menu.gif': picture(3), 'credits.txt': textBytes('Made by me.\r\n') });
    t.game.scenes[0].desc = 'Test Game';
    t.files.set('test.gam', serializeGame(t.game));
    const titles = textContrast(t.game, new GameFiles(t.files)).map((f) => f.title);
    expect(titles).toEqual(['9 of 9 letters on the credits are hard to read against the picture', expect.stringContaining('menu’s choices')]);
  });

  it('reads the menu’s words from the project’s DOS player patches', () => {
    const t = withScreens({ 2: 'menu.gif' }, { 'menu.gif': picture(3) });
    t.game.scenes[0].desc = 'Test Game';
    t.files.set('test.gam', serializeGame(t.game));
    const menu = (player?: Record<string, string>) =>
      textContrast(t.game, new GameFiles(t.files), player).find((f) => f.title.includes('menu’s choices'))?.title;
    expect(menu()).toMatch(/^71 of 71 letters/);
    expect(menu({ 'str.menu.play': 'Go' })).toMatch(/^69 of 69 letters/);
  });
});
