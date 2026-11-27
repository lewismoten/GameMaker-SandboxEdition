// Inventory field in the Pocket host replay's per-tick state line.
export function meterField(meters: readonly number[]): string {
  return meters.slice(0, 30).join(',');
}

export function meterDifference(expected: string, actual = ''): string {
  const engine = expected.split(',');
  const board = actual.split(',');
  if (board.length !== engine.length) return `meters: expected ${engine.length} counters, received ${board.length}`;
  const i = engine.findIndex((value, index) => value !== board[index]);
  return `meter[${i}]: engine ${engine[i]}, board ${board[i]}`;
}
