// Arrow chords for keyboards without a numeric keypad (Mac laptops): two arrows held together
// stand in for the keypad key between them, as long as the game binds that key. The game still
// sees exactly the scan codes PLAYGAME would get from a PC keyboard: while ↑+← are held it gets
// Home (pad 7) pressed and the two arrows let go, as if the player had moved a finger from the
// arrows to Home; letting go of one arrow lets go of Home and presses the arrow still held.
// Opposite arrows ↑+↓ stand in for pad 5, the keypad's center.

const UP = 72,
  LEFT = 75,
  RIGHT = 77,
  DOWN = 80;

/** Arrow pairs and the keypad key each pair stands for, in the order they are tried. */
export const ARROW_CHORDS: readonly { arrows: readonly [number, number]; scan: number }[] = [
  { arrows: [UP, LEFT], scan: 71 }, // Home / Pad 7
  { arrows: [UP, RIGHT], scan: 73 }, // PgUp / Pad 9
  { arrows: [DOWN, LEFT], scan: 79 }, // End / Pad 1
  { arrows: [DOWN, RIGHT], scan: 81 }, // PgDn / Pad 3
  { arrows: [UP, DOWN], scan: 76 }, // Pad 5
];

/** The DOM key codes of the four arrow keys (the keypad's own 8 4 6 2 never chord). */
export const ARROW_CODES: Record<string, number> = { ArrowUp: UP, ArrowLeft: LEFT, ArrowRight: RIGHT, ArrowDown: DOWN };

/**
 * Turns the arrow keys physically held into the keys the game should see held.
 * `bound` says whether the game uses a key; chords whose key it doesn't use stay plain arrows.
 */
export function chordKeys(held: ReadonlySet<number>, bound: (scan: number) => boolean): Set<number> {
  const out = new Set(held);
  for (const c of ARROW_CHORDS) {
    const [a, b] = c.arrows;
    if (out.has(a) && out.has(b) && bound(c.scan)) {
      out.delete(a);
      out.delete(b);
      out.add(c.scan);
    }
  }
  return out;
}

/**
 * Tracks the arrows held and the keys the game was told about, and returns the scan code
 * events (bit 7 set = released) that take the game from what it saw to what it should see.
 * Releases come before presses, so the game never sees a chord and its arrows held at once.
 */
export class ArrowChords {
  private held = new Set<number>();
  private shown = new Set<number>();

  constructor(public bound: (scan: number) => boolean = () => false) {}

  /** An arrow key went down or up; returns the events for the game. */
  arrow(scan: number, pressed: boolean): number[] {
    if (pressed) this.held.add(scan);
    else this.held.delete(scan);
    const want = chordKeys(this.held, this.bound);
    const out: number[] = [];
    for (const s of this.shown) if (!want.has(s)) out.push(s | 0x80);
    // a newly made chord goes first, then plain arrows in the order they were pressed
    for (const s of [...want].sort((x, y) => Number(ARROW_CODES_SET.has(x)) - Number(ARROW_CODES_SET.has(y)))) if (!this.shown.has(s)) out.push(s);
    this.shown = want;
    return out;
  }

  /** Forgets everything (focus lost: the keyboard lets go of every key). */
  reset(): void {
    this.held.clear();
    this.shown.clear();
  }
}

const ARROW_CODES_SET = new Set(Object.values(ARROW_CODES));
