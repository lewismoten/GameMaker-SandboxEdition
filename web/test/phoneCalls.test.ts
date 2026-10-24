// Tests: who answers the wall phone (desk/room/phone/calls.ts).
import { describe, expect, it } from 'vitest';
import { callFor, dialComplete, localNumber } from '../src/desk/room/phone/calls';
import { keypadDigits } from '../src/retro/bbs/modem';

describe('wall phone numbers', () => {
  it('places a call once the number is complete', () => {
    expect(dialComplete('911')).toBe(true);
    expect(dialComplete('555014')).toBe(false);
    expect(dialComplete('5550148')).toBe(true);
    expect(dialComplete('1412555726')).toBe(false);
    expect(dialComplete('14125557263')).toBe(true);
    expect(dialComplete('412555017')).toBe(false);
    expect(dialComplete('4125550177')).toBe(true);
  });

  it('drops the local area code, keeps 1-800', () => {
    expect(localNumber(keypadDigits('1-412-555-SAND'))).toBe('5557263');
    expect(localNumber('4125550177')).toBe('5550177');
    expect(localNumber('18005550142')).toBe('18005550142');
  });

  it('always does the same thing for a number', () => {
    expect(callFor('5550123')).toBe(callFor('14125550123'));
    expect(callFor('5550177')).toBe(callFor('4125550177'));
  });
});
