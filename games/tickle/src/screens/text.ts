// The words: the story, the instructions and the credits as text pages (30 columns, 16 lines a
// page), the level cards' lines (from the song), and the disk's README.TXT. The lyrics are from
// "Certified Rat Tickler" by The Bard of Bizarre.
import { withCreditPage } from '../../../kit/license';
import { NEEDED } from '../ids';

const page = (lines: string[], pages = 1) => {
  for (const l of lines) if (l.length > 30) throw new Error(`Text line over 30 columns: "${l}"`);
  if (lines.length > 16 * pages) throw new Error(`Text over ${pages} page(s): "${lines[0]}"`);
  while (lines.length % 16) lines.push('');
  return lines.join('\n');
};

export const TITLE = 'CERTIFIED';
export const SUBTITLE = 'RAT TICKLER';
export const AUTHOR = 'The Bard of Bizarre';

/**
 * Who made the song and the pictures: the lyrics, the music (no recording came with the song, so
 * Claude composed the game's), and the title, cover and certificate art, which Claude drew for the
 * game. Used by LICENSE.TXT (the credits page and the README spell it out to fit their columns;
 * about.json says the same in its blurb).
 */
export const SONG_CREDIT =
  "lyrics shaped by ChatGPT from Lewis Moten's prompts (after much back and forth); no recording came with the song, so its music was composed for this game by Claude Opus 5.5; title, cover and certificate art drawn for this game by Claude Opus 5.5";

export const STORY = [
  page([
    'I earned a paper in dorsal',
    'delight. Two hours of',
    'training in how to pin right.',
    'No petting. No tail-tugging.',
    'There is method in the craft:',
    'pin first, or they will never',
    'read it as a laugh.',
    '',
    '        - The Bard of Bizarre',
  ]),
  page([
    'Doc Leo, PhD (Comedic',
    'Science), has done it: a',
    'self-paced course, under two',
    'hours, and a certificate in',
    'rat tickling. Certified!',
    '',
    'Rats sing too high for us to',
    'hear: 50 kHz is joy, 22 kHz',
    'is dread. A bat detector',
    'brings it down to earshot.',
    '',
    'No rats yet. But fate will',
    'make its demand, and Doc Leo',
    'will answer: a legion of',
    'happy rats. A laughing carpet.',
    'MWA-HA-HA-HA!',
  ]),
].join('\n');

export const INSTRUCTIONS = [
  page([
    'Tickle every rat you can into',
    'the laughing carpet. Each door',
    'opens for a carpet big enough:',
    `${NEEDED.join(', ')} rats in all.`,
    '',
    'LEFT/RIGHT or A D walk. UP or',
    'W hops: hold it to go higher.',
    'Q and E (or keypad 7 and 9)',
    'hop up and sideways.',
    '',
    'Z or DOWN: PIN. Both hands',
    'press down beside you.',
    'X or SPACE: TICKLE. Fingers',
    'wiggle out to both sides.',
    'L: laugh maniacally.',
  ]),
  page([
    'THE TECHNIQUE',
    '1. PIN first: a rat close by',
    '   rolls onto its back, paws',
    '   up.',
    '2. Then TICKLE: it giggles at',
    '   50 kHz and comes to your',
    '   hand. Touch it: it joins',
    '   the laughing carpet.',
    '',
    'A tickle without a pin goes',
    'right over a wary rat: it',
    'will never read it as play.',
    '',
    "Bump a rat that isn't playing",
    'and it squeals at 22 kHz:',
    'dread. Your rapport drops.',
  ]),
  page([
    'RAPPORT is your health.',
    'Bunsen flames, Tesla coils',
    "and Jacob's ladders (while",
    'they arc), sewer water, the',
    'floor buffer, the alligator',
    "and Dean Dour's frown all",
    'cost rapport. Coffee mends it.',
    'A rubber chicken on a leash',
    'is an extra life.',
    '',
    'Steam from a grate lifts you.',
    '',
    'F1 help      F2 counters',
    'F3 music     F4 sound',
    'F5 save F6 load  ESC quit',
  ]),
].join('\n');

/** Each level's card: its name, where, and two lines of the song. */
export const CARDS: { title: string; where: string; lines: [string, string] }[] = [
  { title: '1. THE COURSE', where: 'A classroom, after midnight', lines: ['I earned a paper', 'in dorsal delight.'] },
  { title: '2. THE LAB', where: 'Before the needles start', lines: ['Tickle first to drain', 'the stress.'] },
  { title: '3. THE SEWERS', where: 'Under the city', lines: ['No rats yet, but I', 'will answer.'] },
  { title: '4. THE EMPIRE', where: 'The tower, in the storm', lines: ['A laughing carpet', 'bowing under my command.'] },
];

const CREDITS_TEXT = page(
  [
    'CERTIFIED RAT TICKLER',
    'by The Bard of Bizarre, 1995',
    'Shareware from The Sofa BBS',
    '',
    'Based on the song "Certified',
    'Rat Tickler" by The Bard of',
    'Bizarre (Lewis Moten as his',
    'hobo clown, Doc Leo, PhD in',
    'Comedic Science), about the',
    'day he earned his rat',
    'tickling certificate.',
    '',
    "Lyrics: ChatGPT, from Lewis's",
    'prompts (after much back and',
    'forth). No recording came',
    'with the song: the music was',
    'composed for this game by',
    'Claude Opus 5.5.',
    'Title, cover and certificate',
    'art: drawn for this game by',
    'Claude Opus 5.5. The Bard of',
    'Bizarre logo: DeepAI. Doc Leo',
    'photo: Lewis Moten.',
    '',
    'Game: blocks, maps, sprites,',
    'sounds and the FM tango by',
    'Claude, built as Game-Maker',
    '3.0 files. Made with GAME-',
    'MAKER by Recreational',
    'Software Designs.',
    '',
    'No rats were harmed. MWA-HA!',
  ],
  2,
);

/** The credits, ending with the FREE TO SHARE page (kit/license.ts). */
export const CREDITS = withCreditPage(CREDITS_TEXT);

export function readme(price: string): string {
  return `
    CERTIFIED RAT TICKLER
    Version 1.0 - June 1995
    by The Bard of Bizarre

"I am a certified rat tickler.
 Certificate in hand.
 No rats yet - but I will
 answer when fate makes its
 demand."

Doc Leo, PhD (Comedic Science),
has a brand new certificate in
rat tickling. Now for the rats.
Pin first, then tickle: through
a night classroom, a lab full of
Tesla coils, the sewers under
the city and up a tower in a
storm, every rat you tickle
joins the laughing carpet. Doors
open only for a carpet big
enough. Avoid Dean Dour.

No rats are harmed. They love
it. Listen: 50 kHz!

STARTING THE GAME
  Type TICKLE and press Enter.
  VGA required. A Sound Blaster
  is recommended for the music
  (a villainous tango, theremin
  and all) and the laughter.

KEYS
  Arrows or A D  walk
  Up or W        hop
  Q E            hop sideways
  Z or Down      PIN
  X or Space     TICKLE
  L              laugh

FILES IN THIS ZIP
  TICKLE.GAM   the game
  *.MAP        four levels
  TICKLE.BBL   blocks
  LEO.CHR      Doc Leo
  TICKLE.SND   sound effects
  *.CMF        Sound Blaster
               music
  *.VOC        sampled sound
  *.GIF *.FLI  pictures and
               cartoons
  README.TXT   this file
  LICENSE.TXT  then and now

THIS IS SHAREWARE
  Copy it, give it to friends,
  upload it to your favorite
  BBS - all the files, please,
  unchanged.

  If it made you cackle,
  register for ${price}: you get a
  tape of the song and your own
  CERTIFIED RAT TICKLER wallet
  card. Send a check (US funds)
  to:

    The Bard of Bizarre
    c/o The Sofa BBS
    Pittsburgh, PA

  (In the story only: there is
  nothing to pay and nowhere to
  mail. The game is free to
  play, share and change (MIT
  license); see LICENSE.TXT.)

  Leave a message for DOC LEO
  on The Sofa BBS,
  1-412-555-0177.

CREDITS (NOW)
  The song "Certified Rat
  Tickler": lyrics shaped by
  ChatGPT from Lewis Moten's
  prompts, after much back and
  forth (as The Bard of
  Bizarre). No recording came
  with the song: the music here
  was composed for this game by
  Claude Opus 5.5, and the
  title, cover and certificate
  art were drawn for it by
  Claude Opus 5.5. The logo was
  made with DeepAI; the Doc Leo
  photo is Lewis's own. Built
  by Claude with GAME-MAKER 3.0
  by Recreational Software
  Designs.

All because I learned to tickle
them by hand.
`.replace(/^\n/, '');
}
