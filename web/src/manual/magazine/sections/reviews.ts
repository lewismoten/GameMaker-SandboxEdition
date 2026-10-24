// Reviews: the Shareware Game of the Month (Sign of the Hedgehog, chosen after studying its
// maps and files on the CD: nine places across England, a map screen between them, a real
// ending) with the design practices it shows, pointed at The Ultimate Owner's Guide's chapters
// (craft, levels); then short reader reviews of the CD's gameware and shareware. Every fact
// comes from the games' own text screens and maps, and each author is credited as their own
// files name them.
import { cols, grid, head, note, p, pull, shot, side } from '../blocks';
import type { Block, MagSection } from '../types';

const HOG = 'signhdg';

interface Review {
  game: string;
  title: string;
  /** Who made it, as the game's own files say. */
  by: string;
  /** Stars out of five (halves allowed) and the 1–100 score. */
  stars: number;
  score: number;
  text: string;
  pros: string;
  cons: string;
  /** The reader who sent it in (a handle, as on the BBSes). */
  from: string;
}

const starLine = (n: number): string => '★'.repeat(Math.floor(n)) + (n % 1 ? '½' : '') + '☆'.repeat(5 - Math.ceil(n));

/** One review: a little headline, what the reader says, plusses and minuses, and the score. */
function review(r: Review): Block[] {
  return [
    head(r.title, { size: 's', level: 3 }),
    note(r.by),
    p(r.text),
    p(`**+** ${r.pros} **–** ${r.cons}`),
    p(`**${starLine(r.stars)} ${r.score}/100** · [Play it](go:play/${r.game}) · *${r.from}*`),
  ];
}

const REVIEWS_A: Review[] = [
  {
    game: 'paperair',
    title: 'Paper Airplane',
    by: 'Shareware by Matt Bell, 1993',
    stars: 4,
    score: 84,
    text: 'XEMTX stole your invention, the patent office is 900 miles off, and the bridges are out, so you fold your application into a paper airplane, bolt on a motor and fly it there. The flying changes as you go: some levels you sink unless you climb, some you glide, some you ride rocket engines you pick up on the way.',
    pros: 'A story that made us laugh out loud, and a new way to fly every few levels.',
    cons: 'The shareware version stops after seven of its fourteen levels.',
    from: 'BALSAWOOD',
  },
  {
    game: 'octolrs',
    title: 'Octolris',
    by: 'Shareware by A-J Games (Eric-Jon Waugh), 1994',
    stars: 4,
    score: 82,
    text: 'The last slime octopus on Earth escapes a sushi boat and heads for the ocean through a seahouse, the vents, the street, the sewers and a discotheque. Grab vials of slime and he can climb walls (press slash), which turns every level into a puzzle about where you are allowed to go.',
    pros: 'You will see a slime octopus climb a fence in a disco.',
    cons: 'Short, with more rounds for registered players.',
    from: 'TENTACLE TOM',
  },
];

const REVIEWS_B: Review[] = [
  {
    game: 'orb',
    title: 'ORB: The Derelict Planet',
    by: 'Shareware by Josh Turcotte',
    stars: 3.5,
    score: 76,
    text: 'You are an Orb, a rolling machine from Chara 4, sent to an aggressor world whose ten dropped weapons have gone missing. A planetary report rates every weapon from the Orb of Water to the Orb of Antimatter, so you know what beats what.',
    pros: 'Credits that thank the author’s dog, two parakeets and a cat for the monsters.',
    cons: 'Three levels of a planned ten, and it is hard.',
    from: 'ROLLER',
  },
  {
    game: 'parsec3d',
    title: 'Parsec Man 3D',
    by: 'Shareware by Mark Hadley, 1994',
    stars: 3.5,
    score: 74,
    text: 'Jetpack across the four planets of XON for a power crystal. The “3D” is real: dig out a pair of red/blue 3D glasses, because the title and the star map of XON are drawn twice, in red and in blue, and float right off the screen. In the levels there is depth of another kind: blocks drawn behind Parsec can be passed through, blocks level with him are solid. Some planets have gravity; some are seen from above.',
    pros: 'Real red/blue 3D: keep the glasses by the keyboard.',
    cons: 'It takes a level to learn which blocks are “behind”.',
    from: 'ZON RANGER',
  },
  {
    game: 'zoom',
    title: 'Zoom the Super Bear',
    by: 'Shareware by A-J Games',
    stars: 4,
    score: 80,
    text: 'Grandpa Merlin’s spell goes awry and gives cousin Zoom the power to fly. Each of the five fruity locales comes in two scenes: an overhead shooter, then a side-view adventure, so the game keeps changing gear.',
    pros: 'Two kinds of game in one, in the same world as A-J’s Quest.',
    cons: 'Different keys for the two views take some getting used to.',
    from: 'CAPE CRUSADER',
  },
  {
    game: 'gridlin',
    title: 'Gridline',
    by: 'Shareware by Eric-Jon Waugh, 1993',
    stars: 3,
    score: 68,
    text: 'Trapped in a world of grids with creatures that turn flesh to stone at a touch, you have only your martial arts: kick with G and H, punch with Y and B, and drink the cola you find to protect yourself.',
    pros: 'A spooky, stark look and a simple goal: get out.',
    cons: 'Punishing from the first screen, and the kick keys are a stretch.',
    from: 'BLACK BELT BETH',
  },
];

const REVIEWS_GAMEWARE: Review[] = [
  {
    game: 'peach',
    title: 'Peach the Lobster',
    by: 'Gameware by Eric-Jon Waugh (A-J Games), 1994',
    stars: 4,
    score: 85,
    text: 'Fang Duck has taken over Norumbega, and the fastest land lobster around sneaks in to stop him: the Grasslands, sunken Atland, the caverns and the Techno-Castle. Shoot a monitor with your claw gun and its item flies to you.',
    pros: 'Full of ideas, and the credits thank the author’s mom for “the concept of a lobster in shoes”.',
    cons: 'Shooting monitors for items takes a round to understand.',
    from: 'CLAWDIA',
  },
  {
    game: 'nebula',
    title: 'Nebula',
    by: 'Gameware: story and graphics by Gregory Stone, monsters by Joan Stone',
    stars: 3.5,
    score: 75,
    text: 'You play a solar flare called before the Planetary Coalition: a haloed sun is about to go nova. Find the yellow orb in the blue world to spit fire, and look hard for a stronger fireball.',
    pros: 'A hero nobody else would think of, and a creator’s note inviting you to add worlds of your own in Game-Maker.',
    cons: 'Only four planets and stars. (The note agrees, and asks you to build more.)',
    from: 'SUNSPOT',
  },
  {
    game: 'penguin',
    title: 'Penguin Pete',
    by: 'Gameware by Joan Stone',
    stars: 3.5,
    score: 72,
    text: 'Pete dives the arctic sea floor and the icebergs for the eight sections of a broken submarine. He has a harpoon, a killing jump, snowballs and bombs, from weakest to strongest, and eats algae and fish to heal.',
    pros: 'A clear ladder of weapons, and the creator says you may borrow its gameware for your own games.',
    cons: 'A lot of keys (J, M, N, B, P, D) for one penguin.',
    from: 'ICEBERG IKE',
  },
  {
    game: 'glub',
    title: 'Glubada Pond',
    by: 'Gameware by Eric-Jon Waugh',
    stars: 3.5,
    score: 73,
    text: 'A happy fish wants more room to swim and sets out for the biggest water there is, with help from magical vending machines. Bottles with straws heal you, and a big bottle stores a potion for later.',
    pros: 'Charming and gentle. The credits name, as inspiration, “that fish in the lake which always seems to be looking at me”.',
    cons: 'Swimming in eight directions on the keypad takes practice.',
    from: 'FINS',
  },
];

const HOW_WE_SCORE = side(
  'How we score',
  [
    p(
      'Five stars: worth a long-distance call. Three: a good evening. Every game here is on the Game-Maker CD, and every **Play it** opens it now. Got a review? TURBO BUTTON, P.O. Box 000.',
    ),
  ],
  'cyan',
);

export const REVIEWS: MagSection = {
  id: 'reviews',
  title: 'Reviews',
  blurb: 'Shareware Game of the Month: Sign of the Hedgehog. Plus readers rate ten more',
  dept: 'REVIEWS',
  pages: () => [
    {
      kind: 'dept',
      tone: 'yellow',
      blocks: [
        head('Sign of the Hedgehog', {
          kicker: '★ Shareware Game of the Month ★',
          size: 'xl',
          level: 2,
          deck: 'A hedgehog, a teapot and a hundred crumpets. Eric-Jon Waugh’s trip across England is the best-designed game on the disk this month, and here is why.',
        }),
        grid(
          [
            [shot(HOG, 'title', 'Sign of the Hedgehog’s title screen', 'The title screen. Hedrick has an appointment.', -2)],
            [
              p(
                'Hedrick H. Hogg has been invited to the most important tea of his life: tea with the Queen. The trouble is, the royal house is out of crumpets, and he has been told to bring **one hundred**. He has ten. “I only need ninety!” he says, and off he goes.',
                { drop: true },
              ),
              p(
                'What follows is nine places across England: a building site, Stone Hedge, a dark pool, a woodland cabin, rolling fields, a large tree, the subway, Big Ben and, at last, Buckingham. Hedrick walks, jumps, ducks and rolls, and he fights with what a gentleman carries: he **pours tea** on his enemies and **blows steam** at them.',
              ),
            ],
          ],
          0.4,
        ),
        cols(2, [
          p(
            'We pick a Game of the Month for the way it is made, not for how big it is. Sign of the Hedgehog won because every part of it is pulling the same way. The goal fits in one sentence and you can count it. Every place looks, sounds and plays different. Between levels a map shows how far you’ve come. And at the end there is a real scene with a punch line, not a sales pitch.',
          ),
          p(
            'Its credits say Eric-Jon Waugh did the graphics, sound, control, animation, characters, monsters, maps “and most everything else”, with background music from Recreational Software Designs, Creative Labs and Ronnie Toon. It is from **A-J Games**, the makers of A-J’s Quest, Octolris and Gridline.',
          ),
        ]),
        grid(
          [
            [
              side(
                'Fact file',
                [
                  p('**Made by:** Eric-Jon Waugh, A-J Games'),
                  p('**Levels:** 9, with a map screen after each'),
                  p('**Music:** a different tune in every level'),
                  p('**Controls:** arrows walk, jump, duck and roll; G and H pour tea; T and Y blow steam; P and D pick up and drop'),
                  p('**Goal:** 100 crumpets (you start with 10)'),
                ],
                'white',
              ),
            ],
            [
              side(
                'The verdict',
                [
                  p('**★★★★½ 91/100.** Charming, fair and finished. [Play Sign of the Hedgehog](go:play/signhdg)'),
                  note('Shareware from A-J Games. 256-color VGA, Sound Blaster sound and music.'),
                ],
                'pink',
              ),
            ],
          ],
          0.4,
        ),
      ],
    },
    {
      kind: 'dept',
      tone: 'white',
      blocks: [
        head('Why it works: the design lessons', {
          kicker: 'Game of the Month, continued',
          size: 'l',
          level: 2,
          deck: 'Want your own game in this spot? Here is what Sign of the Hedgehog does right, with the chapter of The Ultimate Owner’s Guide that teaches each one.',
        }),
        cols(2, [
          head('1. A goal you can count', { size: 's', level: 3 }),
          p(
            'One hundred crumpets, and you start with ten. A player always knows what they are doing and how close they are. That is the guide’s first rule: write one sentence about what the player does. ([Designing With a Goal](go:ultimate/craft))',
          ),
          head('2. Variety every level', { size: 's', level: 3 }),
          p(
            'Each place has its own map, its own music (nine tunes for nine places) and three different block sets across the trip. The Dark Pool even gives Hedrick a character set of his own for the swim. That is the guide’s “a new place, a new enemy and a new item every level or two”. ([Variety](go:ultimate/craft))',
          ),
          head('3. A map between the levels', { size: 's', level: 3 }),
          p(
            'After each place, an overhead map of the countryside shows Hedrick’s road growing a little longer. It is a breather and a progress bar in one, and it makes nine levels feel like one journey. ([Detours worth taking](go:ultimate/levels))',
          ),
          head('4. Treasure along the route', { size: 's', level: 3 }),
          p(
            'On the maps, the crumpets sit on ledges, girders and stepping stones, along the way Hedrick is going and just off it. Looking around pays, and nothing you need is sealed away. ([Everything on the map has a job](go:ultimate/levels))',
          ),
          head('5. A hero with a personality', { size: 's', level: 3 }),
          p(
            'A hedgehog who rolls, pours tea and blows steam is a joke and a set of moves at once. The weapon is the character. ([A hero who feels right](go:ultimate/craft))',
          ),
          head('6. An ending, not an ad', { size: 's', level: 3 }),
          p(
            'In the ending’s text, Hedrick reaches the Queen with his crumpets and is told, ever so politely, that the palace has “fallen upon biscuits, rather”, and why didn’t he merely pop off to the grocery? The won screen gets its own picture and its own music. ([An ending, not an ad](go:ultimate/levels))',
          ),
        ]),
        grid(
          [
            [shot(HOG, 'level', 'Hedrick on the building site among red girders', 'The building site: girders to climb and crumpets on the beams.', 1.5)],
            [
              side(
                'Room to grow',
                [
                  p(
                    'No game is perfect, and the guide would nudge this one on **keys under the hands**: tea pours with G and H, steam blows with T and Y, and P and D pick up and drop. That sends a hand across the keyboard mid-jump. Read the controls screen before you start. ([Keys under the hands](go:ultimate/craft))',
                  ),
                ],
                'cyan',
              ),
            ],
          ],
          0.4,
        ),
        pull('“I had a devil of a time scrabbling these together.” Hedrick, to the Queen'),
      ],
    },
    {
      kind: 'dept',
      tone: 'news',
      blocks: [
        head('Gamers’ Reviews', {
          kicker: 'You played them. You rated them.',
          size: 'l',
          level: 2,
        }),
        grid([...REVIEWS_A, ...REVIEWS_B.slice(0, 2)].map(review), 0.4),
        HOW_WE_SCORE,
      ],
    },
    {
      kind: 'dept',
      tone: 'news',
      blocks: [
        head('Gamers’ Reviews, continued', { kicker: 'Shareware and gameware', size: 'm', level: 2 }),
        grid(REVIEWS_B.slice(2).map(review), 0.4),
        head('From the gameware drawer: free in the box', { size: 's', level: 3 }),
        grid(REVIEWS_GAMEWARE.map(review), 0.4),
      ],
    },
  ],
};
