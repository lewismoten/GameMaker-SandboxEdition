// Formats the first mismatch between the sorted host and engine page lists.
export function cardDifference(actual: string[], expected: string[]): string {
  const mismatch = actual.findIndex((page, k) => page !== expected[k]);
  const i = mismatch < 0 ? Math.min(actual.length, expected.length) : mismatch;
  return `${actual[i] ?? '<end of list>'} | ${expected[i] ?? '<end of list>'}`;
}
