// The narration script's parts that need no models: the line checks, which lines get recorded,
// the generated README, and the sample trimming and loudness, on synthetic tones (never a voice).
import { describe, expect, it } from 'vitest';
import { clearestWindow, normalize } from './audio';
import { indexJson, lineProblems, planTakes, refreshPlaces, staleIds, textHash, type Line, type VoiceIndex } from './lineIndex';
import { voiceReadme } from './voiceReadme';

const lines: Line[] = [
  { id: 'home-hello', chapter: 'home', where: 'Home: says hello', text: 'Hello there.' },
  { id: 'home-new', chapter: 'home', where: 'Home: points at New game', text: 'Press New game.' },
  { id: 'editor-tiles', chapter: 'editor', text: 'These are | tiles.' },
];
const recorded = (l: Line, voice = 'v1'): VoiceIndex[string] => ({
  chapter: l.chapter,
  where: l.where ?? '',
  text: l.text,
  seconds: 1.5,
  hash: textHash(l.text),
  voice,
});
const all = (): VoiceIndex => Object.fromEntries(lines.map((l) => [l.id, recorded(l)]));
const there = () => true;

describe('lineProblems', () => {
  it('accepts good lines', () => expect(lineProblems(lines)).toEqual([]));
  it('rejects bad and repeated ids, bad chapters and empty text', () => {
    const p = lineProblems([
      { id: 'Hello', chapter: 'home', text: 'x' },
      { id: 'a b', chapter: 'home', text: 'x' },
      { id: 'ok', chapter: 'Home', text: 'x' },
      { id: 'ok', chapter: 'home', text: ' ' },
    ]);
    expect(p).toHaveLength(5);
    expect(p.join('\n')).toMatch(/repeated/);
  });
  it('rejects a non-array', () => expect(lineProblems({})).toHaveLength(1));
});

describe('planTakes', () => {
  it('skips lines whose words and voice are unchanged', () => expect(planTakes(lines, all(), { voice: 'v1', exists: there })).toEqual([]));
  it('records new, changed, missing and re-voiced lines', () => {
    const index = all();
    delete index['home-hello'];
    index['home-new'].hash = textHash('Press Old game.');
    expect(planTakes(lines, index, { voice: 'v1', exists: there })).toEqual(['home-hello', 'home-new']);
    expect(planTakes(lines, all(), { voice: 'v1', exists: (p) => p !== 'editor/editor-tiles.ogg' })).toEqual(['editor-tiles']);
    expect(planTakes(lines, all(), { voice: 'v2', exists: there })).toHaveLength(3);
  });
  it('records everything with force, and just the asked-for ids with only', () => {
    expect(planTakes(lines, all(), { voice: 'v1', exists: there, force: true })).toHaveLength(3);
    expect(planTakes(lines, all(), { voice: 'v1', exists: there, only: ['home-new'] })).toEqual(['home-new']);
  });
});

describe('the index', () => {
  it('finds stale ids, refreshes places, and writes sorted JSON', () => {
    const index = all();
    index.gone = recorded({ id: 'gone', chapter: 'home', text: 'Bye.' });
    expect(staleIds(lines, index)).toEqual(['gone']);
    refreshPlaces([{ ...lines[0], where: 'Home: moved' }], index);
    expect(index['home-hello'].where).toBe('Home: moved');
    expect(Object.keys(JSON.parse(indexJson(index)))).toEqual(['editor-tiles', 'gone', 'home-hello', 'home-new']);
  });
});

describe('voiceReadme', () => {
  it('lists the clips by chapter in the tour order, marks the unrecorded and escapes pipes', () => {
    const index = all();
    delete index['home-new'];
    const md = voiceReadme(lines, index);
    expect(md).toMatch(/never edit by hand/);
    expect(md.indexOf('## home')).toBeLessThan(md.indexOf('## editor'));
    expect(md).toContain('| [home-hello.ogg](home/home-hello.ogg) | Hello there. | Home: says hello | 1.50 |');
    expect(md).toContain('| home-new.ogg (not recorded) |');
    expect(md).toContain('These are \\| tiles.');
  });
});

describe('sample audio', () => {
  const rate = 1000;
  const tone = (seconds: number, amp: number) => Float32Array.from({ length: seconds * rate }, (_, i) => amp * Math.sin(i * 0.9));
  const join = (...parts: Float32Array[]) => {
    const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
    parts.reduce((at, p) => (out.set(p, at), at + p.length), 0);
    return out;
  };

  it('trims quiet ends and keeps the busiest window of a long clip', () => {
    const clip = join(tone(2, 0), tone(3, 0.5), tone(4, 0.001), tone(12, 0.5), tone(1, 0));
    const kept = clearestWindow(clip, rate, 10);
    expect(kept.length).toBe(10 * rate);
    // the 10 s fall inside the 12 s of speech, not across the near-silent gap
    const loudFrames = Array.from({ length: 200 }, (_, f) => kept.slice(f * 50, f * 50 + 50).some((v) => Math.abs(v) > 0.1));
    expect(loudFrames.every(Boolean)).toBe(true);
    const short = clearestWindow(join(tone(1, 0), tone(3, 0.5), tone(1, 0)), rate, 10);
    expect(short.length).toBeGreaterThanOrEqual(3 * rate);
    expect(short.length).toBeLessThan(3.5 * rate);
  });

  it('brings quiet and loud takes to one level without clipping', () => {
    const level = (x: Float32Array) => Math.sqrt(x.reduce((a, v) => a + v * v, 0) / x.length);
    const quiet = normalize(tone(2, 0.02), rate);
    const loud = normalize(tone(2, 0.9), rate);
    expect(level(quiet)).toBeCloseTo(level(loud), 3);
    expect(Math.max(...loud.map(Math.abs))).toBeLessThanOrEqual(0.89 + 1e-6);
  });
});
