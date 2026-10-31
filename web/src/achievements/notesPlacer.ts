// Where the achievement notes go on a page that places them itself (the DOS page). Kept apart
// from toast.ts so that page can say so at startup without loading the toast and its badge art.

type Placer = (host: HTMLElement) => void;

let placer: Placer | undefined;
let changed: (() => void) | undefined;

/** Hands where the notes go to the page (placeNotes(undefined) gives it back). */
export function placeNotes(f: Placer | undefined): void {
  placer = f;
  changed?.();
}

/** The page's placer, if it set one. */
export const notesPlacer = (): Placer | undefined => placer;

/** The toast module asks to hear when the page sets or clears its placer. */
export function onPlacerChange(f: () => void): void {
  changed = f;
}
