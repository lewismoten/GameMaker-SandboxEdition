// Exercise capture sizing across the real level loop, F2 status, return and exit fade.
import { afterEach, expect, it, vi } from 'vitest';
import { Machine } from '@lewismoten/gamemaker-sandbox-engine/engine/machine';
import { runGame } from '@lewismoten/gamemaker-sandbox-engine/engine/game';
import { GameFiles } from '../project/files';
import { testGame } from '../editor/check/testGame';
import { headlessCanvas, WalkAudio } from '../walkthrough/runtime';
import { snapshotPicture } from './snapshot';

class SteppedMachine extends Machine {
  time = 0;
  override now(): number {
    return this.time;
  }
}
afterEach(() => vi.useRealTimers());

it('tracks DOS crop through gameplay, status, resumed gameplay and the menu', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  const t = testGame(['##########', '#S......E#', '##########']);
  const m = new SteppedMachine(headlessCanvas(), new GameFiles(t.files), new WalkAudio(), { frames: 'manual', input: false });
  let phase: 'start' | 'status' | 'resume' | 'exit' | 'done' = 'start';
  const currentPhase = (): string => phase;
  let sawStatus = false;
  const sizes: number[][] = [];
  const capture = () => {
    const p = snapshotPicture(m.screen);
    sizes.push([p.width, p.height]);
  };
  capture();
  const ended = runGame(m, 'test.gam', {
    skipTitle: true,
    onFrame: (w) => {
      expect(m.screen.sceneNumber).toBe(2);
      if (phase === 'start') {
        capture();
        phase = 'status';
        w.keydn[60] = 1;
      } else if (phase === 'resume') {
        capture();
        phase = 'exit';
        w.keydn[1] = 1;
      }
    },
  }).catch((e: unknown) => {
    if (!m.aborted) throw e;
  });
  try {
    for (let i = 0; i < 600 && currentPhase() !== 'done'; i++) {
      m.time += 1000 / 60;
      m.presentFrame(false);
      await vi.advanceTimersByTimeAsync(0);
      if (currentPhase() === 'status' && !m.screen.dosCropped) {
        capture();
        sawStatus = true;
        phase = 'resume';
        m.keyboard.inject(1, true);
        m.keyboard.inject(1, false);
      } else if (currentPhase() === 'exit' && !m.screen.dosCropped) {
        capture();
        phase = 'done';
      }
    }
    expect(sawStatus).toBe(true);
    expect(phase).toBe('done');
    expect(sizes).toEqual([
      [320, 200],
      [312, 196],
      [320, 200],
      [312, 196],
      [320, 200],
    ]);
  } finally {
    m.destroy();
    await ended;
  }
});
