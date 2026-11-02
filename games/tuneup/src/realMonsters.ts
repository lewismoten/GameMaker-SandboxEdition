// The monsters of the dream's end and the real tune-up, added to every .MON after the engine
// bay's (characters.ts buildMonsters).
//
// - The swim: Sir Reginald paddles the length of the oil pipe and out of the far end (no scene
//   places him now: the swim is a close-up drawn in blocks, swim.ts).
// - Brake Dance, on the power ladder: each stiff brake lamp sits inside its solid housing, where
//   Teddy can't touch it, and only a trick at least as strong as its own frees it (turn < roll
//   over < play dead < dance); a weaker trick fizzles on it. A freed lamp, stronger than any
//   trick, floats out to Teddy lit with its letter (B, R, A, K), and his touch counts it.
// - Hubcaps and Balls: three caps lift to show the ball, then shuffle along their paths (a cap
//   crossing over, one sliding under, one bobbing in place, every move the same length of time);
//   at the end of the path each settles. Doc Leo's reach lifts a settled cap: on the ball, or on
//   nothing.
import { LASTMON, type March, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { MON } from './ids';

/** A level's shell game: the caps' paths (one each) and which cap hides the ball. */
export interface CapGame {
  paths: March[][];
  ball: number;
}

/** Ticks the caps stay lifted at the start, showing where the ball is. */
export const REVEAL = 40;

/** The trick ladder: lamp k gives way to trick k or any stronger. */
const lockPower = (k: number) => 10 + 10 * k;
const trickPower = (k: number) => 15 + 10 * k;
/** A freed lamp: stronger than every trick (they pass it by), weaker than Teddy (his touch counts it). */
const LAMP = 99;
const BIRD = 200;

export function addRealMonsters(out: Monster[], n: (name: string) => number, caps?: CapGame): void {
  const two = (a: string, b: string, t: number): [number, number][] => [
    [n(a), t],
    [n(b), t],
  ];
  out[MON.swim] = mon(two('swim0', 'swim1', 6), { power: BIRD, thru: 0, end: -1, newmon: LASTMON }, [corner(0, 0, 2), corner(16, 0, 2)]);
  for (let k = 0; k < 4; k++) {
    // the sparkle flies three blocks right of Teddy and is gone (or spent on a lamp)
    out[MON.trick0 + k] = mon(two(`trick${k}a`, `trick${k}b`, 2), { power: trickPower(k), thru: 0, end: -1, newmon: LASTMON }, [
      corner(0, 0, 4),
      corner(3, 0, 4),
    ]);
    out[MON.lock0 + k] = mon(two('lamp.stiff0', 'lamp.stiff1', 6 + k), { power: lockPower(k), thru: 0, newmon: MON.lamp0 + k });
  }
  // freed, each lamp glows bright red with its letter of BRAKE (the door's lamp is the E)
  for (let k = 0; k < 4; k++) out[MON.lamp0 + k] = mon(two(`lamp.lit${k}.0`, `lamp.lit${k}.1`, 3), { power: LAMP, thru: 0, towards: 2, newmon: LASTMON });
  if (caps) {
    caps.paths.forEach((path, i) => {
      const ball = i === caps.ball;
      out[MON.cap0 + i] = mon(
        [
          [n(ball ? 'cap.upBall' : 'cap.up'), REVEAL],
          [n('cap'), 120],
          [n('cap'), 120],
          [n('cap'), 120],
        ],
        { power: 50, thru: 0, end: -1, newmon: ball ? MON.capRestBall : MON.capRest },
        path,
      );
    });
    out[MON.capRest] = mon(two('cap', 'cap', 60), { power: 50, thru: 0, newmon: MON.capLifted });
    out[MON.capRestBall] = mon(two('cap.ball', 'cap.ball', 60), { power: 50, thru: 0, newmon: MON.capLiftedBall });
    out[MON.capLifted] = mon(two('cap.tada', 'cap.tada', 60), { power: BIRD, thru: 0 });
    out[MON.capLiftedBall] = mon(two('cap.upBall', 'cap.upBall', 60), { power: BIRD, thru: 0 });
  }
}

/** A move of the shell game: `over` crosses to `under`'s place over the top while `under` slides beneath to its place; the third bobs. */
export interface Swap {
  over: number;
  under: number;
}

/**
 * The caps' paths for a shell game: lifted in place for REVEAL ticks, then each swap in turn at
 * `speed` pixels a tick for the cap crossing over (the others at half, so every move takes the
 * same time). `slots` are level columns two apart; cap i starts in slot i.
 */
export function capPaths(swaps: Swap[], speed: 2 | 4): March[][] {
  const pos = [0, 1, 2];
  const paths: March[][] = [0, 1, 2].map(() => [corner(0, -1, 1), corner(0, 0, 1)]);
  // a corner is an offset from where that cap started
  const x = (cap: number, slot: number) => (slot - cap) * 2;
  for (const s of swaps) {
    const third = 3 - s.over - s.under;
    const [a, b, t] = [pos[s.over], pos[s.under], pos[third]];
    paths[s.over].push(corner(x(s.over, a), -1, speed), corner(x(s.over, b), -1, speed), corner(x(s.over, b), 0, speed));
    paths[s.under].push(corner(x(s.under, a), 0, speed / 2));
    paths[third].push(corner(x(third, t), -1, speed / 2), corner(x(third, t), 0, speed / 2));
    [pos[s.over], pos[s.under]] = [pos[s.under], pos[s.over]];
  }
  paths.forEach((p, i) => {
    if (p.length > 10) throw new Error(`cap ${i}: ${p.length} corners (10 at most)`);
  });
  return paths;
}

/** Where each cap ends up (slot index), after `swaps`. */
export function capSlots(swaps: Swap[]): number[] {
  const pos = [0, 1, 2];
  for (const s of swaps) [pos[s.over], pos[s.under]] = [pos[s.under], pos[s.over]];
  return pos;
}
