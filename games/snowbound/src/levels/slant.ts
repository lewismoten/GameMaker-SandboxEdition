// The Jamie Street run's slant: the hill runs down the map and steps one column to the right
// every RISE rows, round and round the map's wrap. Off the bottom it comes back in at the top a
// third of the map further over, on fresh hill, so the ride passes three columns of slope before
// it would meet itself (3 laps x 100 rows, 100 columns over: the line closes exactly). A row of
// the run, u, counts down from the top of the hill; across it, i runs 0 (the left tree line) to
// WIDTH - 1 (the right one).

/** Rows down the hill for each column the run steps right. */
export const RISE = 3;
/** The run's width in blocks, tree lines included. */
export const WIDTH = 24;
/** Its top-left block on the map (row u = 0, i = 0). */
export const X0 = 30;
export const Y0 = 4;
/** Rows before the slant comes back round to the top of the hill. */
export const LOOP = 100 * RISE;

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** The map block of row u, across i. */
export function cellAt(u: number, i: number): [number, number] {
  return [mod(X0 + Math.floor(u / RISE) + i, 100), mod(Y0 + u, 100)];
}

/** A row's place in its step (0..RISE-1): which of the banks' pictures it shows. */
export const phaseOf = (u: number) => mod(u, RISE);

/** The row u and column i of the run at map block (x, y) on lap `lap` (0, 1, 2). */
export function runAt(x: number, y: number, lap: number): { u: number; i: number } {
  const u = mod(y - Y0, 100) + 100 * lap;
  return { u, i: mod(x - X0 - Math.floor(u / RISE), 100) };
}
