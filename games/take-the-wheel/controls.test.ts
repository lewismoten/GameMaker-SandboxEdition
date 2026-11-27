// Keep the joystick help in step with the two actions bound to Space.
import { expect, it } from 'vitest';
import controls from './controls.json';

it('describes both the on-foot jump and kart horn for joystick button 1', () => {
  expect(controls.joystick[1]).toEqual(controls.keys[57]);
  expect(controls.joystick[1].long).toMatch(/on foot.*jump.*kart.*honk/i);
});
