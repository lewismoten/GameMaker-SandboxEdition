// The words: the story, the instructions and the credits as text pages (30 columns, 16 lines a
// page), and the disk's README.TXT. The monologues are "Shakespeare in Sweatpants" by The Bard
// of Bizarre.
import { withCreditPage } from '../../../kit/license';
import about from '../../about.json';
import { page } from '../../../kit/screenText';

/**
 * Who made the monologues and the pictures. Used by LICENSE.TXT (the credits page and the
 * README spell it out to fit their columns; about.json says the same in its blurb).
 */
export const SONG_CREDIT =
  "monologues shaped with ChatGPT from Lewis Moten's prompts; audio and vocals made with Riffusion (now Google Flow Music); game code, art, levels and music made by Claude Opus 5.5; the coffee house is inspired by Lewis's memories of the Beehive in Oakland, Pittsburgh";

export const STORY = [
  page([
    'Oakland, Pittsburgh. A coffee',
    'house with a castle for a',
    'front: THE HIVE. Past the',
    'counter, a little movie',
    'theater. Up the stairs, a',
    'stage, and tonight it is',
    'OPEN MIC NIGHT.',
    '',
    'Doc Leo is hosting. The',
    'sign-up sheet has one name on',
    'it, seventeen times: WILL.',
    '',
    'Will has a velvet doublet, a',
    'starched ruff, and the',
    'comfiest sweatpants in',
    'Allegheny County.',
  ]),
  page([
    'He has seventeen monologues',
    'about the most dramatic',
    'things that ever happened to',
    'him. None of them are',
    'dramatic. A pen. A blanket.',
    'A shopping cart. An itch.',
    '',
    'He will perform every one of',
    'them as an EPIC.',
    '',
    'Buy a coffee with your tips.',
    'Take the stage. Make your',
    'move.',
    '',
    '        - The Bard of Bizarre',
  ]),
].join('\n');

export const INSTRUCTIONS = [
  page([
    'An open-mic night in four',
    'sets. Between sets: buy a',
    'coffee (five tips) at the',
    'cart by the stage, or at the',
    'counter downstairs. The',
    'curtain lets you through with',
    'a cup in hand.',
    '',
    'LEFT/RIGHT or A D walk. UP or',
    'W hops: hold it to hop',
    'higher. Q and E (or keypad 7',
    'and 9) hop up and sideways;',
    'steer as you come down. DOWN',
    'or S sneaks.',
  ]),
  page([
    'SPACE: DECLAIM! A word',
    'balloon flies out to each',
    'side and beats what comes at',
    'you. B: say the line.',
    '',
    'COMPOSURE is your health.',
    'A mug of coffee mends it.',
    'Coins and dollar bills are',
    'TIPS. Old friends from the',
    "Bard's other songs say hello",
    'with a tip, too.',
    '',
    'Each monologue has its PLOT:',
    'the things to find. The way',
    'out only opens with all of',
    'them.',
  ]),
  page([
    'Step into the spotlight to',
    'begin. Hit your mark, find',
    'your plot, deliver the punch',
    'line.',
    '',
    'Some things are too tough for',
    'words: hop over them. Some',
    'take more than one word.',
    '',
    'F1 help      F2 counters',
    'F3 music     F4 sound',
    'F5 save F6 load  ESC quit',
  ]),
].join('\n');

const CREDITS_TEXT = page(
  [
    'SHAKESPEARE IN SWEATPANTS',
    'by The Bard of Bizarre, 1995',
    'Shareware from The Sofa BBS',
    '',
    'Seventeen monologues about',
    'overly dramatic boring',
    'events, by The Bard of',
    'Bizarre (Lewis Moten as his',
    'hobo clown, Doc Leo).',
    '',
    'Monologues: shaped with',
    "ChatGPT from Lewis's",
    'prompts. Audio and vocals:',
    'Riffusion (now Google Flow',
    'Music). Voice clips here are',
    'cut from the recordings.',
    'The Bard of Bizarre logo:',
    'DeepAI. Doc Leo photo: Lewis',
    'Moten.',
    '',
    'THE HIVE is made up, but it',
    "is inspired by Lewis's",
    'memories of the Beehive',
    'coffee house in Oakland,',
    'Pittsburgh: a castle for a',
    'front, a little movie',
    'theater past the counter, a',
    'stage upstairs. Drawn from',
    'memory for this game; not an',
    'official picture of it.',
    '',
    'Game code, art, levels and',
    'the FM score: Claude Opus',
    '5.5, built as Game-Maker 3.0',
    'files. Made with GAME-MAKER',
    'by Recreational Software',
    'Designs.',
    '',
    'Take your spatula.',
    'Make your move.',
  ],
  3,
);

/** The credits, ending with the FREE TO SHARE page (kit/license.ts). */
export const CREDITS = withCreditPage(CREDITS_TEXT, true);

export function readme(price: string): string {
  return `
    SHAKESPEARE IN SWEATPANTS
    Version ${about.version} - Dec 1995
    by The Bard of Bizarre

"It wasn't just a pen.
 It was my pen.
 The chosen one."

Open-mic night at THE HIVE, the
coffee house with a castle for
a front, in Oakland. Upstairs
is a stage. Tonight Will, the
regular in the velvet doublet,
the starched ruff and the gray
sweatpants, performs seventeen
monologues about the most
dramatic things that ever
happened to him: a lost pen, a
goat in the breakroom, an
office chair with murder in its
heart, a dead ficus named
Gerald, a self-checkout, a
shopping cart, a stack of
dirty plates, a banquet and a
bird, a stolen blanket, weird
socks, the last slice of pizza,
an itch, a petition, the great
outdoors, the ants, a cardboard
box and a broken umbrella.

Every one of them, an EPIC.

STARTING THE GAME
  Type SWEATS and press Enter.
  VGA required. A Sound Blaster
  is recommended for the jazz
  and the monologues, spoken.

FILES IN THIS ZIP
  SWEATS.GAM   the game
  *.MAP        the coffee house
               and 17 monologues
  *.BBL *.MBL  blocks
  POET.CHR     Will
  *.SND        sound effects
  *.CMF        Sound Blaster
               music
  *.VOC        the monologues
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

  If it made you laugh, register
  for ${price}: you get a sticker
  that says SHAKESPEARE IN
  SWEATPANTS and a gift certificate for one (1)
  small coffee at the counter.
  Send a check (US funds) to:

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
  "Shakespeare in Sweatpants",
  monologues by The Bard of
  Bizarre: shaped with ChatGPT
  from Lewis Moten's prompts;
  audio and vocals made with
  Riffusion (now Google Flow
  Music). The voice clips here
  are cut from the recordings.
  THE HIVE is inspired by
  Lewis's memories of the
  Beehive coffee house in
  Oakland, Pittsburgh, and drawn
  from memory: it is not an
  official picture of it. Game
  code, art, levels and music
  by Claude Opus 5.5, built with
  GAME-MAKER 3.0 by Recreational
  Software Designs. The logo was
  made with DeepAI; the Doc Leo
  photo is Lewis's own.

Make your move.
`;
}
