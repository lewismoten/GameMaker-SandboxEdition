import { describe, expect, it } from 'vitest';
import { compareKeys } from '../../games/kit/controlsAuditLogic';

describe('compareKeys', () => {
  it('buttons leave out the pad, Esc, Enter and F keys', () => {
    const r = compareKeys([75, 57], new Set([75, 77]), [75, 57, 1, 28, 59]);
    expect(r.buttons).toEqual([57]);
    expect(r.missing).toEqual([]);
    expect(r.unlisted).toEqual([]);
  });
  it('lists a documented key nothing reaches, and a bound key nobody documents', () => {
    const r = compareKeys([30, 44], new Set([75]), [30, 16]);
    expect(r.missing).toEqual([44]);
    expect(r.unlisted).toEqual([16]);
  });
  it('flags more than six buttons', () => {
    expect(compareKeys([], new Set(), [2, 3, 4, 5, 6, 7, 8]).over6).toBe(true);
  });
});
