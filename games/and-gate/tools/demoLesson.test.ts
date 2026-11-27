// The lamp must transition after the failed spark, with both dials on and a spark at the lamp.
import { expect, it } from 'vitest';
import { DemoLesson, type LampFrame } from './demoLesson';

const before: LampFrame = { tick: 20, stoppedAt: 10, dialsOn: 2, dialsOff: 0, lamp: true, sparkAtLamp: true, lightVisible: false };
const after: LampFrame = { ...before, tick: 21, lamp: false, lightVisible: true };

it('accepts the spark lighting the lamp followed by a visible light', () => {
  const lesson = new DemoLesson();
  lesson.observe(before);
  lesson.observe(after);
  expect([lesson.litAt, lesson.visibleAt]).toEqual([21, 21]);
});

it('rejects a missing lamp, wrong order, off dial, or absent spark', () => {
  for (const [first, second] of [
    [{ ...before, lamp: false }, after],
    [
      { ...before, stoppedAt: -1 },
      { ...after, stoppedAt: -1 },
    ],
    [{ ...before, dialsOn: 1, dialsOff: 1 }, after],
    [
      { ...before, sparkAtLamp: false },
      { ...after, sparkAtLamp: false },
    ],
  ]) {
    const lesson = new DemoLesson();
    lesson.observe(first);
    lesson.observe(second);
    expect(lesson.litAt).toBe(-1);
    expect(lesson.visibleAt).toBe(-1);
  }
});

it('requires the resulting light to become visible', () => {
  const lesson = new DemoLesson();
  lesson.observe(before);
  lesson.observe({ ...after, lightVisible: false });
  expect(lesson.litAt).toBe(21);
  expect(lesson.visibleAt).toBe(-1);
});
