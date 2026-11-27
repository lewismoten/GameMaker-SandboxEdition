// The view check's edge rule (games/kit/viewCheck.ts): PLAYGAME draws a monster only when its map cell is inside 1..300 by 1..180.
import { describe, expect, it, vi } from 'vitest';
import { newMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { emptyMonster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { createWorld } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import type { replay } from '../../games/kit/walkthrough';
import { edgesHiding, hiddenMonstersOfGame } from '../../games/kit/viewCheck';

describe('edgesHiding', () => {
  it('is null for a monster that is drawn', () => {
    expect(edgesHiding(100, 100, 100, 100)).toBeNull();
  });
  it('names the left edge for a cell in the left column whose sprite is in view', () => {
    expect(edgesHiding(0, 60, 6, 60)).toEqual(['left']);
  });
  it('names the top edge for a cell in the top row', () => {
    expect(edgesHiding(100, 0, 100, 8)).toEqual(['top']);
  });
  it('names the right edge past the bound', () => {
    expect(edgesHiding(310, 60, 310, 60)).toEqual(['right']);
  });
  it('is null when the sprite is mostly off screen (it is meant to be out of view)', () => {
    expect(edgesHiding(-20, 60, -15, 60)).toBeNull();
  });
});

describe('hiddenMonstersOfGame', () => {
  it('has nothing to report for a game without a walkthrough', async () => {
    expect(await hiddenMonstersOfGame('no-such-game')).toEqual([]);
  });
});

const { replayFrames } = vi.hoisted(() => ({ replayFrames: vi.fn<(...args: Parameters<typeof replay>) => void>() }));
vi.mock('../../games/kit/walkthrough', () => ({ replay: replayFrames }));
vi.mock('node:fs', async (load) => {
  const fs = await load<typeof import('node:fs')>();
  return { ...fs, existsSync: (path: string) => path.endsWith('/and-gate/disk') || fs.existsSync(path) };
});

it('reports the starting cell and pixel position of a moving hidden slot', async () => {
  replayFrames.mockImplementationOnce((_id, _walk, opts) => {
    const world = createWorld(newMap(), { play: () => false }, () => 0.5);
    world.mm[0].monnum = 0;
    world.mon[0] = emptyMonster();
    world.mon[0].pic[0][0] = 0;
    const slot = world.mi[0];
    slot.curPic = 0;
    for (let frame = 1; frame <= 30; frame++) {
      slot.curx = [0, 3 + ((frame - 1) % 10)];
      slot.cury = [2 + Math.floor((frame - 1) / 20), (frame - 1) % 20];
      opts?.onWorld?.(world, 2, frame);
    }
  });
  expect(await hiddenMonstersOfGame('and-gate')).toMatchObject([{ longest: 30, first: { frame: 1, cell: [0, 2], at: [3, 40] } }]);
});
