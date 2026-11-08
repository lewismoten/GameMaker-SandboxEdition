// Speech is sampled, never queued: terminal outcomes bypass the progress interval.
import { describe, expect, it } from 'vitest';
import { progressAnnouncements } from './progressAnnouncements';

describe('progress announcements', () => {
  it('bounds changing progress, skips unchanged text, and delivers terminal outcomes at once', () => {
    let now = 0;
    const messages: string[] = [];
    const speech = progressAnnouncements(
      (t) => messages.push(t),
      5000,
      () => now,
    );
    speech.progress('Starting');
    for (let i = 1; i <= 19; i++) {
      now = i * 250;
      speech.progress(`Tried ${i}`);
    }
    expect(messages).toEqual(['Starting']);
    now = 5000;
    speech.progress('Tried 20');
    now = 10000;
    speech.progress('Tried 20');
    expect(messages).toEqual(['Starting', 'Tried 20']);
    speech.finish('Failed');
    speech.progress('Late progress');
    expect(messages.at(-1)).toBe('Failed');
    speech.finish('Stopped');
    expect(messages.at(-1)).toBe('Stopped');
  });
});
