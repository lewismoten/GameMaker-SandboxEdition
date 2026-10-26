// The Heart's own monster file (heart.mon / heart.mbl): the station machines' hard edition,
// with five slots the Heart never uses given to the boss's later phases. The Heart Eye takes
// three hits (a plasma bolt, a shield orb, or ramming it, which hurts). After each of the
// first two it reels away up the hall, flashing and untouchable for two seconds, and comes
// back wounded, then failing and faster; at the third it bursts into the Core Light, which
// drifts to the courier and charges the seal in front of the exit (src/levels/core.ts).
import { eight, type Creature } from '../bestiary';
import { SEAL_COUNTER } from '../../ids';
import { harder } from '../fauna';
import { mechFauna } from './mech';
import { L } from './define';

/** How much charge the Core Light gives the seal: each seal block it opens takes one. */
const SPARK_CHARGE = 4;

/** The machines the Heart's map never places, and so the slots its boss phases take. */
const FREE = ['Crawler', 'Sentry Drone', 'Gun Turret', 'Security Bot', 'Spider Bot'];

/** Ticks the eye reels after a hit before it comes back. */
const REEL = 36;

export function heartFauna(): Creature[] {
  const list = harder(mechFauna());
  const at = (name: string) => list.findIndex((c) => c.name === name);
  // (L puts the name first, so the eye's own name and note must not ride along in the spread)
  const { name: _name, note: _note, ...eye } = list[at('Heart Eye')];
  // reeling: drawn in the Core's glow, flashing, and too strong to touch or shoot (power
  // over 100, no bite), it rises away from the courier until its time runs out
  const reel = (name: string, note: string, next: string): Creature =>
    L(name, note, {
      ...eye,
      hide: 'glow',
      accent: 'hazard',
      frames: 2,
      anim: 1,
      move: { kind: 'path', corners: [[0, -6, 2]] },
      attack: undefined,
      power: 120,
      dmg: 0,
      end: REEL,
      becomes: next,
      score: 0,
    });
  const phases: Creature[] = [
    reel('Stunned Eye', 'The Heart Eye, hit. It reels away to gather itself.', 'Wounded Eye'),
    L('Wounded Eye', 'The Heart Eye, cracked once. It comes for you now.', {
      ...eye,
      frames: 1,
      move: { kind: 'towards', speed: 1 },
      attack: undefined,
      becomes: 'Reeling Eye',
      score: 5000,
    }),
    reel('Reeling Eye', 'Hit twice. It reels away again.', 'Failing Eye'),
    L('Failing Eye', 'Cracked twice, and quicker for it. One more.', {
      ...eye,
      spikes: true,
      frames: 2,
      anim: 3,
      move: { kind: 'towards', speed: 2 },
      attack: undefined,
      becomes: 'Core Light',
      score: 5000,
    }),
    L('Core Light', 'The light of the Core, set free. It finds you.', {
      arch: 'wisp',
      hide: 'glow',
      accent: 'accent',
      frames: 2,
      anim: 2,
      move: { kind: 'towards', speed: 2 },
      walls: false,
      // stronger than anything still in the hall, so no stray drone can snuff it out; the
      // courier takes it by touch (under 100, the courier's own power)
      power: 99,
      dmg: 0,
      score: 10000,
      place: 'none',
      block: { chHitPt: 25, effect: SEAL_COUNTER, eamt: SPARK_CHARGE },
    }),
  ];
  FREE.forEach((name, k) => (list[at(name)] = phases[k]));
  // the first phase circles before the Guardian and swoops at a courier who comes near;
  // plasma (75) and a shield orb (90) both crack it now
  list[at('Heart Eye')] = {
    ...eye,
    name: 'Heart Eye',
    note: 'The eye of the Maximus Core. Three hits, by plasma, shield orb or ramming (that hurts), set its light free.',
    move: { kind: 'path', corners: eight(3, 1) },
    attack: { relative: true, corners: [[0, 0, 2]] },
    power: 74,
    dmg: 15,
    becomes: 'Stunned Eye',
  };
  for (const n of ['Wounded Eye', 'Failing Eye']) list[at(n)] = { ...list[at(n)], power: 74, dmg: 15 };
  return list;
}
