// The words: the story, the instructions and the credits as text pages (30 columns, 16 lines
// a page), the level cards' lines (from the song), and the disk's README.TXT. The lyrics are
// from "Thread the Needle, Brother Camel" by The Bard of Bizarre.
import { withCreditPage } from '../../../kit/license';
import { EYE_GRACE, GOLD_START } from '../ids';

const page = (lines: string[], pages = 1) => {
  for (const l of lines) if (l.length > 30) throw new Error(`Text line over 30 columns: "${l}"`);
  if (lines.length > 16 * pages) throw new Error(`Text over ${pages} page(s): "${lines[0]}"`);
  while (lines.length % 16) lines.push('');
  return lines.join('\n');
};

export const TITLE = 'THREAD THE NEEDLE, BROTHER CAMEL';
export const AUTHOR = 'The Bard of Bizarre';

/**
 * Who made the song: the lyrics, the recording the game's music and clips come from, and the
 * animated cover its title cartoon comes from. Used by LICENSE.TXT (the credits page and the
 * README spell it out to fit their columns; about.json says the same in its blurb).
 */
export const SONG_CREDIT = "lyrics written by ChatGPT from Lewis Moten's prompts; music and animated cover made with Riffusion (now Google Flow Music)";

export const STORY = [
  page([
    "I was mindin' my humps by the",
    'city gate, chewin\' my cud,',
    "ponderin' fate. Then came a",
    'rich man, all gold and pride,',
    'said he kept the law - every',
    "box he'd tied.",
    '',
    'But Jesus looked him square',
    'and deep, said "Give it all',
    "up if Heaven's what you",
    'seek." The man walked off',
    'with his coins and frown...',
    'and then Jesus turned around.',
    '',
    '        - The Bard of Bizarre',
  ]),
  page([
    '"It\'s easier, child, for a',
    'camel to go through the eye',
    'of a needle..."',
    '',
    "Now you're just a camel. But",
    'the rich man left in such a',
    'huff he left YOU behind, with',
    'his saddle, his fancy shoes',
    `and ${GOLD_START} gold coins in the bags.`,
    '',
    'Was He talkin\' about you?',
    'Your double-wide stride?',
    '',
    'Only one way to find out.',
  ]),
].join('\n');

export const INSTRUCTIONS = [
  page([
    'Give the gold away, slim down',
    "on the spiritual side, and go",
    'through the eye of a needle.',
    '',
    'LEFT/RIGHT or A D walk. UP or',
    'W hops: hold it to go higher.',
    'Q and E hop up and sideways;',
    'steer as you fall.',
    '',
    'DOWN or S: hump down (kneel).',
    'Z and C (or keypad 1 and 3)',
    'crawl on your knees. Kneeling',
    'you are one block high.',
    '',
    'SPACE: even a camel can',
    'dream.',
  ]),
  page([
    'GOLD: the poor along the road',
    'each take a coin. Walk up to',
    'them. Every coin given is a',
    'GRACE.',
    '',
    'EYE GATES: a narrow way takes',
    'one grace to open, then you',
    'crawl through on your knees.',
    `The eye of the needle takes`,
    `${EYE_GRACE} graces. Keep enough!`,
    '',
    'THREAD: spools in the shop.',
    'A frayed thread takes a spool',
    'to mend. Bump it. Then climb:',
    'UP climbs, DOWN lets you down.',
  ]),
  page([
    'Sandstorms blow you back:',
    'wait out the gusts behind a',
    'boulder. The Spirit\'s',
    'updraft lifts you up.',
    '',
    'You have no way to fight. Hop',
    'over what bites. Water, dates',
    'and a well are good for you;',
    'a golden lamp or a mustard',
    'seed is an extra life.',
    '',
    'F1 help      F2 counters',
    'F3 music     F4 sound',
    'F5 save      F6 load',
    'ESC quit',
  ]),
].join('\n');

/** Each level's card: its name, where, and two lines of the song. */
export const CARDS: { title: string; where: string; lines: [string, string] }[] = [
  { title: '1. THE CITY GATE', where: 'Morning, by the market', lines: ["I was mindin' my humps", 'by the city gate...'] },
  { title: '2. THE DESERT ROAD', where: 'Noon, and no real gate', lines: ["Turns out, y'all -", "ain't no real gate!"] },
  { title: "3. THE TAILOR'S", where: 'Lamplight and pins', lines: ['I asked a tailor what', 'thread feel feels.'] },
  { title: '4. THE EYE', where: 'Night, up the needle', lines: ["I'll tuck my humps", 'and squeeze my soul!'] },
];

const CREDITS_TEXT = page(
  [
    'THREAD THE NEEDLE,',
    'BROTHER CAMEL',
    'by The Bard of Bizarre, 1995',
    'Shareware from The Sofa BBS',
    '',
    'Based on the song "Thread the',
    'Needle, Brother Camel" by The',
    'Bard of Bizarre (Lewis Moten',
    'as his hobo clown, Doc Leo),',
    "one of the Bard's bizarre",
    'gospels (Matthew 19:24).',
    '',
    "Lyrics: ChatGPT, from Lewis's",
    'prompts. Music and animated',
    'cover: Riffusion (now Google',
    'Flow Music).',
    '',
    "This game's FM music, its",
    'sung clips and the title',
    'cartoon are made from them.',
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
    'Even a camel can dream!',
  ],
  2,
);

/** The credits, ending with the FREE TO SHARE page (kit/license.ts). */
export const CREDITS = withCreditPage(CREDITS_TEXT);

export function readme(price: string): string {
  return `
    THREAD THE NEEDLE,
    BROTHER CAMEL
    Version 1.0 - May 1995
    by The Bard of Bizarre

"Thread the needle, Brother
 Camel, squeeze on through!
 Leave the baggage and your
 fancy shoes!"

The rich man walked away from
Jesus with his coins and his
frown, and left his camel
behind, saddlebags full of
gold. "It's easier for a camel
to go through the eye of a
needle..." Was He talkin' 'bout
YOU?

Give the gold away to the poor
along the road, slim down on
the spiritual side, crawl the
narrow ways on your knees, ask
a tailor what thread feel
feels, and squeeze through the
eye of a needle. Hump down!

No fighting. Camels don't.

STARTING THE GAME
  Type NEEDLE and press Enter.
  VGA required. A Sound Blaster
  is recommended for the music
  and the singing.

FILES IN THIS ZIP
  NEEDLE.GAM   the game
  *.MAP        four levels
  *.BBL        blocks
  *.CHR        the camel, four
               loads lighter
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

  If it made you smile,
  register for ${price}: you get
  a tape of the song and a
  sewing needle big enough for
  a camel (almost).
  Send a check (US funds) to:

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
  The song "Thread the Needle,
  Brother Camel": lyrics
  written by ChatGPT from Lewis
  Moten's prompts (as The Bard
  of Bizarre); music and
  animated cover made with
  Riffusion (now Google Flow
  Music).
  The music, sung clips and
  title cartoon here are made
  from them. The logo was made
  with DeepAI; the Doc Leo
  photo is Lewis's own. Built
  by Claude with GAME-MAKER 3.0
  by Recreational Software
  Designs.

Even a camel can dream.
`.replace(/^\n/, '');
}
