// THE CHEZ drives by: Lewis's red CitiCar goes past along the street, Doc Leo at the wheel,
// with its motor's whine through the window (audio/chez/; drawn to the kit's side view: ../chezArt.ts). Press
// it for a honk of Doc Leo's bike horn.
import { drawChez } from '../chezArt';
import { roomSound } from '../propSound';
import { chickenWords } from '../../../chicken/chickenWords';
import { turns } from '../propKit';
import { across, STREET, type OutsideEvent } from './outside';

const K = 1.5; // the view's pixels to the kit's unit: 60 x 30, on the street in front of the houses
const HONKS = turns([
  'Honk honk! Doc Leo waves from THE\u00a0CHEZ, Lewis’s red CitiCar. Not a sound from the motor: it’s electric.',
  'Honk honk! THE\u00a0CHEZ hums by at a stately 25 mph, Doc Leo at the wheel, racing stripes and all.',
  '',
]);

export const chez: OutsideEvent = {
  kind: 'chez',
  id: 'desk-chez',
  label: 'THE\u00a0CHEZ driving by, Doc Leo at the wheel and Teddy at the window: honk',
  when: 'day',
  ms: 11_000,
  start: () => roomSound.whirr(11),
  draw(c, p) {
    const x = across(p, 40 * K);
    drawChez(c, x, STREET, K);
    return [x, STREET - 22 * K, 40 * K, 22 * K];
  },
  press() {
    roomSound.honk();
    roomSound.bark('teddy'); // from the passenger window
    // (the third honk names the chicken as she is now)
    return HONKS() || `Honk honk! Doc Leo tips his fedora. ${chickenWords().full} is riding shotgun, buckled in.`;
  },
};
