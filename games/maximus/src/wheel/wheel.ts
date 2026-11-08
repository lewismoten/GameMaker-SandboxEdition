// The Courier's Star Wheel: how its three discs are laid out and the clearance puzzle it solves.
// The big disc (the third) has ten dock letters round its rim and, under the others, a ring of codes.
// The middle disc turns with ten world marks and a ring of its own: some cells print a code, the
// rest are holes cut through, so what is under them is the big disc's print. The small disc turns
// on top with ten courier marks and two windows on the same ring. Each window shows the middle
// disc's code, or, over a hole, the big disc's. Set a dock, a world and a courier mark, then read
// the two windows in order round the ring (first, then second): a pair of pictures. Maxima
// Station's clearance desk asks for one, and three hatches in the pod bay each wear a pair: the
// right one opens. printables.json's wheel and its "Tell me the answer" must agree with this file
// (maximusDecoder.test.ts), and so must the hatches' pictures (build).
import { CODES, GLYPHS, MARKS, WORLDS } from './glyphs';

export { GLYPHS };

export const OUTER = 'ABCDEFGHIJ'.split('');
export const MIDDLE = WORLDS.map((w) => `world ${w}`);
export const INNER = MARKS.map((m) => `mark ${m}`);

/**
 * The middle disc's ring of codes under the small disc's windows, clockwise from the world mark.
 * '' is a hole cut through the disc (no two side by side, so the paper between keeps its strength).
 */
export const HIDDEN: string[][] = [['', 'Rocket', '', 'Key', 'Flag', '', 'Star', 'Rocket', 'Rocket', 'Heart'].map((c) => (c ? `code ${c}` : ''))];

/** The big disc's ring of codes, clockwise from its dock letter A: seen only through a hole in the middle disc. */
export const BEHIND: string[][] = [['Heart', 'Bolt', 'Heart', 'Key', 'Heart', 'Star', 'Star', 'Heart', 'Flag', 'Heart'].map((c) => `code ${c}`)];

/** Two windows in the small disc on one ring, three marks apart; read in this order. */
export const WINDOWS = [
  { at: 0, ring: 0, label: 'FIRST' },
  { at: 3, ring: 0, label: 'SECOND' },
];

const n = OUTER.length;
const place = (k: number) => ((k % n) + n) % n;

/** What window `w` shows with a dock, a world and a mark under the arrow: the middle disc's code, or through its hole the big disc's. */
export function windowShows(dock: string, world: string, mark: string, w: number): string {
  const win = WINDOWS[w];
  const p = win.at - INNER.indexOf(mark);
  return HIDDEN[win.ring][place(p + MIDDLE.indexOf(world))] || BEHIND[win.ring][place(p + OUTER.indexOf(dock))];
}

/** The code the wheel gives: what the windows show, in order round the ring. */
export function codeFor(dock: string, world: string, mark: string): string[] {
  return WINDOWS.map((_, w) => windowShows(dock, world, mark, w));
}

/** The clearance form the desk hands Max: his dock, world of origin and courier badge mark. */
export const CLEARANCE = { dock: 'F', world: 'world Prism', mark: 'mark Chevron' };

/** The code the form works out to. */
export const CLEARANCE_CODE = codeFor(CLEARANCE.dock, CLEARANCE.world, CLEARANCE.mark);

/**
 * The three hatches in the pod bay, bottom to top. Each wears a code (a pair); the other two are the codes a
 * wheel would show a mark early or a mark late, so a near-miss reads wrong. The middle one is right.
 */
export const HATCH_OPEN = 1;
export const HATCHES: string[][] = (() => {
  const i = INNER.indexOf(CLEARANCE.mark);
  const next = (d: number) => codeFor(CLEARANCE.dock, CLEARANCE.world, INNER[place(i + d)]);
  const out = [next(1), CLEARANCE_CODE, next(-1)];
  if (new Set(out.map((c) => c.join())).size !== 3) throw new Error('the three hatches must wear three different codes');
  if (!out.every((c) => c.every((x) => GLYPHS[x]))) throw new Error('a hatch wears a code without a picture');
  return out;
})();

/** Scenes beyond the hundred: the clerk's form, and what each wrong hatch says. */
export const WHEEL_SCENES = { form: 101, wrong: [102, 103] } as const;

/** Every code is a picture on the wheel. */
export const ALL_CODES = CODES.map((c) => `code ${c}`);
