// THE CHEZ drives by: Lewis's red CitiCar goes past along the street, Doc Leo at the wheel,
// with an electric motor's quiet whirr (drawn to the kit's side view: ../chezArt.ts). Press
// it for a honk of Doc Leo's bike horn.
import { drawChez } from '../chezArt';
import { roomSound } from '../propSound';
import { turns } from '../propKit';
import { across, STREET, type OutsideEvent } from './outside';

const K = 1.5; // the view's pixels to the kit's unit: 60 x 30, on the street in front of the houses
const HONKS = turns([
  'Honk honk! Doc Leo waves from THE\u00a0CHEZ, Lewis’s red CitiCar. Not a sound from the motor: it’s electric.',
  'Honk honk! THE\u00a0CHEZ hums by at a stately 25 mph, Doc Leo at the wheel, racing stripes and all.',
  'Honk honk! Doc Leo tips his fedora. Sir Reginald Cluckington III is riding shotgun, buckled in.',
]);

export const chez: OutsideEvent = {
  kind: 'chez',
  id: 'desk-chez',
  label: 'THE\u00a0CHEZ driving by, Doc Leo at the wheel: honk',
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
    return HONKS();
  },
};
