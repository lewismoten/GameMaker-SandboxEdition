// playedOn.ts: what counts as a phone, how a run's hold is tallied through a turn of the
// phone, and which achievements a finished run unlocks.
import { describe, expect, it, vi } from 'vitest';

const unlocked: string[] = [];
vi.mock('./store', () => ({ unlockAchievement: (id: string) => unlocked.push(id) }));

import { finishedIn, RunWatch } from './playedOn';
import { holdOf, type Hold } from '../phoneScreen';

describe('holdOf', () => {
  it('takes a touch screen with a narrow side as a phone, wide or tall', () => {
    expect(holdOf(390, 844, true)).toBe('tall');
    expect(holdOf(844, 390, true)).toBe('wide');
  });
  it('takes a tablet, a mouse or a narrow desktop window as no phone', () => {
    expect(holdOf(820, 1180, true)).toBe('off');
    expect(holdOf(390, 844, false)).toBe('off');
  });
});

/** A watch on a made-up clock, held as `hold` says. */
function watch() {
  let t = 0;
  let hold: Hold = 'tall';
  const w = new RunWatch(
    () => t,
    () => hold,
  );
  return { w, at: (ms: number, h: Hold) => ((t = ms), (hold = h), w.note()), end: (ms: number) => ((t = ms), w.held()) };
}

describe('RunWatch', () => {
  it('counts a run held one way all along', () => {
    const { end } = watch();
    expect(end(60_000)).toBe('tall');
  });

  it('counts the way it was held for most of the run, through a turn', () => {
    const { at, end } = watch();
    at(10_000, 'wide'); // 10 s upright, then turned
    expect(end(40_000)).toBe('wide'); // 30 s sideways
  });

  it('turning back and forth adds up each stretch', () => {
    const { at, end } = watch();
    at(20_000, 'wide');
    at(30_000, 'tall');
    at(35_000, 'wide');
    expect(end(40_000)).toBe('tall'); // 25 s upright against 15 s sideways
  });

  it('counts no phone when it was mostly played off one', () => {
    const { at, end } = watch();
    at(5_000, 'off');
    expect(end(60_000)).toBeUndefined();
  });
});

describe('finishedIn', () => {
  it('unlocks the view’s finish, and the phone’s hold when there was one', () => {
    unlocked.length = 0;
    finishedIn('dos', 'wide');
    finishedIn('web', undefined);
    finishedIn('desk', 'tall');
    expect(unlocked).toEqual(['finish-dos', 'finish-phone-wide', 'finish-web', 'finish-desk', 'finish-phone-tall']);
  });
});
