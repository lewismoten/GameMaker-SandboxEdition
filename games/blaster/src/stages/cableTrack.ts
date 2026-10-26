// The ribbon cable's track: five wires laid corner to corner across the whole 100x100 map,
// which wraps on every side. Each wire is a lane between two solid insulation ridges, running
// up and to the right at 45 degrees. Near the right edge every lane bends flat for KINK..99
// (the kink), so when it comes round the wrap it carries on in the next wire down, not back
// into itself: one lap per wire, all five wires in a row, then (after the red wire) wire 5
// again. The red wire (pin 1) is the last one, and the gate is in it.
//
// Every cell has a track value t: x + y on the slant, y + KINK on the kink. Lanes are bands of
// t: each PITCH wide, the first RIDGE of them the ridge. Crossing the top edge adds 100 to t,
// crossing the right edge takes away KINK, so a lap moves the ship PITCH further: one wire.

export const PITCH = 20;
export const WIRES = 5;
export const RIDGE = 3;
export const KINK = 80;
/** The wire the BLASTER launches in, and the red wire (pin 1) where the gate is. */
export const FIRST = 0;
export const RED = 4;
/** Columns of the red wire the gate fills. */
export const GATE_X = [64, 65];

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** The track value of cell (x, y), as 0..99. */
export const tOf = (x: number, y: number): number => mod(x < KINK ? x + y : y + KINK, WIRES * PITCH);

/** The wire (0..4) and place across it (0..19; below RIDGE is ridge) of cell (x, y). */
export function wireAt(x: number, y: number): { wire: number; o: number } {
  const t = tOf(x, y);
  return { wire: Math.floor(t / PITCH), o: t % PITCH };
}

/** The wire ridden on lap `lap` (0 first). */
export const wireOfLap = (lap: number): number => (FIRST + lap) % WIRES;

/** The number painted on a wire: 5 for the first, counting down to 1 for the red one. */
export const wireNumber = (wire: number): number => WIRES - mod(wire - FIRST, WIRES);

/** The cell at column x of lap `lap`, `o` across its wire (3..19 is the lane). */
export function cellOf(lap: number, x: number, o: number): { x: number; y: number } {
  const t = wireOfLap(lap) * PITCH + o;
  return { x, y: mod(t - (x < KINK ? x : KINK), 100) };
}
