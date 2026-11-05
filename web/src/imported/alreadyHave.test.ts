// An import of a game already held is recognized by its fingerprint.
import { describe, expect, it } from 'vitest';
import { alreadyHave, heldText } from './alreadyHave';

describe('alreadyHave', () => {
  const notes = { a: { fingerprint: { gam: [1, 2] } }, b: {}, c: { fingerprint: { gam: [9], exe: [5] } } };
  it('finds the game with the same .gam files', () => {
    expect(alreadyHave({ gam: [1, 2], exe: [7] }, notes)).toBe('a');
  });
  it('tells players apart when both are known', () => {
    expect(alreadyHave({ gam: [9], exe: [6] }, notes)).toBeUndefined();
    expect(alreadyHave({ gam: [9], exe: [5] }, notes)).toBe('c');
  });
  it('finds nothing for a new game or a game with no .gam', () => {
    expect(alreadyHave({ gam: [3] }, notes)).toBeUndefined();
    expect(alreadyHave({ gam: [] }, notes)).toBeUndefined();
  });
});

describe('heldText', () => {
  const held = { a: { fingerprint: { gam: [1, 2] } } };
  it('names the game already held', () => {
    expect(heldText({ gam: [1, 2] }, (id) => (id === 'a' ? 'Nebula' : undefined), held)).toBe('Already in your games (Nebula)');
  });
  it('says nothing for a new game or one whose project is gone', () => {
    expect(heldText({ gam: [3] }, () => 'x', held)).toBeUndefined();
    expect(heldText({ gam: [1, 2] }, () => undefined, held)).toBeUndefined();
  });
});
