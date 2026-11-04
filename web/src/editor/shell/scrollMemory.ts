// Remembers how far each address was scrolled, so Back to a page lands where it was left.
// Only history moves (Back, Forward) restore it; opening something starts at its top.
const seen = new Map<string, { top: number; win: number }>();

/** Starts noting the scroll of `main` (wide screens) and the window (phones) under the current address. */
export function watchScroll(main: HTMLElement): () => void {
  const note = () => seen.set(location.hash, { top: main.scrollTop, win: window.scrollY });
  main.addEventListener('scroll', note, { passive: true });
  window.addEventListener('scroll', note, { passive: true });
  return () => {
    main.removeEventListener('scroll', note);
    window.removeEventListener('scroll', note);
  };
}

interface Stamp {
  gm?: number;
  from?: string;
}

/**
 * Marks the current history entry as shown, noting the file it was opened from. Returns what the
 * entry already said when it was shown before (Back or Forward), else undefined.
 */
export function stampEntry(from?: string): Stamp | undefined {
  const old = history.state as Stamp | null;
  if (old?.gm === 1) return old;
  history.replaceState({ gm: 1, ...(from ? { from } : {}) }, '');
  return undefined;
}

type Pos = { top: number; win: number } | undefined;

/** Where the current address was left. Read before anything scrolls: resetting to the top is noted too. */
export const savedScroll = (): Pos => seen.get(location.hash);

/** Scrolls back to `at`; tries again as the page's content loads. */
export function restoreScroll(main: HTMLElement, at: Pos): void {
  const hash = location.hash;
  if (!at || (!at.top && !at.win)) return;
  for (const wait of [0, 250, 800]) {
    setTimeout(() => {
      if (location.hash !== hash) return;
      main.scrollTop = at.top;
      window.scrollTo(0, at.win);
    }, wait);
  }
}
