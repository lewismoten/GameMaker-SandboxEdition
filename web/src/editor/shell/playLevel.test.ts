// The Play Level menu (playLevel.ts): its entries, the pick its main part plays, and the game it starts.
import { describe, expect, it } from 'vitest';
import { ADVTYPE, emptyScene, newGame, type Game } from '../../formats/game';
import { currentPick, gameFor, parsePick, pickParam, playChoices } from './playLevel';

function game(): Game {
  const g = newGame('Test');
  for (const name of ['Level 1', 'Level 2']) {
    const s = emptyScene(ADVTYPE);
    s.desc = name;
    g.scenes.push(s);
  }
  g.scenes[0].links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: 5, y: 6 } };
  g.scenes[2].links[0] = { toScene: 3, from: { x: 40, y: 12 }, to: { x: 1, y: 2 } };
  g.scenes[3].links[0] = { toScene: 2, from: { x: 3, y: 3 }, to: { x: 60, y: 7 } };
  g.scenes[3].links[1] = { toScene: 1, from: { x: 50, y: 50 }, to: { x: 0, y: 0 } };
  return g;
}

describe('Play Level menu', () => {
  it('lists every way into a level, labelled by where it comes from', () => {
    expect(playChoices(game()).map((c) => c.label)).toEqual([
      'Level 1 at 5,6, from the title',
      'Level 2 at 1,2, from Level 1’s exit',
      'Level 1 at 60,7, from Level 2’s exit 1',
    ]);
  });

  it('plays the last pick, else a way into the open map’s level, else the first', () => {
    const c = playChoices(game());
    expect(currentPick(c)).toBe(c[0]);
    expect(currentPick(c, undefined, 3)).toBe(c[1]);
    expect(currentPick(c, { to: 2, at: { x: 0, y: 0 }, from: 3, link: 0 }, 3)).toBe(c[2]);
    // the last pick's link has moved: its current spot is played
    expect(currentPick(c, { to: 3, at: { x: 9, y: 9 }, from: 2, link: 0 })?.at).toEqual({ x: 1, y: 2 });
    // its link is gone, but the spot is still a way in
    expect(currentPick(c, { to: 2, at: { x: 60, y: 7 }, from: 9, link: 4 })).toBe(c[2]);
    expect(currentPick([], undefined, 2)).toBeUndefined();
  });

  it('plays the game itself from its own start, and a copy from anywhere else', () => {
    const g = game();
    const c = playChoices(g);
    expect(gameFor(g, c[0])).toBe(g);
    const copy = gameFor(g, c[2]);
    expect(copy).not.toBe(g);
    expect(copy.scenes[0].links[0]).toMatchObject({ toScene: 2, to: { x: 60, y: 7 } });
    expect(g.scenes[0].links[0].to).toEqual({ x: 5, y: 6 });
  });

  it('keeps the copy’s start off the level’s won link (no false "won before it starts" warning)', () => {
    const g = game();
    g.scenes[3].links[1].from = { x: 0, y: 0 };
    const copy = gameFor(g, playChoices(g)[1]);
    expect(copy.scenes[0].links[0].from).not.toEqual({ x: 0, y: 0 });
  });

  it('writes a pick into the address and reads it back', () => {
    const p = playChoices(game())[2];
    expect(pickParam(p)).toBe('2.60.7.3.0');
    expect(parsePick(pickParam(p))).toEqual({ to: 2, at: { x: 60, y: 7 }, from: 3, link: 0 });
    expect(parsePick('true')).toBeUndefined();
    expect(parsePick('title')).toBeUndefined();
  });
});
