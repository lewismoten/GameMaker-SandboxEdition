// Maps the first connected Gamepad API controller onto GameMaker's joystick model:
// position 0 = centered, 1..8 clockwise from up; buttons bit 0 = button 1, bit 1 = button 2
// (and, for the desk's game pad to show, bits 2 and 3 = buttons 3 and 4: PLAYGAME reads only two).

const DEAD_ZONE = 0.4;

export function readGamepad(fourButtons = false): { pos: number; buttons: number } | null {
  const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
  const pad = [...pads].find((p) => p && p.connected);
  if (!pad) return null;
  let x = pad.axes[0] ?? 0;
  let y = pad.axes[1] ?? 0;
  // D-pad buttons (standard mapping 12-15) override the stick.
  const b = (i: number) => !!pad.buttons[i]?.pressed;
  if (b(12)) y = -1;
  if (b(13)) y = 1;
  if (b(14)) x = -1;
  if (b(15)) x = 1;
  const dx = x < -DEAD_ZONE ? -1 : x > DEAD_ZONE ? 1 : 0;
  const dy = y < -DEAD_ZONE ? -1 : y > DEAD_ZONE ? 1 : 0;
  const pos = POSITIONS[(dy + 1) * 3 + (dx + 1)];
  const buttons = (b(0) ? 1 : 0) | (b(1) ? 2 : 0) | (fourButtons ? (b(2) ? 4 : 0) | (b(3) ? 8 : 0) : 0);
  return { pos, buttons };
}

// [dy][dx] -> GetJoyPos numbering
const POSITIONS = [8, 1, 2, 7, 0, 3, 6, 5, 4];
