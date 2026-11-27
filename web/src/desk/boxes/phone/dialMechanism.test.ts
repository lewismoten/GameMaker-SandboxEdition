// The angle walk reports the switch events observed during a one-pitch dial.
import { expect, it } from 'vitest';
import { walk } from '../../../../../games/year2000/phone/tools/dialMechanism';

it('reports the observed switch results for digit one', () => {
  expect(walk(30)).toEqual({ windPulses: 0, returnPulses: 1, lastPulseFromRestDeg: 17 });
});
