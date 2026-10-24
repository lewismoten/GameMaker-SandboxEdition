// Character Spotlight: Teddy, Doc Leo, THE CHEZ, Gwinn and friends, each with their portrait
// (public/cast, drawn from a game's own files), a bio in the magazine's voice and "Seen in"
// links taken from the cast page's own list (cast/castData.ts); then the things hidden in the
// games (the felt eggs, tin hearts, painted eggs, cameos and the nods to history), said as
// "look for…", never where.
import { CAST, type CastMember } from '../../../cast/castData';
import { EGGS } from '../../../eggs/eggs';
import HEARTS from '../../../tinHearts/hearts.json';
import { button, cols, grid, head, note, p, portrait, side } from '../blocks';
import type { Block, MagContext, MagSection } from '../types';

const member = (id: string): CastMember => {
  const m = CAST.find((c) => c.id === id);
  if (!m) throw new Error(`no cast member ${id}`);
  return m;
};

/** "Seen in" links to the first few games a member turns up in (only games the magazine lists). */
function seenIn(ctx: MagContext, m: CastMember, max: number): string {
  const games = m.appears.map((a) => ctx.game(a.game)).filter((g) => g !== undefined);
  const shown = games.slice(0, max).map((g) => `[${g.title}](go:play/${g.id})`);
  const more = games.length - shown.length;
  return `**Seen in:** ${shown.join(', ')}${more > 0 ? ` and ${more} more` : ''}.`;
}

/** A spotlight: portrait, name, what they are, our bio and where to find them. */
function star(ctx: MagContext, id: string, bio: string, max: number): Block[] {
  const m = member(id);
  return [portrait(m.id, m.art.alt, m.art.width, m.art.height), head(m.name, { kicker: m.role, size: 's', level: 3 }), p(bio), p(seenIn(ctx, m, max))];
}

/** Games that hide a tin heart (hearts.json), counted among the games the magazine lists. */
const heartGames = (ctx: MagContext) => Object.keys(HEARTS.hearts).filter((id) => ctx.game(id));

export const SPOTLIGHT: MagSection = {
  id: 'spotlight',
  title: 'Character Spotlight',
  blurb: 'Teddy, Doc Leo, THE CHEZ, Gwinn and friends, and the history hidden in the games',
  dept: 'SPOTLIGHT',
  pages: (ctx) => [
    {
      kind: 'dept',
      tone: 'pink',
      blocks: [
        head('Character Spotlight', {
          kicker: 'Who’s who in the Sandbox',
          size: 'xl',
          level: 2,
          deck: 'They turn up in game after game, at the curb and on the couch. Meet the regulars.',
        }),
        grid(
          [
            star(
              ctx,
              'teddy',
              'The red-gold corgi with the big upright ears and the grin that takes up most of his face. He knows left from right, rings the bell and balances a treat on his nose, and he has starred in three adventures of his own.',
              3,
            ),
            star(
              ctx,
              'leo',
              'A friendly hobo clown in a chewed-up fedora and wire glasses, his own nose and cheeks sunburned pink, walking a rubber chicken on a dog leash. He is the star of the Klown Klub’s Big Show, hosts open mics, tickles rats (he has the certificate) and always orders root beer.',
              3,
            ),
            star(
              ctx,
              'chez',
              'A tomato-red 1976½ CitiCar with a black roof and racing stripes, about half the length of anything parked beside it. It clears the road with an ah-OOO-gah, pulls the parade float at a few miles an hour, and waits at a curb in nearly every Sandbox game. It is charging. It is always charging.',
              3,
            ),
            star(
              ctx,
              'gwinn',
              'Teddy’s big sister: chocolate-brown, amber-eyed, pink collar, and the reason most of these games have a plot. She scattered the costume, flattened the sandcastles and ate a recipe card. Her one trick is zoomies. She is not allowed in the library. She is in the library.',
              3,
            ),
          ],
          0.4,
        ),
        button('go:route/cast', 'Meet the whole cast on stage'),
      ],
    },
    {
      kind: 'dept',
      tone: 'white',
      blocks: [
        head('…and friends', { kicker: 'Character Spotlight, continued', size: 'l', level: 2 }),
        grid(
          [
            star(
              ctx,
              'joe',
              'A tin box of a robot with a bulb on his antenna, reading glasses he doesn’t need and a red bow tie. When every word fell out of every book in The Dog House, he put them back, exactly one hundred at a time.',
              2,
            ),
            star(
              ctx,
              'watt',
              'A pocket-sized repair robot who lives in a fuse box. After lightning bounced him into the toaster, he rolls home through every appliance’s circuit board, one block per press.',
              2,
            ),
            star(
              ctx,
              'chicken',
              'Doc Leo’s rubber chicken, Reggie to his friends (on Tuesdays). He has slipped his leash more than once, and when he squawks it counts as an extra life.',
              3,
            ),
            star(
              ctx,
              'carl',
              'A fly with big red eyes, a smug grin and a barrel roll that makes every swatter miss. He has his own song, and he keeps buzzing into everybody else’s.',
              3,
            ),
            star(
              ctx,
              'goat',
              'Nobody put her in the nativity painting, so she has put herself in every song since. She screams when she’s happy, and also when she isn’t.',
              3,
            ),
            star(
              ctx,
              'will',
              'The open-mic regular in the starched ruff, the velvet doublet and grey sweatpants. Seventeen monologues, every one an epic, and no coffee, no stage.',
              1,
            ),
          ],
          0.28,
        ),
        p('Every cast member has a page on the [cast stage](go:route/cast), where they walk on, say hello and list every game they appear in.'),
      ],
    },
    {
      kind: 'dept',
      tone: 'news',
      blocks: [
        head('History Hidden in the Games', {
          kicker: 'Easter eggs',
          size: 'l',
          level: 2,
          deck: 'In 1980 Atari left its programmers’ names off its games, so Warren Robinett hid “Created by Warren Robinett” in a secret room of Adventure for the Atari 2600. A player found it; Atari’s Steve Wright said to keep it and called it an Easter egg. Little hidden surprises go back even further, to 1973’s Moonlander. The Sandbox and Bard of Bizarre games keep up the habit. We won’t tell you where. We’ll tell you what to look for.',
        }),
        cols(2, [
          side(
            `The ${EGGS.length} felt eggs`,
            [
              p(
                `One soft, hand-stitched felt egg is tucked away in each of ${EGGS.length} Sandbox Software games. Each carries a few names, like the hidden credits of the old days, and a little story of its own. Pick it up, keep it, and save your game with it in your pocket.`,
              ),
              p(
                '**Look for** something soft that doesn’t belong. Teddy fans: find the egg in all three of his adventures and he has a little something for you.',
              ),
            ],
            'yellow',
          ),
          side(
            'Tin hearts',
            [
              p(
                `A small riveted tin heart with a clock face hides in all ${heartGames(ctx).length} Sandbox and Bard of Bizarre games: a nod to the Tin Man, who went all the way to Oz to get one. Touch it and it counts.`,
              ),
              p(
                '**Look for** a glint in a corner, off the beaten path. In some games, **listen for** a tick-tock. Find every one and Mystery Robot Joe has a thank-you waiting on the desk.',
              ),
            ],
            'cyan',
          ),
          side(
            'Painted eggs',
            [
              p(
                'Somebody dyed an egg, painted it by hand in bands, zigzags, dots or stars, and hid it in every Sandbox and Bard of Bizarre game. It is worth a few points and the satisfaction of having looked behind the couch.',
              ),
              p('**Look for** a bright little egg where an egg has no business being.'),
            ],
            'pink',
          ),
          side(
            'Cameos',
            [
              p(
                'The cast wanders between games. THE CHEZ charges at a curb, Teddy naps in the hall, Watt blinks on a circuit board, Carl buzzes through other people’s songs and the third goat from the left turns up framed on a wall.',
              ),
              p('**Look for** a familiar face in an unfamiliar game, then check its “Seen in” list on the [cast page](go:route/cast).'),
            ],
            'white',
          ),
        ]),
        head('Nods to history', { size: 's', level: 3 }),
        p(
          'Some games are history lessons in disguise. [Snowbound: The $89 Shovel](go:play/snowbound) is based on the real winter of 1992, when a kid in Fort Ashby shoveled driveways to buy Game-Maker. [In The Year 2000!](go:play/year2000) is the future as 1992 pictured it: flying cars, robot mowers and dinner in a pill. [Depth Perception](go:play/depth) stars the chrome sphere from every ray-tracing demo, and [Virus Blaster](go:play/blaster) shrinks you down inside the family 486. [Final Curtain](go:play/sleuth) raises the curtain on a 1936 theater.',
        ),
        p(
          '**On the desk,** the 1994 PC has more in it than HELP lists, and the room itself has a few surprises for anyone who pokes around. Keep track of what you find on the [achievements page](go:route/achievements).',
        ),
        note('No spoilers here, and none on the BBS either, please. Ask around.'),
      ],
    },
  ],
};
