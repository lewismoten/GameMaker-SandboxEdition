import { describe, expect, it } from 'vitest';
import type { Walkthrough } from '../src/walkthrough/format';
import { DEFAULT_BUDGET_S, parseArgs, pickGam, sceneLine, walkOutput } from './walkAutoArgs';

describe('walk:auto arguments', () => {
  it('defaults to the editor budget', () => {
    expect(parseArgs(['g.zip'])).toEqual({ source: 'g.zip', budgetMs: DEFAULT_BUDGET_S * 1000, game: undefined, out: undefined });
  });
  it('reads options and rejects mistakes', () => {
    expect(parseArgs(['d', '--budget', '5000', '--game', 'A.GAM', '--out', 'w.json'])).toEqual({ source: 'd', budgetMs: 5000, game: 'A.GAM', out: 'w.json' });
    expect(parseArgs([])).toMatch(/Usage/);
    expect(parseArgs(['d', '--budget'])).toMatch(/needs a value/);
    expect(parseArgs(['d', '--budget', 'x'])).toMatch(/milliseconds/);
    expect(parseArgs(['d', '--wat'])).toMatch(/Unknown/);
    expect(parseArgs(['a', 'b'])).toMatch(/Unexpected/);
  });
  it('reads --basic-keys, the keyboard accessibility run', () => {
    expect(parseArgs(['d', '--basic-keys'])).toMatchObject({ source: 'd', basicKeys: true });
    expect(parseArgs(['d'])).not.toHaveProperty('basicKeys');
  });
});

describe('pickGam', () => {
  it('takes the only game, asks when several, matches --game', () => {
    expect(pickGam(['A.GAM', 'a.bbl'])).toEqual({ gam: 'A.GAM' });
    expect(pickGam(['a.gam', 'b.gam'])).toMatchObject({ error: expect.stringContaining('--game') });
    expect(pickGam(['a.gam', 'b.gam'], 'B')).toEqual({ gam: 'b.gam' });
    expect(pickGam(['a.gam'], 'z.gam')).toHaveProperty('error');
    expect(pickGam(['x.bbl'])).toHaveProperty('error');
  });
});

describe('sceneLine', () => {
  it('shows a stop', () => {
    expect(sceneLine({ scene: 3, name: 'Cave', tried: ['runner', 'search'] }, (i) => i)).toMatch(/runner > search.*STOPPED/);
  });

  it('adds one concise failed-keys diagnostic line', () => {
    expect(
      sceneLine(
        {
          scene: 3,
          name: 'Cave',
          tried: ['runner', 'search', 'keys'],
          keys: {
            cutoff: 'no-reachable-state',
            rounds: [
              {
                kind: 'key',
                source: { counter: 20, cell: 301 },
                candidates: [{ counter: 20, cell: 301 }],
                complete: true,
                budgetMs: 1000,
                ms: 10,
                places: 12,
                nearestGoalDistance: 3,
                exits: 0,
                deaths: 0,
                incidents: 0,
                cutoff: 'no-reachable-state',
              },
            ],
          },
        },
        (i) => i,
      ),
    ).toMatch(/\n\s*keys: no-reachable-state \(key c20 @ 301; 12 places\)$/);
  });
});

describe('walk:auto output', () => {
  it('keeps the walkthrough shape and serializes failed-keys diagnostics', () => {
    const walk = {
      version: 1,
      game: 'test',
      rand: { seed: 1, per: 'scene' },
      segments: [],
      chapters: [],
      timeline: { fps: 60, frames: 0, chapters: [] },
    } as Walkthrough;
    const output = JSON.parse(
      JSON.stringify(
        walkOutput(walk, [
          {
            scene: 3,
            name: 'Cave',
            tried: ['keys'],
            keys: { cutoff: 'budget', rounds: [] },
          },
        ]),
      ),
    );
    expect(output).toMatchObject({
      version: 1,
      game: 'test',
      diagnostics: { keys: [{ scene: 3, name: 'Cave', cutoff: 'budget', rounds: [] }] },
    });
  });
});
