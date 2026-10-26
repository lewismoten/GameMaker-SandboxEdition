// The level check's link and missing-part checks, on the tiny game in testGame.ts: two links on a
// cell, a start on a link, a corner link, links and landings in walls, links off the map, no route
// to the won scene, missing .VOC files and level files, numbers past a set, moves over the cap,
// and the fixes, opposites and key-name repairs the archive's games asked for.
import { describe, expect, it } from 'vitest';
import { BACKBL, parseBlocks, serializeBlocks } from '../../../formats/blocks';
import { NOSCENE, serializeGame } from '../../../formats/game';
import { emptyMonster } from '../../../formats/monster';
import { newSoundSet } from '../../../formats/sound';
import { GameFiles } from '../../../project/files';
import { runChecks } from '../report';
import { scenesOf } from '../sceneData';
import { testGame, type TestGame } from '../testGame';
import { cornerLinks, offMap, shadowedLinks, solidLinks, startsOnLink, wonRoute } from './linkChecks';
import { missingFiles, missingVocs, outOfRange } from './missingParts';
import { counters, opposites } from './blockChecks';
import { mentions, speedCap } from './gameChecks';

// prettier-ignore
const ROWS = [
  '##########',
  '#........#',
  '#E.S.....#',
  '##########',
];
const sceneOf = (t: TestGame) => scenesOf(t.game, t)[0];

describe('the link checks', () => {
  it('finds a second link on a cell, which never fires', () => {
    const t = testGame(ROWS);
    t.game.scenes[2].links[1] = { toScene: 2, from: { x: 1, y: 2 }, to: { x: 5, y: 2 } };
    const f = shadowedLinks(t.game, sceneOf(t));
    expect(f.map((x) => [x.check, x.severity, x.where.link])).toEqual([['link-shadow', 'error', 1]]);
    // the same place twice is harmless
    t.game.scenes[2].links[1] = { ...t.game.scenes[2].links[0] };
    expect(shadowedLinks(t.game, sceneOf(t))).toEqual([]);
  });

  it('finds a scene that starts on its own link, and follows a loop', () => {
    const t = testGame(ROWS);
    t.game.scenes[0].links[0].to = { x: 1, y: 2 };
    const f = startsOnLink(t.game, sceneOf(t), scenesOf(t.game, t));
    expect(f.map((x) => x.severity)).toEqual(['warning']);
    expect(f[0].detail).toContain('the game won scene');
    // a card (an intro picture) passing straight through is often meant
    t.game.scenes[2].files[9] = 'card.lst';
    expect(startsOnLink(t.game, sceneOf(t), scenesOf(t.game, t))[0].severity).toBe('info');
    // a link back into itself, landing on the same link: round for ever
    t.game.scenes[2].links[0] = { toScene: 2, from: { x: 1, y: 2 }, to: { x: 1, y: 2 } };
    expect(startsOnLink(t.game, sceneOf(t), scenesOf(t.game, t)).map((x) => x.severity)).toContain('error');
  });

  it('warns of a link left at (0, 0) only when the corner is open', () => {
    const t = testGame(ROWS);
    t.game.scenes[2].links[1] = { toScene: 1, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } };
    expect(cornerLinks(t.game, sceneOf(t)).map((x) => x.severity)).toEqual(['info']);
    const open = testGame(['..........', '#........#', '#E.S.....#', '##########']);
    open.game.scenes[2].links[1] = { toScene: 1, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } };
    expect(cornerLinks(open.game, sceneOf(open)).map((x) => x.severity)).toEqual(['warning']);
  });

  it('finds a link in a wall and a landing in one, but not one that opens', () => {
    const t = testGame(ROWS);
    t.game.scenes[2].links[1] = { toScene: 1, from: { x: 5, y: 3 }, to: { x: 0, y: 0 } };
    t.game.scenes[0].links[0].to = { x: 3, y: 3 };
    const f = solidLinks(t.game, sceneOf(t));
    expect(f.map((x) => x.title)).toEqual([
      'Link 2 at (5, 3) is inside block 1, which is solid on every side',
      'The hero comes in at (3, 3) with his feet inside block 1, which is solid on every side',
    ]);
    // a wall that animates open (a held start) is fine
    const bbl = parseBlocks(t.files.get('test.bbl')!, BACKBL);
    Object.assign(bbl[1], { nextBl: 0, ntime: 40 });
    t.files.set('test.bbl', serializeBlocks(bbl));
    expect(solidLinks(t.game, sceneOf(t))).toEqual([]);
  });

  it('finds links and landings off the map', () => {
    const t = testGame(ROWS);
    t.game.scenes[2].links[1] = { toScene: 1, from: { x: 100, y: 2 }, to: { x: 0, y: 0 } };
    t.game.scenes[0].links[0].to = { x: 3, y: 100 };
    expect(offMap(t.game, sceneOf(t)).map((x) => x.severity)).toEqual(['error', 'warning']);
  });

  it('finds a game no chain of links can win', () => {
    const t = testGame(ROWS);
    expect(wonRoute(t.game, scenesOf(t.game, t))).toEqual([]);
    t.game.scenes[2].links[0].toScene = 2;
    expect(wonRoute(t.game, scenesOf(t.game, t)).map((x) => x.check)).toEqual(['won-route']);
    // a way to the end hidden under an earlier link on its cell doesn't count
    t.game.scenes[2].links[1] = { toScene: 1, from: { ...t.game.scenes[2].links[0].from }, to: { x: 0, y: 0 } };
    expect(wonRoute(t.game, scenesOf(t.game, t))).toHaveLength(1);
    t.game.scenes[2].links[0].toScene = NOSCENE;
    expect(wonRoute(t.game, scenesOf(t.game, t))).toEqual([]);
  });
});

describe('the missing-part checks', () => {
  it('finds sound slots whose .VOC isn’t there, once per sound set', () => {
    const t = testGame(ROWS);
    t.game.scenes[2].files[7] = 'test.snd';
    const snd = newSoundSet();
    snd.digital[1] = 'BOOM';
    snd.digital[2] = 'here';
    t.files.set('here.voc', new Uint8Array(30));
    const d = { ...sceneOf(t), sounds: snd, names: { ...sceneOf(t).names, snd: 'test.snd' } };
    const f = missingVocs(d, t);
    expect(f).toHaveLength(1);
    expect(f[0].detail).toContain('BOOM.VOC');
    expect(f[0].detail).not.toContain('HERE');
  });

  it('finds files a level needs that aren’t there', () => {
    const t = testGame(ROWS);
    t.game.scenes[2].files[3] = 'gone.mon';
    expect(missingFiles(t.game, t, scenesOf(t.game, t)).map((x) => x.title)).toEqual(['Level names gone.mon, which isn’t in the game']);
  });

  it('finds blocks past the set, counters past 29 and monsters from empty slots', () => {
    const t = testGame(ROWS);
    const map = t.files.get('test.map')!;
    map[(1 * 100 + 5) * 2] = 200;
    const d = sceneOf(t);
    d.bbl[0].effect = 163;
    d.bbl[0].eamt = 1;
    d.mon.push(...Array.from({ length: 64 }, emptyMonster));
    d.map.monsters[0] = { ...d.map.monsters[0], monnum: 7, curx: 4, cury: 1 };
    const f = outOfRange(d);
    expect(f.map((x) => x.severity)).toEqual(['error', 'error', 'warning']);
    expect(f[0].title).toContain('past 149');
    expect(f[1].title).toBe('Block 0 changes counter 163, and the counters stop at 29');
    expect(f[2].title).toContain('Monster 7');
    // a map cell past the set breaks no other check
    expect(() => opposites(d)).not.toThrow();
  });

  it('finds moves bigger than PLAYGAME’s 11 pixels a tick', () => {
    const t = testGame(ROWS);
    const d = sceneOf(t);
    expect(speedCap(d)).toEqual([]);
    d.chr.sequences[5].frames[0].x = 24;
    expect(speedCap(d).map((x) => x.check)).toEqual(['speed-cap']);
  });
});

describe('repairs from the archive’s games', () => {
  it('leaves “glide” (gravity every way at once) out of opposites', () => {
    const t = testGame(['##########', '#..ab....#', '#E.S.....#', '##########']);
    const d = sceneOf(t);
    d.bbl[10].grav = 15;
    d.map.blocks[103] = 10;
    d.map.blocks[104] = 10;
    expect(opposites(d)).toEqual([]);
  });

  it('matches a key named by punctuation as itself', () => {
    expect(mentions('Press ( to dive', 0x0a)).toBeTypeOf('boolean');
    for (let scan = 1; scan < 0x59; scan++) expect(() => mentions('text', scan)).not.toThrow();
  });

  it('calls a gate that takes 19 when the map has 18 hopeless', () => {
    const t = testGame(['######################', '#....................#', '#E.S.................#', '######################']);
    const d = sceneOf(t);
    Object.assign(d.bbl[20], { effect: 21, eamt: 1, touchBl: 0 });
    Object.assign(d.bbl[21], { effect: 21, eamt: -19, solid: 15, touchBl: 0 });
    for (let x = 1; x <= 18; x++) d.map.blocks[100 + x] = 20;
    d.map.blocks[220] = 21;
    d.chr.meter[21] = 1;
    expect(counters(d).map((x) => x.severity)).toEqual(['error']);
  });

  it('reports a level whose file is missing, and plays on', async () => {
    const t = testGame(ROWS);
    t.game.scenes[2].files[6] = 'gone.cbl';
    t.files.set('test.gam', serializeGame(t.game));
    const r = await runChecks(new GameFiles([...t.files]), { budgetMs: 200 });
    expect(r.findings.map((f) => f.check)).toEqual(expect.arrayContaining(['missing-file', 'coverage']));
    expect(r.findings.find((f) => f.check === 'coverage')?.title).toBe('The bot couldn’t play Level');
  });
});
