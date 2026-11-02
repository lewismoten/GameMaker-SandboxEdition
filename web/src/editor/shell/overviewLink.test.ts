// The Overview's tab names in the address (?tab=).
import { describe, expect, it } from 'vitest';
import { overviewHash, overviewTabFrom } from './overviewLink';

describe('overviewTabFrom', () => {
  it('knows each tab and falls back to Files', () => {
    for (const t of ['controls', 'player', 'tools'] as const) expect(overviewTabFrom(t)).toBe(t);
    expect(overviewTabFrom('nope')).toBe('files');
    expect(overviewTabFrom(undefined)).toBe('files');
  });
  it('keeps the tab in the address', () => {
    expect(overviewHash({ id: 'g' }, 'tools')).toContain('tab=tools');
    expect(overviewHash({ id: 'g' }, 'files')).not.toContain('tab');
  });
});
