// The issue's own full-page ads: Game-Maker: Sandbox Edition (inside the front cover), "send
// away for Game-Maker", The Ultimate Owner's Guide order page, and Sandbox Software with The
// Bard of Bizarre and a card to send away for their catalogs. Prices are in the story; every
// coupon's button opens the real thing here, free.
import { adPage, adframe, button, card, grid, list, note, p, shot } from '../blocks';
import type { MagSection } from '../types';

const MAIL = 'Sandbox Software · P.O. Box 000 · Pittsburgh, PA 15213 (a fictional address: nothing to mail, it is all free here)';

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
          'GAME-MAKER: SANDBOX EDITION',
          [
            grid(
              [
                [shot('sandcast', 'level', 'Sandcastle Knight, a level', undefined, -2)],
                [shot('logic', 'level', 'Ohm Sweet Ohm, a level', undefined, 2)],
                [shot('year2000', 'title', 'In The Year 2000!, its title screen', undefined, -1)],
              ],
              0.25,
            ),
            list([
              'Draw your **blocks**, build your **monsters**, lay out your **maps**',
              'Draw a **sound** with the mouse and hear it',
              'A **Level check** plays your scene and shows where players get stuck',
              'Play it on the **1994 desk** or in **today’s web**',
              'Export to **DOS**, the **web**, **Mac**, **Windows** and **Linux**',
            ]),
            grid([[button('go:editor', 'Start your own game')], [button('go:desk', 'Sit at the 1994 desk')], [button('go:guide/start', 'Read the Guide')]]),
          ],
          {
            burst: 'NEW!',
            sub: 'Create your own computer games. **No programming.**',
            small: 'Game-Maker: Sandbox Edition is free, and runs in your web browser. Based on RSD Game-Maker 3.0 by Recreational Software Designs.',
            tone: 'cyan',
          },
        ),
      ],
      'black',
    ),
  ],
};

export const SEND_AWAY_AD: MagSection = {
  id: 'ad-send-away',
  title: 'Send away for Game-Maker',
  toc: false,
  pages: () => [
    adPage(
      'ad-send-away',
      'Send away for Game-Maker',
      [
        adframe(
          'YES! I WANT TO MAKE MY OWN GAMES!',
          [
            p(
              'The complete Game-Maker SE 3.0 kit: the program disks, the Owner’s Guide, The Ultimate Owner’s Guide, a quick reference card, a keyboard template, a map grid pad, a poster and a sticker sheet. Everything a game designer needs, in one box.',
            ),
            card(
              'ORDER FORM',
              [
                'Game-Maker SE 3.0 ........ **$89.00**',
                'Shipping and handling ..... **$4.00**',
                'Choose: ☐ 3½" disks  ☐ CD-ROM',
                'Send a money order to: ' + MAIL,
              ],
              { fields: ['Name', 'Address', 'City, State, ZIP', 'Age'], go: 'go:desk/gmbox', button: 'Open the box on the desk', tone: 'yellow' },
            ),
            grid([[button('go:editor', 'Or start a game on the web now')], [button('go:dos', 'Open DOS Game-Maker')]]),
          ],
          {
            burst: 'ONLY $89!',
            sub: 'Mail the coupon today. Allow 4 to 6 weeks for delivery, or none at all: it is already on this site.',
            small: 'Prices are part of the story. Game-Maker: Sandbox Edition is free.',
            tone: 'yellow',
          },
        ),
      ],
      'white',
    ),
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
            p('You learned the designers. Now learn to design. The advanced booklet for Game-Maker owners, with figures drawn from real games:'),
            list(CHAPTERS.map(([id, t]) => `[${t}](go:ultimate/${id})`)),
            card(
              'ORDER THE ULTIMATE OWNER’S GUIDE',
              ['The advanced booklet ..... **$19.95**', 'Item UOG-3 · Ships with every Game-Maker SE box', 'Send a money order to: ' + MAIL],
              { fields: ['Name', 'Address', 'City, State, ZIP'], go: 'go:ultimate', button: 'Open The Ultimate Owner’s Guide', tone: 'pink' },
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
                p('**THE BARD OF BIZARRE** Bizarre gospels, mundane epics and songs you can play. Song-games from The Sofa BBS, 1-412-555-0177.'),
              ],
            ]),
            card('SEND ME THE CATALOGS!', ['☐ The Sandbox Software catalog', '☐ The Bard of Bizarre catalog', 'Mail to: ' + MAIL], {
              fields: ['Name', 'Address', 'City, State, ZIP'],
              go: 'go:catalog/sandbox',
              button: 'Open the Sandbox Software catalog',
              tone: 'cyan',
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
