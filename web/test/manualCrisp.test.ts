// Tests: drawing manual screen shots crisp (manual/printables/crisp.ts).
import { describe, expect, it } from 'vitest';
import { crispPlan } from '../src/manual/printables/crisp';

describe('crispPlan: every pixel of a manual screen shot the same size', () => {
  it('snaps a scale just over a whole number down to it, exactly', () => {
    expect(crispPlan(640, 400, 620, 2.1)).toEqual({ devW: 1280, devH: 800, whole: 2, exact: true });
    expect(crispPlan(640, 400, 650, 1)).toEqual({ devW: 640, devH: 400, whole: 1, exact: true });
  });
  it('draws other scales over 1 at the next whole scale, then resamples to the room', () => {
    expect(crispPlan(640, 400, 421, 2)).toEqual({ devW: 842, devH: 526, whole: 2, exact: false });
  });
  it('smoothly reduces when there is less room than pixels', () => {
    expect(crispPlan(640, 400, 421, 1)).toEqual({ devW: 421, devH: 263, whole: 1, exact: false });
  });
});
