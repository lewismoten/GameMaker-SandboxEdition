import { describe, expect, it } from 'vitest';
import { viewChanged } from './routeFocus';

describe('route focus rules', () => {
  it('a new page counts, other parts of the same page do not', () => {
    expect(viewChanged('#/', '#/help')).toBe(true);
    expect(viewChanged('#/p/a/x.map', '#/p/b/x.map')).toBe(true);
    expect(viewChanged('#/p/a/x.map?x=1', '#/p/a/x.map?x=2')).toBe(false);
    expect(viewChanged('#/p/a/x.map', '#/p/a/y.gam')).toBe(false);
    expect(viewChanged('#/', '#/?tab=starter')).toBe(false);
  });
});
