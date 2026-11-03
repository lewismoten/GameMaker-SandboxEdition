import { describe, expect, it } from 'vitest';
import { DEFAULT_BUDGET_S, parseArgs, pickGam, sceneLine } from './walkAutoArgs';

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
});
