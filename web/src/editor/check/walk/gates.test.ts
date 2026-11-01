// What adds to a door's counter: monsters that turn into a pickup, blocks that turn into a key
// (maybe for a price), and other scenes, in small worlds built in memory.
import { describe, expect, it } from 'vitest';
import { newBlockSet, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { emptyScene, ADVTYPE } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { MLEN, newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { emptyMonster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { createWorld, type World } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { testGame } from '../testGame';
import { blockChainAdds, lockedWhy, locksOf, monsterAdds } from './gates';
import { otherScenesAdding } from './otherScenes';

const DOOR = 5;
const DOOR_AT = 3 * MLEN + 10;

/** A world with a door at (10, 3) that takes 1 from counter 20, and a hero holding none. */
function doorWorld(): World {
  const w = createWorld(newMap(), { play: () => false });
  Object.assign(w.bg[DOOR], { solid: 15, effect: 20, eamt: -1, touchBl: 0 });
  w.map[DOOR_AT] = DOOR;
  w.ci.meter[20] = 1;
  return w;
}

/** Puts monster `n` live in slot 0 at (x, y). */
function liveMonster(w: World, n: number, x: number, y: number): void {
  w.mm[0] = { monnum: n, curx: x, cury: y };
  w.mi[0].curx = [x, 0];
  w.mi[0].cury = [y, 0];
}

/** Monsters 0..k-1, each turning into the next; the last one's picture adds 1 to counter 20. */
function chainOf(w: World, k: number): void {
  w.mon = Array.from({ length: k }, (_, i) => ({ ...emptyMonster(), newmon: i + 1 < k ? i + 1 : 64 }));
  Object.assign(w.mblk[7], { effect: 20, eamt: 1 });
  w.mon[k - 1].pic[0] = [7, 1];
}

describe('what adds to a door', () => {
  it('nothing: the counter is missing', () => {
    const l = locksOf(doorWorld());
    expect([...l.missing]).toEqual([20]);
    expect(lockedWhy(l)).toBe('The door at (10, 3) needs counter 20: nothing in this scene adds to it.');
  });

  it('a live monster that turns into a pickup when it dies', () => {
    const w = doorWorld();
    chainOf(w, 3);
    liveMonster(w, 0, 4, 3);
    expect([...monsterAdds(w, 0)]).toEqual([20]);
    const l = locksOf(w);
    expect([...l.wanted]).toEqual([20]);
    expect(l.missing.size).toBe(0);
    expect(l.sources).toEqual([{ cell: 3 * MLEN + 4, counter: 20, monster: true }]);
  });

  it('a monster chain that loops ends', () => {
    const w = doorWorld();
    w.mon = [
      { ...emptyMonster(), newmon: 1 },
      { ...emptyMonster(), newmon: 0 },
    ];
    expect(monsterAdds(w, 0).size).toBe(0);
    liveMonster(w, 0, 4, 3);
    expect([...locksOf(w).missing]).toEqual([20]);
  });

  it('a block that births a monster that turns into a pickup', () => {
    const w = doorWorld();
    chainOf(w, 2);
    Object.assign(w.bg[9], { birthMon: 0, birthTime: 20 });
    w.map[3 * MLEN + 2] = 9;
    const l = locksOf(w);
    expect(l.sources).toEqual([{ cell: 3 * MLEN + 2, counter: 20, monster: true }]);
  });

  it('a block that turns into the key when touched or in time', () => {
    const w = doorWorld();
    Object.assign(w.bg[4], { effect: 20, eamt: 1 });
    Object.assign(w.bg[8], { touchBl: 4 });
    Object.assign(w.bg[9], { nextBl: 8, ntime: 5 });
    w.map[3 * MLEN + 2] = 9;
    expect(blockChainAdds(w.bg, 9)).toEqual(new Map([[20, []]]));
    const l = locksOf(w);
    expect(l.sources).toEqual([{ cell: 3 * MLEN + 2, counter: 20 }]);
    expect(l.owed.get(3)).toBeUndefined();
  });

  it('a block chain that loops ends', () => {
    const w = doorWorld();
    Object.assign(w.bg[8], { touchBl: 9 });
    Object.assign(w.bg[9], { touchBl: 8 });
    w.map[3 * MLEN + 2] = 8;
    expect(blockChainAdds(w.bg, 8).size).toBe(0);
    expect([...locksOf(w).missing]).toEqual([20]);
  });

  it('a key bought with money: the price is owed too', () => {
    const w = doorWorld();
    Object.assign(w.bg[4], { effect: 20, eamt: 1 });
    Object.assign(w.bg[8], { effect: 3, eamt: -500, touchBl: 4 });
    w.map[3 * MLEN + 2] = 8;
    w.ci.meter[3] = 1001;
    const l = locksOf(w);
    expect(l.sources).toEqual([{ cell: 3 * MLEN + 2, counter: 20, price: [{ counter: 3, takes: 500 }] }]);
    expect(l.owed.get(3)).toBe(500);
    expect([...l.wanted]).toEqual([20]);
    expect(l.missing.size).toBe(0);
  });

  it('a key the hero cannot afford, with nothing that adds money', () => {
    const w = doorWorld();
    Object.assign(w.bg[4], { effect: 20, eamt: 1 });
    Object.assign(w.bg[8], { effect: 3, eamt: -500, touchBl: 4 });
    w.map[3 * MLEN + 2] = 8;
    w.ci.meter[3] = 100;
    const l = locksOf(w);
    expect([...l.missing]).toEqual([3]);
    expect(l.buys.get(3)).toBe(20);
    expect(lockedWhy(l)).toBe('The door at (10, 3) needs counter 20, and its key costs money: nothing in this scene adds to it.');
  });

  it('a key bought with money that a coin on the map adds', () => {
    const w = doorWorld();
    Object.assign(w.bg[4], { effect: 20, eamt: 1 });
    Object.assign(w.bg[8], { effect: 3, eamt: -500, touchBl: 4 });
    Object.assign(w.bg[6], { effect: 3, eamt: 1000 });
    w.map[3 * MLEN + 2] = 8;
    w.map[3 * MLEN + 1] = 6;
    w.ci.meter[3] = 100;
    const l = locksOf(w);
    expect(l.missing.size).toBe(0);
    expect([...l.wanted].sort()).toEqual([20, 3]);
  });
});

describe('another scene adds to it', () => {
  /** testGame's level with the door and no key, plus a second level "Cave" whose map holds the key. */
  function twoScenes() {
    const t = testGame(['#####', '#S.E#', '#####']);
    const bbl = newBlockSet('bbl');
    Object.assign(bbl[4], { effect: 20, eamt: 1 });
    const map = newMap();
    map.blocks[MLEN + 1] = 4;
    t.files.set('cave.bbl', serializeBlocks(bbl));
    t.files.set('cave.map', serializeMap(map));
    const cave = emptyScene(ADVTYPE);
    cave.desc = 'Cave';
    cave.files = ['', 'cave.map', 'cave.bbl', '', '', 'test.chr', 'test.cbl', ...new Array(13).fill('')];
    t.game.scenes.push(cave);
    return t;
  }

  it('names the scenes that add to the counter', () => {
    const t = twoScenes();
    expect(otherScenesAdding(t.game, t, 2, [20])).toEqual(new Map([[20, ['Cave (scene 3)']]]));
    expect(otherScenesAdding(t.game, t, 3, [20]).size).toBe(0);
    expect(otherScenesAdding(t.game, t, 2, [21]).size).toBe(0);
  });

  it('words it as a suggestion', () => {
    const why = lockedWhy(locksOf(doorWorld()), new Set(), new Map([[20, ['Cave', 'Pit', 'Lake', 'Top']]]))!;
    expect(why).toContain('needs counter 20: another scene adds to it: Cave, Pit, Lake (and 1 more).');
    expect(why).toContain('dismiss this');
    expect(why).not.toContain('nothing in this scene');
  });
});
