// The level check's moves: short scripts of held keys (walk a cell, jump, jump and steer,
// run and jump, use a trick, wait) made from what each of the character's keys does
// (keymap/keyMap.ts characterActions), so the explorer plays any game with the keys it has.
import { characterActions } from '../keymap/keyMap';
import { CHARBL, MONBL } from '../../formats/blocks';
import type { Character } from '../../formats/character';

/** One part of a move: hold these keys until `until` says stop (or `max` ticks pass). */
export interface Step {
  keys: number[];
  /** 'cell': the character's cell changed; 'land': it is on the ground again; 'ticks': after max ticks. */
  until: 'cell' | 'land' | 'ticks';
  max: number;
}

export interface Move {
  name: string;
  steps: Step[];
  /** Only tried where something nearby changes with time (a lift, a timed block). */
  waits?: boolean;
}

export interface KeyRoles {
  move: { scan: number; dx: number; dy: number }[];
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
    else if (action.kind === 'move') roles.move.push({ scan, dx: Math.sign(dx), dy: Math.sign(dy) });
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
