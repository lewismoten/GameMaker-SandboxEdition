// The issue's own full-page ads: Game-Maker: Sandbox Edition (inside the front cover), "send
// away for Game-Maker" (in the look of the 1992 Game-Maker ads), The Ultimate Owner's Guide order page, and Sandbox Software with The
// Bard of Bizarre and a card to send away for their catalogs. Prices are in the story; every
// coupon's button opens the real thing here, free.
import { adPage, adframe, big, button, card, grid, head, list, note, p, shot, side, ultimatePiece } from '../blocks';
import type { MagSection } from '../types';

const MAIL = 'Sandbox Software · P.O. Box 000 · Pittsburgh, PA 15213 (a fictional address: nothing to mail, it is all free here)';

/** Reader Service numbers: the order of the reader service card (readerService.ts). */
const RS_SANDBOX_EDITION = 1;

/** The ad this page's look comes from: Computer Gaming World #99 (October 1992), page 55. */
const ORIGINAL_AD = 'go:url/https://archive.org/details/Computer_Gaming_World_Issue_99/page/n53/mode/2up';

/**
 * The inside front cover: Game-Maker: Sandbox Edition on a blueprint-blue frame, two games made
 * with it, what this edition adds, and the ways in. Its order form is the send-away ad's.
 */
export const SANDBOX_EDITION_AD: MagSection = {
  id: 'ad-sandbox-edition',
  title: 'Game-Maker: Sandbox Edition',
  toc: false,
  pages: () => [
    adPage(
      'ad-sandbox-edition',
      'Game-Maker: Sandbox Edition',
      [
        adframe(
          'EVERY GAME YOU EVER LOVED STARTED AS A BLANK SCREEN.',
          [
            grid(
              [
                [shot('teddy', 'title', 'Teddy’s Little Big Adventure, its title screen', 'Made with it: Teddy’s Little Big Adventure.', -2)],
                [shot('snowbound', 'title', 'Snowbound: The $89 Shovel, its title screen', 'Made with it: Snowbound: The $89 Shovel.', 2)],
              ],
              0.3,
            ),
            p(
              '**Game-Maker™: Sandbox Edition** is RSD Game-Maker 3.0, set free and brought up to date. Draw the blocks, the monsters and the hero, lay out the map, add the sounds and the music, and play it. No programming.',
            ),
            side(
              'New in this edition',
              [
                list([
                  'Make games in your web browser, or in DOS Game-Maker on the 1994 desk.',
                  'The Level check plays your scene and shows where players get stuck.',
                  'The walkthrough bot plays a level first, before anyone else does.',
                  'Export to DOS, the web, Mac, Windows and Linux.',
                ]),
              ],
              'white',
            ),
            grid([[button('go:editor', 'Start a game now')], [button('go:desk', 'Visit the 1994 desk')], [button('go:guide/start', 'Read the Guide')]], 0.25),
            p('Want it in a box? Send away for it: [the order form is on page {page:ad-send-away}](go:mag/ad-send-away).'),
          ],
          {
            burst: 'FREE TO PLAY!',
            sub: 'The blank screen is yours.',
            small: 'Based on RSD Game-Maker 3.0 by Recreational Software Designs. Free here, in your web browser.',
            tone: 'cyan',
          },
        ),
      ],
      'black',
    ),
  ],
};

/**
 * "Send away for Game-Maker", laid out like the full-page Game-Maker ads of 1992: hot pink, a
 * big condensed serif headline, two big screens and a row of five small ones, a second
 * headline, the pitch on the left with the price, the order line on the right, and the order
 * form on a white tear-out coupon. The words and pictures are this edition's own.
 */
export const SEND_AWAY_AD: MagSection = {
  id: 'ad-send-away',
  title: 'Send away for Game-Maker',
  toc: false,
  pages: () => [
    {
      ...adPage(
        'ad-send-away',
        'Send away for Game-Maker',
        [
          head('Yes! I want to make\nmy own games!', { size: 'xl' }),
          grid(
            [
              [
                shot(
                  'sandcast',
                  'level',
                  'Sandcastle Knight, a level',
                  'Build scrolling worlds a hundred blocks wide and a hundred tall, then drop your hero in and play.',
                ),
              ],
              [
                shot(
                  'teddy',
                  'blocks',
                  'The block editor: one of Teddy’s blocks drawn eight times its size beside the block set',
                  'Draw every block pixel by pixel: 150 background blocks to a set, plus monsters and heroes.',
                ),
              ],
            ],
            0.4,
          ),
          grid(
            [
              [shot('teddy', 'palette', 'Teddy’s palette of 256 colors, one color’s red, green and blue beside it', 'Design Palettes')],
              [shot('blaster', 'monsters', 'Virus Blaster’s monsters, each one’s animation frames side by side', 'Animate Monsters')],
              [shot('sandcast', 'map', 'Sandcastle Knight’s whole map, a hundred blocks square, with one screen outlined', 'Map Whole Worlds')],
              [shot('year2000', 'title', 'In The Year 2000!, its title screen', 'Title Your Game')],
              [shot('logic', 'level', 'Ohm Sweet Ohm, a level', 'Check Every Level')],
            ],
            0.15,
          ),
          head('Game-Maker™: Sandbox Edition\nThe whole studio in one box.', { size: 'l' }),
          grid(
            [
              [
                p(
                  'A palette, blocks, monsters, heroes, maps, sounds, music and the scenes that link them into a game. No programming. Bring ideas and a mouse.',
                ),
                list([
                  'Draw blocks, monsters and heroes pixel by pixel.',
                  'Lay out maps and link title screens, levels and story scenes.',
                  'Draw a sound with the mouse and hear it; write FM music.',
                  'The Level check plays your scene and shows where players get stuck.',
                  'Export to DOS, the web, Mac, Windows and Linux.',
                  'In the box: the disks, the Owner’s Guide, The Ultimate Owner’s Guide, a reference card, a keyboard template, a map grid pad, a poster and stickers.',
                ]),
                big('$89', 'plus $4 shipping. Free here.'),
                note(
                  'Address, phone and prices are part of the story. Free here: [the box on the desk](go:desk/gmbox), [DOS Game-Maker](go:dos), [the Guide](go:guide/start). Based on RSD Game-Maker 3.0 by Recreational Software Designs.',
                ),
              ],
              [
                p('ORDER GAME-MAKER TOLL FREE:'),
                big('1-800-555-0133', 'voice orders'),
                card(
                  'ORDER FROM: Sandbox Software, P.O. Box 000, Pittsburgh, PA 15213',
                  [
                    'Send me ___ copies at $89 each = $____',
                    'Shipping and handling ......... + $4.00',
                    '**Total enclosed** $____ ☐ Check ☐ Money order',
                    'Choose: ☐ 3½" disks ☐ CD-ROM · By modem: 1-412-555-SAND',
                  ],
                  {
                    fields: ['Signature', 'Name', 'Address', 'City/State/ZIP'],
                    go: 'go:editor',
                    button: 'Start a game now, free',
                  },
                ),
                note(
                  `Reader Service #${String(RS_SANDBOX_EDITION).padStart(3, '0')} · The original 1992 ad: [Computer Gaming World #99, page 55](${ORIGINAL_AD})`,
                ),
              ],
            ],
            0.4,
          ),
        ],
        'pink',
      ),
      look: 'classic',
    },
  ],
};

const CHAPTERS: [string, string][] = [
  ['levels', 'Levels Players Forgive'],
  ['craft', 'Designing With a Goal'],
  ['tricks', 'Tricks From the Sandbox Games'],
  ['check', 'The Level Check and the Walkthrough Bot'],
  ['music', 'FM Music on the OPL2'],
  ['upload', 'Before You Upload'],
];

export const ULTIMATE_AD: MagSection = {
  id: 'ad-ultimate',
  title: 'The Ultimate Owner’s Guide',
  toc: false,
  pages: () => [
    adPage(
      'ad-ultimate',
      'The Ultimate Owner’s Guide',
      [
        adframe(
          'THE ULTIMATE OWNER’S GUIDE',
          [
            grid(
              [
                [
                  ultimatePiece('The Ultimate Owner’s Guide’s front cover: black and gold, with gold blocks and “For Advanced Designers”', {
                    go: 'go:ultimate',
                  }),
                ],
                [
                  p('You learned the designers. Now learn to design. The advanced booklet for Game-Maker owners, with figures drawn from real games:'),
                  list(CHAPTERS.map(([id, t]) => `[${t}](go:ultimate/${id})`)),
                  card(
                    'ORDER THE ULTIMATE OWNER’S GUIDE',
                    ['The advanced booklet ..... **$19.95**', 'Item UOG-3 · Ships with every Game-Maker SE box', 'Send a money order to: ' + MAIL],
                    { fields: ['Name', 'Address', 'City, State, ZIP'], go: 'go:ultimate', button: 'Open The Ultimate Owner’s Guide' },
                  ),
                ],
              ],
              0.3,
            ),
          ],
          {
            burst: 'FOR OWNERS ONLY',
            sub: 'Level design, tricks from the Sandbox games, the Level check and the walkthrough bot.',
            small: 'It is in the Game-Maker box on the desk, free, and opens from the Guide on the web.',
            tone: 'pink',
          },
        ),
      ],
      'white',
    ),
  ],
};

export const CATALOGS_AD: MagSection = {
  id: 'ad-catalogs',
  title: 'Sandbox Software and The Bard of Bizarre',
  toc: false,
  pages: () => [
    adPage(
      'ad-catalogs',
      'Sandbox Software and The Bard of Bizarre',
      [
        adframe(
          'TWO CATALOGS. ONE STAMP.',
          [
            grid([
              [
                shot('teddy2', 'title', 'Teddy’s Little Bigger Adventure, its title screen'),
                p(
                  '**SANDBOX SOFTWARE** Corgis, clowns, castles and space worlds. Every game boxed with its manual, maps, hint book and stickers. Download them all on the Sandbox BBS, 1-412-555-SAND.',
                ),
              ],
              [
                shot('loaf', 'title', 'Loaf #13 (Left in the Basket), its title screen'),
                p('**THE BARD OF BIZARRE** Bizarre gospels, mundane epics and songs you can play. Song-games from The Sofa BBS, 1-412-555-SOFA.'),
              ],
            ]),
            card('SEND ME THE CATALOGS!', ['☐ The Sandbox Software catalog', '☐ The Bard of Bizarre catalog', 'Mail to: ' + MAIL], {
              fields: ['Name', 'Address', 'City, State, ZIP'],
              go: 'go:catalog/sandbox',
              button: 'Open the Sandbox Software catalog',
            }),
            grid([[button('go:catalog/bard', 'Open The Bard of Bizarre catalog')], [button('go:catalog/shareware', 'The desk’s shareware catalog')]]),
            note(
              'The Bard of Bizarre’s songs: lyrics shaped with ChatGPT from Lewis’s prompts; music and vocals made with Riffusion (now Google Flow Music). Exceptions are on the [Credits page](go:route/credits).',
            ),
          ],
          { burst: 'FREE!', sub: 'Shareware games made with Game-Maker, from two of the boards’ favorite publishers.', tone: 'white' },
        ),
      ],
      'yellow',
    ),
  ],
};
