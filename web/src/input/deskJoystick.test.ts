// The desk's game pad as PLAYGAME's joystick (deskJoystick.ts): its d-pad's nine positions,
// only buttons 1 and 2 reaching a game, and a real gamepad alongside it.
import { afterEach, describe, expect, it } from 'vitest';
import { deskJoystick, holdDeskPad, joinJoy, padPosition, plugDeskPad, PLAYGAME_BUTTONS } from './deskJoystick';

describe('the desk game pad', () => {
  let unplug: (() => void) | undefined;
  afterEach(() => unplug?.());

  it("numbers the d-pad's ways as GetJoyPos does: 1 up, clockwise to 8 up-left", () => {
    const ways: [number, number, number][] = [
      [0, -1, 1],
      [1, -1, 2],
      [1, 0, 3],
      [1, 1, 4],
      [0, 1, 5],
      [-1, 1, 6],
      [-1, 0, 7],
      [-1, -1, 8],
    ];
    for (const [dx, dy, pos] of ways) expect(padPosition(dx, dy), `${dx},${dy}`).toBe(pos);
    // a push a little off straight still goes straight; a touch at the middle is centered
    expect(padPosition(0.3, -1)).toBe(1);
    expect(padPosition(0.1, 0.1)).toBe(0);
  });

  it('gives a game only buttons 1 and 2, as ReadJoyStick reads them from the game port', () => {
    expect(PLAYGAME_BUTTONS).toBe(0b11);
    expect(joinJoy({ pos: 0, buttons: 0b1111 }, null).buttons).toBe(0b11);
    expect(joinJoy({ pos: 0, buttons: 0b1100 }, null).buttons).toBe(0);
  });

  it("joins a real gamepad: the desk pad's direction wins while pushed, the buttons add up", () => {
    expect(joinJoy({ pos: 3, buttons: 1 }, { pos: 7, buttons: 2 })).toEqual({ pos: 3, buttons: 3 });
    expect(joinJoy({ pos: 0, buttons: 0 }, { pos: 7, buttons: 2 })).toEqual({ pos: 7, buttons: 2 });
  });

  it('is the joystick while the desk has it, and lets go when it is unplugged', () => {
    expect(deskJoystick()).toBeNull(); // no desk pad, no gamepad: no joystick
    unplug = plugDeskPad();
    expect(deskJoystick()).toEqual({ pos: 0, buttons: 0 });
    holdDeskPad({ pos: 5, buttons: 0b0110 });
    expect(deskJoystick()).toEqual({ pos: 5, buttons: 0b10 });
    unplug();
    unplug = undefined;
    expect(deskJoystick()).toBeNull();
  });
});
