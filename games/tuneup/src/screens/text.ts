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
    'The town parade is tomorrow.',
    '',
    'The Clown Club is the band.',
    'Their instruments sat ready',
    'in the big red trunk.',
    '',
    'Then Gwinn found the trunk.',
    '',
    'Over it went. Out flew every',
    'keyboard, fiddle, horn and',
    'drum, all over town, a whole',
    'family of instruments in',
    'every neighborhood.',
  ],
  [
    'Doc Leo is waiting at the',
    'bandstand. He is not worried.',
    'He has Teddy.',
    '',
    'Fetch each family home. Every',
    'time you do, the band can',
    'play one more part of the',
    'parade tune.',
    '',
    'Gwinn is very sorry. She is',
    'also having the best night',
    'of her life.',
  ],
);

export const INSTRUCTIONS = pages(
  [
    'ARROWS walk.',
    'UP hops (hold it to hop',
    'higher). Q and E hop left',
    'and right.',
    'DOWN sits.',
    'SPACE boops (paws up, nose',
    'to whatever is above).',
    '',
    'An instrument to find wears',
    'a gold frame. The ones in',
    'shop windows are just for',
    'looking.',
    '',
    'A door out of a neighborhood',
    'opens when its whole family',
    'is found. F2 counts them.',
  ],
  [
    'Floating notes ring as you',
    'touch them.',
    '',
    'In the player piano, notes',
    'drop down two glass tubes.',
    'Stand under a key and press',
    'SPACE as the note lands on',
    'it. No hurry: the key stays',
    'lit for a while.',
    '',
    'The row of notes across the',
    'top turns gold as the song',
    'plays. When all are gold and',
    'you have played 12 notes,',
    'the door at the end opens.',
    'Missed some? Keep playing.',
  ],
  [
    'At the roller rink, Teddy',
    'skates on his own. Tap UP or',
    'DOWN to change lanes; LEFT',
    'holds him back.',
    '',
    'On the marching field, tap',
    "UP or DOWN to move Doc Leo's",
    'baton to a line, and press',
    'SPACE as its note arrives.',
    '',
    'In the woods, climb the',
    'cattail by a staff door to',
    'the hollow note and press',
    'SPACE to play it.',
    '',
    'F fetches a thing to carry.',
  ],
  [
    'Ropes and harp strings: UP',
    'climbs, DOWN lets you down.',
    'Stand in a speaker to ride',
    'it up to the ducts.',
    '',
    'Bell curtains swing open',
    'when the clock hand reaches',
    'the gold.',
    '',
    'On the farm, press SPACE',
    'under a hook while its',
    'instrument is lit.',
    '',
    "Play Doc Leo's chords to",
    'open the trunk. Drum doors',
    'take turns.',
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
    'The instruments are the',
    'pictures and sounds of the',
    "music editor's presets.",
    '',
    'Starring Teddy as himself,',
    'Gwinn as herself, Doc Leo as',
    'the friendliest hobo clown in',
    'the Clown Club, and the Clown',
    'Club as the parade band.',
  ],
  [
    'No instruments were harmed.',
    'Gwinn would like that on the',
    'record.',
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
    'The night before the town parade, Gwinn knocks over the Clown Club',
    "band's instrument trunk. Teddy fetches every family of instruments",
    'home to Doc Leo at the bandstand, one neighborhood at a time.',
    '',
    'To play, run TUNEUP.EXE (or PLAYGAME TUNEUP.GAM).',
    'A Sound Blaster plays the music and the notes; the PC speaker plays',
    'the notes without one.',
    '',
    'Free to share: see LICENSE.TXT.',
    '',
  ].join('\n');
}
