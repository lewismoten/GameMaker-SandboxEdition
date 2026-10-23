// The words: the story, the instructions and the credits as text pages (30 columns, 16
// lines a page), the level cards' lines (from the song), and the disk's README.TXT.
// The lyrics are from "Third Goat from the Left" by The Bard of Bizarre.
import { withCreditPage } from '../../../kit/license';

const page = (lines: string[], pages = 1) => {
  for (const l of lines) if (l.length > 30) throw new Error(`Text line over 30 columns: "${l}"`);
  if (lines.length > 16 * pages) throw new Error(`Text over ${pages} page(s): "${lines[0]}"`);
  while (lines.length % 16) lines.push('');
  return lines.join('\n');
};

export const TITLE = 'THIRD GOAT FROM THE LEFT';
export const AUTHOR = 'The Bard of Bizarre';

/**
 * Who made the song: the lyrics, and the recording and cover art the game's music and clips come
 * from. Used by LICENSE.TXT (the credits page and the README spell it out to fit their columns;
 * about.json says the same in its blurb).
 */
export const SONG_CREDIT =
  "lyrics shaped by ChatGPT from Lewis Moten's prompt (one of his 'bizarre gospels'); recording and cover art made with Riffusion (now Google Flow Music)";

export const STORY = [
  page([
    'I was there that night in',
    'Bethlehem,',
    'Manger-side, behind the lambs.',
    'The stars were bright, the',
    'angels loud,',
    'But somehow I got missed in',
    'the crowd.',
    '',
    "The donkey's in paintings,",
    'the ox gets praise,',
    'Even pigeons got hymns these',
    'days.',
    'But me? I stood there,',
    'chewing hay,',
    'A holy birth just feet away.',
  ]),
  page([
    'You are a goat. Not the',
    'donkey. Not the ox. Not one',
    'of the camels with all that',
    'flair. Just a goat - the one',
    'nobody painted.',
    '',
    'Tonight the shepherds left',
    'the field in a hurry, the',
    'whole town is in Bethlehem to',
    'be counted, and three kings',
    'have parked their camels by',
    'the inn. Something wonderful',
    'is happening in the stable.',
    '',
    'You are going to be there.',
    'Third from the left.',
  ]),
].join('\n');

export const INSTRUCTIONS = [
  page([
    "Get from the shepherds' field",
    'to the stable in Bethlehem',
    'and take your place in the',
    'line at the manger: third',
    'from the left.',
    'ARROWS or W A S D walk; Q/E',
    'and keypad 1/3 go diagonally.',
    '',
    'EAT: walk into anything a',
    'goat would eat. Hay and',
    'thistles fill your BREATH,',
    'cabbages and figs your',
    'health. Rope, laundry, a',
    'sandal... a goat eats it all.',
    'Out of breath? Lean on a well',
    'or trough; sip when it glints.',
  ]),
  page([
    'SPACE: SCREAM the way you',
    'last walked. It costs one',
    'BREATH. Your fainting cousins',
    'stand in the narrow places;',
    'a scream makes them keel over',
    'stiff for a few seconds. Walk',
    'right over them.',
    '',
    'Screams scare off pigeons',
    'too. Camels are not impressed.',
    '',
    'B bleats for joy, C chews',
    'quietly. All night long.',
    '',
    "Thorns, the shepherds' fire,",
    'camels and spit hurt.',
  ]),
  page([
    'WOOL: tufts snag on thorn',
    'bushes, and every lamb you',
    'bump gives you a little. Gold',
    'and frankincense are not for',
    'goats; wool is your gift. The',
    'empty place in the line takes',
    'five. The line jostles: when',
    'a neighbor leans in, wait.',
    'A goat bell is an extra life.',
    'Do not kick the pail.',
    '',
    'F1 help      F2 counters',
    'F3 music     F4 sound',
    'F5 save      F6 load',
    'ESC quit',
  ]),
].join('\n');

/** Each level's card: its name and two lines of the song. */
export const CARDS: { title: string; where: string; lines: [string, string] }[] = [
  { title: '1. THE FIELD', where: "The shepherds' field", lines: ['The stars were bright,', 'the angels loud,'] },
  { title: '2. BETHLEHEM', where: 'Everyone here to be counted', lines: ['But somehow I got missed', 'in the crowd.'] },
  { title: '3. THE CARAVAN', where: 'Three kings, many camels', lines: ['The wise men strutted', 'with camel flair,'] },
  { title: '4. THE STABLE', where: 'Manger-side, behind the lambs', lines: ['I sneezed on Joseph,', 'kicked a pail...'] },
];

const CREDITS_TEXT = page(
  [
    TITLE,
    'by The Bard of Bizarre, 1995',
    'Shareware from The Sofa BBS',
    '',
    'Based on the song "Third Goat',
    'from the Left" by The Bard of',
    'Bizarre (Lewis Moten as his',
    'hobo clown, Doc Leo), one of',
    "the Bard's bizarre gospels.",
    '',
    "Lyrics: ChatGPT, from Lewis's",
    'prompt. Recording and cover',
    'art: Riffusion (now Google',
    "Flow Music). This game's FM",
    'music and sampled sounds are',
    'made from the recording.',
    'The Bard of Bizarre logo:',
    'DeepAI. Doc Leo photo: Lewis',
    'Moten.',
    '',
    'Game: blocks, maps, sprites',
    'and the FM arrangement by',
    'Claude, built as Game-Maker',
    '3.0 files. Made with GAME-',
    'MAKER by Recreational',
    'Software Designs.',
    '',
    'Third goat from the left -',
    'forgotten but true!',
  ],
  2,
);

/** The credits, ending with the FREE TO SHARE page (kit/license.ts). */
export const CREDITS = withCreditPage(CREDITS_TEXT, true);

export function readme(price: string): string {
  return `
    THIRD GOAT FROM THE LEFT
    Version 1.0 - December 1995
    by The Bard of Bizarre

"Third goat from the left -
 forgotten but true!
 I saw it all, from my
 front-stall pew."

You are the goat nobody
painted. Get from the
shepherds' field, through
Bethlehem and past the wise
men's camels, to the stable -
and take your place in the line
at the manger. Third from the
left.

Eat anything. Scream at your
fainting cousins (they keel
over stiff). Collect wool for
a gift. Do not kick the pail.

STARTING THE GAME
  Type GOAT and press Enter.
  VGA required. A Sound Blaster
  is recommended for the music
  and the singing.

FILES IN THIS ZIP
  GOAT.GAM     the game
  *.MAP        four levels
  GOAT.BBL     blocks
  *.SND        sound effects
  *.CMF        Sound Blaster
               music
  *.VOC        sampled sound
  *.GIF        pictures
  README.TXT   this file
  LICENSE.TXT  then and now

THIS IS SHAREWARE
  Copy it, give it to friends,
  upload it to your favorite
  BBS - all the files, please,
  unchanged.

  If it made you smile,
  register for ${price}: you get
  a goat sticker (third from
  the left) and a hand-drawn
  goat. Send a check (US funds)
  to:

    The Bard of Bizarre
    c/o The Sofa BBS
    Pittsburgh, PA

  (In the story only: there is
  nothing to pay and nowhere to
  mail. The game is free to
  play, share and change (MIT
  license; its voice clips are
  for personal, non-commercial
  use only); see LICENSE.TXT.)

  Leave a message for DOC LEO
  on The Sofa BBS,
  1-412-555-0177.

CREDITS (NOW)
  The song "Third Goat from the
  Left": lyrics shaped by
  ChatGPT from Lewis Moten's
  prompt (one of his "bizarre
  gospels" as The Bard of
  Bizarre); the recording and
  its cover art were made with
  Riffusion (now Google Flow
  Music).
  The logo was made with
  DeepAI; the Doc Leo photo is
  Lewis's own. The music and
  sampled sounds here are made
  from that recording. Built by
  Claude with GAME-MAKER 3.0 by
  Recreational Software
  Designs.

He sees you.
`.replace(/^\n/, '');
}
