// Keeps a list where the reader left it while it is redrawn. The file list is rebuilt on every
// file click; building it moves the search box and save note out of the old list first, so the
// list above the reader's row shrinks for a moment and the browser (scroll anchoring) takes
// that off the scroll position. Noting the position first and putting it back fixes that.

/** The part of an element this needs. */
interface Box {
  scrollTop: number;
  querySelector(selector: string): Box | null;
}

/** Runs `redraw`, then puts `root` and the element `inner` matches inside it back where they were. */
export function keepScroll(root: Box, inner: string, redraw: () => void): void {
  const top = root.scrollTop;
  const innerTop = root.querySelector(inner)?.scrollTop ?? 0;
  redraw();
  if (root.scrollTop !== top) root.scrollTop = top;
  const again = root.querySelector(inner);
  if (again && again.scrollTop !== innerTop) again.scrollTop = innerTop;
}
