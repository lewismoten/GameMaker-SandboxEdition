// The level check's checks for every player, from the files (playerChecks.ts, monsterChecks.ts
// startThreat, fliCheck.ts), on the tiny game in testGame.ts.
import { describe, expect, it } from 'vitest';
import { BACKBL, newBlockSet, parseBlocks, serializeBlocks } from '../../../formats/blocks';
import { PICKUPSEQ, parseCharacter, serializeCharacter } from '../../../formats/character';
import { emptyMonster } from '../../../formats/monster';
import { serializeGame } from '../../../formats/game';
import { textBytes } from '../../../formats/binary';
import { GameFiles } from '../../../project/files';
import { scenesOf } from '../sceneData';
import { COIN, RIGHT, testGame, type TestGame } from '../testGame';
import { fliCheck } from './fliCheck';
import { marchReaches, startThreat } from './monsterChecks';
import { lookalike, tapTwice, teachFirst } from './playerChecks';

// prettier-ignore
const ROWS = [
  '##########',
  '#........#',
  '#........#',
  '#E.S..c..#',
  '##########',
];

const sceneOf = (t: TestGame) => scenesOf(t.game, t)[0];

/** Changes the test hero's walk right: `frames` of `dx` pixels, each `pause` ticks. */
function walkRight(t: TestGame, frames: number, dx: number, pause: number[], norepeat = 0, ground = 1): void {
  const chr = parseCharacter(t.files.get('test.chr')!);
  const s = chr.sequences[5];
  s.norepeat = norepeat;
  s.ground = ground;
  for (let i = 0; i < s.frames.length; i++)
    s.frames[i] = i < frames ? { x: dx, y: 0, orient: 0, pic1: 0, pic2: 1, pause: pause[i] ?? 1, extra: new Uint8Array(5) } : { ...s.frames[i], pic2: 51 };
  expect(s.key >> 8).toBe(RIGHT);
  t.files.set('test.chr', serializeCharacter(chr));
}

describe('a tap that moves twice', () => {
  it('finds a whole one-block step whose first frame is shorter than a tap, and leaves a smooth walk alone', () => {
    const t = testGame(ROWS);
    expect(tapTwice(sceneOf(t))).toEqual([]); // 16 px a round: a smooth walk
    walkRight(t, 4, 5, [1, 1, 1, 1]);
    const f = tapTwice(sceneOf(t));
    expect(f).toHaveLength(1);
    expect(f[0].title).toBe('A quick tap of Right / Pad 6 can take two steps, not one: each step (a block) reads a key let go only in its first 0.05 s');
    // a longer last frame doesn't help: the key let go waits for the next first frame
    walkRight(t, 4, 5, [1, 1, 1, 4]);
    expect(tapTwice(sceneOf(t))).toHaveLength(1);
  });

  it('is happy with a long first frame, a step once a press, or a step a key let go stops', () => {
    const t = testGame(ROWS);
    walkRight(t, 4, 5, [5, 1, 1, 1]);
    expect(tapTwice(sceneOf(t))).toEqual([]);
    walkRight(t, 4, 5, [1, 1, 1, 1], 1);
    expect(tapTwice(sceneOf(t))).toEqual([]);
    walkRight(t, 4, 5, [1, 1, 1, 1], 0, 0);
    expect(tapTwice(sceneOf(t))).toEqual([]);
  });
});

describe('scenery that looks collectable', () => {
  it('finds a block drawn like the coin that gives nothing, not the floor the coin lies on', () => {
    const t = testGame(ROWS);
    const bbl = parseBlocks(t.files.get('test.bbl')!, BACKBL);
    // the coin: a yellow square on the air's black
    bbl[COIN].pixels.fill(0);
    for (let y = 6; y < 14; y++) for (let x = 6; x < 14; x++) bbl[COIN].pixels[y * 20 + x] = 14;
    // block 5: the same picture, doing nothing; block 6: plain air with a speck
    Object.assign(bbl[5], { grav: 4, pixels: bbl[COIN].pixels.slice() });
    Object.assign(bbl[6], { grav: 4 });
    bbl[6].pixels[0] = 14;
    t.files.set('test.bbl', serializeBlocks(bbl));
    const map = t.files.get('test.map')!;
    map[(1 * 100 + 5) * 2] = 5;
    map[(1 * 100 + 6) * 2] = 6;
    const f = lookalike(sceneOf(t));
    expect(f.map((x) => x.where.block?.n)).toEqual([5]);
    expect(f[0].title).toBe('Block 5 looks like prize block 2 (points) but does nothing, first at (5, 1)');
    // the same block as a way out (on a link of a scene with this map) does something
    const d = sceneOf(t);
    expect(lookalike(d, [d, { ...d, scene: 9, links: [1 * 100 + 5] }])).toEqual([]);
  });
});

describe('a safe start', () => {
  const withFoe = (place: { x: number; y: number }, march: { x: number; y: number; pic: number }[], towards = 0) => {
    const d = sceneOf(testGame(ROWS));
    const m = emptyMonster();
    m.pic[0] = [0, 1];
    m.towards = towards;
    march.forEach((c, i) => (m.march[0][i] = { ...c, orient: 0 }));
    d.mon = [m];
    d.mbl = newBlockSet('mbl');
    d.mbl[0].chHitPt = -2;
    d.map.monsters = [{ monnum: 0, status: 0, xtra: 0, curx: place.x, cury: place.y, extra: 0 }];
    return d;
  };
  const game = testGame(ROWS).game;

  it('times a walker’s path to the entry', () => {
    const m = emptyMonster();
    m.march[0][0] = { x: -6, y: 0, pic: 4, orient: 0 };
    m.march[0][1] = { x: 0, y: 0, pic: 4, orient: 0 };
    // from (10, 3) toward (4, 3) at 4 px a tick: within a block of (3, 3) after 6 blocks, 30 ticks
    expect(marchReaches(m, { x: 10, y: 3 }, { x: 3, y: 3 }, 100)).toBe(30);
    expect(marchReaches(m, { x: 10, y: 3 }, { x: 3, y: 3 }, 20)).toBeUndefined();
    expect(marchReaches(m, { x: 10, y: 30 }, { x: 3, y: 3 }, 1000)).toBeUndefined();
  });

  it('finds a foe whose path reaches the door within three seconds, and not one that turns back', () => {
    const near = startThreat(
      withFoe({ x: 9, y: 3 }, [
        { x: -6, y: 0, pic: 4 },
        { x: 0, y: 0, pic: 4 },
      ]),
      game,
    );
    expect(near.map((f) => f.title)).toEqual(['Monster 0 walks to where the hero comes in: within 1.4 s']);
    expect(
      startThreat(
        withFoe({ x: 9, y: 3 }, [
          { x: -2, y: 0, pic: 4 },
          { x: 0, y: 0, pic: 4 },
        ]),
        game,
      ),
    ).toEqual([]);
  });

  it('finds a chaser in range, and a block beside the door that hurts', () => {
    expect(startThreat(withFoe({ x: 8, y: 3 }, [], 2), game)[0].title).toMatch(/^Monster 0 chases to where the hero comes in: within/);
    const d = sceneOf(testGame(['##########', '#........#', '#........#', '#E.S^.c..#', '##########']));
    expect(startThreat(d, game).map((f) => f.title)).toEqual(['Block 3 hurts right beside where the hero comes in']);
  });
});

describe('keys taught at the start', () => {
  /** The test game with a pick-up key (G) and a thing to pick up on its map. */
  const withPickup = (help?: string) => {
    const t = testGame(ROWS);
    const chr = parseCharacter(t.files.get('test.chr')!);
    chr.sequences[PICKUPSEQ].key = 0x22 << 8;
    chr.sequences[PICKUPSEQ].frames[0] = { x: 0, y: 0, orient: 0, pic1: 0, pic2: 1, pause: 1, extra: new Uint8Array(5) };
    t.files.set('test.chr', serializeCharacter(chr));
    const bbl = parseBlocks(t.files.get('test.bbl')!, BACKBL);
    bbl[COIN].obj = 1;
    t.files.set('test.bbl', serializeBlocks(bbl));
    if (help) {
      t.game.scenes[0].files[6] = 'help.txt';
      t.files.set('test.gam', serializeGame(t.game));
      t.files.set('help.txt', textBytes(help));
    }
    const files = new GameFiles(t.files);
    return teachFirst(t.game, files, scenesOf(t.game, files));
  };

  it('asks about a pick-up key nothing near the start names', () => {
    const f = withPickup();
    expect(f.map((x) => x.title)).toEqual(['G (pick up) isn’t named at the start of the game']);
  });

  it('is happy when the instructions name it', () => {
    expect(withPickup('Stand on it and press G')).toEqual([]);
  });
});

describe('animations DOS can’t play', () => {
  it('finds an .FLI with an all-black chunk', () => {
    const fli = new Uint8Array(128 + 22);
    const dv = new DataView(fli.buffer);
    dv.setUint32(0, fli.length, true);
    dv.setUint16(4, 0xaf11, true);
    dv.setUint16(6, 1, true);
    dv.setUint16(12, 8, true);
    dv.setUint32(128, 22, true);
    dv.setUint16(132, 0xf1fa, true);
    dv.setUint16(134, 1, true);
    dv.setUint32(144, 6, true);
    dv.setUint16(148, 13, true);
    const f = fliCheck(new GameFiles([['intro.fli', fli]]));
    expect(f.map((x) => x.title)).toEqual(['intro.fli can’t play right in real DOS: an all-black chunk in its first frame (PLAYGAME crashes on it)']);
    expect(f[0].where.file).toBe('intro.fli');
  });
});
