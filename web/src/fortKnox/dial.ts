// The toy safe's combination dial, with no DOM: 60 ticks (numbers 0 to 55 printed every fifth),
// turned right (clockwise, numbers going up) or left. A "run" is one stretch of turning in one
// direction; the door opens when the last three runs went right, left, right and stopped on
// the three numbers of the combination.
export const TICKS = 60;
export type Turn = 'right' | 'left';
export interface Run {
  dir: Turn;
  end: number;
}
export interface Dial {
  pos: number;
  runs: Run[];
}

/** The combination, hidden in the room on the sticky note by the phone (desk/room/phoneNotes.ts). */
export const COMBINATION: readonly [number, number, number] = [35, 10, 50];

export const newDial = (): Dial => ({ pos: 0, runs: [] });
const wrap = (n: number) => ((n % TICKS) + TICKS) % TICKS;

/** Turns the dial by `ticks` (positive right, negative left), one tick at a time. */
export function turnDial(d: Dial, ticks: number): Dial {
  if (!ticks) return d;
  const dir: Turn = ticks > 0 ? 'right' : 'left';
  const pos = wrap(d.pos + ticks);
  const runs = d.runs.slice();
  const last = runs[runs.length - 1];
  if (last?.dir === dir) runs[runs.length - 1] = { dir, end: pos };
  else runs.push({ dir, end: pos });
  return { pos, runs: runs.slice(-3) };
}

/** Whether the dial now stands where the combination opens the door. */
export function opens(d: Dial, combo: readonly number[] = COMBINATION): boolean {
  const dirs: Turn[] = ['right', 'left', 'right'];
  return d.runs.length === 3 && d.runs.every((r, i) => r.dir === dirs[i] && r.end === combo[i]);
}

/** A scrambled dial after a wrong try: the history is forgotten, the position stays. */
export const spin = (d: Dial): Dial => ({ pos: d.pos, runs: [] });
