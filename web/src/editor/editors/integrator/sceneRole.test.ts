import { describe, expect, it } from 'vitest';
import { ADVTYPE, ENDTYPE, STARTTYPE, type Game, type Scene } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { passesThrough, playedAsLevel, roleNote, sceneRole } from './sceneRole';

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
  it('names each pattern from the data', () => {
    expect([0, 1, 2, 3, 4].map((i) => sceneRole(g, i))).toEqual(['title', 'ending', 'branch', 'pass', 'level']);
  });
  it('says what it is only when it is not a plain level', () => {
    expect(roleNote(g, 2)).toBe('2 ways out');
    expect(roleNote(g, 3)).toBe('passes through');
    expect(roleNote(g, 4)).toBeUndefined();
    expect(passesThrough(g, 4)).toBe(false);
  });
  it('level-only findings apply to levels and branching rooms', () => {
    expect([2, 3, 4, 0].map((i) => playedAsLevel(sceneRole(g, i)))).toEqual([true, false, true, false]);
  });
});
