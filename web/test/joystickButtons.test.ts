// Joystick descriptions accept imported companion data without altering DOS input bindings.
import { describe, expect, it } from 'vitest';
import { readJoystickButtons, joystickButtonOptions } from '../src/editor/core/joystickButtons';

describe('project joystick descriptions', () => {
  it('keeps only supported buttons and bounded readable descriptions', () => {
    const original = { 1: { short: '  Hop\n up ', long: 'Hold  to jump.' }, 2: { short: 'a'.repeat(40), long: 'b'.repeat(250) }, 3: { short: 'No' } };
    expect(readJoystickButtons(original)).toEqual({ 1: { short: 'Hop up', long: 'Hold to jump.' }, 2: { short: 'a'.repeat(32), long: 'b'.repeat(240) } });
    expect(original[1].short).toBe('  Hop\n up ');
    for (const value of [null, [], 'bad', { 1: [], 2: { short: 7, long: ' ' } }]) expect(readJoystickButtons(value)).toEqual({});
    expect(readJoystickButtons({ 2: { long: 'Description only' } })).toEqual({ 2: { short: '', long: 'Description only' } });
  });
  it('keeps all native choices and their numeric values while naming the two buttons', () => {
    const options = joystickButtonOptions(readJoystickButtons({ 1: { short: 'Jump' }, 2: { short: 'Fire' } }));
    expect(options).toEqual([
      [0, 'Any (doesn’t matter)'],
      [1, 'Button 1 — Jump'],
      [2, 'Button 2 — Fire'],
      [3, 'Both buttons'],
      [4, 'No buttons pressed'],
    ]);
    expect(joystickButtonOptions({})[1]).toEqual([1, 'Button 1']);
  });
});
