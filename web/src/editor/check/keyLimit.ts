// The keys the level check's explorer may press (explore.ts), limited for a run: the basic keys most players
// use (the arrows, Space and Enter) checks that a game plays without the number pad's diagonals (1, 3, 7, 9),
// Q/E and the like, which many laptops lack and most people never reach for. Used by the walkthrough bot's
// --basic-keys (scripts/walkAuto.ts); the editor's own runs press every key the character has.
import type { Move } from './inputs';

/** Up, Down, Left, Right (the number pad's 8, 2, 4 and 6 send these too), Space and Enter. */
export const BASIC_KEYS: ReadonlySet<number> = new Set([0x48, 0x50, 0x4b, 0x4d, 0x39, 0x1c]);

let allowed: ReadonlySet<number> | undefined;

/** Runs `run` with the explorer pressing only `keys` (undefined: every key). One run at a time per page or worker. */
export async function withKeys<T>(keys: ReadonlySet<number> | undefined, run: () => Promise<T>): Promise<T> {
  const was = allowed;
  allowed = keys;
  try {
    return await run();
  } finally {
    allowed = was;
  }
}

/** The move uses only keys the explorer may press now. */
export const keysAllowed = (m: Move): boolean => !allowed || m.steps.every((s) => s.keys.every((k) => allowed!.has(k)));
