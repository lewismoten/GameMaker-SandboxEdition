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
    "It is Teddy's birthday.",
    '',
    'Nobody says so.',
    '',
    'Doc Leo says "Good morning,',
    'buddy!" and hands Teddy a',
    'list of ERRANDS. Gwinn is not',
    'in her bed. (Again!)',
    '',
    'Teddy does not say anything.',
    'He is a professional. But his',
    'ears droop a little, and so',
    'does his grin. Just a',
    'little.',
  ],
  [
    'So off they go in THE CHEZ,',
    "Doc Leo's little red",
    'CitiCar: the garage, Maple',
    'Street, Puddlewick Park,',
    'Downtown, the river, the old',
    'mill, the Fair, and up Lookout',
    "Hill to the Clown Club's Big",
    'Top.',
    '',
    'Fetch what is on the list at',
    'each stop and bring it to Doc',
    'Leo. He will say it is just',
    'errands.',
    '',
    'It is not just errands.',
  ],
  [
    'Every so often the story says',
    '"MEANWHILE..." and YOU are',
    'Gwinn, or Doc Leo himself.',
    'And between stops, you drive',
    'THE CHEZ (mind the charge).',
    '',
    'You will see what everybody',
    'is up to. Teddy will not.',
    "Please don't tell him.",
    '',
    'Same little dog.',
    'Little BIGGEST adventure.',
  ],
);

export const HELP = pages(
  [
    'TEDDY (arrows or W A D)',
    ' LEFT/RIGHT walk  UP hop',
    '   (hold: higher)  Q/E hop',
    '   up-left / up-right',
    ' SPACE woof     DOWN dig',
    ' F fetch        S sniff',
    ' 1 high five: bells, buttons',
    ' 2 sit pretty   3 spin',
    ' 4 play dead (hold)',
    '',
    'BUTTONS: high five one and a',
    'spark runs down its wire to',
    'what it opens. Some doors',
    'close again by themselves.',
  ],
  [
    'GWINN (MEANWHILE...)',
    ' SPACE BOOF     DOWN dig big',
    ' 1 chew         2 sit (sort',
    '                  of)',
    ' 3 zoomies      4 flop (hold)',
    '',
    'DOC LEO (MEANWHILE...)',
    ' LEFT/RIGHT stroll  UP hop',
    ' SPACE squeeze the rubber',
    '   chicken: SQUAWK!',
    ' 1 twist a balloon dog: it',
    '   floats him up. It pops!',
    ' 4 pratfall (hold)',
    ' F fetch',
  ],
  [
    'THE CHEZ (on the road)',
    ' LEFT/RIGHT drive',
    ' UP bump (over potholes)',
    ' Q/E bump up and along',
    ' SPACE HONK!',
    ' Pull up to a CHARGER to',
    ' plug in. A hill takes one',
    ' charge to climb.',
    '',
    'F1 help  F2 your stuff',
    'F3 music F4 sounds',
    'F5 save  F6 load  ESC quit',
    'F2 shows your treats',
    'and your energy.',
  ],
);

const CREDITS_TEXT = pages(
  [
    "TEDDY'S LITTLE BIGGEST",
    'ADVENTURE',
    'Version 1.0, 1997',
    '',
    'Design, art, music and',
    'programming: Claude',
    'Happy Birthday to You: the',
    'tune of Good Morning to All',
    'by Mildred J. Hill (1893),',
    'public domain.',
    '',
    'Starring Teddy as himself,',
    'Gwinn as herself, Doc Leo as',
    'the friendliest hobo clown in',
    'the Clown Club, and THE CHEZ,',
    'his red 1976 CitiCar.',
  ],
  [
    'No dogs were surprised before',
    'the end. Gwinn kept the',
    'secret for almost a whole',
    'day.',
    '',
    'Made with GAME-MAKER 3.0 by',
    'Recreational Software',
    'Designs. No programming',
    'needed!',
    '',
    'THIS IS SHAREWARE',
    'Copy it for your friends and',
    'upload it to your favorite',
    'BBS. If you enjoy it, please',
    'register for $15. You get a',
    'poster of all four heroes',
  ],
  [
    'and our thanks.',
    '',
    'Sandbox Software',
    'Dept. WOOF WOOF',
    'P.O. Box 000',
    'Pittsburgh, PA 15213',
    '',
    '(A made-up address. Please',
    'do not mail anything.)',
  ],
);

export const WON = pages(
  [
    'The Big Top is dark.',
    '',
    'Teddy pads into the middle of',
    'the ring. He sniffs. He knows',
    'that smell. That is CAKE.',
    '',
    'The lights come up.',
    '',
    '    S U R P R I S E !',
    '',
    'Everybody is there. The',
    'Clown Club. The miller. The',
    'Town Crier. The geese (invited',
    'Gwinn, sort of). Doc Leo, in',
    'his best fedora. And Gwinn,',
    'with a bow on her head.',
  ],
  [
    'There is the BIGGEST cake in',
    'the Tri-County area, with',
    'candles from the bakery. There',
    'are balloons. There is a',
    'banner. There are party horns.',
    'Teddy fetched all of it.',
    '',
    'Gwinn brings him her best',
    'bone, the one she buried',
    'before he was even born. She',
    'drops it at his paws. Then',
    'she SITS. On purpose.',
    '',
    'Happy birthday, Teddy.',
    'The littlest dog.',
    'The biggest day.',
  ],
);

export const LOST = pages([
  'The whole team is tuckered',
  'out.',
  '',
  'Teddy is asleep in the',
  'passenger seat. Gwinn is',
  'asleep on Teddy. Doc Leo is',
  'asleep on the rubber chicken.',
  'THE CHEZ is plugged in.',
  '',
  'Try again! Remember:',
  ' - BONES give energy back',
  ' - WOOF, BOOF or SQUAWK at',
  '   pests first',
  ' - flop flat (4) when things',
  '   come flying at you',
  ' - plug THE CHEZ in early',
]);

/**
 * The felt egg's page (shown on the way out of where it hides). The egg's description,
 * credits and lore are its entry in the web app's egg registry (web/src/eggs/eggs.ts).
 */
export const EGG = pages(
  [
    'Lilac felt sprinkled with',
    'confetti knots in every',
    'color, a pink felt birthday',
    'cake appliqued on each side',
    'with three yarn candles, and',
    'a collar of gold rickrack',
    'with a tiny brass tag that',
    'reads "3".',
    '',
    'Tucked in with the lost party',
    'hats: a place card in Doc',
    'Leo\'s hand. "ONE MORE CHAIR',
    'AT THE TABLE. Keep it for',
    'whoever is still coming."',
    'Teddy sat in it anyway.',
  ],
  [
    'STARRING',
    '',
    'Teddy, the biggest he',
    'has ever been',
    '',
    'Party planned by Gwinn',
    'and Doc Leo, who never',
    'once said so',
    '',
    'Stitched by',
    'Claude Opus 5.5',
  ],
);

/** Lines under each level card (yellow lines start with NEW). */
export const CARDS: Record<string, string[]> = {
  garage: ['Doc Leo needs the keys to', 'THE CHEZ. Errands day!', 'NEW: HIGH FIVE BUTTONS (1)', 'F5 SAVES  F6 LOADS'],
  maple: ['YOU drive THE CHEZ! Off to', 'Puddlewick Park. Mind charge.', 'NEW: SPACE HONK  UP BUMP'],
};

/** Lines on the disk's text files: 31 columns at most. */
const README_WIDTH = 31;

function readme(price: string): string {
  const out = `
TEDDY'S LITTLE BIGGEST
ADVENTURE
     Version 1.0 - 1997
  (c) 1997 Sandbox Software

It is Teddy's birthday, and
nobody says so. Doc Leo hands
him a list of errands, Gwinn
is out (again), and off they
go in THE CHEZ, Doc Leo's red
CitiCar: every place from the
first two adventures, and up
Lookout Hill to the Big Top.

And MEANWHILE... you play the
others too: Gwinn, Doc Leo,
and THE CHEZ on the road.

STARTING THE GAME
  Type TEDDY3 and press Enter.
  A VGA display is required. A
  Sound Blaster (or compatible)
  is recommended for the music
  and digitized sound effects;
  the PC speaker works too.

TEDDY'S KEYS
  LEFT/RIGHT or A/D  walk
  UP or W  hop (hold: higher)
  Q / E    hop up-left/right
  DOWN     dig
  SPACE    speak
  F        fetch
  S        sniff
  1        high five / ring
  2        sit pretty
  3        spin
  4        play dead (hold)

GWINN'S KEYS
  SPACE    boof
  DOWN     dig big
  1        chew
  2        sit (still learning)
  3        zoomies
  4        flop (hold)

DOC LEO'S KEYS
  SPACE    squeeze the chicken
  1        twist a balloon dog
  4        pratfall (hold)
  F        fetch

THE CHEZ
  LEFT/RIGHT  drive
  UP          bump
  SPACE       honk
  Chargers give charge; hills
  take one each.

  F1 help     F2 status
  F3 music    F4 sound
  F5 save     F6 load
  ESC quit

THIS IS SHAREWARE
  You may copy TEDDY'S LITTLE
  BIGGEST ADVENTURE and give it
  to your friends, upload it to
  your favorite BBS, or put it
  on a shareware disk, as long
  as all of the files are
  included and unchanged.

  If you enjoy it, please
  register for ${price} with
  Sandbox Software. Registered
  players receive a full-color
  poster of all four heroes and
  our thanks. Send a check or
  money order (US funds) to:

    Sandbox Software
    Dept. WOOF WOOF
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
  Designs. For Teddy, on his
  birthday; for Gwinn, who kept
  a secret; and for Doc Leo and
  every friendly clown in every
  Clown Club.

Woof! Boof! SQUAWK! Honk!
`.replace(/^\n/, '');
  for (const l of out.split('\n')) if (l.length > README_WIDTH) throw new Error(`readme line over ${README_WIDTH} columns: "${l}"`);
  return out;
}

export const README = readme('$15');

/** The credits, ending with the FREE TO SHARE page (kit/license.ts). */
export const CREDITS = withCreditPage(CREDITS_TEXT);
