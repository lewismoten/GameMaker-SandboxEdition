// The GRAVITAS pad's TURBO switch (desk/pc/gamePad*.ts): "4 BUTTON" leaves buttons 3 and 4 to do
// nothing in Game-Maker games (PLAYGAME reads only the game port's first two button lines);
// "TURBO" makes holding 3 or 4 press 1 or 2 over and over, evenly, like the turbo fire of the
// era's pads. The switch is remembered per browser; a real gamepad's buttons 3 and 4 follow it.

const KEY = 'gm-pad-turbo';
/** One press and one release take this long: ten presses a second. */
export const TURBO_PERIOD_MS = 100;

const readSaved = (): boolean => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

let on = readSaved();
const listeners = new Set<() => void>();

export const turboOn = (): boolean => on;

/** Throws the switch (and remembers it when the browser lets it). */
export function setTurbo(next: boolean): void {
  if (next === on) return;
  on = next;
  try {
    localStorage.setItem(KEY, next ? '1' : '0');
  } catch {
    // no storage: it holds until the page is closed
  }
  for (const l of listeners) l();
}

/** Calls `fn` whenever the switch moves; returns what stops it. */
export function onTurbo(fn: () => void): () => void {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

/** Turns held buttons 3 and 4 (bits 2 and 3) into presses of 1 and 2, tracking how long each has been held. */
export class TurboFire {
  private since: (number | undefined)[] = [undefined, undefined];

  /** The buttons the game sees at time `now` (ms) for the buttons held (bit 0 = button 1): 1 and 2 as held, plus 3 and 4's pulses while `turbo`. */
  step(held: number, now: number, turbo: boolean): number {
    let out = held & 0b11;
    for (const i of [0, 1]) {
      if (!turbo || !(held & (4 << i))) {
        this.since[i] = undefined;
        continue;
      }
      const from = (this.since[i] ??= now);
      // down first, so the first press is not late; then an even down and up
      if (Math.floor((now - from) / (TURBO_PERIOD_MS / 2)) % 2 === 0) out |= 1 << i;
    }
    return out;
  }
}
