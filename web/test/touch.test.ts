// Tests: On-screen touch controls (player/touch.ts).
import { describe, expect, it } from 'vitest';
import { padKeys, touchLabel, touchLayout } from '../src/player/touch';

describe('touch controls', () => {
  it('maps a thumb on the pad to arrow keys, with diagonals and a dead zone', () => {
    expect(padKeys(0, 0, 80)).toEqual([]);
    expect(padKeys(10, 5, 80)).toEqual([]);
    expect(padKeys(70, 0, 80)).toEqual([77]);
    expect(padKeys(-70, 3, 80)).toEqual([75]);
    expect(padKeys(0, -70, 80)).toEqual([72]);
    expect(padKeys(0, 70, 80)).toEqual([80]);
    expect(padKeys(50, -50, 80)).toEqual([72, 77]);
    expect(padKeys(-50, 50, 80)).toEqual([80, 75]);
  });

  it('picks the layout from the player shape', () => {
    expect(touchLayout(390, 844)).toBe('portrait');
    expect(touchLayout(844, 390)).toBe('landscape');
    expect(touchLayout(800, 800)).toBe('portrait');
  });

  it('labels keys briefly', () => {
    expect(touchLabel(57)).toBe('Space');
    expect(touchLabel(76)).toBe('5');
  });
});
