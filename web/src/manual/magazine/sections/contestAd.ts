// A full-page parody of the 1993 game design contest spread TURBO BUTTON's world might have
// run: a curved banner, the title stacked over a starburst, a loud pastel page of arrows and
// squiggles (contestAd.css), screenshots of Game-Maker's tools and Sandbox games down both
// sides (real renders, as every `shot` is), a pitch, prizes by place and by category, and
// dense contest rules. Every prize, rule and address is made up and friendly; the points
// split adds to 100. Contact details are the magazine's usual fake box.
import '../contestAd.css';
import { adPage, adframe, big, cols, grid, p, shot } from '../blocks';
import type { MagSection } from '../types';

const contestAd = () =>
  adPage(
    'contest-ad',
    'The Game-Maker Game Design Contest',
    [
      adframe(
        'THE GAME-MAKER GAME DESIGN',
        [
          grid(
            [
              [
                shot('blaster', 'monsters', 'Game-Maker’s monster tool: animation strips on its dark panel', undefined, -2),
                shot('snowbound', 'level', 'Snowbound: The $89 Shovel, a level with the hero in the snow', undefined, 1.5),
                shot('teddy', 'palette', 'Game-Maker’s palette tool: 256 colors in a grid', undefined, -1.5),
              ],
              [
                big('CONTEST!'),
                p(
                  'Plenty of people would like to make a game, but the time and the programming words stand in the way. Game-Maker took most of those out. **Now we’d like to see what you do with it.**',
                ),
                p(
                  'Game-Maker is a set of tools and an engine that runs your game. It needs an AT with VGA, a mouse and a hard disk, and takes a joystick if you’re feeling fancy. **Make a game. Put it on a floppy. Mail it.**',
                ),
              ],
              [
                shot('sandcast', 'map', 'A Game-Maker map seen whole, tiny blocks in a grid', undefined, 2),
                shot('logic', 'level', 'A level of a Sandbox game, in full color', undefined, -1),
                shot('loaf', 'title', 'A Sandbox game’s title screen', undefined, 2),
              ],
            ],
            0.2,
          ),
          cols(2, [
            p('**PRIZES**'),
            p('**Best Overall Game**'),
            p('**1ST PLACE:** a ride around the block in THE CHEZ (Teddy gets the window seat), plus a golden rubber-chicken trophy on a stand.'),
            p('**2ND PLACE:** a genuine tin heart, shiny side out, in a box that is mostly tissue paper.'),
            p('**3RD PLACE:** an honorary Clown Club red nose. Honking is encouraged, and entirely friendly.'),
            p('**Most Original:** a lifetime supply of peel-off disk labels. Some peeling required.'),
            p('**Best Theme/Story Line:** a certificate saying you told it better than we could, signed with a paw print by Gwinn.'),
            p('**Best Game Created by a Team:** one rubber chicken for each member, up to four. Matching is not guaranteed.'),
            p('**Best Graphics (Animated):** a flip-book of your best sprite, spiral bound by hand.'),
            p('**Best Graphics (Static):** a very nice empty picture frame, for hanging your own way.'),
          ]),
          p(
            '**Every entry received gets a copy of Teddy’s Little Big Adventure,** the Game-Maker game that hops, on a 3½" floppy with a gold star on the label.',
          ),
        ],
        {
          burst: 'WIN A CHICKEN!',
          sub: '**TURBO BUTTON** and **Sandbox Software** Present',
          small:
            '**CONTEST RULES!** 1. Up to two games can be sent by any one person alone or as part of a team. Games must reach the address below, postmarked no later than noon (or so), Friday, March 31, 1995. Send games on 3½" floppy disks, double or high density, notched or not. Games can be any size, but won’t be sent back: they go on the shelf, and Teddy reviews each one. • 2. Original art and graphics are not necessary, but extra cheering is given for art first drawn on a napkin. • 3. Games will be judged by the TURBO BUTTON staff, with Gwinn and Teddy supervising. All decisions are final, unless we change our minds nicely. • 4. Judges assign up to 100 points per game in these categories: Game Concept and Design 15 · Graphic Design 20 · Animation 15 · Story Line/Theme 15 · Playability 20 · Originality 10 · Honk Factor 5 · **Total 100.** • 5. A game may win in at most two categories, or three if it has a dog in it. • 6. Entrants must say whether the game is a solo or a team effort, and how many dogs helped. • 7. All games must be designed with Game-Maker and run under PLAYGAME. Wild homemade engines, however clever, go in the other contest. • 8. This contest is not open to employees of Sandbox Software or TURBO BUTTON, their dogs, or their families (Teddy is very sorry). • 9. Entrants keep full ownership of their games. Winners hear by mail, in an envelope, eventually. Contest prizes are made up, and so is the box: there is nothing to mail, and it is all free to play here. Send all entries to: **Game-Maker Contest, c/o TURBO BUTTON, P.O. Box 000.**',
          tone: 'white',
        },
      ),
    ],
    'white',
  );

export const CONTEST_AD: MagSection = {
  id: 'contest-ad',
  title: 'The Game-Maker Game Design Contest',
  toc: false,
  pages: () => [contestAd()],
};
