// The spring issue's interview with Lewis: a Q&A in his voice built only from his own account of
// the years up to spring 1993 (docs/history.md): Fort Ashby, the ad, the snow and the box
// arriving. What came after (graduation, the 486, Pittsburgh) is in No. 2's update (lewis.ts).
// The ad that started it follows on its own page, reprinted and labeled as one.
import { a, adPage, adframe, big, button, cols, grid, head, list, note, p, pull, q, side } from '../../blocks';
import { ORIGINAL_AD } from '../ads';
import type { MagSection } from '../../types';

const L = 'LEWIS';

export const LEWIS_1: MagSection = {
  id: 'lewis',
  title: 'Interview: The Kid Who Shoveled Snow for Game-Maker',
  blurb: 'Lewis Moten on Fort Ashby, the winter of 1992, and the sound designer he never forgot',
  dept: 'INTERVIEW',
  pages: () => [
    {
      kind: 'article',
      blocks: [
        head('“The Snow Became My First Business”', {
          kicker: 'The Interview',
          size: 'xl',
          level: 1,
          deck: 'Lewis Moten bought Game-Maker with a winter’s worth of shoveled driveways, and made a game of the winter. We asked him how it started.',
        }),
        cols(2, [
          q('Where were you when you first heard of Game-Maker?'),
          a(
            L,
            'Fort Ashby, in Mineral County, West Virginia. My family moved there in November 1990, during the county’s hunting-week break from school. Our house was on a hill.',
          ),
          q('New town, new school?'),
          a(L, 'Before the move I had been at Eastern Vocational Technical High School in Baltimore. In West Virginia I went to Frankfort High School.'),
          q('Was there a computer at home?'),
          a(L, 'My brother bought an IBM PS/2, a 286, with Mom’s help, and I used it often.'),
          q('What did a kid do for fun in Fort Ashby?'),
          a(
            L,
            'I made friends at a video rental store in town that had a pool table, and the arcade machines were further into town, upstairs at a place across from the convenience store. I painted ceramics at the ceramic shop. There was a pizza shop at the bottom of my hill, and a friend who also had a computer, where we played games.',
          ),
          q('You were a firefighter, too?'),
          a(
            L,
            'A junior firefighter, at the volunteer fire department on the corner. I listened to the fire radios, dried and rolled hoses, rode the brush truck once, and dropped suction hoses into the river at the fairgrounds during night drills. We flew model rockets at the fairgrounds, too.',
          ),
          q('Any place for a kid who liked to build things?'),
          a(
            L,
            'A little library across from the grocery store, one big eight-sided room and a copier. Next to it was a hardware store where I bought bits for my router and scroll saw for woodworking.',
          ),
          q('And then you saw the ad.'),
          a(
            L,
            'In October 1992 a game magazine advertised RSD Game-Maker for $89 plus $4 shipping. The next issue listed it at $129. I was 16. [Here is the ad](go:mag/ad-reprint).',
          ),
        ]),
        pull('“When I had the money I bought a money order and sent it off for Game-Maker.”', 'Lewis Moten'),
        side(
          'Lewis, winter of 1992',
          [
            grid(
              [
                [list(['Age: 16', 'Town: Fort Ashby, West Virginia', 'Computer: his brother’s IBM PS/2, a 286'])],
                [list(['Game-Maker: $89 + $4 shipping, by money order', 'Paid for by: shoveling snow after the December 11 storm'])],
              ],
              0.3,
            ),
          ],
          'cyan',
          2,
        ),
      ],
    },
    {
      kind: 'article',
      blocks: [
        head('Moten Snow to Software Operations', { kicker: 'The Interview, continued', size: 'l', level: 2 }),
        cols(2, [
          q('So how does a 16-year-old come up with $93?'),
          a(
            L,
            'On December 11, 1992, a nor’easter snowed the area in. The local paper ran “Keyser area is snowbound” that day. The snow became my first business.',
          ),
          q('What was the business?'),
          a(
            L,
            'From December 1992 to February 1993 I shoveled driveways around Fort Ashby. I had to find customers, set prices, schedule the work and do it well in the cold. When I had the money I bought a money order and sent it off for Game-Maker.',
          ),
          q('What happened when the box came?'),
          a(L, 'I went from moving snow to making software. I built tile-based adventure games and learned how game logic works.'),
          q('What did your games open on?'),
          a(
            L,
            'My copy wouldn’t start a game without its title card, RSD’s “Game-Maker Presents:” picture. Plenty of people drew their own card in its place; I just left RSD’s.',
          ),
          q('What part of the program stayed with you?'),
          a(L, 'The sound editor, most of all. You drew a sound’s wave with the mouse, and a few bytes became an 8-bit sound effect.'),
        ]),
        pull('“Draw the wave, hear the effect.”', 'Lewis Moten'),
        side(
          'Play that winter',
          [
            p(
              '*Snowbound: The $89 Shovel* is that winter as a game, set in Fort Ashby in December 1992. A kid has a shovel, a coffee can and a plan: clear the neighborhood’s driveways, sled down Jamie Street, and get $89 to the mall before the price goes up. It is on the [free disk](go:mag/disk).',
            ),
            button('go:play/snowbound', 'Play Snowbound'),
          ],
          'cyan',
        ),
        note(
          'Interview for this issue. Lewis’s answers are drawn from his own account of those years, “Lewis and Game-Maker”, in the Sandbox Edition’s notes.',
        ),
      ],
    },
    {
      ...adPage(
        'ad-reprint',
        'Game-Maker 2.0 (reprint)',
        [
          adframe(
            'RSD GAME-MAKER 2.0',
            [
              big('$89', 'plus $4 shipping'),
              p('Reprinted for this issue, not a live ad: the price was $129 by the next issue, and the ad ran in the October 1992 issue of a game magazine.'),
              p(`This is the ad Lewis answered. [The original page, at the Internet Archive](${ORIGINAL_AD})`),
              button('go:mag/lewis', 'Back to the interview'),
            ],
            { burst: 'THE AD THAT STARTED IT', sub: 'Computer Gaming World #99, October 1992', tone: 'white' },
          ),
        ],
        'pink',
      ),
      look: 'classic',
    },
  ],
};
