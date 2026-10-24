// Level 11's monsters: the funhouse's jack-in-the-box toys. Each one sits shut, rattles, then
// pops its smiling puppy up on the spring (that bump stings, -7), and drops back in. A WOOF
// latches it shut for good. Two of them keep the other half of the beat.
import { POWER } from '../ids';
import { newBestiary } from './level';
import { jackLatched, jackShut, jackUp } from '../sprites/funhouse';

/** How long a jack stays shut, rattles and stays up, in ticks. */
export const JACK = { shut: 22, rattle: 6, up: 14 };

export function funhouseBeasts() {
  const b = newBestiary();
  b.pic('jackShut', jackShut()).pic('jackRattle', jackShut(true)).pic('jackUp', jackUp(), { hp: -8 }).pic('jackLatched', jackLatched());
  const shut: [string, number] = ['jackShut', JACK.shut];
  const rattle: [string, number] = ['jackRattle', JACK.rattle];
  const up: [string, number] = ['jackUp', JACK.up];
  b.add('jack', { pics: [shut, rattle, up], power: POWER.pest, becomes: 'jackDone', upscore: 25 });
  b.add('jackLate', { pics: [up, shut, rattle], power: POWER.pest, becomes: 'jackDone', upscore: 25 });
  b.add('jackDone', { pics: [['jackLatched', 50]], power: POWER.friend });
  return b;
}
