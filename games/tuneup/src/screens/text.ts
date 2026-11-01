// The words: text pages Game-Maker writes over the paper screens (30 columns, 16 lines a page)
// and the readme on the disk.
import { withCreditPage } from '../../../kit/license';
import about from '../../about.json';

/** Pads a page to 16 lines and checks the width. */
const page = (lines: string[]) => {
  for (const l of lines) if (l.length > 30) throw new Error(`Text line over 30 columns: "${l}"`);
  if (lines.length > 16) throw new Error(`Page over 16 lines: "${lines[0]}"`);
  while (lines.length < 16) lines.push('');
  return lines.join('\n');
};
const pages = (...ps: string[][]) => ps.map(page).join('\n');

export const STORY = pages(
  [
    'It is the morning of the',
    'Clown Club parade, and',
    'THE CHEZ is meant to lead it.',
    '',
    'Overnight, Gwinn buried Doc',
    "Leo's toolbox in the yard and",
    "tipped the Clown Club's",
    'instrument trunk into the',
    'open hood.',
    '',
    'Now the car honks like a',
    'kazoo and rattles like a',
    'tambourine.',
  ],
  [
    'No wrenches? No problem.',
    '',
    'Doc Leo will give THE CHEZ a',
    'tune-up by ear. He does his',
    'shrinking trick and climbs',
    'inside, and Sir Reginald III,',
    'his rubber chicken, does the',
    'fiddly bits: he fits where',
    "Doc Leo can't.",
    '',
    'Teddy rides along in the',
    'front passenger seat.',
    '',
    'Just a really good ear.',
  ],
);

export const INSTRUCTIONS = pages(
  [
    'Left and Right walk.',
    'Up hops (Q and E hop left',
    'and right). On a wire, Up',
    'climbs and Down climbs down.',
    '',
    'Space reaches up. Hold it',
    'under a crank to turn it.',
    '',
    'JUMP START: find the red and',
    'black clamps, each opens its',
    'terminal. Then crank till',
    'the gauge is full.',
  ],
  [
    'SPARK PLUCKS: climb each plug',
    'wire and pluck its plug. The',
    'sparks run in firing order:',
    'first, third, fourth, second.',
    'Wait for yours to pass. A',
    'spark frizzes your hair (a',
    'little energy).',
    '',
    'THE TIMING BEAT: notes drop',
    'down the pipes onto the keys.',
    'Press Space as a note lands:',
    'on the beat scores best. Each',
    'verse ends when the meter at',
    'the top fills; the gate opens',
    'if you played enough notes.',
  ],
  [
    "OIL'S WELL: Z X C V B squirt",
    'oil into the staff lines,',
    'bottom to top. An oiled',
    'Squeak becomes a note that',
    'floats home to you. Bring',
    'them all home.',
    '',
    'F2 shows your clamps, plucks,',
    'notes, energy and tips.',
    'F5 saves, F6 loads.',
  ],
);

const CREDITS_TEXT = pages(
  [
    'TUNE-UP',
    `Version ${about.version} - November 1994`,
    '',
    'Design, art, music and',
    'programming: Claude Opus 5.5',
    '',
    "Doc Leo's sprite: the one",
    'drawn for CERTIFIED RAT',
    'TICKLER, in a shop coat.',
    '',
    'Starring Doc Leo as the',
    'friendliest hobo clown in',
    'the Clown Club, Sir Reginald',
    'III as himself (and later',
    'herself), Teddy and Gwinn.',
  ],
  [
    'No wrenches were harmed.',
    'Gwinn would like that on the',
    'record.',
    '',
    'The songs are played on the',
    "music editor's instrument",
    'presets; the slide whistle',
    'is synthesized.',
    '',
    'Made with GAME-MAKER 3.0 by',
    'Recreational Software',
    'Designs. No programming',
    'required!',
  ],
);

export const CREDITS = withCreditPage(CREDITS_TEXT);

export function readme(): string {
  return [
    'TUNE-UP',
    `Version ${about.version} - November 1994`,
    'A Sandbox Software game, made with Game-Maker 3.0.',
    '',
    "It's the morning of the Clown Club parade, and THE CHEZ won't run",
    'right: Gwinn tipped the instrument trunk into the hood. With no',
    'wrenches, Doc Leo shrinks down and tunes it up by ear, with Sir',
    'Reginald III, his rubber chicken, doing the fiddly bits.',
    '',
    'To play, run TUNEUP.EXE (or PLAYGAME TUNEUP.GAM).',
    'A Sound Blaster plays the music and the notes; the PC speaker plays',
    'the notes without one.',
    '',
    'Free to share: see LICENSE.TXT.',
    '',
  ].join('\n');
}
