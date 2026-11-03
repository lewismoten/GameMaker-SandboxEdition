// How long the page's chrome lives (the top bar's Guides button and settings menu). main.ts begins a
// new life each time it builds the top bar or the desk, which ends the old one, so listeners that these
// parts put on window or document pass `{ signal: pageLife() }` and do not outlast the page they belong to.
let current = new AbortController();

/** The signal of the page chrome shown now; aborted when it is replaced. */
export const pageLife = (): AbortSignal => current.signal;

/** The page's chrome is built again (or the desk takes over): the old one's listeners go. */
export function beginPage(): void {
  current.abort(null); // no Error: its captured stack would hold the desk's closures
  current = new AbortController();
}
