// House ads: the magazine's own full-page ads, put in by issue.ts where the pages must come out
// to whole folded sheets (a multiple of four), first to last as many as it needs: the 1994
// desk, subscriptions, readers' games, and The Ultimate Owner's Guide with the hint books.
// Prices and the entry form are part of the story; every button opens the real thing here.
import { adPage, adframe, big, button, callouts, card, covers, grid, list, p, piece, rows, shot, side, ultimatePiece } from '../blocks';
import { MAG } from '../masthead';
import type { MagPage } from '../types';

/** The Ultimate Owner's Guide's chapters, in its order (ultimate/plan.ts; a test keeps them in step). */
export const GUIDE_CHAPTERS: [id: string, title: string][] = [
  ['palettes', 'Palettes: One Map, Many Moods'],
  ['blocks', 'Blocks That Behave'],
  ['actors', 'Monsters, Heroes and Actors'],
  ['logic', 'Counters, Gates and Puzzles'],
  ['scenes', 'Scenes, Links and the Camera'],
  ['sounds', 'The Sound Set, Slot by Slot'],
  ['voice', 'Digitized Voice'],
  ['music', 'FM Music on the OPL2'],
  ['show', 'Title Screens and Demos'],
  ['testing', 'Testing Like a Pro'],
  ['craft', 'Designing With a Goal'],
  ['levels', 'Levels Players Forgive'],
  ['tricks', 'Tricks From the Sandbox Games'],
  ['check', 'The Level Check and the Walkthrough Bot'],
  ['numbers', 'The Numbers to Remember'],
  ['upload', 'Before You Upload'],
];

const chapterLinks = (from: number, to: number) => list(GUIDE_CHAPTERS.slice(from, to).map(([id, t]) => `[${t}](go:ultimate/${id})`));

/** The 1994 desk, toured by its snapshot (deskShot.ts): every spot is a thing on the desk you can use. */
const deskAd = (): MagPage =>
  adPage(
    'house-desk',
    'The 1994 desk',
    [
      adframe(
        'YOUR 1994 PC, IN A BROWSER TAB',
        [
          callouts(
            'desk',
            'The 1994 desk: a beige PC with Snowbound’s title screen on the monitor, posters on the wall, a shelf of game boxes, a disk box, a modem, a snowy window, a wall phone and the Game-Maker box, each with a numbered spot',
            [
              {
                x: 22.5,
                y: 22,
                title: 'The black-light poster',
                text: 'Doc Leo in velvet and neon. With a Sandbox game in the drive, its own poster hangs here instead. After dark the tube comes on and the inks glow.',
              },
              {
                x: 9,
                y: 43,
                title: 'The shelf of boxes',
                text: 'Every Sandbox game boxed, with its manual, maps, hint book and stickers. This magazine is up there too.',
              },
              {
                x: 80,
                y: 20,
                title: 'The window',
                text: 'Snowing, like the winter of 1992. The sky darkens when yours does, and the moon and stars come out.',
              },
              {
                x: 94,
                y: 22,
                title: 'The phone',
                text: 'Lift the handset and dial. Mom’s numbers are taped beside it, and time and temperature always answers.',
              },
              {
                x: 35,
                y: 57,
                title: 'The modem',
                text: 'DATA/FAX 14.4. Dial the Sandbox BBS at 1-412-555-SAND, download games and watch the front lights blink.',
              },
              {
                x: 18,
                y: 68,
                title: 'The disk box',
                text: 'Flip through the floppies and slide one into drive A:. Your own games are in there too, with a blank disk.',
              },
              {
                x: 37,
                y: 72,
                title: 'The PC',
                text: 'Switch it on for DOS, Game-Maker™ and its designers, as they ran in 1994. Yes, it has a TURBO button.',
              },
              {
                x: 86,
                y: 62,
                title: 'The Game-Maker box',
                text: 'Open it for the Owner’s Guide, The Ultimate Owner’s Guide, the reference card, the poster and the stickers.',
              },
            ],
          ),
          grid([[button('go:desk', 'Sit at the desk')], [button('go:desk/modem', 'Dial the modem')], [button('go:desk/diskbox', 'Open the disk box')]], 0.25),
        ],
        {
          burst: 'NO IRQs!',
          sub: 'No screwdriver, no boot disk, no busy signal. A whole desk from December 1994, switched on and waiting.',
          small: 'Free, in your web browser. No jumpers to set.',
          tone: 'white',
        },
      ),
    ],
    'black',
  );

/** Subscriptions: a gag (this is the only issue, free here), so the card's button opens the contents. */
const subscribeAd = (): MagPage =>
  adPage(
    `house-subscribe`,
    `${MAG.name} subscriptions`,
    [
      adframe(
        `SUBSCRIBE TO ${MAG.name}!`,
        [
          covers(`Five ${MAG.name} covers fanned out: this issue and the next four`, [
            { issue: 'Vol. 1, No. 1 · This issue', line: 'Game-Maker’s source code set free!', tone: 'black' },
            { issue: 'Vol. 1, No. 2', line: '100 levels players forgive', tone: 'cyan' },
            { issue: 'Vol. 1, No. 3', line: 'FM music in a weekend', tone: 'pink' },
            { issue: 'Vol. 1, No. 4', line: 'Is a 28.8 modem worth it?', tone: 'yellow' },
            { issue: 'Vol. 1, No. 5', line: 'Readers’ games: the best of the boards', tone: 'news' },
          ]),
          grid(
            [
              [
                rows([
                  { title: '1 year · 12 issues', price: '$34.95', blurb: 'Save 41% off the cover price.' },
                  { title: '2 years · 24 issues', price: '$59.95', blurb: 'Save 50%. Our best deal.' },
                  { title: 'At the newsstand · 12 issues', price: '$59.40', blurb: '12 trips at $4.95. If they have it.' },
                ]),
                side(
                  'EVERY MONTH',
                  [
                    list([
                      'Hints for the newest shareware',
                      'Reviews of every game on the boards',
                      'Readers’ games, with screens',
                      'Phone numbers for the best BBSes',
                    ]),
                  ],
                  'white',
                ),
              ],
              [
                card(
                  `YES! SEND ME ${MAG.name}`,
                  [
                    '☐ 1 year (12 issues) **$34.95**',
                    '☐ 2 years (24 issues) **$59.95**',
                    '☐ Payment enclosed ☐ Bill me later',
                    'My computer: ☐ 286 ☐ 386 ☐ 486',
                  ],
                  {
                    fields: ['Name', 'Address', 'City, State, ZIP', 'Age', 'Favorite game'],
                    go: 'go:mag/contents',
                    button: 'Read this issue, free',
                  },
                ),
              ],
            ],
            0.38,
          ),
        ],
        {
          burst: 'SAVE 40%!',
          sub: 'Twelve issues of hints, reviews and the newest shareware, in your mailbox before it’s on the newsstand.',
          small: `Just a gag: ${MAG.name} is this one issue, free to read here. There is no subscription, and nothing is mailed. Prices are part of the story.`,
          tone: 'yellow',
        },
      ),
    ],
    'cyan',
  );

/** Readers' games: what a game made with Game-Maker looks like, and how to send one in (upload it to the BBS). */
const readersAd = (): MagPage =>
  adPage(
    'house-readers',
    'Make your own game',
    [
      adframe(
        'YOUR GAME COULD BE IN THESE PAGES',
        [
          grid(
            [
              [shot('teddy', 'level', 'Teddy’s Little Big Adventure, a level', undefined, -2)],
              [shot('sandcast', 'level', 'Sandcastle Knight, a level', undefined, 1)],
              [shot('blaster', 'title', 'Virus Blaster, its title screen', undefined, -1)],
              [shot('goat', 'title', 'Third Goat from the Left, its title screen', undefined, 2)],
              [shot('snowbound', 'level', 'Snowbound: The $89 Shovel, a level', undefined, 1)],
              [shot('year2000', 'title', 'In The Year 2000!, its title screen', undefined, -2)],
              [shot('logic', 'level', 'Ohm Sweet Ohm, a level', undefined, 2)],
              [shot('loaf', 'title', 'Loaf #13 (Left in the Basket), its title screen', undefined, -1)],
            ],
            0.18,
          ),
          grid(
            [
              [
                side(
                  '1. MAKE IT',
                  [
                    p(
                      'Draw the blocks, the hero and the monsters in Game-Maker™, lay out the map, add sound. No programming. The **Level check** finds where players get stuck.',
                    ),
                  ],
                  'white',
                ),
              ],
              [
                side(
                  '2. PACK IT',
                  [
                    p('Tick off **Before You Upload**, then copy it to a floppy with Utilities ▸ Transfer, or export it.'),
                    button('go:guide/export', 'Sharing a game'),
                  ],
                  'white',
                ),
              ],
              [
                side(
                  '3. CALL THE BBS',
                  [p('Dial the Sandbox BBS at 1-412-555-SAND and upload it. Every upload earns you file points.'), button('go:bbs/sandbox', 'Call the BBS')],
                  'white',
                ),
              ],
            ],
            0.25,
          ),
          card(
            'READER GAME ENTRY FORM',
            ['Kind of game: ☐ Action ☐ Puzzle ☐ Adventure ☐ Something new', '☐ The walkthrough bot beat every level ☐ I ran Before You Upload'],
            {
              fields: ['Your name', 'Age', 'Game title', 'BBS where it’s uploaded'],
              go: 'go:editor',
              button: 'Start a new game',
            },
          ),
        ],
        {
          burst: 'BE A STAR!',
          sub: 'Every game on this page started as a blank screen. Each month we print the best games readers upload, with screens and a review.',
          small: 'The entry form is part of the story: nothing is mailed, printed or judged, and your game stays yours.',
          tone: 'cyan',
        },
      ),
    ],
    'white',
  );

/** The Ultimate Owner's Guide and the hint books: their covers, every chapter, and readers' words. */
const prosAd = (): MagPage =>
  adPage(
    'house-pros',
    'Calling all game designers',
    [
      adframe(
        'LEARN FROM THE PROS',
        [
          grid(
            [
              [ultimatePiece('The Ultimate Owner’s Guide’s front cover: black and gold, with gold blocks and “For Advanced Designers”', { go: 'go:ultimate' })],
              [chapterLinks(0, 6)],
              [chapterLinks(6, 11)],
              [chapterLinks(11, 16)],
            ],
            0.18,
          ),
          grid(
            [
              [piece('teddy', 'hintbook', 'Teddy’s Little Big Adventure’s hint book, its cover', { go: 'go:hints/teddy' })],
              [piece('snowbound', 'hintbook', 'Snowbound’s hint book, its cover', { go: 'go:hints/snowbound' })],
              [
                p('**The hint books.** Stuck in a Sandbox game? Every answer is printed upside down, so you read only the one you need.'),
                button('go:hints/teddy', 'Read a hint book'),
              ],
              [big('$19.95'), p('The guide alone. Free in every Game-Maker™ box, and free here.'), button('go:ultimate', 'Open the guide')],
            ],
            0.18,
          ),
          side(
            'WHAT READERS SAY',
            [
              grid(
                [
                  [p('“I read the levels chapter on the bus and fixed three pits by supper.” *— K.T., Altoona*')],
                  [p('“My little brother finally beat my game. Thanks a lot.” *— Marcus, age 13, Erie*')],
                  [p('“The FM music chapter turned my beeps into a band.” *— J.R., Johnstown*')],
                ],
                0.2,
              ),
            ],
            'white',
          ),
        ],
        {
          burst: 'TIPS!',
          sub: 'The Ultimate Owner’s Guide: sixteen chapters from the people who made the Sandbox games.',
          tone: 'pink',
        },
      ),
    ],
    'white',
  );

const HOUSE: (() => MagPage)[] = [deskAd, subscribeAd, readersAd, prosAd];

/** The i-th house ad. */
export const houseAd = (i: number): MagPage => HOUSE[i % HOUSE.length]();
