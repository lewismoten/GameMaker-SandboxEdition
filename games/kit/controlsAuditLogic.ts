// Pure part of the touch-button audit: which keys become buttons and how they differ from controls.json.
/** F1 to F10 (the engine's own), Esc and Enter: never listed as touch buttons. */
const isFunction = (s: number) => s >= 59 && s <= 68;

export interface KeyComparison {
  /** Scan codes that get their own touch button (not covered by the pad, Esc, Enter or F keys). */
  buttons: number[];
  over6: boolean;
  /** Documented in controls.json but reachable by neither the pad nor a button. */
  missing: number[];
  /** Bound by a character but not documented in controls.json. */
  unlisted: number[];
}

/** `documented`: controls.json key scans; `covered`: the pad's scans (padPlan); `bound`: scans the .chr sequences use. */
export function compareKeys(documented: number[], covered: ReadonlySet<number>, bound: number[]): KeyComparison {
  const buttons = bound.filter((s) => !covered.has(s) && s !== 1 && s !== 28 && !isFunction(s));
  const reach = new Set([...covered, 1, 28]);
  return {
    buttons,
    over6: buttons.length > 6,
    missing: documented.filter((k) => !reach.has(k) && !buttons.includes(k) && !isFunction(k)),
    unlisted: buttons.filter((s) => !documented.includes(s)),
  };
}
