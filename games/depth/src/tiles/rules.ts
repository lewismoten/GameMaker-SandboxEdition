// How each kind of block behaves in each focus plane: Game-Maker's solid sides, hit points,
// points, counters and what it turns into when touched.
import { CROWN, MON, lensCounters } from '../ids';
import type { Behavior, Rules } from './book';
import { SOLID } from './book';
import type { Plane } from './cells';

/** Falling into the void: enough to end any life at once. */
export const FALL = -999;

/** Ticks an auto-focus panel stays in focus, and out. */
export const PULSE = 40;

export interface LevelRules {
  level: number;
  /** Extra kinds of this level. */
  extra?: (kind: string, plane: Plane, part: number) => Behavior | undefined;
}

export function rulesFor(o: LevelRules): Rules {
  const [cr, cg, cb] = lensCounters(o.level);
  return (kind, plane, part) => {
    const x = o.extra?.(kind, plane, part);
    if (x) return x;
    switch (kind) {
      case 'wall':
      case 'orb':
        return { solid: SOLID };
      case 'near':
        return plane === 'near' ? { solid: SOLID } : {};
      case 'far':
        return plane === 'far' ? { solid: SOLID } : {};
      case 'pit':
      case 'void':
        return { hp: FALL };
      case 'nbridge':
        return plane === 'near' ? {} : { hp: FALL };
      case 'fbridge':
        return plane === 'far' ? {} : { hp: FALL };
      case 'photon':
        return { score: 25, touch: 'floor' };
      case 'bulb':
        return { hp: 30, score: 10, touch: 'floor' };
      case 'lensR':
        return { effect: cr, eamt: 1, score: 250, touch: 'floor' };
      case 'lensG':
        return { effect: cg, eamt: 1, score: 250, touch: 'floor' };
      case 'lensB':
        return { effect: cb, eamt: 1, score: 250, touch: 'floor' };
      case 'gateR':
        return { solid: SOLID, effect: cr, eamt: -1, score: 100, touch: 'floor' };
      case 'gateG':
        return { solid: SOLID, effect: cg, eamt: -1, score: 100, touch: 'floor' };
      case 'gateB':
        return { solid: SOLID, effect: cb, eamt: -1, score: 100, touch: 'floor' };
      case 'pulseA':
        return { next: { kind: 'pulseB', time: PULSE } };
      case 'pulseB':
        return { hp: FALL, next: { kind: 'pulseA', time: PULSE } };
      case 'slopeN':
        return { grav: 1 };
      case 'slopeE':
        return { grav: 2 };
      case 'slopeS':
        return { grav: 4 };
      case 'slopeW':
        return { grav: 8 };
      case 'crystal':
      case 'pillar':
        return { solid: SOLID };
      case 'teapot':
        return { solid: SOLID, birth: { mon: MON.steam, time: 70 } };
      case 'nest':
        return { solid: SOLID, birth: { mon: MON.bat, time: 90 } };
      case 'chez':
        // plugged in at the rear passenger side: push against it to charge up
        return part === 2 ? { solid: SOLID, hp: 2 } : { solid: SOLID };
      case 'egg':
        // an object: walking over it does nothing; the pick-up key (Enter) takes it
        return { obj: true, score: 1996, touch: 'floor' };
      case 'crowngate':
        return { solid: SOLID, effect: CROWN, eamt: -1, score: 1000, touch: 'floor' };
      default:
        return {};
    }
  };
}
