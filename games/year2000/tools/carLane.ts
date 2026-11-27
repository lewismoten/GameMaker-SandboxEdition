// Check each prerequisite independently on the fenced approach to the neighborhood CitiCar.
import type { LevelMap } from '../src/levels/mapkit';

export const carGates = ['gatePages', 'gateZap', 'gateKeys'] as const;
const steps = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function checkCarGate(lm: LevelMap, closed: (typeof carGates)[number]): void {
  const exit = lm.at('exit');
  const start = lm.at('start');
  const seen = new Set<string>([`${start.x},${start.y}`]);
  const todo = [[start.x, start.y]];
  while (todo.length) {
    const [x, y] = todo.pop()!;
    for (const [dx, dy] of steps) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx === exit.x && ny === exit.y) throw new Error(`year2000: the CitiCar door is reachable with ${closed} shut`);
      if (nx < 0 || ny < 0 || nx >= 48 || ny >= 32 || seen.has(`${nx},${ny}`)) continue;
      const tile = lm.get(nx, ny);
      if (tile === closed) continue;
      // Other lane gates and the garage stand open. Collectible items leave walkable floor.
      if (
        tile !== 'garagedoor' &&
        !carGates.some((gate) => gate === tile) &&
        lm.set.def(tile).solid &&
        !/^(page|quarter|pill|battery|zapper|cola|keys)_/.test(tile)
      )
        continue;
      seen.add(`${nx},${ny}`);
      todo.push([nx, ny]);
    }
  }
}
