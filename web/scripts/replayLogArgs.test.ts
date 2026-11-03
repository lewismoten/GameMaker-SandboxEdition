import { describe, expect, it } from 'vitest';
import { parseArgs, readPlays } from './replayLogArgs';

describe('replay:log arguments', () => {
  it('reads options and defaults frames when --out is given', () => {
    expect(parseArgs(['a.jsonl', '--session', 'x', '--play', '2', '--out', 'o'])).toMatchObject({
      file: 'a.jsonl',
      session: 'x',
      play: 2,
      out: 'o',
      frames: 'snaps',
    });
    expect(parseArgs(['a', '--frames', '40,80'])).toMatchObject({ frames: [40, 80] });
  });
  it('explains a bad command line', () => {
    expect(parseArgs([])).toMatch(/Usage/);
    expect(parseArgs(['a', '--nope'])).toMatch(/Unknown/);
    expect(parseArgs(['a', '--frames', 'x'])).toMatch(/--frames/);
  });
});

describe('readPlays', () => {
  const line = (o: object) => JSON.stringify(o);
  const log = [
    line({ kind: 'key', session: 's1' }),
    line({ kind: 'game-start', session: 's1', play: 1, seed: 7 }),
    line({ kind: 'game-input', session: 's1', play: 1, ev: [1, 75] }),
    line({ kind: 'game-snap', session: 's1', play: 1, clock: 18, scene: 2 }),
    line({ kind: 'game-input', session: 's1', play: 1, ev: [20, 203] }),
    line({ kind: 'game-end', session: 's1', play: 1, how: 'won' }),
    line({ kind: 'game-start', session: 's2', play: 1, seed: 8 }),
    'not json',
  ].join('\n');
  it('groups snapshots, keys and the end by session and play', () => {
    const plays = readPlays(log);
    expect(plays.map((p) => p.session)).toEqual(['s1', 's2']);
    expect(plays[0].input).toEqual([
      { clock: 1, scan: 75 },
      { clock: 20, scan: 203 },
    ]);
    expect(plays[0].snaps).toHaveLength(1);
    expect(plays[0].end?.how).toBe('won');
  });
  it('can pick one session', () => {
    expect(readPlays(log, 's2')).toHaveLength(1);
  });
});
