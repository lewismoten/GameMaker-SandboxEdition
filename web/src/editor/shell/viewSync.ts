// Tells the open file's editor that the address changed its view settings (?scene=…) while the
// file stayed open, so a link to the same file with another scene applies without reopening it.
const listeners = new Set<() => void>();

/** Runs `fn` whenever the open file is asked to follow its address again. Returns the way to stop. */
export function onViewChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

/** The address changed only its settings; the open editor reads them again. */
export function viewChanged(): void {
  for (const fn of [...listeners]) fn();
}
