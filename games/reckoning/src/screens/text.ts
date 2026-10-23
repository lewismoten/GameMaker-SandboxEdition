// The words: the story, the instructions and the credits as text pages (30 columns, 16 lines a
// page), the act cards' lines (from the monologue), and the disk's README.TXT. The monologue is
// "The Great Dairy Reckoning of 3:17 a.m." by The Bard of Bizarre.
import { withCreditPage } from '../../../kit/license';

const page = (lines: string[], pages = 1) => {
  for (const l of lines) if (l.length > 30) throw new Error(`Text line over 30 columns: "${l}"`);
  if (lines.length > 16 * pages) throw new Error(`Text over ${pages} page(s): "${lines[0]}"`);
  while (lines.length % 16) lines.push('');
  return lines.join('\n');
};

export const TITLE = 'THE GREAT DAIRY';
export const SUBTITLE = 'RECKONING OF 3:17 A.M.';
export const AUTHOR = 'The Bard of Bizarre';

/** Who made the spoken recording the game's voice clips come from. */
export const RECORDING_CREDIT = 'recording (voice) made with Riffusion (now Google Flow Music)';

/**
 * Who made the monologue and the pictures: the words, the recording, and the title art and the
 * music, which no one supplied and Claude made for the game. Used by LICENSE.TXT (the credits
 * page and the README spell it out to fit their columns; about.json says the same in its blurb).
 */
export const SONG_CREDIT = `monologue shaped by ChatGPT from Lewis Moten's prompt; ${RECORDING_CREDIT}; music and title art made for this game by Claude Opus 5.5`;

export const STORY = [
  page([
    '[Lights rise. A man stands in',
    'the glow of an open fridge.',
    'He is shirtless. He is',
    'sweating. A single slice of',
    'cheesecake rests on a',
    'porcelain plate like a',
    'cursed artifact.]',
    '',
    'There it is. The enemy.',
    'And the lover.',
    'The... enemy-lover.',
    '',
    '        - The Bard of Bizarre',
  ]),
  page([
    'It is 3:17 A.M. You are',
    'lactose intolerant. Your',
    'body? A temple. Your',
    'intestines? A battlefield.',
    '',
    'But maybe this time it will',
    'be different. Maybe science',
    'has evolved in the last six',
    'hours. Maybe the bacteria in',
    'your gut unionized.',
    '',
    "Sneak to the fridge. Don't",
    'wake your wife. Find your',
    'willpower. (It will not be',
    'enough. It never is.)',
  ]),
].join('\n');

export const INSTRUCTIONS = [
  page([
    'Out of bed, past the dogs, to',
    'the fridge; up its shelves to',
    'the cheesecake; the dash to',
    'the bathroom; and then the',
    'reckoning.',
    '',
    'LEFT/RIGHT or A D tiptoe. UP',
    'or W hops: hold it to hop',
    'higher. Q and E (or keypad 7',
    'and 9) hop up and sideways;',
    'steer as you come down. DOWN',
    'or S sneaks.',
    '',
    'SPACE or B: the monologue.',
  ]),
  page([
    'DIGNITY is your health. A',
    'creaky board, a squeaky toy,',
    'toy blocks, a sleeping dog and',
    'all the dairy cost you some.',
    'Hop over. A glass of water',
    'brings it back.',
    '',
    'CELERY is willpower: seven',
    'to face the cheesecake. It',
    'takes all seven. Then you eat',
    'it. THREE ROLLS of toilet',
    'paper open the bathroom door.',
    'Never go in without three.',
    'The gurgle is coming. RUN.',
  ]),
  page([
    'THE RECKONING: SPACE throws',
    'almond milk to the right. It',
    'beats his milkshakes and it',
    'beats the Devil, top and',
    'bottom, four times each.',
    'Almond and oat milk refill',
    'it. Lactase pills mend your',
    'dignity.',
    '',
    "Take the Devil's last straw",
    'to the porcelain throne.',
    '',
    'F1 help      F2 counters',
    'F3 music     F4 sound',
    'F5 save F6 load  ESC quit',
  ]),
].join('\n');

/** Each act's card: its name, where, and two lines of the monologue. */
export const CARDS: { title: string; where: string; lines: [string, string] }[] = [
  { title: 'I. 3:17 A.M.', where: 'The bedroom. She is asleep.', lines: ['I shouldn\'t.', "I can't."] },
  { title: 'II. THE FRIDGE', where: 'The kitchen. The glow.', lines: ['Graham-crackered by', 'angels themselves.'] },
  { title: 'III. OH NO', where: 'SMASH CUT. The hall.', lines: ['That was immediate.', 'That was TOO immediate.'] },
  { title: 'IV. THE RECKONING', where: 'Lights turn blood red.', lines: ['Well, well, well...', "Couldn't resist, could ya?"] },
];

const CREDITS_TEXT = page(
  [
    'THE GREAT DAIRY RECKONING',
    'OF 3:17 A.M.',
    'by The Bard of Bizarre, 1995',
    'Shareware from The Sofa BBS',
    '',
    'Based on the spoken piece',
    '"The Great Dairy Reckoning of',
    '3:17 a.m." by The Bard of',
    'Bizarre (Lewis Moten as his',
    'hobo clown, Doc Leo), from',
    "Lewis's own struggle: he is",
    'lactose intolerant, and he',
    'loves cheesecake.',
    '',
    "Monologue: ChatGPT, from",
    "Lewis's prompt (it called it",
    '"The Cheesecake Temptation: A',
    'Lactose Odyssey"). Recording',
    '(voice): Riffusion (now',
    'Google Flow Music). Voice',
    'clips here are cut from it.',
    'Music and title art: made for',
    'this game by Claude Opus 5.5',
    '(none came with the piece).',
    'The Bard of Bizarre logo:',
    'DeepAI. Doc Leo photo: Lewis',
    'Moten.',
    '',
    'Game: blocks, maps, sprites',
    'and the FM score by Claude,',
    'built as Game-Maker 3.0',
    'files. Made with GAME-MAKER',
    'by Recreational Software',
    'Designs.',
    '',
    'Is there Lactaid in hell?',
  ],
  3,
);

/** The credits, ending with the FREE TO SHARE page (kit/license.ts). */
export const CREDITS = withCreditPage(CREDITS_TEXT);

export function readme(price: string): string {
  return `
    THE GREAT DAIRY RECKONING
    OF 3:17 A.M.
    Version 1.0 - Nov 1995
    by The Bard of Bizarre

"There it is. The enemy.
 And the lover.
 The... enemy-lover."

It's 3:17 A.M. You are lactose
intolerant, and there is a
slice of New York cheesecake in
the fridge. Tiptoe out of bed
without waking your wife, past
the creaky board, the sleeping
dogs and the toy blocks. Climb
the fridge's shelves past the
dairy come to life, with all
the willpower seven sticks of
celery can give. Eat it anyway.
Then: the dash to the bathroom,
the gurgle right behind you.
Then: the reckoning, against the
Devil himself, in leisure wear,
sipping a milkshake. You have
almond milk now.

STARTING THE GAME
  Type RECKON and press Enter.
  VGA required. A Sound Blaster
  is recommended for the music
  (thunder, organ, a cow, a
  tango) and the monologue,
  spoken.

FILES IN THIS ZIP
  RECKON.GAM   the game
  *.MAP        four acts
  RECKON.BBL   blocks
  *.CHR        the man, and the
               man in hell
  *.SND        sound effects
  *.CMF        Sound Blaster
               music
  *.VOC        the monologue and
               sound effects
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
  you put the cheesecake back,
  register for ${price}: you get a
  tape of the monologue and the
  Bard's own recipe for a
  dairy-free cheesecake (it is
  mostly cashews and hope).
  Send a check (US funds) to:

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
  "The Great Dairy Reckoning of
  3:17 a.m.", a spoken piece by
  The Bard of Bizarre, from
  Lewis Moten's own struggle
  (lactose intolerant, loves
  cheesecake): monologue
  shaped by ChatGPT from
  Lewis's prompt; recording
  (voice) made with Riffusion
  (now Google Flow Music). The
  voice clips here are cut
  from the recording. The
  music and the title art were
  made for this game by Claude
  Opus 5.5. The logo was made
  with DeepAI; the Doc Leo
  photo is Lewis's own. Built
  by Claude with GAME-MAKER 3.0
  by Recreational Software
  Designs.

Is there Lactaid in hell?
`.replace(/^\n/, '');
}
