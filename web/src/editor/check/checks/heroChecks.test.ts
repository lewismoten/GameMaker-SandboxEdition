// The level check's newer file checks on the tiny game in testGame.ts: prizes in view but out of
// reach (inView.ts, sealed.ts), floors and walls that look alike (blockChecks.ts footing),
// starting values PLAYGAME ignores and a blank Idle (heroStart.ts), and the front screens' colors.
import { describe, expect, it } from 'vitest';
import { BACKBL, parseBlocks, serializeBlocks } from '../../../formats/blocks';
import { IDLESEQ, parseCharacter, serializeCharacter } from '../../../formats/character';
import { serializeGame } from '../../../formats/game';
import { scenesOf } from '../sceneData';
import { testGame, WALL, type TestGame } from '../testGame';
import { blockChecks } from './blockChecks';
import { endingChecks } from './gameChecks';
import { blankIdle, startValues } from './heroStart';
import { seenFrom } from './inView';
import { sealed } from './sealed';

const sceneOf = (t: TestGame) => scenesOf(t.game, t)[0];

describe('prizes in view but out of reach', () => {
  it('tells a coin walled in beside the hero’s path from one far out of sight', () => {
    const rows = ['##########', '#........#', '#E.S.....#', '##########', '#c########', ...new Array(10).fill('##########'), '#c########'];
    const t = testGame(rows);
    const f = sealed(sceneOf(t), t.game);
    expect(f.map((x) => [x.check, x.where.cells])).toEqual([
      ['prize-in-view', [401]],
      ['unreachable', [1501]],
    ]);
    expect(f[0].title).toBe('1 of block 2 is in view but sealed in, first at (1, 4)');
  });

  it('sees across the map’s wrapping edge', () => {
    expect(seenFrom([0], (c) => c === 99)).toEqual([0]);
    expect(seenFrom([0], (c) => c === 50)).toEqual([]);
  });

  it('counts a prize the other plane of two reaches as reachable', () => {
    // two scenes on maps alike but for one wall: the coin is walled in on the first map only
    const t = testGame(['##########', '#........#', '#E.S..c..#', '##########']);
    const map = t.files.get('test.map')!;
    t.files.set('twin.map', map.slice());
    // wall the coin at (6, 2) in on test.map
    for (const c of [2 * 100 + 5, 2 * 100 + 7, 1 * 100 + 6]) map[c * 2] = WALL;
    const near = t.game.scenes[2];
    t.game.scenes.push({ ...near, files: near.files.map((f, i) => (i === 1 ? 'twin.map' : f)), links: near.links.map((l) => ({ ...l, toScene: 2 })) });
    near.links[1] = { toScene: 3, from: { x: 1, y: 1 }, to: { x: 1, y: 1 } };
    t.files.set('test.gam', serializeGame(t.game));
    const all = scenesOf(t.game, t);
    // with no twin the walled-in coin is reported
    expect(sealed(all[0], t.game, [all[0]]).length).toBeGreaterThan(0);
    expect(sealed(all[0], t.game, all)).toEqual([]);
  });
});

describe('floors and walls that look alike', () => {
  it('finds an open block drawn like the wall', () => {
    const t = testGame(['##########', '#........#', '#E.S.ffff#', '##########']);
    const bbl = parseBlocks(t.files.get('test.bbl')!, BACKBL);
    bbl[20].pixels.set(bbl[WALL].pixels);
    bbl[20].grav = bbl[0].grav;
    t.files.set('test.bbl', serializeBlocks(bbl));
    const map = t.files.get('test.map')!;
    for (let x = 5; x < 9; x++) map[(2 * 100 + x) * 2] = 20;
    const footing = blockChecks.flatMap((c) => c(sceneOf(t))).filter((f) => f.check === 'footing');
    expect(footing.map((f) => f.title)).toEqual(['Open block 20 looks like solid block 1 (100% of its pixels the same)']);
  });
});

describe('the hero at the start', () => {
  it('finds a later character whose starting hit points PLAYGAME ignores, a warning when the player chose it', () => {
    const t = testGame(['##########', '#........#', '#E.S.....#', '##########']);
    const strong = parseCharacter(t.files.get('test.chr')!);
    strong.meter[0] = 200;
    t.files.set('strong.chr', serializeCharacter(strong));
    const first = t.game.scenes[2];
    // scene 2 chooses between scene 3 (the same hero) and scene 4 (the strong one)
    t.game.scenes.push({ ...first, links: first.links.map((l) => ({ ...l })) });
    t.game.scenes.push({ ...first, files: first.files.map((f, i) => (i === 5 ? 'strong.chr' : f)), links: first.links.map((l) => ({ ...l })) });
    first.links[1] = { toScene: 3, from: { x: 4, y: 2 }, to: { x: 3, y: 2 } };
    first.links[2] = { toScene: 4, from: { x: 5, y: 2 }, to: { x: 3, y: 2 } };
    t.files.set('test.gam', serializeGame(t.game));
    const f = startValues(t.game, scenesOf(t.game, t));
    expect(f.map((x) => [x.severity, x.title])).toEqual([['warning', 'strong.chr starts with hit points 200, which PLAYGAME ignores']]);
    expect(f[0].detail).toContain('test.chr: hit points 100');
  });

  it('finds an Idle with no frames', () => {
    const t = testGame(['##########', '#........#', '#E.S.....#', '##########']);
    expect(blankIdle(sceneOf(t))).toEqual([]);
    const chr = parseCharacter(t.files.get('test.chr')!);
    chr.sequences[IDLESEQ].frames[0].pic2 = 51;
    t.files.set('test.chr', serializeCharacter(chr));
    expect(blankIdle(sceneOf(t)).map((f) => f.severity)).toEqual(['info']);
  });

  it('finds a menu with no picture and a first level with no palette', () => {
    const t = testGame(['##########', '#........#', '#E.S.....#', '##########']);
    const titles = endingChecks(t.game, scenesOf(t.game, t)).map((f) => f.title);
    expect(titles).toContain('No menu picture: PLAYGAME draws random color ramps behind the menu');
    expect(titles).toContain('Level has no palette, and no level before it sets one');
  });
});
