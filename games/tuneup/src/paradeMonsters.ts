// The parade's followers (monster slots from MON.parade, which the Beltway's traffic shares: no
// scene has both, so the parade scenes keep their own .MON). Each follows THE CHEZ the way PLAYGAME
// lets a monster follow a hero: an attack march with activate 2 ("relative to the character"), whose
// corners are offsets from the hero re-aimed every tick, so it keeps a place a fixed number of
// blocks behind the car (to its right, as the car drives left) at a speed well over the car's.
// It starts once the hero is within 8 blocks (so the last place is 6 blocks back: a corner count
// of nine ends the march, and the restart needs the follower in range), and a follower in place
// restarts its march at once. They never hurt or block: no solid block, no effect, and a power over the hero's.
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { MON } from './ids';
import { PARADE_FOLLOWERS } from './sprites/paradeSprites';

/** The followers' power: over CHARPOWER (100), so touching the car never undoes them. */
const POWER = 200;
/** Pixels a tick a follower moves to its place (well over the car's best, so it keeps up). */
const SPEED = 16;
/** Blocks behind the hero (right of it) the first follower keeps; the others each a block further. */
export const FIRST_PLACE = 1;

/** `places[i]` is how many blocks behind the car follower i keeps (its own, so none overlap). */
export function addParadeMonsters(out: Monster[], n: (name: string) => number, places: number[]): void {
  PARADE_FOLLOWERS.forEach((name, i) => {
    // PLAYGAME enters an attack march at its corner 1; nine corners to the same place, level with the hero's top block, where the car is drawn, then it starts over
    const attack = Array.from({ length: 10 }, (_, k) => corner(places[i], 0, k ? SPEED : 0));
    const m = mon(
      [
        [n(`parade.${name}0`), 5],
        [n(`parade.${name}1`), 5],
      ],
      { power: POWER, thru: 0, activate: 2 },
      [corner(0, 0, 1), corner(0, 0, 1)],
    );
    m.march[1] = attack;
    out[MON.parade + i] = m;
  });
}
