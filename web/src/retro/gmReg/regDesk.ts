// What CHK.EXE is asking right now, for the desk around the PC: while GM wants a word from the
// Owner's Guide the desk opens the guide beside the monitor, and while it wants a name and
// registration number (GM REGISTER, or the copy check) it puts the registration card there.
// Kept free of other imports so the desk can listen without loading the PC.

export type RegAsk =
  /** manualcheck(): a word from the Owner's Guide (or register instead). */
  | { kind: 'question'; page: number; paragraph: number; word: number }
  /** regi(): GM REGISTER asking for the name and number from the card. */
  | { kind: 'register' };

export interface RegDesk {
  ask: RegAsk;
  /** Writes PLAYGAME.REG as regi() did and lets GM go on; a message in plain words when it can't. */
  apply(name: string, number: string): string | undefined;
}

type Listener = (desk: RegDesk | null) => void;

let current: RegDesk | null = null;
const listeners = new Set<Listener>();

/** CHK.EXE: what it is asking now (null when it isn't). */
export function setRegDesk(desk: RegDesk | null): void {
  current = desk;
  listeners.forEach((l) => l(desk));
}

/** The desk: told now and at every change; returns the way to stop listening. */
export function onRegDesk(l: Listener): () => void {
  listeners.add(l);
  l(current);
  return () => void listeners.delete(l);
}
