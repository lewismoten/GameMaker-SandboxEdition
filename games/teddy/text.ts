// The words: text pages Game-Maker writes over the cream panels (30 columns, 16 lines a
// page), the level cards, and the readme on the disk.

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
    'proud member of the Klown',
    "Klub. Tonight is the Klub's",
    'Big Show, and Doc Leo is the',
    'star.',
    '',
    'Teddy also has a big sister:',
    'Gwin, a brown pit-lab mix.',
    'She is younger, but bigger.',
    'She ruins everything.',
  ],
  [
    'This morning Gwin found Doc',
    "Leo's costume suitcase. She",
    'ran out the back door with it',
    'and all over town, and the',
    'costume went everywhere:',
    '',
    '  the HAT,  the BOW TIE,',
    '  the SHOES, the HORN,',
    '  and the RED NOSE.',
    '',
    'No nose, no show!',
    '',
    'Doc Leo is already at the',
    'Klub getting ready. Only a',
    'little dog can save the Big',
    'Show. A little dog...',
  ],
  [
    '...with a big adventure.',
    '',
    "Fetch each piece of Doc Leo's",
    'costume. His friend Pockets',
    'waits with the Klown Car at',
    'the end of every stop and',
    'drives Teddy on to the next',
    'one, once he has the piece.',
    '',
    'Backyard. Maple Street. The',
    'park. Downtown. And at last,',
    'the Klown Klub itself.',
    '',
    'Good luck, Teddy.',
    "Who's a good boy?",
  ],
);

export const HELP = pages(
  [
    'MOVING',
    ' LEFT/RIGHT  walk',
    ' UP          hop (hold it to',
    '             hop higher, let',
    '             go to steer)',
    '',
    "TEDDY'S TRICKS",
    ' SPACE  speak: WOOF! scares',
    '        squirrels, cats,',
    '        pigeons and geese',
    ' DOWN   dig: unearths bones,',
    '        digs through soft',
    '        dirt and sand',
    ' F      fetch: pick up Doc',
    "        Leo's costume",
  ],
  [
    ' H      high five: pops',
    '        balloons, slaps the',
    '        hands held out above',
    ' S      sit pretty: sends up',
    '        a heart for anybody',
    '        asking "SIT!"',
    ' T      spin: turns',
    '        revolving doors and',
    '        turnstiles',
    ' R      roll over: shakes',
    '        loose a fluff ball',
    '        that knocks stacks',
    '        over',
    ' D      play dead (hold):',
    '        flat as a rug, so',
    '        things fly over you',
  ],
  [
    'TREATS are worth points. A',
    'BONE gives energy back.',
    'Gwin eats your treats when',
    'she bumps into you!',
    '',
    'Bring the costume piece to',
    'the Klown Car to go on.',
    '',
    'F1 help      F2 your stuff',
    'F3 music     F4 sounds',
    'F5 save      F6 load',
    'ESC quit',
    '',
    'F2 shows treats as "Money"',
    'and energy as "Hitpoints".',
  ],
);

export const CREDITS = pages(
  [
    "TEDDY'S LITTLE BIG ADVENTURE",
    'Version 1.0, 1995',
    '',
    'Design, art, music and',
    'programming: Claude',
    '',
    'Starring Teddy as himself.',
    'With Gwin as herself (sorry).',
    'And Doc Leo, the friendliest',
    'hobo clown in the Klown Klub.',
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
    'P.O. Box 1995',
    'Pittsburgh, PA 15213',
    '',
    '(A made-up address. Please',
    'do not mail anything.)',
  ],
);

export const WON = pages([
  'The Big Show!',
  '',
  'Doc Leo honks his horn, tips',
  'his hat, straightens his bow',
  'tie, wiggles his big shoes,',
  'and puts on his RED NOSE.',
  '',
  'The crowd roars. The Klown',
  'Klub cheers. And Teddy',
  'takes a bow.',
  '',
  'Gwin is covered in confetti,',
  'frosting and sawdust. She',
  'has never been happier.',
  '',
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
  ' - play dead (D) when things',
  '   come flying at you',
]);

/** Lines under each level card (yellow lines start with NEW). */
export const CARDS: Record<string, string[]> = {
  backyard: ["Fetch Doc Leo's hat, then dig", 'under the fence to the car.', 'NEW: HOP SPEAK DIG FETCH'],
  street: ['Bow tie. Watch the sprinklers', 'and the mail truck.', 'NEW: HIGH FIVE (H)'],
  park: ['Big shoes. Geese guard the', 'bridge; kids want a sit!', 'NEW: SIT PRETTY (S)'],
  city: ['The horn. Spin the revolving', 'doors; play dead under pins!', 'NEW: SPIN (T)  PLAY DEAD (D)'],
  klub: ['The red nose! Earn tickets', 'with tricks. Showtime!', 'NEW: ROLL OVER (R)'],
};

export function readme(price: string): string {
  return `              TEDDY'S LITTLE BIG ADVENTURE
                    Version 1.0 - 1995
                (c) 1995 Sandbox Software

  Teddy is a Pembroke Welsh Corgi who knows a ton of tricks. His
  person, Doc Leo, is a friendly hobo clown and tonight is the star
  of the Klown Klub's Big Show. But Teddy's big sister Gwin (younger,
  bigger, a brown pit-lab mix who ruins everything) ran off with Doc
  Leo's costume suitcase and scattered it all over town.

  Hop, bark, dig, high five, sit pretty, spin, roll over and play
  dead your way from the backyard to Maple Street, the park,
  downtown and the Klown Klub, and get every piece of the costume -
  the hat, the bow tie, the shoes, the horn and the red nose - to the
  show on time.

  STARTING THE GAME
    Type TEDDY and press Enter. A VGA display is required. A Sound
    Blaster (or compatible) is recommended for the music and the
    digitized sound effects; the PC speaker works too.

  KEYS
    LEFT/RIGHT walk         UP hop (hold for higher)
    SPACE      speak        DOWN dig
    F          fetch        H    high five
    S          sit pretty   T    spin
    R          roll over    D    play dead (hold)
    F1 help  F2 status  F3 music  F4 sound  F5 save  F6 load  ESC quit

  FILES ON THIS DISK
    TEDDY.GAM     the game          *.MAP      five levels
    *.BBL *.MBL   blocks            *.MON      monsters
    TEDDY.CHR     Teddy             TEDDY.SND  sound effects
    *.CMF         Sound Blaster     *.VOC      digitized sounds
    *.GIF *.FLI   pictures          README.TXT this file

  THIS IS SHAREWARE
    This is shareware. You may copy TEDDY'S LITTLE BIG ADVENTURE and
    give it to your friends, upload it to your favorite BBS, or put it
    on a shareware disk, as long as all of the files are included and
    unchanged.

    If you enjoy it, please register for ${price} with Sandbox Software.
    Registered players receive the next adventure, a full-color poster
    of Teddy, and our thanks. Send a check or money order (US funds)
    to:

        Sandbox Software
        Dept. WOOF
        P.O. Box 1995
        Pittsburgh, PA 15213

    (This is a fictional address for this game - there is no real
    Sandbox Software to mail. Please do not send money anywhere.)

  SAYING THANKS
    Built with GAME-MAKER 3.0 by Recreational Software Designs.
    For Teddy, for Gwin (yes, even Gwin), and for Doc Leo and every
    friendly clown in every klown klub.

  Woof!
`;
}

export const README = readme('$12');
