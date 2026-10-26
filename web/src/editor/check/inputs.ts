// The level check's moves: short scripts of held keys (walk a cell, jump, jump and steer,
// run and jump, use a trick, wait) made from what each of the character's keys does
// (keymap/keyMap.ts characterActions), so the explorer plays any game with the keys it has.
import { characterActions } from '../keymap/keyMap';
import { CHARBL, MONBL } from '../../formats/blocks';
import type { Character } from '../../formats/character';

/** One part of a move: hold these keys until `until` says stop (or `max` ticks pass). */
interface Step {
  keys: number[];
  /** 'cell': the character's cell changed; 'land': it is on the ground again; 'ticks': after max ticks. */
  until: 'cell' | 'land' | 'ticks';
  max: number;
  /** Hold at least this many ticks, whatever `until` says (steady hands). */
  min?: number;
}

export interface Move {
  name: string;
  steps: Step[];
  /** Only tried where something nearby changes with time (a lift, a timed block). */
  waits?: boolean;
  /** After the last key is let go, wait at least this many ticks before the next move (steady hands). */
  settle?: number;
}

interface KeyRoles {
  /** `once`: its sequence plays once a press (no repeat while held): a push, a shove of a sled. */
  move: { scan: number; dx: number; dy: number; once?: boolean }[];
  /** `hold`: holding the key keeps it going (it repeats and can't stall), so a long hold climbs or flies. */
  jump: { scan: number; dx: number; hold?: boolean }[];
  /** Keys whose sequence stays in place: fire, tricks, pick up. */
  act: number[];
}

/**
 * Sorts the character's keys by what they do (`gravity`: the scene pulls the hero down, so
 * a move up is a jump). Keys the joystick alone starts are left out.
 */
export function keyRoles(chr: Character, gravity: boolean): KeyRoles {
  const roles: KeyRoles = { move: [], jump: [], act: [] };
  const seen = new Set<number>();
  // keys that start the same sequence, or a copy of it (arrows and letters both), are tried once
  const same = new Set<string>();
  for (const { scan, action } of characterActions(chr, gravity)) {
    if (!scan || seen.has(scan)) continue;
    seen.add(scan);
    const s = chr.sequences[action.seq];
    const { key: _k, xtra: _x, jstkBut: _b, jstkMov: _m, sound: _s, on: _o, ...rest } = s;
    const sig = JSON.stringify(rest, (_k, v: unknown) => (v instanceof Uint8Array ? undefined : v));
    if (same.has(sig)) continue;
    same.add(sig);
    let dx = 0;
    let dy = 0;
    for (const f of s.frames) {
      if (f.pic2 === CHARBL + 1) break;
      if (f.pic2 === MONBL) continue;
      dx += f.x;
      dy += f.y;
    }
    // a sequence that moves and comes back (up and down again) is played like a jump
    const moves = s.frames.some((f) => f.pic2 !== CHARBL + 1 && f.pic2 !== MONBL && (f.x || f.y));
    const hold = !s.norepeat && !s.ground;
    if (action.kind === 'action' && moves && !dx && !dy) roles.jump.push({ scan, dx: 0, hold });
    else if (action.kind === 'move') roles.move.push({ scan, dx: Math.sign(dx), dy: Math.sign(dy), ...(s.norepeat ? { once: true } : {}) });
    else if (action.kind === 'jump') roles.jump.push({ scan, dx: Math.sign(dx), hold });
    // a trick that neither moves the hero, fires anything nor picks up can't take them anywhere new
    else if (action.kind === 'fire' || action.kind === 'pickup' || (action.kind === 'action' && (dx || dy))) roles.act.push(scan);
  }
  return roles;
}

/** The moves tried from every resting place. Keys are pressed in order, so the last one listed runs. */
export function movesFor(roles: KeyRoles, gravity: boolean): Move[] {
  const out: Move[] = [];
  const sideways = roles.move.filter((m) => m.dx !== 0 && m.dy === 0);
  for (const m of roles.move) {
    out.push({ name: `walk ${m.scan}`, steps: [{ keys: [m.scan], until: 'cell', max: 30 }] });
    // a short step lines a jump up; on a top-down map the walk does it all
    if (gravity) out.push({ name: `step ${m.scan}`, steps: [{ keys: [m.scan], until: 'ticks', max: 2 }] });
    // a key that moves once a press is tapped again and again until the hero is in a new cell
    if (m.once)
      out.push({
        name: `tap ${m.scan}`,
        steps: Array.from({ length: 8 }, (_, i) => ({ keys: i % 2 ? [] : [m.scan], until: 'ticks' as const, max: i % 2 ? 3 : 4 })),
      });
  }
  // a jump tapped or held a while, alone, steered from the start (running) or after it
  for (const j of roles.jump)
    for (const press of j.hold ? [1, 6, 18] : [1, 6]) {
      out.push({ name: `jump ${j.scan} ${press}`, steps: [{ keys: [j.scan], until: 'ticks', max: press }] });
      if (j.dx === 0)
        for (const m of sideways) {
          out.push({
            name: `jump ${j.scan} ${press} running ${m.scan}`,
            steps: [
              { keys: [m.scan, j.scan], until: 'ticks', max: press },
              { keys: [m.scan], until: 'land', max: 60 },
            ],
          });
          // a tap steered at once is the running jump; held, steering late is a different arc
          if (press > 1)
            out.push({
              name: `jump ${j.scan} ${press} then ${m.scan}`,
              steps: [
                { keys: [j.scan], until: 'ticks', max: press },
                { keys: [m.scan], until: 'land', max: 60 },
              ],
            });
        }
    }
  for (const a of roles.act) out.push({ name: `use ${a}`, steps: [{ keys: [a], until: 'ticks', max: 1 }] });
  out.push({ name: 'wait', steps: [{ keys: [], until: 'ticks', max: 18 }], waits: true });
  return out;
}

/**
 * The moves as a player with steady, unhurried hands plays them (the Level check's Slower hands):
 * one key at a time, and at least `minTicks` between any two key changes, so a key is held that
 * long, a change of keys lets go first and waits that long, and the next move waits too. Moves
 * that need two keys at once are left out.
 */
export function steadyMoves(moves: Move[], minTicks: number): Move[] {
  const out: Move[] = [];
  const seen = new Set<string>();
  for (const m of moves) {
    if (m.steps.some((s) => s.keys.length > 1)) continue;
    const steps: Step[] = [];
    for (const s of m.steps) {
      const last = steps[steps.length - 1];
      // a different key straight after another: let go first, and wait
      if (last?.keys.length && s.keys.length && last.keys[0] !== s.keys[0]) steps.push({ keys: [], until: 'ticks', max: minTicks });
      steps.push(s.until === 'ticks' ? { ...s, max: Math.max(s.max, minTicks) } : { ...s, max: Math.max(s.max, minTicks), min: minTicks });
    }
    const steady: Move = { ...m, name: `${m.name} steady`, steps, settle: minTicks };
    const k = JSON.stringify(steps);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(steady);
  }
  return out;
}
