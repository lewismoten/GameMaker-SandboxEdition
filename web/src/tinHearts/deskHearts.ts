// The tin hearts kept in the 1994 room rather than in a game: so far one, in the wall clock.
// The rubber chicken pops out of the wristwatch now and then (desk/props/clock.ts; where the
// clock isn't drawn, every third TIME at the desk's DOS prompt stands in for a press), and once
// it has come out POPS_BEFORE_HEART times, every pop after that brings out a small tin heart
// too, until it is taken. It counts toward the hunt like a game's heart (tinHearts.ts); being in
// no game, it is kept in localStorage instead of a save. EGG.EXE adds or takes it away under
// the same overrides as the others.
//
// Grandfathering: the clock heart joined the hunt after people had finished it, so whether every
// game's heart was already found is decided once, the first time it is asked, and kept: such a
// visitor keeps what finding them all opened, and is shown the clock heart as one more to find.
// Plain localStorage, no DOM: the hunt's bookkeeping and the desk both read it from here.

/** The clock heart's id among the hunt's hearts (no game has this id). */
export const CLOCK_HEART = 'desk-clock';
/** The room's hearts, as the hunt lists them (EGG.EXE's ledger, after the games). */
export const DESK_HEARTS: readonly { id: string; title: string }[] = [{ id: CLOCK_HEART, title: 'The wall clock, in the room' }];

/** When the clock heart was taken (an ISO date). */
export const CLOCK_FOUND_KEY = 'gm-clock-heart';
/** How many times the chicken has popped out of the clock, across visits. */
const POPS_KEY = 'gm-clock-pops';
const GRANDFATHER_KEY = 'gm-hearts-before-clock';
/**
 * The chicken comes out this many times before the heart comes with it: enough that the visitor
 * has met the chicken and knows the clock does something, few enough (every third press, so a
 * dozen presses, over any number of visits) that someone poking at the clock finds it.
 */
export const POPS_BEFORE_HEART = 3;

/** Fired on window when a heart is found, or EGG.EXE changes one (tinHearts.ts listens). */
export const TIN_HEARTS_CHANGED = 'gm-tin-hearts-changed';

const get = (k: string): string | null => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const put = (k: string, v: string): void => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* private mode: for this visit only */
  }
};

/** How many times the chicken has come out so far. */
export function clockPops(): number {
  const n = Number(get(POPS_KEY));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** When the clock heart was taken, if it was. */
export function clockHeartTaken(): string | undefined {
  try {
    const n = JSON.parse(get(CLOCK_FOUND_KEY) ?? 'null');
    return n && typeof n.found === 'string' ? n.found : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The chicken has popped out once more. `found`: whether the clock heart counts as found now
 * (taken, or added in EGG.EXE). True when the heart comes out with it this time.
 */
export function chickenPopped(found: boolean): boolean {
  const before = clockPops();
  put(POPS_KEY, String(Math.min(before + 1, 999)));
  return !found && before >= POPS_BEFORE_HEART;
}

/** The visitor took the clock heart: kept once (the first date stays). */
export function takeClockHeart(when = new Date()): void {
  if (!clockHeartTaken()) put(CLOCK_FOUND_KEY, JSON.stringify({ found: when.toISOString() }));
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(TIN_HEARTS_CHANGED));
}

/**
 * Whether every game's heart was found before the clock heart joined the hunt. Decided the first
 * time it is asked (`gamesDone`: whether every game's heart counts as found now), then kept.
 */
export function grandfathered(gamesDone: boolean): boolean {
  const kept = get(GRANDFATHER_KEY);
  if (kept === '1' || kept === '0') return kept === '1';
  put(GRANDFATHER_KEY, gamesDone ? '1' : '0');
  return gamesDone;
}
