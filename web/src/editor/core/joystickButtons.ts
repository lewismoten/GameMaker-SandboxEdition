// Project-wide joystick descriptions are companion metadata; native button numbers stay intact.
export const JOYSTICK_BUTTONS = 'joystickButtons';
export interface JoystickButtonDescription {
  short: string;
  long: string;
}
export type JoystickButtons = Partial<Record<1 | 2, JoystickButtonDescription>>;
const text = (value: unknown, limit: number) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, limit) : '');

export function readJoystickButtons(value: unknown): JoystickButtons {
  const out: JoystickButtons = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return out;
  for (const index of [1, 2] as const) {
    const entry: unknown = (value as Record<string, unknown>)[index];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const fields = entry as Record<string, unknown>;
    const short = text(fields.short, 32),
      long = text(fields.long, 240);
    if (short || long) out[index] = { short, long };
  }
  return out;
}

export function joystickButtonOptions(buttons: JoystickButtons): [number, string][] {
  const label = (index: 1 | 2) => `Button ${index}${buttons[index]?.short ? ` — ${buttons[index].short}` : ''}`;
  return [
    [0, 'Any (doesn’t matter)'],
    [1, label(1)],
    [2, label(2)],
    [3, 'Both buttons'],
    [4, 'No buttons pressed'],
  ];
}
