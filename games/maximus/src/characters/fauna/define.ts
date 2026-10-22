// Shorthands for writing a creature: C(creature) checks the type, L(name, note, rest) puts
// the name and the field-guide note first so the long lists read like a bestiary.
import type { Creature } from '../bestiary';

/** Shorthand for a creature definition. */
export const C = (c: Creature): Creature => c;
export const L = (name: string, note: string, rest: Omit<Creature, 'name' | 'note'>): Creature => ({ name, note, ...rest });
