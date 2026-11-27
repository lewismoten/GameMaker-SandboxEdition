// The level 2 jump counter can grow beyond its starting balance.
import { expect, it } from 'vitest';
import controls from '../controls.json';
import { HOWTO, STORY } from './text';

it('teaches the starting balance in the story and both sets of controls', () => {
  for (const copy of [STORY, HOWTO, controls.keys['57'].long]) {
    expect(copy.replace(/\s+/g, ' ')).toMatch(/start with two jumps/i);
  }
});
