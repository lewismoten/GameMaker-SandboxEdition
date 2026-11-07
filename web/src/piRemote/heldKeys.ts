// Which Pi keys are held, and by what (the mouse on the on-screen keyboard, the physical
// keyboard, a latched modifier), so a key goes down once and up only when nothing holds it.

/** What holds a key down. */
export type Holder = 'screen' | 'physical' | 'latch';

/** A KEY frame to send: the Linux code and its new state. */
export interface KeyChange {
  code: number;
  state: 'down' | 'up';
}

export class HeldKeys {
  private readonly holders = new Map<number, Set<Holder>>();

  /** `holder` presses `code`: a change when the key was up. */
  press(code: number, holder: Holder): KeyChange | undefined {
    let set = this.holders.get(code);
    if (!set) this.holders.set(code, (set = new Set()));
    const was = set.size;
    set.add(holder);
    return was === 0 ? { code, state: 'down' } : undefined;
  }

  /** `holder` lets go of `code`: a change when nothing else holds it. */
  release(code: number, holder: Holder): KeyChange | undefined {
    const set = this.holders.get(code);
    if (!set?.delete(holder)) return undefined;
    if (set.size) return undefined;
    this.holders.delete(code);
    return { code, state: 'up' };
  }

  /** Whether `holder` (or anything, without one) holds `code`. */
  isHeld(code: number, holder?: Holder): boolean {
    const set = this.holders.get(code);
    return !!set && (holder ? set.has(holder) : set.size > 0);
  }

  /** Lets go of every key `holder` holds (or every key), in the order they were pressed. */
  releaseAll(holder?: Holder): KeyChange[] {
    const changes: KeyChange[] = [];
    for (const [code, set] of [...this.holders]) {
      if (holder) {
        const change = this.release(code, holder);
        if (change) changes.push(change);
      } else if (set.size) {
        this.holders.delete(code);
        changes.push({ code, state: 'up' });
      }
    }
    return changes;
  }
}
