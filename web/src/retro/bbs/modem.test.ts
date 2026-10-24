// The dial-up call's timeline: the same dialing for every speed, a handshake of its own after.
import { describe, expect, it } from 'vitest';
import { dialSounds } from './modem';

describe('modem handshakes', () => {
  it('answers at the same moment, and takes longer to connect the faster the modem', () => {
    const at = (s: Parameters<typeof dialSounds>[2]) => dialSounds(undefined, '1-412-555-SAND', s);
    expect(at(300).answer).toBe(at(56000).answer);
    const connects = ([300, 1200, 2400, 14400, 33600, 56000] as const).map((s) => at(s).connect - at(s).answer);
    expect(connects).toEqual([...connects].sort((a, b) => a - b));
    expect(connects[0]).toBeLessThan(3);
    expect(connects.at(-1)).toBeGreaterThan(6);
  });
});
