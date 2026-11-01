// Lewis's update, for this issue: a Q&A in his voice built only from his own account of those
// years (docs/history.md). The first interview (Fort Ashby, the ad, the snow, the box) ran in
// the spring 1993 issue (spring93/interview.ts); this is what came after: graduation, the 486,
// Pittsburgh. It shares both its pages with small ads.
import { a, button, cols, grid, head, note, p, pull, q, side } from '../blocks';
import type { MagSection } from '../types';
import { FUN_NIGHT, SWAP_MEET } from './smallAds';

const L = 'LEWIS';

export const LEWIS: MagSection = {
  id: 'lewis',
  title: 'Lewis Moten: Two Years On',
  blurb: 'Graduation, a 486 with a CD-ROM drive, Pittsburgh, and the sound designer he never forgot',
  dept: 'INTERVIEW',
  pages: () => [
    {
      kind: 'article',
      blocks: [
        head('The Sound That Kept Coming Back', {
          kicker: 'Lewis Moten, an update',
          size: 'xl',
          level: 1,
          deck: 'In our spring 1993 issue (Vol. 1, No. 4) Lewis told us how a December storm bought his copy of Game-Maker. We caught up with him to ask what came after.',
        }),
        cols(2, [
          q('Where did life take you after high school?'),
          a(L, 'I graduated in May 1994, and my parents gave me a 486 with a CD-ROM drive as a graduation gift. I left for Pittsburgh in June.'),
          q('Did Game-Maker leave with you?'),
          a(
            L,
            'Its sound editor kept coming back in my own projects. A UFO game I began in Second Life in 2009, where you hunt for aliens with a flashlight, came to the web with drawn sound effects in the spirit of Game-Maker’s. I sent data between two devices as sound, from memories of cassette drives and a 2400 baud modem that tied up the phone line. I planned a GPS scavenger hunt with sound effects made from 36 bytes of data. And I built a web page that lets you draw a sound effect with the mouse.',
          ),
        ]),
        pull('“Draw the wave, hear the effect.”', 'Lewis Moten'),
        SWAP_MEET,
      ],
    },
    {
      kind: 'article',
      blocks: [
        head('Why a 1994 desk?', { kicker: 'Lewis Moten, an update, continued', size: 'l', level: 2 }),
        cols(2, [
          q('What is the 1994 desk in the Sandbox Edition about?'),
          a(
            L,
            'It recreates how games like these were found and shared before most homes had the internet: a PC and a DOS prompt, a modem and a phone line, the BBSes, the boxes on the shelf. The point is the feeling of it: waiting on a download, trading games on a board, and finding out what a box of software could let a kid make.',
          ),
          q('And the sound designer you loved?'),
          a(L, 'It’s in the Sandbox Edition, in the desk’s DOS Game-Maker and in the web editor: draw the wave, hear the effect.'),
          q('Who set Game-Maker’s source free?'),
          a(
            L,
            'Andy Stone released Game-Maker’s source code under the MIT License in 2014. This edition turns that source into a version that runs in a web browser, keeps the original file formats, and adds new games made with it.',
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
        FUN_NIGHT,
      ],
    },
  ],
};
