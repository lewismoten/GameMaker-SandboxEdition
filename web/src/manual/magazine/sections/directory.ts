// The game directory: every game the site lists (ctx.games, which never holds a secret one),
// as a mail-order catalog's listing: a small screenshot, the title, who made it, the year, the
// price, one line from the game's own story text, and links to play it, read its manual and
// open its hint book. Grouped by publisher: Sandbox Software, The Bard of Bizarre, the CD's
// gameware (RSD's samples, then the other studios'), the CD's shareware.
import { card, grid, head, note, p, rows, side } from '../blocks';
import type { Block, ListingRow, MagContext, MagGame, MagPage, MagSection } from '../types';

/** Each game's one line, from its own about.json or the story text on its disk. */
export const ONE_LINE: Record<string, string> = {
  // Sandbox Software
  year2000: 'Dex Dynamo’s robot dog ate his science report, and the Science Fair is on the Moon at 3:00.',
  sandcast: 'Teddy the corgi knight takes back the backyard sandbox after Gwinn’s zoomies flattened every castle.',
  teddy: 'Gwinn ran off with Doc Leo’s clown costume, and tonight is the Klown Klub’s Big Show!',
  snowbound: 'Fort Ashby, December 1992: shovel the neighborhood a scoop at a time and get to LaVale Mall.',
  logic: 'Watt, a pocket-sized repair robot, rolls through twenty-three haywire circuit boards to get home.',
  blaster: 'Shrink down, launch the BLASTER nano-fighter and chase GLITCH through the family 486.',
  brief: 'Mystery Robot Joe, the tin night librarian, puts thirty-two hundred-word stories back together.',
  maximus: 'Courier Max crosses 88 worlds by pod, rover and diving bell, hunting ten star-shards.',
  sleuth: 'Opening night, 1936: Inspector Ada Penn has until dawn to name the killer in the theater.',
  depth: 'Roll Ray the chrome sphere through six ray-traced scenes: whatever is sharp is solid.',
  realm: 'Lord Deadline stole the round tuit. A full adventure across Procrastia, jester and all.',
  teddy2: 'Gwinn’s bed is empty! Sniff out her trail to the Tri-County Fair, and play as Gwinn herself.',
  teddy3: 'It’s Teddy’s birthday and nobody says so. Run Doc Leo’s errands, and drive THE CHEZ.',
  // The Bard of Bizarre
  carl: 'You are Carl, the fly in the room, and you’re winning.',
  goat: 'The goat nobody painted eats its way to its place at the manger, third from the left.',
  loaf: 'The loaf nobody picked when the five thousand were fed rolls out of its basket.',
  loofah: 'You scrubbed with the pink loofah anyway. Now the whole shower is cursed.',
  mustard: 'The smallest seed in all the land hops, roots and grows up to the palm of God’s hand.',
  needle: 'The rich man’s camel gives his gold away to squeeze through the eye of a needle.',
  reckoning: 'It’s 3:17 a.m., and there’s a slice of New York cheesecake in the fridge.',
  remote: 'Friday night, snacks, the tape in the VCR, and the remote is GONE.',
  risi: 'Make Emperor Gravis laugh, in six songs in Latin, or count the sand of the Circus Maximus.',
  smirked: 'Lily, eight, in a unicorn hoodie, is not scared of the haunted house. You are.',
  sweats: 'Open-mic night at The Hive: seventeen monologues, and every one is an EPIC.',
  tickle: 'Doc Leo has a brand new certificate in rat tickling, and no rats yet. No rats are harmed.',
  // gameware: Recreational Software Designs
  houses: 'Buildings made of the HOUSES blocks. Follow the green path to change into another character.',
  nebula: 'You are a solar flare, summoned before the Planetary Coalition to take up its charge.',
  penguin: 'Penguin Pete recovers eight sections of a submarine from the arctic ice.',
  pipemare: 'Stop the leaks at the Bureau of World Water Works, and reach the vermin’s pile of gold.',
  sample: 'One way through the maze to the book of knowledge, with monsters moving about.',
  terrain: 'Not really a game: roam a scene of Terrain blocks for ideas. Pick up the lazer gun!',
  tutor: 'Not a game either: a guided tour of scrolling, one-way doors, shooting and more.',
  // gameware: the other studios
  bcuda: 'SECRET MISSION #1, classified: dive in your sub and recover the pieces from the wrecks.',
  outerlim: 'Alone in a canyon from the old TV series, with strange weeds and the Zanti Misfits.',
  warrior: 'Robots have taken your friends while you were at lunch. Woman Warrior goes after them.',
  donut: 'An evil witch bought Crulla for a magic spell, and Crullo the donut goes after her.',
  glub: 'A happy fish leaves Glubada Pond in search of the largest body of water it can find.',
  heart: 'A self-propelled ball of uranium rolls deep under Venus to stop the monsters there.',
  peach: 'Peach the Lobster and her claw gun against Fang Duck and his minions, the ducks.',
  rings5: 'Roant’s most famous warrior sets out to rescue the princess, Dusk Rose.',
  volume: 'Marty takes the back seat of the bus home from school, and it isn’t Oz out there.',
  zark: 'Ambassador to the aliens? You take the most powerful ship on Venus and prepare for trouble.',
  // shareware
  ajquest: 'A-J Bear and his hedgehog, Hedge, take on Prince Ostro and his giant pretzels.',
  ajqst2: 'Ostro has escaped! A-J and three friends go after him, each by his own route.',
  bounerm: 'Pick up a little green crystal and you’re a rubber ball. Roll with it.',
  fluffyr: 'Ralf, an intelligent chicken-duck, goes looking for a forgotten paradise called Earth.',
  gridlin: 'A world made of grids, creatures that turn you to stone, and only your martial arts.',
  njlnflx: 'The first ship with the flux drive finds the universe is not as empty as it seems.',
  octolrs: 'The only gelatinous octopus of his kind is snagged in a sushi ship’s net.',
  pac: 'PAC spits power orbs through the Andims. Very difficult: don’t give up too early.',
  signhdg: 'Hedrick H. Hogg must bring one hundred crumpets to tea with the Queen.',
  zoom: 'Grandpa Merlin’s spell went awry, and cousin Zoom became super. A-J tells the story.',
  congress: 'Fight through The City and InflationLand to stop the Majority Leader.',
  parsec3d: 'PARSEC and his jetpack suit hunt the power crystal of XON, past the OCTAXON.',
  orb: 'A voice hails Chara 4, a mechanical world of intelligent machines, the Orbs among them.',
  paperair: 'Fly a radio-controlled paper airplane 900 miles to the patent office before XEMTX.',
};

const by = (g: MagGame) => [g.author, g.company && g.company !== g.author ? g.company : undefined].filter(Boolean).join(' / ');

/** The price column: the box price, FREE gameware, or SHAREWARE with its fee in the by-line. */
function price(g: MagGame): string {
  if (g.kind === 'gameware') return g.price ?? 'FREE';
  if (g.kind === 'shareware') return /free/i.test(g.price ?? '') ? 'FREEWARE' : 'SHAREWARE';
  return g.price ?? 'FREE';
}

function row(g: MagGame): ListingRow {
  const fee = g.kind === 'shareware' && g.price && !/free/i.test(g.price) ? `reg. ${g.price}` : undefined;
  const more: ListingRow['more'] = [['Play it', `go:play/${g.id}`]];
  if (g.manual) more.push(['Manual', `go:manual/${g.id}`]);
  if (g.hints?.length) more.push(['Hint book', `go:hints/${g.id}`]);
  return {
    title: g.title,
    go: `go:play/${g.id}`,
    by: [by(g), g.year ? String(g.year) : undefined, fee].filter(Boolean).join(' · '),
    price: price(g),
    blurb: ONE_LINE[g.id] ?? g.tagline ?? '',
    more,
    shot: { game: g.id, view: 'title', alt: `${g.title}, its title screen` },
  };
}

/** Two columns of listings (one on a phone). */
function listing(games: MagGame[]): Block {
  const half = Math.ceil(games.length / 2);
  return grid([[rows(games.slice(0, half).map(row))], [rows(games.slice(half).map(row))]], 0.4);
}

const byYear = (x: MagGame, y: MagGame) => (x.year ?? 9999) - (y.year ?? 9999) || x.title.localeCompare(y.title);
const byTitle = (x: MagGame, y: MagGame) => x.title.replace(/^the /i, '').localeCompare(y.title.replace(/^the /i, ''));
const RSD = 'Recreational Software Designs';

/** The directory's groups, each in its listing order. */
export function groups(ctx: MagContext) {
  const of = (kind: MagGame['kind']) => ctx.games.filter((g) => g.kind === kind);
  const sandbox = of('sandbox').sort(byYear);
  const bizarre = of('bizarre').sort(byTitle);
  const gameware = of('gameware');
  const rsd = gameware.filter((g) => g.company === RSD).sort(byTitle);
  const ajGameware = gameware.filter((g) => g.company === 'A-J Games').sort(byTitle);
  const otherGameware = gameware.filter((g) => g.company !== RSD && g.company !== 'A-J Games').sort(byTitle);
  const shareware = of('shareware');
  const ajShareware = shareware.filter((g) => g.company === 'A-J Games').sort(byTitle);
  const otherShareware = shareware.filter((g) => g.company !== 'A-J Games').sort(byTitle);
  return { sandbox, bizarre, rsd, otherGameware, ajGameware, otherShareware, ajShareware };
}

const dept = (blocks: Block[], tone: MagPage['tone'] = 'white'): MagPage => ({ kind: 'dept', tone, blocks });

function pages(ctx: MagContext): MagPage[] {
  const g = groups(ctx);
  const firstSandbox = g.sandbox.slice(0, 8);
  const moreSandbox = g.sandbox.slice(8);
  return [
    dept([
      head('The Game Directory', {
        kicker: 'Every game in this issue',
        deck: `${ctx.games.length} games made with Game-Maker, from the newest Sandbox Software boxes to the shareware on the Game-Maker CD. Press a title to play it.`,
        size: 'l',
        level: 2,
      }),
      head('Sandbox Software', { kicker: 'Boxed games · Pittsburgh, PA', size: 's', level: 3 }),
      listing(firstSandbox),
    ]),
    dept([
      head('Sandbox Software, continued', { size: 's', level: 2 }),
      listing(moreSandbox),
      grid(
        [
          [
            side('How to read the listings', [
              p(
                '**Title** plays the game. **Price** is the mail-order price in 1995; SHAREWARE means try it first and register with the author for the fee shown. **Manual** and **Hint book** open the box.',
              ),
            ]),
          ],
          [
            side(
              'Free here, every one',
              [
                p(
                  'The prices are part of the story. On this site every game in the directory plays free, on the [1994 desk](go:desk) or in [today’s web](go:editor). Sandbox Software’s boxes and catalog are in the [Sandbox Software catalog](go:catalog/sandbox).',
                ),
              ],
              'cyan',
            ),
          ],
        ],
        0.4,
      ),
      card(
        'SANDBOX SOFTWARE MAIL-ORDER CARD',
        [
          'Check the games you want: ☐ In The Year 2000!  ☐ Sandcastle Knight  ☐ Teddy’s Little Big Adventure  ☐ Snowbound  ☐ all the rest!',
          'Every box holds its manual, a key card, *The Sandbox Scoop* newsletter and a sticker sheet. Stuck? Ask for the hint book.',
          'Nothing to mail: every game here plays free.',
        ],
        { fields: ['Name', 'Address', 'City, State, ZIP'], go: 'go:catalog/sandbox', button: 'Open the Sandbox Software catalog', tone: 'yellow' },
      ),
    ]),
    dept(
      [
        head('The Bard of Bizarre', {
          kicker: 'Song-games · from The Sofa BBS',
          deck: 'Shareware games from the songs and monologues of The Bard of Bizarre, and from the six Latin songs of Veni, Vidi, Risi! Free in [The Sofa’s file library](go:bbs/sofa) and in the [Bard’s catalog](go:catalog/bard).',
          size: 'm',
          level: 2,
        }),
        listing(g.bizarre),
      ],
      'pink',
    ),
    dept(
      [
        head('Gameware', {
          kicker: 'On the Game-Maker CD',
          deck: 'Samples that came with Game-Maker: free to play, take apart and learn from.',
          size: 'm',
          level: 2,
        }),
        head('Recreational Software Designs', { kicker: 'The makers of Game-Maker', size: 's', level: 3 }),
        listing(g.rsd),
        head('Other studios', { size: 's', level: 3 }),
        listing(g.otherGameware),
      ],
      'news',
    ),
    dept(
      [
        head('Gameware, continued', { kicker: 'A-J Games', size: 's', level: 2 }),
        listing(g.ajGameware),
        head('Shareware', {
          kicker: 'On the Game-Maker CD',
          deck: 'Try before you buy: play it free, and if you like it, register with the author. Also in the sand pile on [THE -= S A N D B O X =- BBS](go:bbs/sandbox).',
          size: 'm',
          level: 2,
        }),
        listing(g.otherShareware),
      ],
      'news',
    ),
    dept(
      [
        head('Shareware, continued', { kicker: 'A-J Games', size: 's', level: 2 }),
        listing(g.ajShareware),
        note(
          'Authors and fees are as each game’s own files give them. Registration addresses are left out: the CD’s shareware is in the paper [shareware catalog](go:catalog/shareware) on the desk.',
        ),
      ],
      'news',
    ),
  ];
}

export const DIRECTORY: MagSection = {
  id: 'directory',
  title: 'The Game Directory',
  blurb: 'Every Sandbox, Bizarre, gameware and shareware game, and where to play it',
  dept: 'GAME DIRECTORY',
  pages,
};
