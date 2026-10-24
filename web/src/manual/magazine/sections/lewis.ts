// The interview with Lewis, for this issue: a Q&A in his voice built only from his own account
// of those years (docs/history.md). Anything beyond it stays general.
import { a, button, cols, grid, head, note, p, pull, q, shot, side } from '../blocks';
import type { MagSection } from '../types';

const L = 'LEWIS';

export const LEWIS: MagSection = {
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
          deck: 'Lewis Moten bought Game-Maker with a winter’s worth of shoveled driveways. Today he keeps Game-Maker: Sandbox Edition. We asked him how it started.',
        }),
        cols(2, [
          q('Where were you when you first heard of Game-Maker?'),
          a(
            L,
            'Fort Ashby, in Mineral County, West Virginia. My family moved there in November 1990, during the county’s hunting-week break from school, and I started high school at Eastern Vocational Technical High School that fall. Our house was on a hill, and the family computer was an IBM PS/2 that I shared with my mom.',
          ),
          q('What did a kid do for fun in Fort Ashby?'),
          a(
            L,
            'I made friends at a video rental store in town that had a pool table and arcade machines. And I was a junior firefighter. I listened to the fire radios, dried and rolled hoses, rode the brush truck once, and dropped suction hoses into the river at the fairgrounds during night drills.',
          ),
          q('And then you saw the ad.'),
          a(L, 'In October 1992 a game magazine advertised RSD Game-Maker for $89 plus $4 shipping. The next issue listed it at $129. I was 16.'),
        ]),
        pull('“When I had the money I bought a money order and sent it off for Game-Maker.”', 'Lewis Moten'),
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
          q('What part of the program stayed with you?'),
          a(L, 'The sound editor, most of all. You drew a sound’s wave with the mouse, and a few bytes became an 8-bit sound effect.'),
        ]),
        side(
          'Play that winter',
          [
            p(
              '*Snowbound: The $89 Shovel* is that winter as a game, set in Fort Ashby in December 1992. A kid has a shovel, a coffee can and a plan: clear the neighborhood’s driveways, sled down Jamie Street, and get $89 to the mall before the price goes up.',
            ),
            button('go:play/snowbound', 'Play Snowbound'),
          ],
          'cyan',
        ),
        shot('snowbound', 'level', 'Snowbound: the kid with his shovel on a snowy street', 'The streets in *Snowbound* are the ones Lewis grew up on.'),
      ],
    },
    {
      kind: 'article',
      blocks: [
        head('The Sound That Kept Coming Back', { kicker: 'The Interview, continued', size: 'l', level: 2 }),
        cols(2, [
          q('Where did life take you after high school?'),
          a(L, 'I graduated in May 1994 and left for Pittsburgh in June.'),
          q('Did Game-Maker leave with you?'),
          a(
            L,
            'Its sound editor kept coming back in my own projects. A UFO game I began in Second Life in 2009, where you hunt for aliens with a flashlight, came to the web with drawn sound effects in the spirit of Game-Maker’s. I sent data between two devices as sound, from memories of cassette drives and a 2400 baud modem that tied up the phone line. I planned a GPS scavenger hunt with sound effects made from 36 bytes of data. And I built a web page that lets you draw a sound effect with the mouse.',
          ),
          q('What is the 1994 desk in the Sandbox Edition about?'),
          a(
            L,
            'It recreates how games like these were found and shared before most homes had the internet: a PC and a DOS prompt, a modem and a phone line, the BBSes, the boxes on the shelf. The point is the feeling of it: waiting on a download, trading games on a board, and finding out what a box of software could let a kid make.',
          ),
        ]),
        grid([
          [
            side(
              'Read more from Lewis',
              [
                p('[Creating a UFO game](go:url/https://lewismoten.com/2024/04/15/creating-a-ufo-game/)'),
                p('[Data over audio](go:url/https://lewismoten.com/2024/05/01/data-over-audio/)'),
                p('[Game design](go:url/https://lewismoten.com/2024/05/20/game-design/)'),
              ],
              'yellow',
            ),
          ],
          [
            side(
              'Sit at the desk',
              [p('Switch on the PC, dial a BBS, and open the boxes on the shelf.'), button('go:desk', 'Go to the 1994 desk'), button('go:bbs', 'Call the BBS')],
              'pink',
            ),
          ],
        ]),
        note(
          'Interview for this issue. Lewis’s answers are drawn from his own account of those years, “Lewis and Game-Maker”, in the Sandbox Edition’s notes.',
        ),
      ],
    },
  ],
};
