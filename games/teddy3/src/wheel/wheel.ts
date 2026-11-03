// The Face Dial: how its rings are laid out, and the gates in the game it opens. The big disc
// has the top halves of nine faces from the cast round its rim; the small disc turns on top with
// the bottom halves of the same nine in a different order, and a spiral of seven windows, each
// onto a ring of signs of its own (printed on the big disc under it). Turn the small disc until
// a face joins (its top and bottom halves meet under the arrow) and the seven windows show a
// code: seven signs. The three gates in Firefly Meadow (levels/meadow.ts) each wear seven signs;
// the one that wears the code a face shows is the gate that opens. printables.json's dial and its
// "Tell me the answer" must agree with this file (web/src/manual/printables/teddyDecoder.test.ts).
import { FACES } from './faces';
import { SYMBOLS } from './symbols';

/** The big disc's faces, clockwise from the arrow. */
export const OUTER = ['Teddy', 'Gwinn', 'Doc Leo', 'Juggles', 'Honker', 'Pratfall', 'Crier', 'Goose', 'Poodle'];

/** The small disc's: the same nine in another order (nine is odd, so no two faces join at the same turn). */
export const INNER = OUTER.map((_, i) => OUTER[(i * 5) % OUTER.length]);

/** The signs on the big disc under the small one: seven rings, outermost first, one sign against each place. */
export const HIDDEN: string[][] = [
  ['bone', 'heart', 'heart', 'nose', 'slice', 'star', 'hat', 'star', 'slice'],
  ['paw', 'bone', 'paw', 'balloon', 'heart', 'balloon', 'nose', 'slice', 'paw'],
  ['bone', 'nose', 'bone', 'heart', 'paw', 'paw', 'hat', 'slice', 'balloon'],
  ['nose', 'balloon', 'balloon', 'star', 'star', 'bone', 'paw', 'slice', 'balloon'],
  ['paw', 'paw', 'nose', 'star', 'bone', 'slice', 'heart', 'star', 'slice'],
  ['bone', 'balloon', 'paw', 'heart', 'balloon', 'slice', 'nose', 'bone', 'paw'],
  ['hat', 'paw', 'heart', 'balloon', 'slice', 'hat', 'star', 'balloon', 'nose'],
];

/** The small disc's seven windows, in a spiral: beside which of its faces each is cut, the ring it opens onto, and its number. */
export const WINDOWS = HIDDEN.map((_, i) => ({ at: i, ring: i, label: String(i + 1) }));

export const GLYPHS: Record<string, string[]> = { ...FACES, ...SYMBOLS };

/** How many places the big disc is ahead of the small one when a face joins (its top half's place less its bottom half's). */
export function turnOf(face: string): number {
  const n = OUTER.length;
  return (((OUTER.indexOf(face) - INNER.indexOf(face)) % n) + n) % n;
}

/** The seven signs the windows show when a face is joined, window 1 first. */
export function codeOf(face: string): string[] {
  const t = turnOf(face);
  return WINDOWS.map((w) => HIDDEN[w.ring][(w.at + t) % OUTER.length]);
}

/** The Firefly Meadow's gates, west to east: the face each code is (the middle gate is Gwinn's) and which gate is true. */
export const GATES = { faces: ['Honker', 'Gwinn', 'Doc Leo'], open: 1 };

/** What each gate wears: seven signs. */
export const GATE_CODES = GATES.faces.map(codeOf);
