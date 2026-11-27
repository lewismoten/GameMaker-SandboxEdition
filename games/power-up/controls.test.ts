// The control hints should guide players back out of the canyon in The Wide Gap.
import { expect, it } from 'vitest';
import controls from './controls.json';

it('describes jumping up the canyon steps with Space and the joystick', () => {
  for (const jump of [controls.keys[57], controls.joystick[1]]) {
    expect.soft(jump.long).toMatch(/jump/i);
    expect.soft(jump.long).toMatch(/steps/i);
  }
  for (const hint of Object.values(controls.keys)) {
    expect.soft(`${hint.short} ${hint.long}`).not.toMatch(/ladder/i);
  }
});
