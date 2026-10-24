// The words: the story, the instructions and the credits as text pages (30 columns, 16 lines a
// page), the level cards' lines (from the song), and the disk's README.TXT. The lyrics are from
// "Where's the Remote?" by The Bard of Bizarre, word for word (wrapped to fit the columns).
import { withCreditPage } from '../../../kit/license';
import { DIGITS_NEEDED, PENNIES_NEEDED, SPOTS_NEEDED } from '../ids';

const page = (lines: string[], pages = 1) => {
  for (const l of lines) if (l.length > 30) throw new Error(`Text line over 30 columns: "${l}"`);
  if (lines.length > 16 * pages) throw new Error(`Text over ${pages} page(s): "${lines[0]}"`);
  while (lines.length % 16) lines.push('');
  return lines.join('\n');
};

export const TITLE = "WHERE'S THE REMOTE?!";
export const AUTHOR = 'The Bard of Bizarre';

/** Who made the music the game's FM songs and sung clips come from. */
export const MUSIC_CREDIT = 'music made with Riffusion (now Google Flow Music)';

/**
 * Who made the song and the pictures: the lyrics, the recording, and the title and cover art,
 * which no one supplied and Claude drew for the game. Used by LICENSE.TXT (the credits page and
 * the README spell it out to fit their columns; about.json says the same in its blurb).
 */
export const SONG_CREDIT = `lyrics shaped by ChatGPT from Lewis Moten's prompt; ${MUSIC_CREDIT}; title and cover art drawn for this game by Claude Opus 5.5`;

/** The song, word for word (the clean lyrics; each line broken in two at its comma or dash). */
export const LYRICS: Record<string, string[]> = {
  verse1: [
    'I sat down with snacks,',
    '  the couch is a throne,',
    'Netflix is loaded,',
    "  I'm in the zone.",
    'But fate has struck',
    '  with cruel delight-',
    'The remote is gone,',
    '  it vanished from sight.',
  ],
  chorus1: [
    "Where's the remote?!",
    '  I just had it here!',
    'Checked the cushions,',
    '  checked my rear.',
    'Lifted the dog,',
    '  looked under the cat,',
    'Even asked Alexa',
    "  where it's at.",
    'This couch is a portal,',
    '  a Bermuda zone-',
    'Where remotes disappear',
    '  and dreams are blown.',
  ],
  verse2: [
    'I flipped the blanket,',
    '  I kicked the floor,',
    'Opened the fridge-',
    '  who knows anymore?',
    'Called my mom',
    '  just in case she knew,',
    'She said "Check your hand,"',
    '  but nope, not true.',
  ],
  chorus2: [
    "Where's the remote?!",
    '  Is it playing a game?',
    'Does it sneak away',
    '  and change its name?',
    'I just wanna binge',
    '  my cooking show,',
    "But now I'm screaming,",
    '  moving slow.',
    "It's like it grew legs",
    '  and left the room-',
    'Straight into the void',
    '  of eternal doom.',
  ],
  bridge: [
    'I found ten pennies,',
    '  three pens, a spoon,',
    'A sock from Christmas,',
    '  a tiny raccoon (??)',
    'But no clicker,',
    '  no buttons, no guide-',
    'Just existential panic',
    '  on the living room ride.',
  ],
  final: [
    "Where's the remote?!",
    "  My will's worn thin.",
    'I might just stand up',
    '  and press "Play" again.',
    "But wait-what's this,",
    '  beneath my thigh?',
    'There you are,',
    '  you sneaky guy.',
    "Next time I'll tape you",
    '  to my chest-',
    "You're the worst,",
    '  but also the best.',
  ],
};

export const STORY = [
  page([`"WHERE'S THE REMOTE?"`, '', ...LYRICS.verse1, '', '        - The Bard of Bizarre']),
  page([
    "Friday night, 1995. You've",
    'got snacks. The tape is in',
    'the VCR (the Bard calls it',
    '"streaming"; it blinks',
    '12:00). The Voice-O-Matic',
    '2000 is on the end table',
    '(he calls it "the butler").',
    '',
    'And the remote is GONE.',
    '',
    'Search the couch, the dog,',
    'the cat, the kitchen. Call',
    'Mom. Fall into the void',
    'between the cushions. Ride',
    'it out. Just find it.',
  ]),
].join('\n');

export const INSTRUCTIONS = [
  page([
    'Find the remote. Search the',
    'living room and the kitchen,',
    'the void between the cushions',
    'and the living room ride.',
    '',
    'ARROWS or W A S D walk. Q, E',
    'and keypad 1 and 3 walk on',
    'the diagonals.',
    '',
    "SPACE: WHERE'S THE REMOTE?!",
    'The shout blows dust bunnies,',
    'cockroaches and lint away.',
    'B clicks your empty thumb at',
    'the TV. C checks your hand.',
  ]),
  page([
    'SEARCH by pushing into a',
    'thing: couch cushions, the',
    "dog's bed, the cat's chair,",
    'the laundry, the magazines.',
    'Walk over the blanket. The',
    `baby gate opens at ${SPOTS_NEEDED} spots.`,
    '',
    "MOM'S NUMBER is on fridge",
    'magnets all over the kitchen',
    `floor. The phone dials all ${DIGITS_NEEDED}.`,
    '',
    `PENNIES: the pay TV in the`,
    `void takes ${PENNIES_NEEDED} to get you out.`,
    'Fake remotes say NOPE.',
  ]),
  page([
    'THE RIDE: the spinning rug',
    'carries you round. Off at the',
    'far top corner, PLAY on the',
    'VCR, back through the ride,',
    'out at the EXIT, and sit.',
    '',
    'PATIENCE is your health. The',
    "cat swipes; Teddy's kiss, the",
    'fridge and snacks help. The',
    'Voice-O-Matic and Mom give',
    'you an extra life.',
    '',
    'F1 help      F2 counters',
    'F3 music     F4 sound',
    'F5 save F6 load  ESC quit',
  ]),
].join('\n');

/** Each level's card: its name, where, and two lines of the song. */
export const CARDS: { title: string; where: string; lines: [string, string] }[] = [
  { title: '1. THE LIVING ROOM', where: 'Friday night, 1995', lines: ["Where's the remote?!", 'I just had it here!'] },
  { title: '2. THE KITCHEN', where: 'Under the fluorescent tube', lines: ['Opened the fridge-', 'who knows anymore?'] },
  { title: '3. THE VOID', where: 'Between the cushions', lines: ['This couch is a portal,', 'a Bermuda zone-'] },
  { title: '4. THE RIDE', where: 'The living room, spinning', lines: ['Just existential panic on', 'the living room ride.'] },
];

const SONG_PAGES = [
  page(['THE SONG', '', ...LYRICS.chorus1]),
  page([...LYRICS.verse2]),
  page([...LYRICS.chorus2]),
  page([...LYRICS.bridge]),
  page([...LYRICS.final, '', '        - The Bard of Bizarre']),
];

const CREDITS_TEXT = page(
  [
    "WHERE'S THE REMOTE?!",
    'by The Bard of Bizarre, 1995',
    'Shareware from The Sofa BBS',
    '',
    'Based on the song "Where\'s',
    'the Remote?" by The Bard of',
    'Bizarre (Lewis Moten as his',
    'hobo clown, Doc Leo), a song',
    'about a mundane thing nobody',
    'should care about.',
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
    'Tape it to your chest.',
  ],
  2,
);

/** The credits: the whole song (liner notes), the credits, and the FREE TO SHARE page (kit/license.ts). */
export const CREDITS = withCreditPage([...SONG_PAGES, CREDITS_TEXT].join('\n'), true);

export function readme(price: string): string {
  return `
    WHERE'S THE REMOTE?!
    Version 1.0 - June 1995
    by The Bard of Bizarre

"Where's the remote?!
 I just had it here!
 Checked the cushions,
 checked my rear."

Friday night. Snacks. The tape
is in the VCR. And the remote
is gone. Search the couch (lift
the cushions, lift the dog,
look under the cat), ask the
Voice-O-Matic 2000 (it orders
a pizza), open the fridge, call
your mom ("Check your hand"),
fall into the void between the
cushions where every lost
thing goes, and ride out the
living room ride. It's here
somewhere.

STARTING THE GAME
  Type REMOTE and press Enter.
  VGA required. A Sound Blaster
  is recommended for the music
  (with a kazoo) and the
  singing.

FILES IN THIS ZIP
  REMOTE.GAM   the game
  *.MAP        four levels
  REMOTE.BBL   blocks
  REMOTE.CHR   you
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

  If it made you check your own
  couch, register for ${price}: you
  get a couch-cushion sticker
  and a roll of duct tape for
  your remote. Send a check (US
  funds) to:

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
  The song "Where's the
  Remote?": lyrics shaped by
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

You're the worst, but also
the best.
`.replace(/^\n/, '');
}
