import { describe, expect, it } from 'vitest';
import { CEREMONIES, DIPLOMA, ceremonyState, highestLevel, isCeremony, needed, stageGames, certificateTitle, ceremonyTitle } from './ceremonies';
import { STARTER_GROUPS, STARTER_ORDER } from './starter';
import { STARTER_HEROES } from './starterHeroes';

const basics = () => stageGames(CEREMONIES[0]);

describe('ceremonies', () => {
  it('names things as designed', () => {
    expect(ceremonyTitle(CEREMONIES[0])).toBe('Graduation: First Steps');
    expect(certificateTitle(CEREMONIES[0])).toBe('Certificate of First Steps');
    expect(ceremonyTitle(DIPLOMA)).toBe('The Sandbox Diploma');
  });
  it('every stage names real groups, and each group is in exactly one stage', () => {
    const names = STARTER_GROUPS.map((g) => g.name);
    const used = CEREMONIES.flatMap((c) => c.groups);
    for (const g of used) expect(names).toContain(g);
    expect(new Set(used).size).toBe(used.length);
  });
  it('needs at least three of every four, rounded up', () => {
    for (const c of CEREMONIES) expect(needed(c)).toBe(Math.ceil(stageGames(c).length * 0.75));
    expect(needed(CEREMONIES[0])).toBe(Math.ceil(basics().length * 0.75));
  });
  it('is locked with progress, opens at the threshold, and is earned once its id is finished', () => {
    const c = CEREMONIES[0];
    const need = needed(c);
    const locked = ceremonyState(c, new Set(basics().slice(0, need - 1)));
    expect(locked.state).toBe('locked');
    if (locked.state === 'locked') {
      expect(locked.progress).toBe(`${need - 1} of ${need} needed`);
      expect(locked.missing.length).toBe(basics().length - (need - 1));
    }
    expect(ceremonyState(c, new Set(basics().slice(0, need))).state).toBe('open');
    expect(ceremonyState(c, new Set([c.id])).state).toBe('earned');
  });
  it("one stage's graduation does not unlock another", () => {
    expect(ceremonyState(CEREMONIES[1], new Set([CEREMONIES[0].id])).state).toBe('locked');
  });
  it('the diploma needs all six certificates', () => {
    const s = ceremonyState(DIPLOMA, new Set(CEREMONIES.slice(0, 5).map((c) => c.id)));
    expect(s.state).toBe('locked');
    if (s.state === 'locked') expect(s.progress).toBe('5 of 6 needed');
    expect(ceremonyState(DIPLOMA, new Set(CEREMONIES.map((c) => c.id))).state).toBe('open');
    expect(ceremonyState(DIPLOMA, new Set([DIPLOMA.id])).state).toBe('earned');
  });
  it('levels follow the number of certificates', () => {
    const ids = CEREMONIES.map((c) => c.id);
    expect(highestLevel(new Set())).toBeUndefined();
    expect(highestLevel(new Set(basics()))).toBeUndefined();
    const lv = (n: number) => highestLevel(new Set(ids.slice(0, n)));
    expect([1, 2, 3, 4, 5, 6].map(lv)).toEqual(['Beginner', 'Beginner', 'Maker', 'Maker', 'Designer', 'Master']);
    expect(highestLevel(new Set([...ids, DIPLOMA.id]))).toBe('Graduate');
  });
  it('graduations stay out of the Starter groups, order and heroes', () => {
    for (const c of [...CEREMONIES, DIPLOMA]) {
      expect(isCeremony(c.id)).toBe(true);
      expect(STARTER_ORDER).not.toContain(c.id);
      expect(STARTER_HEROES[c.id]).toBeUndefined();
    }
    expect(isCeremony('first-steps')).toBe(false);
  });
});
