// The words: text pages Game-Maker writes over the cream panels (30 columns, 16 lines a
// page), the level cards, and the readme on the disk.
import { withCreditPage } from '../../../kit/license';

/** Pads a page to 16 lines and checks the width. */
const page = (lines: string[]) => {
  for (const l of lines) if (l.length > 30) throw new Error(`Text line over 30 columns: "${l}"`);
  if (lines.length > 16) throw new Error(`Page over 16 lines: "${lines[0]}"`);
  while (lines.length < 16) lines.push('');
  return lines.join('\n');
};
const pages = (...ps: string[][]) => ps.map(page).join('\n');

export const STORY = pages(
  [
    'Teddy is a Pembroke Welsh',
    'Corgi. He is short. He is',
    'fluffy. He knows a TON of',
    'tricks.',
    '',
    'His person is Doc Leo, a',
    'friendly hobo clown and a',
    'proud member of the',
    'Clown Club. Doc Leo twists',
    'balloon animals, does magic',
    'tricks, and marches in every',
    'parade in town. Tonight is',
    "the Clown Club's Big Show,",
    'and Doc Leo is the star.',
    '',
    '',
  ],
  [
    'Teddy also has a big sister,',
    'Gwinn: a chocolate pit-lab',
    'mix. Adopted, younger, bigger,',
    'still learning. (SIT? Nope.)',
    '',
    'Doc Leo drove ahead to the',
    'Clown Club in his little red',
    '1976 CitiCar. Then Gwinn found',
    'his costume suitcase on the',
    'back step, and ran all over',
    'town with it. Out flew the',
    'FEDORA, the GREEN TIE, the RED',
    'SNEAKERS, the RUBBER CHICKEN',
    '(on its leash) and the RED',
    'NOSE. Balloon dogs too.',
    '',
  ],
  [
    'No nose, no show! Only a',
    'little dog can save the Big',
    'Show. A little dog...',
    '...with a big adventure.',
    '',
    "Fetch each piece of Doc Leo's",
    'costume. His friend Pockets',
    "waits in Doc Leo's CitiCar at",
    'the end of every stop and',
    'drives Teddy on to the next',
    'one, once he has the piece.',
    '',
    'Backyard. Maple Street. The',
    'park. Downtown, where the',
    'parade is lining up. And at',
    'last, the Clown Club itself.',
  ],
  ['Good luck, Teddy.', "Who's a good boy?"],
);

export const HELP = pages(
  [
    'MOVING (arrows or W A D)',
    ' LEFT/RIGHT  walk (A/D)',
    ' UP/W  hop (hold it to hop',
    '       higher, let go to',
    '       steer)',
    ' Q/E   hop up and left/right',
    '       in one go',
    '',
    "TEDDY'S TRICKS",
    ' SPACE  speak: WOOF! scares',
    '        squirrels, cats,',
    '        pigeons and geese',
    ' DOWN   dig: unearths bones,',
    '        digs through soft dirt',
    ' F      fetch: pick up Doc',
    "        Leo's costume",
  ],
  [
    'TRICKS ON THE NUMBER KEYS',
    ' 1  high five: pops balloons,',
    '    slaps hands held out',
    ' 2  sit pretty: a heart for',
    '    anybody asking "SIT!"',
    ' 3  spin: turns revolving',
    '    doors and turnstiles',
    ' 4  play dead (hold): flat',
    '    as a rug, so things fly',
    '    over you',
    ' 5  roll over: shakes loose',
    '    a fluff ball that knocks',
    '    stacks over',
    '',
    '',
    '',
  ],
  [
    'TREATS are worth points. A',
    'BONE gives energy back. A',
    'BALLOON DOG is worth 250.',
    'Gwinn bumps you: one treat',
    "gone. She has Teddy's green",
    'WOBBLE BALL too: WOOF and she',
    "drops it. It's an extra nap!",
    'Bring the costume piece to',
    "Doc Leo's red CitiCar.",
    'F1 help      F2 your stuff',
    'F3 music     F4 sounds',
    'F5 save      F6 load',
    'ESC quit',
    'F2 shows treats as "Money"',
    'and energy as "Hitpoints".',
  ],
);

const CREDITS_TEXT = pages(
  [
    "TEDDY'S LITTLE BIG ADVENTURE",
    'Version 1.0, 1995',
    '',
    'Design, art, music and',
    'programming: Claude',
    '',
    'Starring Teddy as himself.',
    'With Gwinn as herself (sorry).',
    'And Doc Leo, the friendliest',
    'hobo clown in the Clown Club,',
    'and his red 1976 CitiCar.',
    '',
    'Made with GAME-MAKER 3.0 by',
    'Recreational Software',
    'Designs. No programming',
    'needed!',
  ],
  [
    'THIS IS SHAREWARE',
    '',
    'Copy it for your friends and',
    'upload it to your favorite',
    'BBS. If you enjoy it, please',
    'register for $12. You get',
    'the next adventure, a poster',
    'of Teddy, and our thanks.',
    '',
    'Sandbox Software',
    'Dept. WOOF',
    'P.O. Box 000',
    'Pittsburgh, PA 15213',
    '',
    '(A made-up address. Please',
    'do not mail anything.)',
  ],
);

export const WON = pages([
  'The Big Show!',
  '',
  'Doc Leo tips his fedora,',
  'straightens his tie, laces',
  'his red sneakers, walks his',
  'rubber chicken (BAWK!) and',
  'puts on his RED NOSE.',
  '',
  'Then he orders a root beer.',
  '(He always orders root beer.)',
  'The crowd roars, the',
  'Clown Club parades out into',
  'the night with Teddy up on',
  'the CitiCar roof, and Gwinn',
  'chases the confetti.',
  "Who's a good boy? TEDDY IS.",
]);

export const LOST = pages([
  'Teddy is all tuckered out.',
  '',
  'Even the best little dog',
  'needs a nap after a day like',
  'this one. Doc Leo will be',
  'home soon with a treat.',
  '',
  'Try again! Remember:',
  ' - BONES give energy back',
  ' - WOOF at pests first',
  ' - play dead (4) when things',
  '   come flying at you',
]);

/** Shown on the way out of the Dog House (the felt egg's page; names as in the credits). */
export const DOGHOUSE = pages(
  [
    "Felted like Doc Leo's own",
    'clown egg: cream felt with',
    'red big-top stripes, rainbow',
    'polka dots, a corgi-orange',
    'paw print on each side and a',
    'tiny red pom-pom nose on top.',
    '',
    'Teddy found it by the red door',
    'of The Dog House, at the end',
    'of a trail of sugar, vanilla',
    'and something fizzy.',
    '',
    'He followed it as far as the',
    'kitchen and was told, firmly,',
    '"Not yet."',
  ],
  ['STARRING', '', 'Teddy, a corgi who knows', 'left from right', '', 'and Doc Leo, PhD', '(Comedic Science)'],
);

/** Lines under each level card (yellow lines start with NEW). */
export const CARDS: Record<string, string[]> = {
  backyard: ["Fetch Doc Leo's fedora, dig", 'under the fence. WOOF at Gwinn!', 'NEW: HOP DIG F:FETCH SPACE:WOOF', 'F5 SAVES  F6 LOADS'],
  street: ['Green tie. Watch sprinklers;', 'borrow a book at the Dog House.', 'NEW: HIGH FIVE (1)'],
  park: ['Red sneakers. Geese guard the', 'bridge; kids want a sit!', 'NEW: SIT PRETTY (2)'],
  city: ['Rubber chicken! Spin the', 'revolving doors; play dead!', 'NEW: SPIN (3)  PLAY DEAD (4)'],
  klub: ['The red nose! Earn tickets', 'with tricks. Root beer, too.', 'NEW: ROLL OVER (5)'],
};

/** Lines on the disk's text files: 31 columns at most. */
const README_WIDTH = 31;

function readme(price: string): string {
  const out = `
 TEDDY'S LITTLE BIG ADVENTURE
     Version 1.0 - 1995
  (c) 1995 Sandbox Software

Teddy is a Pembroke Welsh Corgi
who knows a ton of tricks. His
person, Doc Leo, is a friendly
hobo clown, and tonight he is
the star of the Clown Club's
Big Show. But Teddy's big
sister Gwinn just ran off with
Doc Leo's costume suitcase and
scattered it all over town.
No nose, no show!

Hop, bark, dig, high five, sit
pretty, spin, play dead and
roll over your way across
town. Find every piece of the
costume and get it to the show
on time!

STARTING THE GAME
  Type TEDDY and press Enter.
  A VGA display is required. A
  Sound Blaster (or compatible)
  is recommended for the music
  and digitized sound effects;
  the PC speaker works too.

KEYS
  LEFT/RIGHT or A/D  walk
  UP or W  hop (hold: higher)
  Q / E    hop up-left/right
  DOWN     dig
  SPACE    speak
  F        fetch
  1        high five
  2        sit pretty
  3        spin
  4        play dead (hold)
  5        roll over
  F1 help     F2 status
  F3 music    F4 sound
  F5 save     F6 load
  ESC quit

FILES ON THIS DISK
  TEDDY.GAM   the game
  *.MAP       five levels
  *.BBL *.MBL blocks
  *.MON       monsters
  TEDDY.CHR   Teddy
  TEDDY.SND   sound effects
  *.CMF       Sound Blaster
              music
  *.VOC       digitized sounds
  *.GIF *.FLI pictures
  *.LST       slide shows
  README.TXT  this file

THIS IS SHAREWARE
  You may copy TEDDY'S LITTLE
  BIG ADVENTURE and give it to
  your friends, upload it to
  your favorite BBS, or put it
  on a shareware disk, as long
  as all of the files are
  included and unchanged.

  If you enjoy it, please
  register for ${price} with
  Sandbox Software. Registered
  players receive the next
  adventure, a full-color
  poster of Teddy, and our
  thanks. Send a check or
  money order (US funds) to:

    Sandbox Software
    Dept. WOOF
    P.O. Box 000
    Pittsburgh, PA 15213

  (This is a fictional address
  for this game - there is no
  real Sandbox Software to
  mail. Please do not send
  money anywhere.)

SAYING THANKS
  Built with GAME-MAKER 3.0 by
  Recreational Software
  Designs. For Teddy, for
  Gwinn (yes, even Gwinn), and
  for Doc Leo and every
  friendly clown in every
  Clown Club.

Woof!
`.replace(/^\n/, '');
  for (const l of out.split('\n')) if (l.length > README_WIDTH) throw new Error(`readme line over ${README_WIDTH} columns: "${l}"`);
  return out;
}

export const README = readme('$12');

/** The credits, ending with the FREE TO SHARE page (kit/license.ts). */
export const CREDITS = withCreditPage(CREDITS_TEXT);
