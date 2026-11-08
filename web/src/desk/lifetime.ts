// How long the desk lives. Listeners that the desk's parts put on window or document pass
// `{ signal: deskLifetime() }`, so leaving the desk (renderDesk's disposer) takes them all off at once
// and the old desk's elements are not held by them.
let current = new AbortController();

/** The signal of the desk being built or shown now; aborted when it is left. */
export const deskLifetime = (): AbortSignal => current.signal;

/** A desk is being built: a new lifetime begins. */
export function beginDesk(): void {
  current.abort(null); // not an Error: its captured stack would hold the desk's closures
  current = new AbortController();
}

/** The desk is left: everything registered with its lifetime goes. */
export function endDesk(): void {
  beginDesk(); // a fresh, unused one, so the ended one (and what its 'abort' handlers closed over) is let go
}
