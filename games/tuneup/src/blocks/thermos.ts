// The thermos: a steel flask with a red cup, steam curling. Touched, it gives a little energy back
// (and a few points) and is gone. A level adds it over its own background block (`back`).
import { AIR, type Kit } from './common';

/** Adds block `name`: a thermos standing on `back` that heals `hp` and scores `score`. */
export function addThermos(k: Kit, name: string, back: string, hp: number, score = 25): void {
  const { c } = k;
  const t = k.pic(back);
  t.rect(6, 6, 8, 13, c('ink', 1)).rect(7, 7, 6, 11, c('mach', 3)).rect(7, 7, 2, 11, c('mach', 4)).rect(6, 3, 8, 3, c('red', 2)).rect(6, 3, 8, 1, c('red', 3));
  t.rect(7, 12, 6, 2, c('red', 2));
  for (const [x, y] of [
    [10, 1],
    [11, 0],
    [9, 0],
  ])
    t.set(x, y, c('cloud', 2));
  k.book.add(name, t, { ...AIR, hp, score, touch: back });
}
