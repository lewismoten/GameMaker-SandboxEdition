// The words on the disk: the instructions and credits (Game-Maker text pages, 30 columns and
// 16 lines a page) and README.TXT.
import { withCreditPage } from '../../../kit/license';

const page = (lines: string[]) => {
  for (const l of lines) if (l.length > 30) throw new Error(`Text line over 30 columns: "${l}"`);
  if (lines.length > 16) throw new Error(`Text over a page: "${lines[0]}"`);
  while (lines.length % 16) lines.push('');
  return lines.join('\n');
};

export const INSTRUCTIONS = [
  page([
    'Find the three pieces of the',
    'Royal Round Tuit and take them',
    'to Deadline Keep.',
    '',
    'ARROWS or W A S D walk.',
    'SPACE swings your sword the',
    'way you last walked.',
    'ENTER picks up what you stand',
    'on (rare, and worth it).',
    'K toots the kazoo (once Doc',
    'Leo has taught you).',
    'T drinks a tonic.',
    '',
    'WALK INTO people to talk, and',
    'into shop counters to buy:',
    'once to pay, again to take.',
  ]),
  page([
    'Foes that bite you get hurt',
    'too. Gems they drop are money.',
    '',
    'GATES open when you have what',
    'they want: the Royal Writ,',
    'the foghorn, a lamp, a charge',
    'for THE CHEZ, the Tuit pieces.',
    'Walk into them.',
    '',
    'The Tuit Table in the Garden',
    'Court lights a pedestal for',
    'each piece you carry.',
    '',
    'Rest at an inn bed (10 gold).',
    'Tonics are 15 gold. Hattie',
    'sells phoenix feathers.',
  ]),
  page([
    'THE CHEZ crosses the Dawdle',
    'Flats. Arrows drive, SPACE',
    'honks. Charging posts top up',
    'her charge (your hit points).',
    'The low bridges flood with the',
    'tide: wait for it to drain.',
    '',
    'F1 help      F2 your satchel',
    'F3 music     F4 sound',
    'F5 save      F6 load',
    'ESC quit',
    '',
    'F2 shows gold, hit points,',
    'lives and what you carry.',
    'Save often. Procrastia is',
    'bigger than it looks.',
  ]),
].join('\n');

export const CREDITS = withCreditPage(
  [
    page([
      'QUEST FOR THE ROUND TUIT',
      'Sandbox Software, 1996',
      '',
      'Design, pixels, maps, music,',
      'sound and words by Claude -',
      'every block, monster, song and',
      'scene built as Game-Maker 3.0',
      'files, in code.',
      '',
      'Roads that curve, rivers that',
      'run diagonally, shores with',
      'foam on them: painted in true',
      'color, then dithered into 256.',
      '',
      'Made with GAME-MAKER by',
      'Recreational Software Designs.',
    ]),
    page([
      'STARRING',
      '',
      'Pip of Nowish ......... Pip',
      'Doc Leo .... himself, a hobo',
      '  clown, PhD (Comedic Science)',
      'Sir Reginald Cluckington III',
      '  .......... a rubber chicken',
      'Teddy ..... a corgi who knows',
      '  his left from his right',
      "Gwinn .. two n's, one sock",
      'THE CHEZ .. a 1976 1/2 CitiCar',
      '  (charge port: rear passenger',
      '  side, for reasons)',
      '',
      'Lord Deadline ..... himself',
      '',
    ]),
    page(['For Lewis "Lewie" Moten III,', 'who always gets around to it.', '', 'No kings were rushed in the', 'making of this game.']),
  ].join('\n'),
);

export function readme(price: string): string {
  return `
    QUEST FOR THE ROUND TUIT
    A Realm of Procrastia Adventure
    Version 1.0 - Spring 1996
    (c) 1996 Sandbox Software

In the Kingdom of Procrastia
everything gets done...
eventually. King Dillydally IX
keeps the realm running with the
Royal Round Tuit: whenever he
gets one, he gets around to it.

Then Lord Deadline stole it and
broke it in three. Now nobody
gets around to anything, least
of all stopping him.

Except Pip of Nowish, the one
person in Procrastia who does
things the day he's asked.

Four towns, four dungeons, a
drive across forty leagues of
tidal mud in a horseless
carriage, a jester with a
rubber chicken on a leash, two
runaway royal hounds and a
library book 300 years overdue.

STARTING THE GAME
  Type TUIT and press Enter.
  A VGA display is required. A
  Sound Blaster (or compatible)
  is recommended for the music
  and sampled sound effects;
  the PC speaker works too.

FILES ON THIS DISK
  TUIT.GAM     the game
  *.MAP        the world, towns
               and dungeons
  *.BBL        blocks
  *.MBL *.MON  monsters
  PIP.CHR      Pip
  CHEZ.CHR     THE CHEZ
  *.CMF        Sound Blaster
               music
  *.VOC        digitized sounds
  *.GIF *.FLI  pictures
  README.TXT   this file

THIS IS SHAREWARE
  You may copy QUEST FOR THE
  ROUND TUIT and give it to your
  friends, upload it to your
  favorite BBS, or put it on a
  shareware disk, as long as all
  of the files go with it,
  unchanged.

  If you enjoy it, please
  register for ${price}. You'll get
  the cloth map of Procrastia,
  the Royal Hint Book (with a
  red film to read the answers
  through), and our thanks.
  Eventually.

    Sandbox Software
    P.O. Box 000
    Pittsburgh, PA 15213

  Or call THE SANDBOX BBS, open
  24 hours, 14,400 baud.

Nobody is allowed to rush you.
`;
}
