// The Courier's Star Wheel: how its three discs are laid out and the clearance puzzle it solves.
// The big disc has ten dock letters round its rim; the middle disc turns with ten world marks
// (the ten worlds that hold a star-shard) and, under the small disc's window, a ring of codes; the
// small disc turns on top with ten courier marks. Set a world against a courier mark and the
// window shows a code. Maxima Station's clearance desk asks for one, and three hatches in the pod
// bay each wear a code: the right one opens. printables.json's wheel and its "Tell me the answer"
// must agree with this file (wheelDecoder.test.ts), and so must the hatches' pictures (build).
import { CODES, GLYPHS, MARKS, WORLDS } from './glyphs';

export { GLYPHS };

export const OUTER = 'ABCDEFGHIJ'.split('');
export const MIDDLE = WORLDS.map((w) => `world ${w}`);
export const INNER = MARKS.map((m) => `mark ${m}`);

/** The ring of codes printed on the middle disc under the small disc's window, clockwise from the world mark. */
export const HIDDEN: string[][] = [['Rocket', 'Star', 'Bolt', 'Flag', 'Key', 'Heart', 'Rocket', 'Bolt', 'Star', 'Flag'].map((c) => `code ${c}`)];

/** One window in the small disc, at its first mark. */
export const WINDOWS = [{ at: 0, ring: 0, label: 'CODE' }];

const n = OUTER.length;
const place = (k: number) => ((k % n) + n) % n;

/** What window `w` shows with `world` and `mark` under the arrow (the dock letter does not change it). */
export function codeFor(world: string, mark: string, w = 0): string {
  const win = WINDOWS[w];
  return HIDDEN[win.ring][place(win.at - INNER.indexOf(mark) + MIDDLE.indexOf(world))];
}

/** The clearance form the desk hands Max: his dock, world of origin and courier badge mark. */
export const CLEARANCE = { dock: 'F', world: 'world Prism', mark: 'mark Chevron' };

/** The code the form works out to. */
export const CLEARANCE_CODE = codeFor(CLEARANCE.world, CLEARANCE.mark);

/**
 * The three hatches in the pod bay, bottom to top. Each wears a code; the other two are the codes a
 * wheel would show a mark early or a mark late, so a near-miss reads wrong. The middle one is right.
 */
export const HATCH_OPEN = 1;
export const HATCHES: string[] = (() => {
  const i = INNER.indexOf(CLEARANCE.mark);
  const next = (d: number) => codeFor(CLEARANCE.world, INNER[place(i + d)]);
  const out = [next(1), CLEARANCE_CODE, next(-1)];
  if (new Set(out).size !== 3) throw new Error('the three hatches must wear three different codes');
  if (!out.every((c) => GLYPHS[c])) throw new Error('a hatch wears a code without a picture');
  return out;
})();

/** Scenes beyond the hundred: the clerk's form, and what each wrong hatch says. */
export const WHEEL_SCENES = { form: 101, wrong: [102, 103] } as const;

/** Every code is a picture on the wheel. */
export const ALL_CODES = CODES.map((c) => `code ${c}`);
