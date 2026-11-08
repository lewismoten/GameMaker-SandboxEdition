// Level 9, THE SURVEY LINE (noon): the county survey party has strung plank walkways across the gully so it can
// measure the mountain, then gone to lunch. Tess pulls the survey stakes along them (a mountain is hard enough to
// measure without help). Three decks, a ladder up between each, the first and third heading right and the second
// back left. Some runs of boards are loose and drop away on a clock, as on the lookout; here they are longer, and
// on the first and third decks two runs are out of step with a single sound board between. A fall is only to the
// gully floor: walk back to the ladder and try again.
import { ORIGIN } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, MountainMap, type Level } from '../level';

export const G_SURVEY = 29;
/** The decks' rows (Tess walks on the row above): the first heads right, the second back left, the third right to the door. */
export const DECKS = [22, 15, 8] as const;
export const surveyFeet = (k: number): number => (k < 0 ? G_SURVEY : DECKS[k]) - 1;

export const SURVEY_AT = {
  /** The ladder up onto deck k. */
  ladders: [8, 59, 8],
  /** Loose runs: [deck, first, last, starts gone (out of step)]. */
  loose: [
    [0, 20, 25, false],
    [0, 39, 43, false],
    [0, 45, 49, true],
    [1, 38, 45, false],
    [1, 18, 23, false],
    [2, 19, 24, false],
    [2, 37, 42, false],
    [2, 44, 49, true],
    [2, 63, 70, false],
  ],
  /** Sound stretches [deck, first, last]. */
  sound: [
    [0, 7, 19],
    [0, 26, 38],
    [0, 44, 44],
    [0, 50, 60],
    [1, 46, 70],
    [1, 24, 37],
    [1, 6, 17],
    [2, 7, 18],
    [2, 25, 36],
    [2, 43, 43],
    [2, 50, 62],
    [2, 71, 78],
  ],
  stakes: [
    [0, 11],
    [0, 31],
    [0, 57],
    [1, 67],
    [1, 34],
    [1, 16],
    [2, 12],
    [2, 30],
    [2, 56],
    [2, 74],
  ],
  acorns: [
    [0, 18],
    [0, 37],
    [0, 56],
    [1, 69],
    [1, 25],
    [1, 14],
    [2, 16],
    [2, 33],
    [2, 60],
    [2, 72],
  ],
  pie: [1, 55],
  exit: 76,
  signs: { camp: [-1, 10], two: [0, 33], lunch: [0, 51], hat: [1, 47], form: [1, 10], top: [2, 51] },
} as const;

const SIGNS = {
  camp: ['CREW AT LUNCH, BACK BY 1:00. PULL THE STAKES.', 4, 3],
  two: ['TWO RUNS, OUT OF STEP. REST BETWEEN THEM.', 4, 3],
  lunch: ['LUNCH: 31 ROLLS, 1 THERMOS. NOT A STAKE.', 4, 3],
  hat: ['DO NOT MEASURE THE THING LOOKING BACK.', 4, 3],
  form: ['FORM 27-B: MOVING A MOUNTAIN. WHY?', 4, 3],
  top: ['UP HERE IT LOOKS LIKE A HILL. IT IS NOT.', 4, 3],
} as const;

export function levelSurvey(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['trail', 'tower']);
  const s = addSigns(book, pal, SIGNS);
  const W = 82;
  const A = SURVEY_AT;
  const g = new Grid(W, G_SURVEY + 4);
  g.row(G_SURVEY, 0, W - 1, 'G').fill(0, G_SURVEY + 1, W, 3, 'D');
  g.col(0, 0, G_SURVEY - 1, 'X').col(W - 1, 0, G_SURVEY - 1, 'X');
  g.put(3, G_SURVEY - 2, 's').put(3, G_SURVEY - 1, 'S');
  const m = new MountainMap(book, g.rows());
  const isLadder = (x: number) => (A.ladders as readonly number[]).includes(x);
  // piers under the first deck's sound stretches and the end piers of the upper decks (open at the foot, so the
  // gully floor is walkable); the upper decks hang from their end piers
  const pier = (x: number, top: number) => {
    for (let y = top + 1; y < G_SURVEY; y++) m.set(x, y, y >= G_SURVEY - 2 ? 'legFoot' : 'leg');
  };
  for (const [k, a, b] of A.sound.filter(([k]) => k === 0)) for (const x of [a, b]) if (!isLadder(x)) pier(x, DECKS[k]);
  for (const x of [6, 70]) pier(x, DECKS[1]);
  pier(78, DECKS[2]);
  DECKS.forEach((row, k) => {
    for (const [kk, a, b] of A.sound) if (kk === k) for (let x = a; x <= b; x++) m.set(x, row, x % 4 ? 'deck' : 'deck2');
    for (const [kk, a, b, gone] of A.loose) if (kk === k) for (let x = a; x <= b; x++) m.set(x, row, gone ? 'boardGone' : 'boardUp');
  });
  A.ladders.forEach((x, k) => {
    for (let y = DECKS[k] - 1; y <= surveyFeet(k - 1); y++) m.set(x, y, 'ladder');
  });
  for (const [k, x] of A.stakes) m.set(x, surveyFeet(k), 'post');
  for (const [k, x] of A.acorns) m.set(x, surveyFeet(k), 'acorn');
  m.set(A.pie[1], surveyFeet(A.pie[0]), 'pie');
  m.set(A.exit, DECKS[2] - 2, 'doorTop').set(A.exit, DECKS[2] - 1, 'doorBottom');
  m.exits.push({ from: [A.exit + ORIGIN, DECKS[2] - 1 + ORIGIN] });
  for (const k of Object.keys(s) as (keyof typeof s)[]) {
    const [deck, x] = A.signs[k];
    m.sign(x, onGround(deck < 0 ? G_SURVEY : DECKS[deck], s[k]), s[k]);
  }
  return {
    file: 'survey',
    title: 'The Survey Line',
    hint: 'Pull the stakes. Mind the boards.',
    look: 'noon',
    map: m,
    book,
    timed,
    mon: 'trail',
    song: 'trail',
  };
}
