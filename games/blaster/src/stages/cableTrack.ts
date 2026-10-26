// The ribbon cable's track: one gray ribbon cable coiled corner to corner across a 100x100
// map that wraps on every side. Each coil is a band of cable running up and to the right at
// 45 degrees, with a strip of motherboard between it and the next. Near the right edge every
// band bends flat (the kink), so when it comes round the wrap it carries on as the next coil
// down instead of meeting itself.
//
// Every cell has a track value t: x + y on the slant, y + KINK on the kink. Bands are PITCH
// wide in t: the first BOARD of them motherboard (solid), the rest cable. Crossing the top
// edge adds 100 to t and crossing the right edge takes away KINK, so a lap moves the ship
// PITCH further: one coil. The cable starts at a black plug in coil 0's kink and ends at
// another in coil 4's; the rest of those two coils is bare board.

export const PITCH = 20;
export const COILS = 5;
export const BOARD = 7;
export const KINK = 80;
/** The coil the BLASTER launches in (only its kink is cable) and the last one. */
export const FIRST = 0;
export const LAST = 4;
/** The plugs: the columns each one covers on the kink. */
export const START_PLUG = [81, 82, 83];
export const END_PLUG = [88, 89, 90];

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** The track value of cell (x, y), as 0..99. */
export const tOf = (x: number, y: number): number => mod(x < KINK ? x + y : y + KINK, COILS * PITCH);

/** The coil (0..4) and place across it (0..19; below BOARD is board) of cell (x, y). */
export function coilAt(x: number, y: number): { coil: number; o: number } {
  const t = tOf(x, y);
  return { coil: Math.floor(t / PITCH), o: t % PITCH };
}

/** The coil ridden on lap `lap` (0, the launch, is only the kink). */
export const coilOfLap = (lap: number): number => (FIRST + lap) % COILS;

/** Is there cable on coil `coil` at column x? (Before the first plug and after the last, bare board.) */
export function hasCable(coil: number, x: number): boolean {
  if (coil === FIRST) return x >= START_PLUG[0];
  if (coil === LAST) return x <= END_PLUG[END_PLUG.length - 1];
  return true;
}

/** The cell at column x of lap `lap`, `o` across its coil (BOARD..19 is cable). */
export function cellOf(lap: number, x: number, o: number): { x: number; y: number } {
  const t = coilOfLap(lap) * PITCH + o;
  return { x, y: mod(t - (x < KINK ? x : KINK), 100) };
}
