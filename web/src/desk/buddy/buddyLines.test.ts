// The desk buddy's reaction rules: who speaks when, how often, and that nothing it says pushes play.
import { describe, expect, it } from 'vitest';
import { adoptStored, FIRST_HELLO, LINE_GAP, LINES, newMind, react } from './buddyLines';

describe('desk buddy reactions', () => {
  it('meets you once, then says hello at most once a day', () => {
    const m = newMind();
    expect(react(m, { kind: 'open', today: '2026-11-07' }, 0)).toEqual({ pose: 'wave', line: FIRST_HELLO });
    expect(m.met).toBe(true);
    expect(react(m, { kind: 'open', today: '2026-11-07' }, 100_000)).toEqual({ pose: 'wave' });
    expect(react(m, { kind: 'open', today: '2026-11-08' }, 200_000)?.line).toBe(LINES.hello[0]);
  });

  it('names the game that starts, and cheers its finish', () => {
    const m = newMind({ met: true });
    expect(react(m, { kind: 'game', title: 'Snowbound' }, 0)?.line).toBe("Snowbound! I'll watch from here.");
    const won = react(m, { kind: 'won', title: 'Snowbound' }, 1000);
    expect(won?.pose).toBe('cheer');
    expect(won?.line).toContain('Snowbound');
  });

  it('keeps quiet through most levels: only every third new one, a minute after it last spoke', () => {
    const m = newMind({ met: true });
    react(m, { kind: 'game', title: 'Depth' }, 0);
    expect(react(m, { kind: 'level', scene: 2 }, 1000)).toEqual({ pose: 'look' });
    expect(react(m, { kind: 'level', scene: 3 }, 70_000)?.line).toBeUndefined();
    expect(react(m, { kind: 'level', scene: 4 }, 71_000)?.line).toBeUndefined();
    expect(react(m, { kind: 'level', scene: 3 }, 72_000)).toBeUndefined(); // seen already
    expect(react(m, { kind: 'level', scene: 5 }, 73_000)?.line).toBeDefined();
    expect(react(m, { kind: 'level', scene: 1 }, 200_000)).toBeUndefined(); // not a level
  });

  it('waits between ordinary lines but not for big moments', () => {
    const m = newMind({ met: true, helloDay: '2026-11-06' });
    expect(react(m, { kind: 'open', today: '2026-11-07' }, 0)?.line).toBeDefined();
    react(m, { kind: 'idle' }, 1000);
    expect(react(m, { kind: 'back' }, 2000)?.line).toBeUndefined();
    expect(react(m, { kind: 'badge', title: 'Mug shot' }, 3000)?.line).toBe('A new badge: Mug shot!');
    react(m, { kind: 'idle' }, 4000);
    expect(react(m, { kind: 'back' }, 4000 + LINE_GAP)?.line).toBeDefined();
  });

  it('dozes when idle, once, and only wakes with a line if it was asleep', () => {
    const m = newMind({ met: true });
    expect(react(m, { kind: 'back' }, 0)).toBeUndefined();
    expect(react(m, { kind: 'idle' }, 0)).toEqual({ pose: 'sleep' });
    expect(react(m, { kind: 'idle' }, 1)).toBeUndefined();
    expect(react(m, { kind: 'back' }, LINE_GAP)?.pose).toBe('wave');
  });

  it('when quiet, still poses but never speaks', () => {
    const m = newMind({ met: false, quiet: true });
    for (const ev of [
      { kind: 'open', today: 'x' },
      { kind: 'game', title: 'T' },
      { kind: 'won', title: 'T' },
      { kind: 'badge', title: 'B' },
      { kind: 'certificate' },
    ] as const)
      expect(react(m, ev, 0)?.line).toBeUndefined();
  });

  it('never pushes play, grades, totals or losing in anything it says', () => {
    const all = [FIRST_HELLO, ...Object.values(LINES).flat()];
    const pushy =
      /\b(should|must|more|try|come back|don't forget|tomorrow|daily|streak|perfect|grade|gpa|4\.0|percent|left|remaining|of \d|hurry|miss(ed)? you|lost|lose|die|died|sad|hungry|lonely)\b|%/i;
    for (const line of all) expect(line, line).not.toMatch(pushy);
    for (const line of all) expect(line.length, line).toBeLessThanOrEqual(60);
  });
});

describe('desk buddy and stored state (FLAGS RESET BUDDY)', () => {
  it('takes all of what was stored, so its next write cannot undo a reset', () => {
    const mind = newMind({ quiet: true, met: true, helloDay: '2026-11-13' });
    const known = { quiet: true, met: true, helloDay: '2026-11-13' };
    expect(adoptStored(mind, known, {})).toBe(true); // FLAGS RESET BUDDY
    expect({ quiet: mind.quiet, met: mind.met, helloDay: mind.helloDay }).toEqual({ quiet: false, met: false, helloDay: undefined });
  });
  it('leaves unsaved memory alone when the store did not change', () => {
    const mind = newMind({ met: false });
    const known = { quiet: false, met: false, helloDay: undefined };
    mind.met = true;
    expect(adoptStored(mind, known, { quiet: false, met: false })).toBe(false);
    expect(mind.met).toBe(true);
  });
});
