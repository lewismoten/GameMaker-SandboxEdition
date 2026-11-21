import { existsSync, readFileSync } from 'node:fs';
import { parseBlocks, serializeBlocks, BACKBL, SOLTOP } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseSlideList } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { describe, expect, it } from 'vitest';
import { ADVTYPE, ENDTYPE, STARTTYPE, parseGame, serializeGame, type Game, type Scene } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { screensAndSongs } from './sceneSlots';
import { passesThrough } from '../../../project/sceneArrivals';
import { levelCheckNote, roleNote, roleLabel, mapSceneLabels, sceneRole } from './sceneRole';

const link = (fx: number, fy: number, toScene: number, tx = 5, ty = 5) => ({ from: { x: fx, y: fy }, toScene, to: { x: tx, y: ty } });
const scene = (gametype: number, links: ReturnType<typeof link>[] = []) => ({ gametype, files: [], desc: new Uint8Array(), links }) as unknown as Scene;
const game = (scenes: Scene[]) => ({ scenes }) as unknown as Game;

describe('sceneRole', () => {
  // 0 title -> 2 (arrive 5,5); 2 walks to 3 or 4; 3 passes straight to 1; 4 has one exit to 1
  const g = game([
    scene(STARTTYPE, [link(0, 0, 2)]),
    scene(ENDTYPE),
    scene(ADVTYPE, [link(9, 9, 3, 7, 7), link(8, 8, 4, 6, 6)]),
    scene(ADVTYPE, [link(7, 7, 1)]),
    scene(ADVTYPE, [link(9, 9, 1)]),
  ]);
  const entrances = [link(0, 0, 2), link(1, 1, 2, 8, 8)];
  const room = (entries: typeof entrances) => game([scene(STARTTYPE, entries), scene(ENDTYPE), scene(ADVTYPE, [link(5, 5, 1)])]);

  it('requires an exit at every arrival, in either link order', () => {
    for (const entries of [entrances, [...entrances].reverse()]) expect(sceneRole(room(entries), 2)).toBe('level');
    const isolated = game([scene(ADVTYPE, [link(50, 50, 1)]), scene(ENDTYPE)]);
    expect(passesThrough(isolated, [0])).toBe(false);
  });

  it('keeps the Level check note off a room that needs play from one entrance', () => {
    expect(levelCheckNote(room(entrances), 2)).toBe('');
    expect(levelCheckNote(room(entrances.slice(0, 1)), 2)).toContain('leaves at once');
  });
  it('recognizes an arrival on a link that ends play at a missing destination', () => {
    const g = room(entrances.slice(0, 1));
    g.scenes[2].links[0].toScene = 90;
    expect(passesThrough(g, [2])).toBe(true);
  });
  it('counts only destinations outside the scene as ways out', () => {
    const g = room([link(0, 0, 2, 8, 8)]);
    g.scenes[2].links.push(link(8, 8, 2, 5, 5));
    expect(sceneRole(g, 2)).toBe('level');
    expect(roleNote(g, 2)).toBeUndefined();
  });

  it('checks only arrivals inside the selected printable room', () => {
    const g = room(entrances);
    expect(passesThrough(g, [2])).toBe(false);
    expect(passesThrough(g, [2], (at) => at.x === 5)).toBe(true);
  });

  it('names each pattern from the data', () => {
    expect([0, 1, 2, 3, 4].map((i) => sceneRole(g, i))).toEqual(['title', 'ending', 'branch', 'pass', 'level']);
  });
  it('says what it is only when it is not a plain level', () => {
    expect(roleNote(g, 2)).toBe('2 ways out');
    expect(roleNote(g, 3)).toBe('passes through');
    expect(roleNote(g, 4)).toBeUndefined();
    expect(passesThrough(g, [4])).toBe(false);
  });
  it('level-only findings apply to levels and branching rooms', () => {
    expect([2, 3, 4, 0].map((i) => levelCheckNote(g, i))).toEqual(['', expect.stringContaining('leaves at once'), '', '']);
  });
});

// Native files built from games/cutscenes/src/{game,levels,timing}.ts and games/carl/build.ts.
// Root npm ci builds these disks, just as it does for the editor's other game-data checks.
describe('roles from real games', () => {
  const native = (id: string, gam: string) => {
    const get = (name: string) => {
      const path = new URL(`../../../../../games/${id}/disk/${name.toLowerCase()}`, import.meta.url);
      return existsSync(path) ? new Uint8Array(readFileSync(path)) : undefined;
    };
    return { game: parseGame(get(gam)!), files: { get } };
  };
  const cuts = native('cutscenes', 'cuts.gam');
  const carl = native('carl', 'carl.gam');

  it('finds the timed stage and both tales, and keeps the menu room a branch', () => {
    expect([0, 1, 2, 3, 4, 5].map((i) => sceneRole(cuts.game, i, cuts.files))).toEqual(['title', 'ending', 'cutscene', 'branch', 'cutscene', 'cutscene']);
    expect(roleNote(cuts.game, 2, cuts.files)).toBe('cutscene');

    expect(roleLabel(cuts.game, 3, cuts.files)).toBe('3 ways out');
  });

  it('keeps the Bard logo intro in Carl’s title role and its timed level cards in level roles', () => {
    expect(parseSlideList(carl.files.get('title.lst')!).some((s) => s.name.endsWith('.fli') && s.pause === 0)).toBe(true);
    expect(sceneRole(carl.game, 0, carl.files)).toBe('title');
    expect(sceneRole(carl.game, 1, carl.files)).toBe('ending');
    expect(sceneRole(carl.game, 2, carl.files)).toBe('level');
  });

  const changed = (name: string, bytes?: Uint8Array) => ({ get: (file: string) => (file === name ? bytes : cuts.files.get(file)) });
  it('does not guess without map or block data, or from a slide list alone', () => {
    expect(sceneRole(cuts.game, 2)).toBe('level');
    for (const name of ['one.map', 'cuts.bbl']) expect(sceneRole(cuts.game, 2, changed(name))).toBe('level');
    expect(sceneRole(cuts.game, 2, changed('one.map', new Uint8Array()))).toBe('level');
  });

  it('requires finite explicit slide waits, including nested lists', () => {
    for (const text of ['one.gif', 'one.gif 65535', 'one.gif -1', 'one.lst 1', 'missing.gif 1', '']) {
      expect(sceneRole(cuts.game, 2, changed('one.lst', new TextEncoder().encode(text))), text).toBe('level');
    }
    expect(sceneRole(cuts.game, 2, changed('one.lst', new TextEncoder().encode('tale1.lst 1')))).toBe('cutscene');
  });

  it('requires a timed opening along the arrival column, not animated decoration or a permanent floor', () => {
    const blocks = parseBlocks(cuts.files.get('cuts.bbl')!, BACKBL);
    const permanent = structuredClone(blocks);
    for (const b of permanent) b.ntime = 0;
    expect(sceneRole(cuts.game, 2, changed('cuts.bbl', serializeBlocks(permanent)))).toBe('level');
    const loop = structuredClone(blocks);
    // Loop each timed floor back to itself instead of opening.
    loop.forEach((b, i) => {
      if (b.ntime > 0 && b.solid & SOLTOP) b.nextBl = i;
    });
    expect(sceneRole(cuts.game, 2, changed('cuts.bbl', serializeBlocks(loop)))).toBe('level');
    const moved = structuredClone(cuts.game);
    for (const l of moved.scenes[2].links) l.from.x = 90;
    expect(sceneRole(moved, 2, cuts.files)).toBe('level');
  });

  it('keeps an immediate link a pass and checks every entrance', () => {
    const g = structuredClone(cuts.game);
    g.scenes[2].links[0].from = { ...g.scenes[0].links[0].to };
    expect(sceneRole(g, 2, cuts.files)).toBe('pass');
    g.scenes[2].links[0] = structuredClone(cuts.game.scenes[2].links[0]);
    g.scenes[0].links.push(link(0, 0, 2, 90, 90));
    expect(sceneRole(g, 2, cuts.files)).toBe('level');
  });

  it('uses the same short role in the scene screen and music lists', () => {
    const { screens, songs } = screensAndSongs(cuts.game, cuts.files);
    expect(screens.find((s) => s.scene === 2)?.label).toBe('A Scene That Moves · cutscene intro');
    expect(songs.find((s) => s.scene === 3)?.label).toBe('A Menu Room · 3 ways out');
  });

  it('labels shared maps per scene without changing any native bytes', () => {
    const before = serializeGame(cuts.game);
    expect(mapSceneLabels(cuts.game, 'TALE.MAP', cuts.files)).toEqual(['Tale One · cutscene', 'Tale Two · cutscene']);
    expect(mapSceneLabels(cuts.game, 'hall.map', cuts.files)).toContain('A Menu Room · 3 ways out');
    expect(mapSceneLabels(cuts.game, 'missing.map', cuts.files)).toEqual([]);
    expect(serializeGame(cuts.game)).toEqual(before);
  });
});
