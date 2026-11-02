import { describe, expect, it } from 'vitest';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { GameFiles } from '../../project/files';
import { planPack } from './packAll';
import { sceneDelta } from './sceneDelta';

const empty = () => {
  const f = new GameFiles();
  f.set('t.gam', serializeGame(newGame('T')));
  return f;
};

describe('planPack', () => {
  it('has nothing to pack for a game with no sprites', () => {
    expect(planPack(empty(), 't.gam', [])).toBeUndefined();
  });
  it('has nothing to pack when the reservations free nothing', () => {
    expect(planPack(empty(), 't.gam', [{ first: 10, last: 20, role: 'monster' }])).toBeUndefined();
  });
});

describe('sceneDelta', () => {
  it('is zero between a game and its copy', () => {
    const f = empty();
    expect(sceneDelta(f, f.copy(), 't.gam')).toEqual({ mean: 0, worst: 0, changed: 0 });
  });
});
