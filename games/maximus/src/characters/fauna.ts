// The four monster families of the Hundred Worlds. Each fills all 44 creature slots of
// its .MON, and each has an "easy" and a "hard" edition (the outer sectors' creatures
// move faster, hit harder and take more to kill) - 64 monsters per file, every slot used.
// The families themselves are in fauna/ (land, sea, space, mech).
import type { Creature } from './bestiary';

/** The harder edition: faster and tougher, same art and the same .MBL. */
export function harder(list: Creature[]): Creature[] {
  return list.map((c) => {
    const speedUp = (n: number) => (n > 0 ? n + 1 : n);
    const move =
      c.move.kind === 'towards' || c.move.kind === 'away' || c.move.kind === 'random'
        ? { ...c.move, speed: Math.min(c.move.kind === 'random' ? 3 : 5, speedUp(c.move.speed)) }
        : c.move.kind === 'path'
          ? { ...c.move, corners: c.move.corners.map(([x, y, s, o]) => [x, y, s + 1, o] as [number, number, number, number?]) }
          : c.move;
    return {
      ...c,
      move,
      // contact damage lives in the shared .MBL, so it stays the same
      // stay on the same side of the weapons' powers (blaster 40, flak 45, nova 60, mines 70, plasma 75, shield 90)
      power: c.power <= 10 ? c.power : c.power < 40 ? Math.min(38, c.power + 10) : c.power < 75 ? Math.min(74, c.power + 8) : c.power,
      score: Math.round(c.score * 1.5),
    } as Creature;
  });
}

export { landFauna } from './fauna/land';
export { seaFauna } from './fauna/sea';
export { spaceFauna } from './fauna/space';
export { mechFauna } from './fauna/mech';
