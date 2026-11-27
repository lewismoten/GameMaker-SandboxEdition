// The recording gives the demo until Escape to show Pip's lesson once.
import { expect, it } from 'vitest';
import { recordedDemo } from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';
import { showsLesson } from './demoLesson';

function playback(wait: number, openings: number[]) {
  let ticks = 0;
  const trail = [2];
  return showsLesson(recordedDemo([], wait, 2), {
    trail,
    press() {},
    release() {},
    async tick() {
      if (openings.includes(++ticks)) trail.push(4);
      return undefined;
    },
  });
}

it('counts the tick of Escape and stops before the release delay', async () => {
  expect(await playback(2, [2])).toBe(true);
  expect(await playback(1, [2])).toBe(false);
});

it('requires Pip to open exactly once', async () => {
  expect(await playback(3, [1, 3])).toBe(false);
});
