// Play here: the map cell in the middle of the view, as a play-test start spot kept on the map.
export function playSpot(cell: { x: number; y: number }, cols: number, rows: number): { x: number; y: number } {
  const clamp = (v: number, n: number) => Math.max(0, Math.min(n - 1, Math.floor(v)));
  return { x: clamp(cell.x, cols), y: clamp(cell.y, rows) };
}
