// Tests: On-screen touch controls (player/touch.ts).
import { describe, expect, it } from 'vitest';
import { padSector, touchLabel, touchLayout } from '../src/player/touch';

describe('touch controls', () => {
  it('maps a thumb on the pad to one of eight directions, with a dead zone', () => {
    expect(padSector(0, 0, 80)).toBeUndefined();
    expect(padSector(10, 5, 80)).toBeUndefined();
    expect(padSector(70, 0, 80)).toBe(0);
    expect(padSector(-70, 3, 80)).toBe(4);
    expect(padSector(-70, -3, 80)).toBe(4);
    expect(padSector(0, -70, 80)).toBe(-2);
    expect(padSector(0, 70, 80)).toBe(2);
    expect(padSector(50, -50, 80)).toBe(-1);
    expect(padSector(-50, 50, 80)).toBe(3);
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
