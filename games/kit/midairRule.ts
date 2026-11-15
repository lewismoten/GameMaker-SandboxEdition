// The rule midairJump.ts uses for a direct (non-momentum) rise: can a held push of P pixels a tick lift the hero
// again once he is falling? Pure, so a test can hold it to the measurement (heldRiseProof.ts sweeps it).
//
// Units: gravity's momentum (ci.gravy) is already pixels a tick. Each move adds the frame's y and then ci.gravy to the
// move (character.ts:421-443; PLAYGAME.C:2454-2473), and only then clamps the move to MAXGRAV (11) pixels
// (character.ts:447; PLAYGAME.C:2484-2487). So a direct push of P lifts the hero while P > gravy, and gravy grows by
// 1 every GRAVSPEED ticks in a block with downward gravity (character.ts:243; PLAYGAME.C:3751), capped at MAXGRAV*4 =
// tune.gravityCap = 44 (character.ts:250; PLAYGAME.C:3763), and zeroed on a floor (character.ts:219; PLAYGAME.C:3712).
// So the 11-pixel clamp changes the speed, not the condition: after P * gravityTicks ticks in the air no press can lift
// him, and a push above the cap (P > 44) never runs out. A push of exactly 44 nets zero once gravy is capped.
import { CHARBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { INF_REPEAT, parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { STOCK_TUNING, type PlayTuning } from '@lewismoten/gamemaker-sandbox-engine/engine/world';

/** True when a held direct rise of `pushPerTick` pixels can still lift a hero who is falling, however long he has fallen. */
export function riseNeverRunsOut(pushPerTick: number, tune: Pick<PlayTuning, 'gravityCap'> = STOCK_TUNING): boolean {
  return pushPerTick > tune.gravityCap;
}

/** Ticks in the air after which a held direct rise of `pushPerTick` can no longer lift the hero (Infinity when it never runs out). */
export function ticksUntilStuck(pushPerTick: number, tune: Pick<PlayTuning, 'gravityCap' | 'gravityTicks'> = STOCK_TUNING): number {
  return riseNeverRunsOut(pushPerTick, tune) ? Infinity : pushPerTick * tune.gravityTicks;
}

const MIN_PUSH = 3; // a smaller upward push (a sled's steering, say) is not a jump
const RISE_RATE = 8; // a direct push upward of this many pixels a tick or more is a jump held up; less is walking, climbing or a nudge
const NO_FRAME = CHARBL + 1; // the end of a sequence

export type Verdict = 'REJUMP' | 'counted' | 'locked' | 'allowed' | 'bounded';
export interface Jump {
  game: string;
  file: string;
  seq: number;
  key: number;
  push: number;
  lock: number;
  air: number;
  meter: number;
  verdict: Verdict;
  reason: string;
}

/** The upward pushes in one character file's keyed momentum sequences. */
export function jumpsIn(game: string, file: string, bytes: Uint8Array, allow: Record<string, string>): Jump[] {
  const ch = parseCharacter(bytes);
  const out: Jump[] = [];
  ch.sequences.forEach((s, seq) => {
    if (!s.key) return;
    let push = 0;
    let dur = 0;
    for (const f of s.frames) {
      if (f.pic2 === NO_FRAME) break;
      push -= f.y;
      dur += f.pause;
    }
    // Not momentum: the frames move him directly, so only a strong push a tick counts as a jump held up.
    const direct = !s.momentum;
    if (direct ? dur === 0 || push / dur < RISE_RATE : push < MIN_PUSH) return;
    const key = s.key >> 8;
    const air = 2 * push; // gravity adds 1 a tick, 1 pixel per unit: up for `push` ticks, down for as many
    const lock = s.ground ? dur : 0;
    const meter = ch.meter[seq];
    const name = `${game}/${file}/${key.toString(16)}`;
    const reason = allow[name] ?? allow[`${game}/${file}`] ?? allow[game] ?? '';
    let verdict: Verdict = 'REJUMP';
    if (reason) verdict = 'allowed';
    else if (direct) verdict = riseNeverRunsOut(push / dur) ? 'REJUMP' : 'bounded';
    else if (meter < INF_REPEAT) verdict = 'counted';
    else if (lock >= air) verdict = 'locked';
    out.push({ game, file, seq, key, push, lock, air, meter, verdict, reason });
  });
  return out;
}
