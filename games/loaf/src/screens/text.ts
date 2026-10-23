// The words: the story, the instructions and the credits as text pages (30 columns, 16 lines a
// page), the level cards' lines (from the song), and the disk's README.TXT. The lyrics are from
// "Loaf #13 (Left in the Basket)" by The Bard of Bizarre.
import { withCreditPage } from '../../../kit/license';

const page = (lines: string[], pages = 1) => {
  for (const l of lines) if (l.length > 30) throw new Error(`Text line over 30 columns: "${l}"`);
  if (lines.length > 16 * pages) throw new Error(`Text over ${pages} page(s): "${lines[0]}"`);
  while (lines.length % 16) lines.push('');
  return lines.join('\n');
};

export const TITLE = 'LOAF #13';
export const SUBTITLE = '(LEFT IN THE BASKET)';
export const AUTHOR = 'The Bard of Bizarre';

/** Who made the music the game's FM songs and sung clips come from. */
export const MUSIC_CREDIT = 'music made with Riffusion (now Google Flow Music)';

/**
 * Who made the song and the pictures: the lyrics, the recording, and the title and cover art,
 * which no one supplied and Claude drew for the game. Used by LICENSE.TXT (the credits page and
 * the README spell it out to fit their columns; about.json says the same in its blurb).
 */
export const SONG_CREDIT = `lyrics shaped by ChatGPT from Lewis Moten's prompt; ${MUSIC_CREDIT}; title and cover art drawn for this game by Claude Opus 5.5`;

export const STORY = [
  page([
    'They broke five loaves for the',
    'hungry crowd, fish flew like',
    'a prayer through the hands of',
    'the proud. They fed the masses',
    'with grace and awe...',
    '',
    'But me? I stayed behind, with',
    'a crust and a flaw.',
    '',
    '        - The Bard of Bizarre',
  ]),
  page([
    'You are Loaf #13. Whole and',
    'fluffy, round and crusty, and',
    'left in the basket in the',
    'shade of a fig tree while your',
    'brothers went hand to hand.',
    '',
    'Nobody picked you. The crowd',
    'is fed and the hillside is',
    'full of hungry hands, big',
    'feet and flying fish.',
    '',
    "But you're still bread. And",
    'nothing is ever wasted.',
  ]),
].join('\n');

export const INSTRUCTIONS = [
  page([
    'Roll out of your basket, over',
    'the hillside, through the',
    'stacked baskets, into the',
    'twelfth basket, and home in',
    'the hands of a child.',
    '',
    'LEFT/RIGHT or A D roll (slow',
    'and steady). UP or W rises:',
    'hold it to rise higher. Q and',
    'E (or keypad 7 and 9) rise up',
    'and sideways; steer as you',
    'come down. DOWN or S hunkers.',
    '',
    "SPACE or B: I'm still bread!",
  ]),
  page([
    'WARM AIR over a cooking fire',
    'lifts you, the way warm',
    'makes dough rise. The fire',
    'itself is too hot!',
    '',
    'THE WEAVE inside a basket:',
    'no falling; UP and DOWN',
    'climb. CHAFF gives way.',
    '',
    'HOLY CRUMBS (golden): the lid',
    'of the stacked baskets opens',
    'for seven. EMPTY BASKETS at',
    'dusk: touch to gather each',
    'one up full. The twelfth',
    'takes you when eleven are.',
  ]),
  page([
    'Crumbs are points. A jar of',
    'water mends your crust; a pot',
    'of honey is an extra life.',
    'Say hello to a brother loaf.',
    '',
    'You have no way to fight.',
    'Hungry hands, big feet and',
    'fish take a bite: rise over.',
    '',
    'The door of home takes one',
    'holy crumb: a gift for Mama.',
    '',
    'F1 help      F2 counters',
    'F3 music     F4 sound',
    'F5 save F6 load  ESC quit',
  ]),
].join('\n');

/** Each level's card: its name, where, and two lines of the song. */
export const CARDS: { title: string; where: string; lines: [string, string] }[] = [
  { title: '1. HUNGRY CROWD', where: 'A hillside in Galilee, noon', lines: ['They fed the masses', 'with grace and awe...'] },
  { title: '2. THE WASTELAND', where: 'In the stacked baskets', lines: ['While I sat lonely', 'in a wicker wasteland.'] },
  { title: '3. TWELVE BASKETS', where: 'The same hillside, at dusk', lines: ['He gathered me up,', 'twelve baskets full.'] },
  { title: '4. THE WAY HOME', where: 'The village, by lamplight', lines: ['I traveled home in', 'the hands of a child.'] },
];

const CREDITS_TEXT = page(
  [
    'LOAF #13 (LEFT IN THE BASKET)',
    'by The Bard of Bizarre, 1995',
    'Shareware from The Sofa BBS',
    '',
    'Based on the song "Loaf #13',
    '(Left in the Basket)" by The',
    'Bard of Bizarre (Lewis Moten',
    'as his hobo clown, Doc Leo),',
    "one of the Bard's gospel",
    'oddities.',
    '',
    "Lyrics: ChatGPT, from Lewis's",
    'prompt. Music: Riffusion (now',
    'Google Flow Music). This',
    "game's FM music and sung clips",
    'are made from the recording.',
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
    '3.0 files. Made with GAME-',
    'MAKER by Recreational',
    'Software Designs.',
    '',
    "I'm still bread.",
  ],
  2,
);

/** The credits, ending with the FREE TO SHARE page (kit/license.ts). */
export const CREDITS = withCreditPage(CREDITS_TEXT);

export function readme(price: string): string {
  return `
    LOAF #13
    (LEFT IN THE BASKET)
    Version 1.0 - May 1995
    by The Bard of Bizarre

"But I'm still bread!
 Don't count me out!
 Still risen with purpose,
 I have no doubt."

You are Loaf #13, the one
nobody picked when the five
thousand were fed. Roll out of
your basket and across the
hillside, past hungry hands,
big feet and flying fish, climb
the wicker wasteland for holy
crumbs, help gather up twelve
baskets full at dusk, and ride
home in the hands of a child.

No fighting. You're bread.
Just rise.

STARTING THE GAME
  Type LOAF and press Enter.
  VGA required. A Sound Blaster
  is recommended for the music
  (a gospel slow jam, organ and
  choir) and the singing.

FILES IN THIS ZIP
  LOAF.GAM     the game
  *.MAP        four levels
  LOAF.BBL     blocks
  *.CHR        the loaf, and the
               loaf in a cloth
  *.SND        sound effects
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

  If it fed your soul a little,
  register for ${price}: you get a
  tape of the song and a recipe
  for the Bard's own crusty
  bread. Send a check (US
  funds) to:

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
  The song "Loaf #13 (Left in
  the Basket)": lyrics shaped
  by ChatGPT from Lewis Moten's
  prompt (as The Bard of
  Bizarre); music made with
  Riffusion (now Google Flow
  Music). The FM music and
  sung clips here are made
  from the recording. The
  title and cover art were
  drawn for this game by
  Claude Opus 5.5. The logo was
  made with DeepAI; the Doc Leo
  photo is Lewis's own. Built
  by Claude with GAME-MAKER 3.0
  by Recreational Software
  Designs.

Nothing's ever wasted.
`.replace(/^\n/, '');
}
