import { describe, expect, it } from 'vitest';
import { claimMediaFocus, playerHasFocus } from './mediaFocus';

describe('media focus', () => {
  it('a preview takes it from another preview', () => {
    let lost = 0;
    const a = claimMediaFocus('preview', () => lost++);
    const b = claimMediaFocus('preview', () => lost++);
    expect(a && b).toBeTruthy();
    expect(lost).toBe(1);
    b!();
  });

  it('a player stops every preview, and no preview starts until it lets go', () => {
    const stopped: string[] = [];
    claimMediaFocus('preview', () => stopped.push('preview'));
    const release = claimMediaFocus('player', () => stopped.push('player'));
    expect(stopped).toEqual(['preview']);
    expect(playerHasFocus()).toBe(true);
    expect(claimMediaFocus('preview', () => stopped.push('late'))).toBeUndefined();
    release!();
    expect(playerHasFocus()).toBe(false);
    const again = claimMediaFocus('preview', () => undefined);
    expect(again).toBeTruthy();
    again!();
    expect(stopped).toEqual(['preview']);
  });

  it('a player takes it from another player', () => {
    let lost = false;
    claimMediaFocus('player', () => (lost = true));
    const b = claimMediaFocus('player', () => undefined);
    expect(lost).toBe(true);
    b!();
  });
});
