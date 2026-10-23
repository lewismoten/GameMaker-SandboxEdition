// The desk's drive-by CHEZ is drawn from a copy of the kit's measurements (the dev server
// can't load games/): keep the two the same.
import { describe, expect, it } from 'vitest';
import * as kit from '../../../../games/kit/chez';
import { CHEZ_AXLE, CHEZ_BODY, CHEZ_POD, CHEZ_WHEELS, CHEZ_WINDOW } from './chezArt';

describe('the drive-by CHEZ', () => {
  it('has the shared side view’s measurements (games/kit/chez.ts)', () => {
    expect(CHEZ_BODY).toEqual(kit.CHEZ_BODY);
    expect(CHEZ_WINDOW).toEqual(kit.CHEZ_WINDOW);
    expect(CHEZ_POD).toEqual(kit.CHEZ_POD);
    expect(CHEZ_WHEELS).toEqual(kit.CHEZ_WHEELS);
    expect(CHEZ_AXLE).toBe(kit.CHEZ_AXLE);
  });
});
