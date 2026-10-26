// The game pad on the desk (desk/pc/gamePad.ts) is the PC's joystick, plugged into its game
// port beside any real gamepad (input/gamepad.ts). Its d-pad gives one of PLAYGAME's nine
// positions (GetJoyPos in code/GM/JSTICKC.C: 0 centered, 1..8 clockwise from up) and its four
// buttons are bits 0-3. PLAYGAME reads only the game port's first two button lines
// (ReadJoyStick in JSTICKA.ASM keeps bits 4 and 5 of port 201h), so buttons 3 and 4, wired to
// the second joystick's lines, never reach a game.
import { readGamepad } from './gamepad';

export interface Joy {
  pos: number;
  buttons: number;
}

/** The button bits PLAYGAME reads: buttons 1 and 2. */
export const PLAYGAME_BUTTONS = 0b11;

/** The position for a push of (dx, dy) on a d-pad of radius 1 (y down); inside `dead` it is centered. */
export function padPosition(dx: number, dy: number, dead = 0.25): number {
  if (Math.hypot(dx, dy) < dead) return 0;
  // eight slices of 45 degrees, the first centered on up
  const slice = Math.round(Math.atan2(dx, -dy) / (Math.PI / 4));
  return ((slice + 8) % 8) + 1;
}

/** What the game reads with the desk pad and a real gamepad both plugged in: the pad's direction wins while it is pushed. */
export function joinJoy(desk: Joy, pad: Joy | null): Joy {
  return { pos: desk.pos || pad?.pos || 0, buttons: (desk.buttons | (pad?.buttons ?? 0)) & PLAYGAME_BUTTONS };
}

let held: Joy = { pos: 0, buttons: 0 };
let plugged = 0;

/** The desk pad is on the desk (and plugged in) until the returned function is called. */
export function plugDeskPad(): () => void {
  plugged++;
  return () => {
    plugged--;
    held = { pos: 0, buttons: 0 };
  };
}

/** What the desk pad's d-pad and buttons are held at now. */
export function holdDeskPad(joy: Joy): void {
  held = { ...joy };
}

/**
 * The PC's joystick for a game: the desk pad and any real gamepad together. With no desk pad
 * on the page it is just the gamepad, as everywhere else (null when there is none).
 */
export function deskJoystick(): Joy | null {
  const pad = readGamepad();
  return plugged ? joinJoy(held, pad) : pad;
}
