// Tests: the Sandbox walkthroughs (src/walkthrough): their key encoding, the YouTube chapter
// rules, and every games/<id>/walkthrough.json being well formed with chapters YouTube takes.
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { clock, decodeKeys, encodeKeys, youtubeChapters, youtubeText, type Walkthrough } from '../src/walkthrough/format';
import { SegmentRecorder, seeded } from '../src/walkthrough/runtime';

const gamesDir = join(__dirname, '../../games');
const walkthroughs = readdirSync(gamesDir)
  .filter((id) => existsSync(join(gamesDir, id, 'walkthrough.json')))
  .map((id) => JSON.parse(readFileSync(join(gamesDir, id, 'walkthrough.json'), 'utf8')) as Walkthrough);

describe('walkthrough keys', () => {
  it('round-trip, with gaps past 16 bits', () => {
    const keys = [
      { delta: 0, key: 72 },
      { delta: 127, key: 200 },
      { delta: 128, key: 57 },
      { delta: 70000, key: 185 },
    ];
    expect(decodeKeys(encodeKeys(keys))).toEqual(keys);
  });

  it('play each segment from the tick its scene is entered', () => {
    const walk = { segments: [{ scene: 2, keys: encodeKeys([{ delta: 1, key: 77 }, { delta: 2, key: 205 }]) }, { scene: 4, keys: encodeKeys([{ delta: 3, key: 57 }]) }] } as Walkthrough;
    const r = new SegmentRecorder(walk);
    r.begin();
    r.enterScene(2);
    const ticks = (n: number) => Array.from({ length: n }, () => r.doPlayback());
    expect(ticks(3)).toEqual([[77], [], [205]]);
    // a scene with no segment of its own (passed through) keeps counting the last one
    r.enterScene(9);
    expect(ticks(2)).toEqual([[], []]);
    r.enterScene(4);
    expect(ticks(3)).toEqual([[], [], [57]]);
    expect(r.keysLeft).toBe(0);
  });

  it('seed monsters as the simulators do (games/kit/pixels.ts rng)', () => {
    const a = seeded(1);
    const b = seeded(1);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(a()).toBeGreaterThanOrEqual(0);
  });
});

describe('YouTube chapters', () => {
  it('start at 0:00, run 10 s or more, and fold short ones into the one before', () => {
    const fps = 60;
    const ch = [
      { title: 'Opening', frame: 3 },
      { title: 'Story', frame: 5 * fps },
      { title: 'Level 1', frame: 30 * fps },
      { title: 'Level 2', frame: 36 * fps },
      { title: 'Ending', frame: 100 * fps },
    ];
    const out = youtubeChapters(ch, fps, 105 * fps);
    expect(out.map((c) => c.title)).toEqual(['Opening', 'Level 1']);
    expect(out[0].start).toBe(0);
    expect(youtubeChapters(ch, fps, 200 * fps).map((c) => c.title)).toEqual(['Opening', 'Level 1', 'Ending']);
  });

  it('write times as YouTube does', () => {
    expect(clock(0)).toBe('0:00');
    expect(clock(83.9)).toBe('1:23');
    expect(clock(3725)).toBe('1:02:05');
  });

  it('make a title and a description with the chapter list', () => {
    const t = youtubeText({ gameTitle: 'Test Game', year: 1995, company: 'Sandbox Software', url: 'https://example.com/#/game/cd:test', fps: 60, frames: 60 * 120, chapters: [{ title: 'Opening', frame: 0 }, { title: 'Level 1', frame: 600 }, { title: 'Ending', frame: 6000 }] });
    expect(t.title).toBe('Test Game (1995 DOS, Sandbox Software) — Full Walkthrough, No Commentary');
    expect(t.description).toContain('0:00 Opening\n0:10 Level 1\n1:40 Ending');
    expect(t.description).toContain('Claude Opus 5.5');
    expect(t.description).toContain('https://example.com/#/game/cd:test');
  });
});

describe.each(walkthroughs.map((w) => [w.game, w] as const))('%s walkthrough', (_id, w) => {
  it('is complete and timed', () => {
    expect(w.version).toBe(1);
    expect(w.segments.length).toBeGreaterThan(0);
    for (const s of w.segments) expect(() => decodeKeys(s.keys)).not.toThrow();
    expect(w.timeline.frames).toBeGreaterThan(0);
    expect(w.timeline.chapters[0].frame).toBe(0);
    expect(w.timeline.chapters.map((c) => c.title)).toContain('Ending');
  });

  it('has a chapter list YouTube takes', () => {
    const yt = youtubeChapters(w.timeline.chapters, w.timeline.fps, w.timeline.frames);
    expect(yt.length).toBeGreaterThanOrEqual(3);
    expect(yt[0].start).toBe(0);
    const ends = [...yt.slice(1).map((c) => c.start), w.timeline.frames / w.timeline.fps];
    yt.forEach((c, i) => expect(ends[i] - c.start).toBeGreaterThanOrEqual(10));
  });
});
