// The words: the story, the instructions and the credits as text pages (30 columns, 16 lines a
// page), the level cards' lines (from the song), and the disk's README.TXT. The lyrics are from
// "There's a Fly in the Room (And It's Winning)", recorded as "A Fly Named Carl", by The Bard of
// Bizarre.
import { withCreditPage } from '../../../kit/license';

const page = (lines: string[], pages = 1) => {
  for (const l of lines) if (l.length > 30) throw new Error(`Text line over 30 columns: "${l}"`);
  if (lines.length > 16 * pages) throw new Error(`Text over ${pages} page(s): "${lines[0]}"`);
  while (lines.length % 16) lines.push('');
  return lines.join('\n');
};

export const AUTHOR = 'The Bard of Bizarre';

/** Who made the music the game's FM songs and sung clips come from. */
const MUSIC_CREDIT = 'music made with Riffusion (now Google Flow Music)';

/**
 * Who made the song and the pictures: the lyrics, the recording, and the title and cover art,
 * which no one supplied and Claude drew for the game. Used by LICENSE.TXT (the credits page and
 * the README spell it out to fit their columns; about.json says the same in its blurb).
 */
export const SONG_CREDIT = `lyrics shaped by ChatGPT from Lewis Moten's prompt; ${MUSIC_CREDIT}; title and cover art drawn for this game by Claude Opus 5.5`;

export const STORY = [
  page([
    'I sat down with my snacks and',
    'my Netflix queue, just me and',
    'the silence, not a thing to',
    'do. Then came a buzz like a',
    'judgmental tune...',
    '',
    "Now there's a fly in the room,",
    "and it's louder than June.",
    '',
    '        - The Bard of Bizarre',
  ]),
  page([
    'You are Carl. You are a fly.',
    "You've got a vendetta, a",
    'college degree in doom, and',
    "nowhere you'd rather be than",
    'right here, in his living',
    'room, living rent-free.',
    '',
    'He has a dish towel. He has',
    'the old clap. He has sage and',
    'essential oils.',
    '',
    'You have the barrel roll.',
    '',
    "And Carl's got ambitions.",
  ]),
].join('\n');

export const INSTRUCTIONS = [
  page([
    'Fly through his house, out',
    'the window and into the wild,',
    'and back for the aux cord.',
    '',
    'ARROWS fly. Q E Z C (or the',
    'keypad 7 9 1 3) fly the',
    "diagonals. Flies don't fall:",
    'let go and you hover.',
    '',
    'SPACE: BARREL ROLL. Its',
    'whoosh flies ahead: a towel,',
    'clap or swatter it hits will',
    'MISS, and stay missed a bit.',
    '',
    'B: BUZZ, the way you last',
    'flew. It wakes sleeping ears.',
  ]),
  page([
    'SUGAR keeps a fly flying.',
    'Each bit of air you fly into',
    'for the first time costs one',
    "(air you've flown is free).",
    'F2 counts it as Money: sugar',
    "is a fly's only money.",
    '',
    'A SUGAR CUBE gives 25.',
    '',
    'Out of sugar, you sink. Hold',
    'DOWN on the carpet (or the',
    'grass) to lick up crumbs: a',
    'sugar every moment or so.',
  ]),
  page([
    'SNACKS: the floor lamp only',
    'takes you after eight.',
    '',
    'SMILES: land on a calendar, a',
    'clock, a picture or a recipe',
    'on the kitchen wall. The door',
    'opens for six.',
    '',
    'EARS: buzz a sleeping ear,',
    'then fly into it while it',
    'twitches. Three, and he opens',
    'the window.',
    '',
    'HOURGLASSES: two hours each.',
    'The big clock breaks at 24.',
  ]),
  page([
    'A soda or a flower mends',
    'your patience; a donut',
    'is an extra life. Crumbs are',
    'points. Say hi to Loaf #13',
    'and the mustard seed.',
    'The stove, the fan, the',
    'flytrap, the frog, the mop',
    'and the smoke all get you.',
    'Wind gusts push you back.',
    'At the stereo his hand grabs',
    'for the aux cord: roll it a',
    'MISS, twice.',
    '',
    'F1 help      F2 counters',
    'F3 music     F4 sound',
    'F5 save F6 load  ESC quit',
  ]),
].join('\n');

/** Each level's card: its name, where, and two lines of the song. */
export const CARDS: { title: string; where: string; lines: [string, string] }[] = [
  { title: '1. THE COUCH', where: 'The living room, afternoon', lines: ['I sat down with my snacks', 'and my Netflix queue...'] },
  { title: '2. THE WALLS', where: 'The kitchen', lines: ['It landed on the wall,', 'just to flash me a smile.'] },
  { title: '3. IN BED', where: 'The bedroom, 3:47 AM', lines: ['Carl buzzes near my ear', "like he's reading my head."] },
  { title: '4. THE WINDOW', where: 'The backyard', lines: ["I've opened the window.", "I've begged him to leave."] },
  { title: '5. SEEN THINGS', where: 'The wild (a documentary)', lines: ['Some say flies live', '24 hours. Carl...'] },
  { title: '6. THE AUX CORD', where: 'The living room, in gloom', lines: ['I tried sage, essential', 'oils... now I mop the floor.'] },
];

const CREDITS_TEXT = page(
  [
    'CARL: A FLY NAMED CARL',
    'by The Bard of Bizarre, 1995',
    'Shareware from The Sofa BBS',
    '',
    'Based on the song "There\'s a',
    "Fly in the Room (And It's",
    'Winning)", recorded as "A Fly',
    'Named Carl", by The Bard of',
    'Bizarre (Lewis Moten as his',
    'hobo clown, Doc Leo).',
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
    "Carl's got the aux cord now.",
  ],
  2,
);

/** The credits, ending with the FREE TO SHARE page (kit/license.ts). */
export const CREDITS = withCreditPage(CREDITS_TEXT, true);

export function readme(price: string): string {
  return `
    CARL
    A FLY NAMED CARL
    Version 1.0 - June 1995
    by The Bard of Bizarre

"There's a fly in the room
 and it's got a vendetta,
 Dancing through air like
 it's wearing stilettos."

You are Carl, the fly. He has
snacks, a movie queue, a
dish towel and the old clap.
You have a barrel roll and a
college degree in doom. Eat
his snacks, smile from his
walls, buzz his ear at 3:47 AM,
go out the window and live a
whole documentary, then come
back and take the aux cord.

You can't lose to a dish
towel. Barrel roll.

Flying takes sugar: fresh air
costs a little, sugar cubes
fill you up, and a tired fly
sinks to the carpet to lick
up crumbs.

STARTING THE GAME
  Type CARL and press Enter.
  VGA required. A Sound Blaster
  is recommended for the music
  (a bouncy ukulele, a kazoo,
  and Carl) and the singing.

FILES IN THIS ZIP
  CARL.GAM     the game
  *.MAP        six levels
  *.BBL        blocks (the
               house, the yard)
  CARL.CHR     Carl
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

  If Carl made you laugh,
  register for ${price}: you get a
  Carl sticker (he will land on
  it) and a genuine rolled-up
  magazine (lightly used, never
  hit anything). Send a check
  (US funds) to:

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
  The song "There's a Fly in
  the Room (And It's Winning)",
  recorded as "A Fly Named
  Carl": lyrics shaped by
  ChatGPT from Lewis Moten's
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

Rest in peace, peace and quiet.
`.replace(/^\n/, '');
}
