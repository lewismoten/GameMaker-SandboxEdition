// Drive segment boundaries with deterministic ticks and record every applied key.
import { expect, it, vi } from 'vitest';
import { encodeKeys, type Walkthrough } from '../src/walkthrough/format';
import { measureCyd } from './cydReplay';

const inputs: number[][] = [];
vi.mock('@lewismoten/gamemaker-sandbox-tools/kit/gameSim', () => ({
  TICKS_PER_SECOND: 18,
  GameSim: class {
    scene = 2;
    ended = '';
    clock = 0;
    game = { scenes: [{}, {}, { files: [] }] };
    isHeld() {
      return false;
    }
    press(key: number) {
      inputs.push([this.clock + 1, key]);
    }
    release(key: number) {
      inputs.push([this.clock + 1, key | 128]);
    }
    tick() {
      this.clock++;
      if (this.clock === 5) return 'link';
      if (this.clock === 8) {
        this.ended = 'won';
        return 'end';
      }
    }
  },
}));

const walk: Walkthrough = {
  version: 1,
  game: 'fixture',
  rand: { per: 'scene', seed: 1 },
  chapters: [],
  timeline: { fps: 60, frames: 0, chapters: [] },
  segments: [
    {
      scene: 2,
      keys: encodeKeys([
        { delta: 1, key: 77 },
        { delta: 2, key: 205 },
        { delta: 1, key: 75 },
      ]),
    },
    { scene: 2, keys: encodeKeys([{ delta: 1, key: 57 }]) },
  ],
};

it('applies every first-segment input before restarting the same scene', async () => {
  inputs.length = 0;
  await measureCyd(new Map(), walk, new Set());
  expect(inputs).toEqual([
    [1, 77],
    [3, 205],
    [4, 75],
    [6, 57],
  ]);
});
