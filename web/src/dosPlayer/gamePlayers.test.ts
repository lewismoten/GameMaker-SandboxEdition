// The games' own DOS player looks (games/<id>/player.json, games/kit/player.ts): each keeps
// the rules, and the rules turn away what would change how a game plays.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { playerProblems, ruleProblems } from '../../../games/kit/player';

const gamesDir = join(__dirname, '../../../games');
const withPlayer = readdirSync(gamesDir).filter((id) => existsSync(join(gamesDir, id, 'player.json')));

describe('games/<id>/player.json', () => {
  // one test for them all, so the list of games with one is never printed
  it('each keeps the rules', () => {
    const broken = Object.fromEntries(withPlayer.map((id) => [id, playerProblems(id)]).filter(([, p]) => p.length));
    expect(broken).toEqual({});
  });
});

describe('ruleProblems', () => {
  it('takes words, colors, frames and positions', () => {
    expect(
      ruleProblems({
        'str.invent.money': 'Sugar:     %d',
        'color.rgb.hsGreen': [40, 56, 63],
        'border.invent.outer': [8, 8, 312, 192],
        'layout.hiscore.title.x': 108,
      }),
    ).toEqual([]);
  });

  it('turns away timings, switched-off keys and renamed extensions', () => {
    const p = ruleProblems({ 'timing.highScores': -1, 'table.fkeys.F5': 'off', 'file.ext.gif': 'pic' });
    expect(p).toHaveLength(3);
    expect(p.join('\n')).toMatch(/timing would change how the game plays/);
    expect(p.join('\n')).toMatch(/switched-off key/);
    expect(p.join('\n')).toMatch(/keep their extensions/);
  });

  it('turns away what breaks the patch table, and stock values', () => {
    expect(ruleProblems({ 'str.invent.money': 'Sugar: %s' })[0]).toMatch(/keep %d/);
    expect(ruleProblems({ 'str.menu.quit': 'Leave now' })[0]).toMatch(/longer than 4/);
    expect(ruleProblems({ 'str.menu.play': 'Play' })[0]).toMatch(/CD player's own value/);
    expect(ruleProblems({ 'no.such': 1 })[0]).toMatch(/no such patch/);
  });

  it('turns away a recolored black-screen word that is hard to read', () => {
    // color 0 black, color 1 a dark blue, color 2 white
    const pal = new Uint8Array(768);
    pal.set([4, 4, 20], 3);
    pal.set([63, 63, 63], 6);
    expect(ruleProblems({ 'color.rgb.hsGreen': [60, 60, 60], 'color.select.status': 'hsGreen' }, [['l1.pal', pal]])).toEqual([]);
    expect(ruleProblems({ 'color.rgb.hsGreen': [4, 4, 22], 'color.select.status': 'hsGreen' }, [['l1.pal', pal]])[0]).toMatch(
      /color.select.status: color 1 of l1.pal/,
    );
  });
});
