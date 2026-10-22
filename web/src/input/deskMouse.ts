// The ball mouse on the desk (desk/pc/tray.ts) is the PC's mouse. Like a real one it only
// reports how far it rolled and which buttons are down; the program running on the PC (a
// VGA designer, a game) moves its own pointer by that much, as the mouse driver did.

/** dx, dy in 320x200 screen pixels (fractions allowed); buttons: 1 = left, 2 = right. */
export type DeskMouseListener = (dx: number, dy: number, buttons: number) => void;

const listeners = new Set<DeskMouseListener>();

/** Listens to the desk mouse; returns the function that stops listening. */
export function listenDeskMouse(f: DeskMouseListener): () => void {
  listeners.add(f);
  return () => void listeners.delete(f);
}

/** The desk mouse rolled by (dx, dy) screen pixels with these buttons down. */
export function deskMouse(dx: number, dy: number, buttons: number): void {
  for (const f of listeners) f(dx, dy, buttons);
}

/** Moves a pointer by whole pixels, keeping the fractions for next time. */
export class Mickeys {
  private rx = 0;
  private ry = 0;

  /** Whole pixels to move now for a roll of (dx, dy). */
  take(dx: number, dy: number): [number, number] {
    this.rx += dx;
    this.ry += dy;
    const x = Math.trunc(this.rx) + 0; // never -0
    const y = Math.trunc(this.ry) + 0;
    this.rx -= x;
    this.ry -= y;
    return [x, y];
  }
}
