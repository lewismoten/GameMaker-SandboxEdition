// Same-tick sound requests retain their playback order.
import { expect, it } from 'vitest';
import { SLOT } from '../src/sounds';
import { cutoffGap } from './route';

const fanfare = { slot: SLOT.fanfare, tick: 10 };
const ping = { slot: SLOT.ping, tick: 10 };

it('requires a ping after the fanfare even within one tick', () => {
  expect(cutoffGap([fanfare, ping])).toBe(0);
  expect(() => cutoffGap([ping, fanfare])).toThrow('the jump: heard');
});
