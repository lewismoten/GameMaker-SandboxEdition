// The desk's simple overlays (the clipping, the phone notes, the catalog, the disk box): the
// keyboard goes into the overlay when it opens, so Tab and a screen reader start there, and
// back to the prop that opened it when it closes.

/** Focuses `target` in a just-opened overlay; returns what puts focus back where it was. */
export function focusInto(target: HTMLElement | null): () => void {
  const opener = document.activeElement as HTMLElement | null;
  target?.focus({ preventScroll: true });
  return () => {
    if (opener?.isConnected && opener !== document.body) opener.focus({ preventScroll: true });
  };
}
