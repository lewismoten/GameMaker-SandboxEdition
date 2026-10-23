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
    'The Big Show was a BIG hit.',
    '',
    'The Klown Klub paraded until',
    'midnight. Teddy rode on the',
    "roof of Doc Leo's CitiCar,",
    'THE CHEZ. Gwinn chased the',
    'confetti. Everybody went home',
    'happy and tired.',
    '',
    'Well. Almost everybody.',
    '',
    "In the morning, Gwinn's bed",
    'is empty. Her pink collar is',
    'gone. A trail of confetti',
    'leads out the doggy door.',
    '',
  ],
  [
    'And Doc Leo has news: the',
    'Klown Klub is booked at the',
    'TRI-COUNTY FAIR, tonight, way',
    'out past the river. The Big',
    'Show was big. This show is',
    'BIGGER. Teddy opens.',
    '',
    "But Teddy won't go anywhere",
    'without his big sister.',
    '(He will not say so. But he',
    'keeps looking at her bed.)',
    '',
    'Doc Leo will drive THE CHEZ.',
    'Teddy will do the sniffing.',
    '',
    '',
  ],
  [
    'Follow her trail across town,',
    'over the river and out to the',
    'Fair. Fetch what she dropped',
    'on the way and bring it to',
    'Doc Leo at THE CHEZ: it tells',
    'him where to drive next.',
    '',
    'And where is Gwinn while all',
    "this goes on? You'll see. Now",
    'and then the story says',
    '"MEANWHILE..." and then YOU',
    'are Gwinn. Good luck.',
    '',
    'Same little dog.',
    'A little bigger adventure.',
  ],
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
    '        off pests',
    ' DOWN   dig: bones, soft dirt',
    ' F      fetch',
    ' S      SNIFF! (new) finds',
    '        what is hidden where',
    '        you see a faint wisp',
  ],
  [
    'MORE TRICKS (number keys)',
    ' 1  high five: hands held',
    '    out, balloons, and bells',
    '    (Teddy rings bells now)',
    ' 2  sit pretty: a heart for',
    '    anybody asking "SIT!"',
    ' 3  spin: revolving doors,',
    '    turnstiles, SPIN bubbles',
    ' 4  play dead (hold): things',
    '    fly over you',
    '',
    'Roll over? Teddy retired',
    'from rolling over. By',
    'choice. He is a professional',
    'now.',
    '',
  ],
  [
    "GWINN'S TRICKS (MEANWHILE...)",
    ' SPACE  BOOF: a big bark',
    ' DOWN   dig BIG (hard dirt)',
    ' 1      chew (ropes, boxes)',
    ' 2      sit (still learning)',
    ' 3      ZOOMIES! knocks over',
    '        things both ways',
    ' 4      flop (hold)',
    '',
    'Bring what Gwinn dropped to',
    'Doc Leo at THE CHEZ.',
    'F1 help  F2 your stuff',
    'F3 music F4 sounds',
    'F5 save  F6 load  ESC quit',
    'F2 shows treats as "Money".',
  ],
);

const CREDITS_TEXT = pages(
  [
    "TEDDY'S LITTLE BIGGER",
    'ADVENTURE',
    'Version 1.0, 1996',
    '',
    'Design, art, music and',
    'programming: Claude',
    '',
    'Starring Teddy as himself,',
    'a little bigger this time.',
    'Gwinn as herself (sorry,',
    'everybody). Doc Leo, still',
    'the friendliest hobo clown',
    'in the Klown Klub. And THE',
    'CHEZ, his red 1976 CitiCar.',
    '',
    '',
  ],
  [
    'No dogs were rushed. Gwinn',
    'did all of her own stunts,',
    "and some of everybody else's.",
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
    'register for $15. You get',
    'the next adventure, a poster',
    'of Teddy AND Gwinn, and our',
  ],
  ['thanks.', '', 'Sandbox Software', 'Dept. WOOF WOOF', 'P.O. Box 000', 'Pittsburgh, PA 15213', '', '(A made-up address. Please', 'do not mail anything.)'],
);

export const WON = pages(
  [
    'The judge looks at Gwinn.',
    '"SIT," says the judge.',
    '',
    'Teddy sits pretty beside her.',
    'Gwinn looks at Teddy.',
    'Gwinn looks at the judge.',
    'Gwinn looks at a corn dog.',
    '',
    'And then...',
    '',
    'Gwinn SITS.',
    '',
    'For a whole three seconds!',
    'The crowd goes wild. Gwinn',
    'goes wild. The ribbon is',
    'BLUE.',
  ],
  [
    'Then the Klown Klub takes the',
    'stage. Teddy opens with every',
    'trick he knows (and a sniff).',
    'Doc Leo pulls a dove out of',
    'his fedora. THE CHEZ leads the',
    'fair parade under fireworks.',
    '',
    'Doc Leo orders a root beer.',
    '(He always orders root beer.)',
    'Gwinn gets a corn dog. Teddy',
    'gets the rest of the corn dog',
    'when Gwinn is not looking.',
    '',
    "Who's a good boy? TEDDY IS.",
    "Who's a good girl? GWINN IS.",
    '(Mostly.)',
  ],
);

export const LOST = pages([
  'Teddy is all tuckered out.',
  '',
  'Even the best little dog',
  'needs a nap after a day like',
  'this one. Gwinn would never',
  'nap now. (Gwinn would never',
  'nap, period.)',
  '',
  'Try again! Remember:',
  ' - BONES give energy back',
  ' - SNIFF (S) at faint wisps',
  ' - WOOF at pests first',
  ' - play dead (4) when things',
  '   come flying at you',
]);

/**
 * The felt egg's page (shown on the way down from where it hides). The egg's description,
 * credits and lore are its entry in the web app's egg registry (web/src/eggs/eggs.ts).
 */
export const EGG = pages(
  [
    'Butterscotch felt walked all',
    'over with little brown paw',
    'prints, a white felt bone',
    'appliqued on each side with a',
    'red bow tied round it, and a',
    'collar of blue rickrack with',
    'a tiny brass tag that reads',
    '"2".',
    '',
    'Buried with the bone: a',
    'wooden spoon, well gnawed and',
    'still sticky. Teddy will not',
    'say where he got it, but he',
    'keeps looking toward the',
    'kitchen and licking his nose.',
  ],
  ['STARRING', '', 'Teddy, a little bigger', 'this time', '', "Stunts by Gwinn (two n's),", 'uncredited at her own', 'request'],
);

/** Lines under each level card (yellow lines start with NEW). */
export const CARDS: Record<string, string[]> = {
  house: ["Gwinn's bed is empty! Sniff", 'out her collar. Doc Leo waits.', 'NEW: SNIFF (S)'],
  night: ['MEANWHILE... last night. YOU', 'are Gwinn. Follow your nose!', 'NEW: SPACE BOOF 1 CHEW 3 ZOOM'],
  farm: ['MEANWHILE... dawn. Gwinn finds', 'a farm. So many chickens!', 'RIDE THE HAY ELEVATOR'],
  show: ['The dog show! Gwinn is in', 'the Best Behaved ring. Uh-oh.', 'EVERY TRICK YOU KNOW'],
  midway: ['THE FAIR! Earn tickets with', 'tricks. THE BIG DROP takes 3.', 'NEW: TICKETS FOR TRICKS'],
  maze: ['A corn maze! Sniff out her', 'paw prints: they show the way.', 'STEPS GO UP, HOLES GO DOWN'],
  river: ['The rubber chicken is in the', 'river! Sit for the miller.', 'NEW: SWIM WITH THE CURRENT'],
  main: ['Her leash is on the gazebo!', 'Ring bells with a high five.', 'NEW: RING THE BELL (1)'],
};

/** Lines on the disk's text files: 31 columns at most. */
const README_WIDTH = 31;

export function readme(price: string): string {
  const out = `
TEDDY'S LITTLE BIGGER ADVENTURE
     Version 1.0 - 1996
  (c) 1996 Sandbox Software

The morning after the Klown
Klub's Big Show, Gwinn's bed is
empty. Her collar is gone, and
a trail of confetti leads out
the doggy door. Tonight the
Klown Klub plays the Tri-County
Fair, and Teddy won't go
without his big sister.

Sniff out her trail across
town, over the river and out to
the Fair. Bring what she
dropped to Doc Leo and his red
CitiCar, THE CHEZ. And now and
then: MEANWHILE... you are
Gwinn.

STARTING THE GAME
  Type TEDDY2 and press Enter.
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

  F1 help     F2 status
  F3 music    F4 sound
  F5 save     F6 load
  ESC quit

THIS IS SHAREWARE
  You may copy TEDDY'S LITTLE
  BIGGER ADVENTURE and give it
  to your friends, upload it to
  your favorite BBS, or put it
  on a shareware disk, as long
  as all of the files are
  included and unchanged.

  If you enjoy it, please
  register for ${price} with
  Sandbox Software. Registered
  players receive the next
  adventure, a full-color
  poster of Teddy and Gwinn,
  and our thanks. Send a check
  or money order (US funds) to:

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
  Designs. For Teddy, for
  Gwinn (who sat, once), and
  for Doc Leo and every
  friendly clown in every Klown
  Klub.

Woof! Boof!
`.replace(/^\n/, '');
  for (const l of out.split('\n')) if (l.length > README_WIDTH) throw new Error(`readme line over ${README_WIDTH} columns: "${l}"`);
  return out;
}

export const README = readme('$15');

/** The credits, ending with the FREE TO SHARE page (kit/license.ts). */
export const CREDITS = withCreditPage(CREDITS_TEXT);
