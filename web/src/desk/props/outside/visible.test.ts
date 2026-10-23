import { describe, expect, it } from 'vitest';
import { canSee, type Sight } from './visible';

const page = (over: Partial<Sight> = {}): Sight => ({
  hidden: false,
  rect: { left: 900, top: -80, width: 380, height: 500 },
  view: { width: 1440, height: 900 },
  windowAt: () => true,
  ...over,
});

describe('whether the desk window can be seen', () => {
  it('sees it on the desk with nothing over it', () => expect(canSee(page())).toBe(true));
  it('not with the tab in the background', () => expect(canSee(page({ hidden: true }))).toBe(false));
  it('not when a narrow layout leaves it out', () => expect(canSee(page({ rect: { left: 0, top: 0, width: 0, height: 0 } }))).toBe(false));
  it('not when the desk is gone (today’s web)', () => expect(canSee(page({ rect: undefined }))).toBe(false));
  it('not under a manual, a box or the zoomed monitor', () => expect(canSee(page({ windowAt: () => false }))).toBe(false));
  it('not when it is off the screen', () => expect(canSee(page({ rect: { left: 2000, top: 0, width: 380, height: 500 } }))).toBe(false));
  it('still sees it with part of it covered (the lamp, a bubble)', () => {
    let n = 0;
    expect(canSee(page({ windowAt: () => n++ > 0 }))).toBe(true);
  });
});
