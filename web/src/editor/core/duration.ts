// Human-readable durations for time fields; unit conversion never changes the stored DOS values.
export interface TickDuration {
  /** Timer steps per second (gameplay 18.2, music its audio clock). */
  rate: number;
  /** A zero value may disable an effect instead of waiting zero seconds. */
  zero?: string;
  /** Some frame timers still show a picture for one tick when their stored pause is zero. */
  minimum?: number;
}

/** Rounded milliseconds, with carrying across second/minute/hour boundaries. */
export function durationText(milliseconds: number, long = false): string {
  if (!Number.isFinite(milliseconds)) return 'Unknown duration';
  let remaining = Math.max(0, Math.round(milliseconds));
  const units: [number, string, string][] = [
    [3600000, 'h', 'hour'],
    [60000, 'min', 'minute'],
    [1000, 's', 'second'],
    [1, 'ms', 'millisecond'],
  ];
  const parts: string[] = [];
  for (const [size, short, word] of units) {
    const count = Math.floor(remaining / size);
    remaining %= size;
    if (count) parts.push(`${count} ${long ? word + (count === 1 ? '' : 's') : short}`);
  }
  return parts.length ? parts.join(long ? ', ' : ' ') : long ? '0 seconds' : '0 s';
}

export function tickDuration(ticks: number, options: TickDuration, long = false): string {
  if (ticks === 0 && options.zero) return options.zero;
  if (!(options.rate > 0)) return 'Unknown duration';
  return durationText((Math.max(ticks, options.minimum ?? 0) / options.rate) * 1000, long);
}
