// The score table a walkthrough shows at the end: a game fresh off the disk has an empty Top
// Ten, so the walkthrough fills its blank places with made-up callers' scores, the way a
// well-played copy of the game would look. Only the walkthrough's own copy of the files is
// changed (runtime.ts); real entries stay where they are. The scores are scaled to the game:
// around what the walkthrough itself scored, rounded to the game's own steps, so a game that
// counts in hundreds doesn't show a table of fives. A game that never scores keeps a blank table.
import type { HighScore } from '../formats/highscore';

/** Made-up callers (BBS handles of the day; no real people). */
const NAMES = [
  'PIXEL WIZARD',
  'MONSTER MASH',
  'SCROLLMASTER',
  'THE BLOCKSMITH',
  'SAND CASTLE',
  'JOYSTICK JOE',
  'TURBO TINA',
  'DISKETTE DAN',
  'VGA VAL',
  'MODEM MOLLY',
  'BYTE BANDIT',
  'HIGH SCORE HAL',
];

/** The largest of 1000, 500, 100, 50, 10, 5 and 1 that the score is a multiple of. */
function stepOf(score: number): number {
  for (const s of [1000, 500, 100, 50, 10, 5]) if (score % s === 0) return s;
  return 1;
}

/** A small seeded shuffle, so a game's table is the same in every run of its walkthrough. */
function shuffled<T>(list: readonly T[], seed: number): T[] {
  const out = [...list];
  let s = seed >>> 0 || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The table with its blank places filled: scores from a little above `score` (the
 * walkthrough's own) down to about a sixth of it, sorted best first with the real ones.
 */
export function fillBlankScores(table: HighScore[], score: number, seed: number): HighScore[] {
  const real = table.filter((e) => e.score > 0);
  const blanks = table.length - real.length;
  if (!blanks || score <= 0) return table;
  const step = stepOf(score);
  const top = score * 1.2;
  const names = shuffled(NAMES, seed);
  const made = Array.from({ length: blanks }, (_, i) => {
    const f = blanks === 1 ? 1 : 1 - (i / (blanks - 1)) * 0.85;
    return { score: Math.max(step, Math.round((top * f) / step) * step), name: names[i % names.length] };
  });
  return [...real, ...made].sort((a, b) => b.score - a.score).slice(0, table.length);
}
