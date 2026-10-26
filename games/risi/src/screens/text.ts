// The words: the story, the instructions and the credits as text pages (30 columns, 16 lines a
// page), the level cards' Latin lines with their English, and the disk's README.TXT. The songs
// are Veni, Vidi, Risi!'s (Lewis Moten's group); the Latin on screen is the songs' own.
import { withCreditPage } from '../../../kit/license';

const page = (lines: string[], pages = 1) => {
  for (const l of lines) if (l.length > 30) throw new Error(`Text line over 30 columns: "${l}"`);
  if (lines.length > 16 * pages) throw new Error(`Text over ${pages} page(s): "${lines[0]}"`);
  while (lines.length % 16) lines.push('');
  return lines.join('\n');
};

export const TITLE = 'VENI, VIDI, RISI!';
export const SUBTITLE = 'I CAME, I SAW, I LAUGHED';
export const AUTHOR = 'Veni, Vidi, Risi!';

/**
 * Who made the songs' words and recordings. Used by LICENSE.TXT (the credits page and the
 * README spell it out to fit their columns; about.json, the guide and the flyer say the same).
 */
export const SONG_CREDIT = "lyrics shaped with ChatGPT from Lewis Moten's prompts; music and vocals made with Riffusion (now Google Flow Music)";

/** What was made for the game, as LICENSE.TXT says it. */
export const ART_CREDIT = 'title and cover art drawn for this game by Claude Opus 5.5';

export const STORY = [
  page([
    'ROMA. A long time ago, or',
    'about 1995.',
    '',
    'Marcus Iocundus writes comic',
    'songs in Latin. Cogito,',
    'scribo, quaero iocum: I',
    'think, I write, I look for',
    'the joke. Omnes spectant,',
    'nemo ridet: everyone',
    'watches, no one laughs.',
    '',
    'Then came his banquet for',
    'the senators. And Rufus.',
  ]),
  page([
    'Canis meus flatum dedit. My',
    'dog... has released a fart.',
    'Under the table, in shadow.',
    'The senators coughed. Lady',
    'Flavia fainted. Lucius used',
    'the amphora.',
    '',
    'The Senate has spoken: make',
    'Emperor Gravis laugh, who has',
    'not laughed in forty years,',
    'or count the sand of the',
    'Circus Maximus, grain by',
    'grain.',
    '',
    'So Marcus will live his six',
    'songs. Veni, vidi... risi?',
  ]),
].join('\n');

export const INSTRUCTIONS = [
  page([
    'Six songs, six places: the',
    'banquet, the battle, the',
    'rooftops, the kitchen (you',
    'are Felix, a cat), the',
    'baths and the theater.',
    '',
    'LEFT/RIGHT or A D walk. UP or',
    'W hops: hold it to hop',
    'higher. Q and E (or keypad 7',
    'and 9) hop up and sideways;',
    'steer as you come down. DOWN',
    'or S sneaks. Steam and drums',
    'lift you. Climb ladders with',
    'UP.',
    '',
    'B sings a line of the song.',
  ]),
  page([
    'SPACE tells a joke to the',
    'right, Z to the left: "HA!"',
    '(Felix: "MIAU!"). Jokes never',
    "run out. They clear Rufus's",
    "clouds and the wise man's",
    'spells, and they make stone',
    'faces laugh. A meow scares a',
    'mouse into dropping its',
    'cheese.',
    '',
    'DIGNITAS is your health.',
    'Grapes, a cup or a towel',
    'bring it back. A wreath is',
    'a life.',
  ]),
  page([
    'I.   Open five shutters.',
    'II.  Run! Retreat is victory.',
    'III. Touch seven tituli.',
    'IV.  Six cheeses crown a cat.',
    'V.   Six golden scales.',
    'VI.  Five laughs open the',
    '     stage. Hop his SILENTIUM!',
    '     and joke the Emperor into',
    '     laughing; lay his crown',
    '     on the altar.',
    '',
    'F1 help      F2 counters',
    'F3 music     F4 sound',
    'F5 save F6 load  ESC quit',
  ]),
].join('\n');

/**
 * Each level's card: its song (Latin), the song in English, what to do there (with the key it
 * takes, so no level's goal or control lives only on the help pages), and a sung line with its
 * English.
 */
export const CARDS: { numeral: string; title: string; english: string; goal: string; lines: [string, string] }[] = [
  {
    numeral: 'I',
    title: 'CANIS MEUS FLATUM DEDIT',
    english: 'My Dog Has Farted',
    goal: 'Hop up to open five shutters.',
    lines: ['Sub mensa... in tenebris...', 'Beneath the table, in shadow...'],
  },
  {
    numeral: 'II',
    title: 'LAUDES IGNAVI',
    english: 'In Praise of the Coward',
    goal: 'Run right! Retreat is victory.',
    lines: ['Cucurri-curri-currimus!', 'We ran and ran and ran!'],
  },
  {
    numeral: 'III',
    title: 'TITUS TORQUET LINGUA',
    english: 'Titus Twists His Tongue',
    goal: 'Touch seven tituli. UP climbs.',
    lines: ['Titus tot titulos tetigit.', 'Titus touched so many titles.'],
  },
  {
    numeral: 'IV',
    title: 'FELIS FORTISSIMUS',
    english: 'The Bravest Cat',
    goal: 'Six cheeses! SPACE meows at mice.',
    lines: ['Sed propter caseum!', 'But for the cheese!'],
  },
  {
    numeral: 'V',
    title: 'CANIT PISCIS AUREUS',
    english: 'The Golden Fish Sings',
    goal: 'Six gold scales. Steam and drums lift.',
    lines: ['O piscis aureus, diva balnei!', 'O golden fish, bathtub diva!'],
  },
  {
    numeral: 'VI',
    title: 'SILENTIUM RIDENTIUM',
    english: 'The Silence of Laughter',
    goal: 'SPACE jokes. 5 laughs open the stage.',
    lines: ['Omnes spectant, nemo ridet.', 'All watch. No one laughs.'],
  },
];

const CREDITS_TEXT = page(
  [
    'VENI, VIDI, RISI!',
    'I Came, I Saw, I Laughed',
    'by Veni, Vidi, Risi!, 1995',
    'Shareware from The Sofa BBS',
    '',
    'Veni, Vidi, Risi! is Lewis',
    "Moten's group: six comic",
    'songs in Latin, sung as an',
    'opera, a march, a patter',
    'song, a hymn to a cat, an',
    'aria and a lament. Its games',
    'sit with The Bard of',
    "Bizarre's on The Sofa BBS.",
    '',
    'Lyrics: shaped with ChatGPT',
    "from Lewis's prompts. Music",
    'and vocals: made with',
    'Riffusion (now Google Flow',
    "Music). This game's sung",
    'clips are cut from the',
    'recordings, and its FM score',
    'is arranged from them.',
    'Title and cover art: drawn',
    'for this game by Claude Opus',
    '5.5. The Bard of Bizarre',
    'logo: DeepAI. Doc Leo photo:',
    'Lewis Moten.',
    '',
    'Game: code, blocks, maps,',
    'sprites and the FM',
    'arrangement by Claude Opus',
    '5.5, built as Game-Maker 3.0',
    'files. Made with GAME-MAKER',
    'by Recreational Software',
    'Designs. Teddy, Gwinn and',
    'Doc Leo appear as themselves.',
    '',
    'Risus erit... forsitan cras?',
  ],
  3,
);

/** The credits, ending with the FREE TO SHARE page (kit/license.ts). */
export const CREDITS = withCreditPage(CREDITS_TEXT, true);

export function readme(price: string): string {
  return `
    VENI, VIDI, RISI!
    I Came, I Saw, I Laughed
    Version 1.0 - Dec 1995
    by Veni, Vidi, Risi!

"Omnes spectant, nemo ridet."
 (Everyone watches.
  No one laughs.)

Marcus Iocundus writes comic
songs in Latin, and nobody in
Rome laughs. Then, at his
banquet for the senators, his
dog Rufus breaks wind under
the table. The Senate's
sentence: make Emperor Gravis
laugh (he hasn't in forty
years) or count the sand of
the Circus Maximus. So Marcus
lives all six of his songs:
the banquet, a battle won by
running away, the rooftops of
Rome and a tongue twister,
the kitchen as Felix, the
bravest cat, the baths where
a goldfish sings, and at last
the theater, where nobody
laughs. Yet.

STARTING THE GAME
  Type RISI and press Enter.
  VGA required. A Sound Blaster
  is recommended for the music
  (an opera, a march, a patter
  song, an aria) and the sung
  Latin.

FILES IN THIS ZIP
  RISI.GAM     the game
  *.MAP        six levels
  *.BBL        blocks
  MARCUS.CHR   the poet
  FELIX.CHR    the cat
  *.SND        sound effects
  *.CMF        Sound Blaster
               music
  *.VOC        the songs' lines
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

  If it made you laugh (in
  any language), register for
  ${price}: you get a sticker that
  says RISI! and a Latin phrase
  book for all occasions. Send
  a check (US funds) to:

    Veni, Vidi, Risi!
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
  Six songs by Veni, Vidi,
  Risi!, Lewis Moten's group:
  lyrics shaped with ChatGPT
  from Lewis's prompts; music
  and vocals made with
  Riffusion (now Google Flow
  Music). The sung clips here
  are cut from the recordings,
  and the FM score is arranged
  from them. The title and
  cover art were drawn for this
  game by Claude Opus 5.5. The
  Bard of Bizarre logo was made
  with DeepAI; the Doc Leo
  photo is Lewis's own. Built
  by Claude Opus 5.5 with
  GAME-MAKER 3.0 by
  Recreational Software
  Designs.

Veni. Vidi. Risi.
`.replace(/^\n/, '');
}
