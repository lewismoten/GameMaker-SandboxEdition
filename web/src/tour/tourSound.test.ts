// A pending clip must follow the tour controls even when its offline check or media load finishes late.
import { afterEach, expect, it, vi } from 'vitest';
import { TourSound } from './tourSound';
import { availableOffline } from '../offline/availability';

vi.mock('../offline/availability', () => ({ availableOffline: vi.fn(async () => true) }));
vi.mock('@lewismoten/gamemaker-sandbox-engine/audio/engine', () => ({
  AudioEngine: class {
    stopAll() {}
    dispose() {}
  },
}));
vi.mock('@lewismoten/gamemaker-sandbox-engine/audio/mix', () => ({ channelGain: () => 1, onMix: () => () => {} }));

afterEach(() => vi.unstubAllGlobals());

it('keeps a ready voice silent while paused and resumes the same clip', async () => {
  const play = vi.fn(async () => {});
  const pause = vi.fn();
  class Clip extends EventTarget {
    play = play;
    pause = pause;
    duration = 2;
    removeAttribute() {}
    set src(_url: string) {
      this.dispatchEvent(new Event('canplaythrough'));
    }
  }
  vi.stubGlobal('Audio', Clip);
  const sound = new TourSound();
  const duration = sound.speak('line.ogg');
  sound.pause(true);
  expect(await duration).toBe(2300);
  expect(play).not.toHaveBeenCalled();
  sound.pause(false);
  expect(play).toHaveBeenCalledTimes(1);
  sound.pause(true);
  expect(pause).toHaveBeenCalledOnce();
  sound.set(false);
  sound.pause(false);
  expect(play).toHaveBeenCalledTimes(1);
  sound.dispose();
});

it('drops a pending voice when muted before availability resolves', async () => {
  let finish!: (available: boolean) => void;
  vi.mocked(availableOffline).mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const sound = new TourSound();
  const duration = sound.speak('line.ogg');
  sound.set(false);
  finish(true);
  expect(await duration).toBe(0);
  sound.dispose();
});
