// Drive A:'s eject button: refused only while the drive's light is on, and then with words that say so.
import { describe, expect, it } from 'vitest';
import { ejectRefusal } from './ejectRule';

describe('ejectRefusal', () => {
  it('lets the disk out when the light is off, whatever is running', () => {
    expect(ejectRefusal(false)).toBeUndefined();
  });

  it('waits while the light is on, and says it is the light', () => {
    expect(ejectRefusal(true)).toMatch(/light/);
    expect(ejectRefusal(true)).not.toMatch(/quit/i);
  });
});
