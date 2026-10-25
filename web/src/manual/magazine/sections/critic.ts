// The Critic's Corner: a staff critic's split verdict on Snowbound: The $89 Shovel, top marks
// for its true story and low ones for its play. Every claim is checked against the game in
// games/snowbound: the sled starts on flat snow at the top of Jamie Street and each press of
// down is one shove (src/levels/maps.ts, src/characters/kid.ts norepeat); four levels, about
// three minutes of them in the walkthrough (walkthrough.json's timeline); nothing gates the
// street exits, and the mall lot snows over and pays again (src/blocks/ground.ts). The
// price is the one on the box (about.json), and the ad it mentions really carries the game.
import { cols, grid, head, note, p, shot, side } from '../blocks';
import type { MagContext, MagPage } from '../types';

const GAME = 'snowbound';
/** The staff critic, by handle like the readers. */
const CRITIC = 'FROSTBITE FRANK';

export function criticsCorner(ctx: MagContext): MagPage {
  const price = ctx.game(GAME)?.price ?? '$12';
  return {
    id: 'critics-corner',
    kind: 'dept',
    tone: 'white',
    blocks: [
      head('Snowbound: The $89 Shovel', {
        kicker: 'Critic’s Corner',
        size: 'l',
        level: 2,
        deck: 'A true story told with heart, around a game that’s over before your cocoa cools.',
      }),
      note(`Sandbox Software, 1995 · ${price} on the box · reviewed by *${CRITIC}*, staff critic`),
      grid(
        [
          [
            shot(
              GAME,
              'level',
              'Snowbound’s first level: the kid in red on the sidewalk at Gale Street and Dunn Drive, an orange plow on the road below',
              'Gale Street, 7 AM: the kid in red is you, and the orange plow along the bottom is already out. Enjoy the view. It’s one of only four.',
              -1.5,
            ),
          ],
          [
            p(
              'First, the part Sandbox got exactly right. Snowbound is the true story of December 1992 in Fort Ashby, West Virginia: a foot and a half of snow, no school, and a pink Game-Maker™ box in a mall window at $89, until the price goes up in January. You hang out a sign, **Moten Snow-to-Software Operations**, deliver the morning papers, dig out the neighbors at a dollar a scoop, sled down Jamie Street and count your coffee can under the lights at LaVale Mall. You want that kid to get his box. I did.',
              { drop: true },
            ),
          ],
        ],
        0.4,
      ),
      cols(2, [
        p(
          'Then you play it. The sled run starts at the top of Jamie Street on flat snow, and the sled just sits there. Each press of the down arrow is one shove, and holding it down doesn’t keep pushing, so I tapped, tapped, tapped like I was sending Morse code before the hill finally took me. It felt like a lot of work for a sled. Once it’s rolling it’s a fair little run: rocks, trees, moguls, dollar bills on the snow and toboggan kids cutting across.',
        ),
        p(
          'And then it’s over. There are four levels: Gale Street, Jamie Street, Bowden Drive and LaVale Mall. The walkthrough Sandbox recorded plays all four in a little over three minutes. Worse, nothing makes you shovel the streets at all. I walked past every driveway, rode the hill, dodged the plows on Bowden Drive and stood in the mall lot while the squalls buried it again, a dollar a scoop, until I had $89 for the register. Box bought, credits up.',
        ),
        p(
          'So why the A+? Because the heart of it is right, and the heart is the hard part. Snowbound plays like a practice swing, the kind every studio takes early on. Teddy’s Little Big Adventure and Maximus show what Sandbox can do when it connects. Read Snowbound’s story, ride the hill once, and spend your money on one of those.',
        ),
      ]),
      grid(
        [
          [
            side(
              'The verdict',
              [
                p('**STORY: A+** A real winter and a real reason to shovel.'),
                p('**GAMEPLAY: C–** A stubborn sled and four short levels.'),
                p(`**Bottom line:** Don’t waste your money on it. Or [play it](go:play/${GAME}) and see for yourself.`),
                note(`Sandbox Software, ${price}. 256-color VGA, Sound Blaster music and sound.`),
              ],
              'pink',
            ),
          ],
          [
            side(
              'Yes, they advertise with us',
              [
                p(
                  'Sandbox Software bought the ad on page {page:ad-sandbox-edition}, and Snowbound’s title screen is in it. No, it didn’t help. Nobody at Sandbox saw this review before you did.',
                ),
              ],
              'cyan',
            ),
          ],
        ],
        0.4,
      ),
    ],
  };
}
