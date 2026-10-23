// The words: the story, the instructions and the credits as text pages (30 columns, 16 lines a
// page), the act cards' lines (from the song), and the disk's README.TXT. The song is "Cleanse
// Me, O Loofah, But Leave My Soul" by The Bard of Bizarre; the lines on screen follow Lewis's
// own transcription of it.
import { withCreditPage } from '../../../kit/license';

const page = (lines: string[], pages = 1) => {
  for (const l of lines) if (l.length > 30) throw new Error(`Text line over 30 columns: "${l}"`);
  if (lines.length > 16 * pages) throw new Error(`Text over ${pages} page(s): "${lines[0]}"`);
  while (lines.length % 16) lines.push('');
  return lines.join('\n');
};

export const TITLE = 'CLEANSE ME, O LOOFAH';
export const SUBTITLE = 'BUT LEAVE MY SOUL';
export const AUTHOR = 'The Bard of Bizarre';

/**
 * Who made the song's words and its recording. Used by LICENSE.TXT (the credits page and the
 * README spell it out to fit their columns; about.json, the guide and the flyer say the same).
 */
export const SONG_CREDIT = "lyrics written by ChatGPT from Lewis Moten's prompts; music made with Riffusion (now Google Flow Music)";

/** What was made for the game, as LICENSE.TXT says it. */
export const ART_CREDIT = 'title and cover art drawn for this game by Claude Opus 5.5';

export const STORY = [
  page([
    'She said, "Don\'t touch the',
    'pink one. It\'s mine!"',
    'But I, I didn\'t listen.',
    'I thought, it\'s just a loofah.',
    'How wrong I was.',
    '',
    'There it hung, innocent,',
    'smug on the silver rack,',
    'a mesh of malice, gently',
    'drying, waiting to attack.',
    '',
    '        - The Bard of Bizarre',
  ]),
  page([
    'It was peach, or coral, some',
    'evil hue. You scrubbed with',
    'it anyway. Now you are',
    'cursed in the shower. The',
    'mirror fogs up: YOU CROSSED',
    'A LINE. The towel screams.',
    '',
    'Lift the curse. Brine is',
    'salt and rosemary. Light six',
    'candles. Face Scrubbus',
    'Maximus, the demon sponge,',
    'and wash the coral out of it',
    'until it is the pink one',
    'again. Then hang it back on',
    'her rack. Never touch the',
    'loofah.',
  ]),
].join('\n');

export const INSTRUCTIONS = [
  page([
    'The bathroom, the all-night',
    'store, home in the dark, and',
    'the shower at midnight.',
    '',
    'LEFT/RIGHT or A D tiptoe. UP',
    'or W hops: hold it to hop',
    'higher. Q and E (or keypad 7',
    'and 9) hop up and sideways;',
    'steer as you come down. DOWN',
    'or S sneaks. Steam lifts you;',
    'climb the luffa vines with',
    'UP.',
    '',
    'B sings a line of the song.',
  ]),
  page([
    'DIGNITY is your health. Drips,',
    'cursed soap, the screaming',
    'towel, cracked tiles and',
    'brambles cost you some. A dry',
    'washcloth brings it back.',
    '',
    'BATH SALT: five in the mop',
    'bucket make the brine.',
    'SILVER COINS: six buy you a',
    'loofah of your own.',
    'CANDLES: touch one to light',
    'it. Six burning open the',
    'bathroom door.',
    'The rubber duck: a life.',
  ]),
  page([
    'ROSEMARY is brine: three',
    'splashes a sprig. SPACE',
    'throws a splash to the right.',
    'It tames wild loofahs, and',
    'it cleanses Scrubbus Maximus,',
    'top and bottom, four times',
    'each, into the pink one.',
    '',
    'Hang the pink one back on',
    'her silver rack.',
    '',
    'F1 help      F2 counters',
    'F3 music     F4 sound',
    'F5 save F6 load  ESC quit',
  ]),
].join('\n');

/** Each act's card: its name, where, and two lines of the song. */
export const CARDS: { title: string; where: string; lines: [string, string] }[] = [
  { title: 'I. THE SHOWER', where: 'The bathroom. Candlelight.', lines: ['Loofah of Lucifer,', 'you lather my fate.'] },
  { title: 'II. THE AISLE', where: 'The all-night store. 3 A.M.', lines: ['From some forest-dark', 'aisle you came.'] },
  { title: 'III. HOME', where: 'She is asleep. The mirror...', lines: ['The mirror steamed', 'a warning sign.'] },
  { title: 'IV. SCRUBBUS', where: 'The shower. Midnight.', lines: ['Scrubbus maximus,', 'demon sponge divine.'] },
];

const CREDITS_TEXT = page(
  [
    'CLEANSE ME, O LOOFAH,',
    'BUT LEAVE MY SOUL',
    'by The Bard of Bizarre, 1995',
    'Shareware from The Sofa BBS',
    '',
    'Based on the song "Cleanse',
    'Me, O Loofah, But Leave My',
    'Soul" by The Bard of Bizarre',
    '(Lewis Moten as his hobo',
    'clown, Doc Leo): a goth rock',
    'song about domestic life.',
    '',
    'Lyrics: written by ChatGPT',
    "from Lewis's prompts. Music:",
    'made with Riffusion (now',
    "Google Flow Music). This",
    "game's sung clips are cut",
    'from the recording, and its',
    'FM score is arranged from it.',
    'Title and cover art: drawn',
    'for this game by Claude Opus',
    '5.5 (none came with the',
    'song). The Bard of Bizarre',
    'logo: DeepAI. Doc Leo photo:',
    'Lewis Moten.',
    '',
    'Game: blocks, maps, sprites',
    'and the FM arrangement by',
    'Claude, built as Game-Maker',
    '3.0 files. Made with',
    'GAME-MAKER by Recreational',
    'Software Designs.',
    '',
    'Never touch the loofah.',
  ],
  3,
);

/** The credits, ending with the FREE TO SHARE page (kit/license.ts). */
export const CREDITS = withCreditPage(CREDITS_TEXT);

export function readme(price: string): string {
  return `
    CLEANSE ME, O LOOFAH,
    BUT LEAVE MY SOUL
    Version 1.0 - Dec 1995
    by The Bard of Bizarre

"She said, 'Don't touch the
 pink one. It's mine!'
 But I, I didn't listen."

You scrubbed with it anyway:
the loofah of Lucifer, peach
or coral, some evil hue. Now
you're cursed in the shower.
The mirror fogs up YOU CROSSED
A LINE. The towel screams. The
soap has teeth. Gather bath
salt for the brine, go out at
3 A.M. to a store whose bath
aisle has grown into a dark
forest (where loofahs come
from), pick rosemary, buy a
loofah of your own, light six
candles at home, and face
Scrubbus Maximus, the demon
sponge, in the shower at
midnight. Wash the coral out
of it until it is the pink
one again, and hang it back
on her rack.

STARTING THE GAME
  Type LOOFAH and press Enter.
  VGA required. A Sound Blaster
  is recommended for the music
  (power chords, a cathedral
  organ, booming toms) and the
  sung lines.

FILES IN THIS ZIP
  LOOFAH.GAM   the game
  *.MAP        four acts
  LOOFAH.BBL   blocks
  LOOFAH.CHR   the man
  *.SND        sound effects
  *.CMF        Sound Blaster
               music
  *.VOC        the song's lines
               and sound effects
  *.GIF *.FLI  pictures and
               cartoons
  README.TXT   this file
  LICENSE.TXT  then and now

THIS IS SHAREWARE
  Copy it, give it to friends,
  upload it to your favorite
  BBS - all the files, please,
  unchanged.

  If it made you laugh, or made
  you buy your own loofah,
  register for ${price}: you get a
  tape of the song and a bar of
  the Bard's own unscented,
  uncursed soap. Send a check
  (US funds) to:

    The Bard of Bizarre
    c/o The Sofa BBS
    Pittsburgh, PA

  (In the story only: there is
  nothing to pay and nowhere to
  mail. The game is free; see
  LICENSE.TXT.)

  Leave a message for DOC LEO
  on The Sofa BBS,
  1-412-555-0177.

CREDITS (NOW)
  "Cleanse Me, O Loofah, But
  Leave My Soul", a song by The
  Bard of Bizarre (Lewis Moten):
  lyrics written by ChatGPT
  from Lewis's prompts; music
  made with Riffusion (now
  Google Flow Music). The sung
  clips here are cut from the
  recording, and the FM score
  is arranged from it. The title and cover
  art were drawn for this game
  by Claude Opus 5.5. The logo
  was made with DeepAI; the Doc
  Leo photo is Lewis's own.
  Built by Claude with
  GAME-MAKER 3.0 by
  Recreational Software
  Designs.

Never touch the loofah.
`.replace(/^\n/, '');
}
