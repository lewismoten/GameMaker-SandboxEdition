// Mail Bag: readers' letters with the editors' replies (an octopus that won't climb, a score a
// big sister disputes, a tin heart theory, a drawing of the moon, the Sandbox BBS's busy signal)
// and OOPS!, a correction to the preview issue. Every fact in a reply is the games' or the
// boards' own: the octopus needs slime (Octolris's help screen), the hearts sit in their maps
// whatever the time, the Sandbox BBS has one line (bbsListings.ts), and the correction's keys
// are PLAYGAME's (mailBag.test.ts reads the engine). Readers are made up: a handle and a town.
import { a, art, card, cols, grid, head, note, p, side } from '../blocks';
import type { Block, MagSection } from '../types';

/** The correction: the key the preview issue named for the score, and the one that shows it. */
export const CORRECTION = { said: 4, right: 2 };

interface Letter {
  title: string;
  kicker?: string;
  text: string;
  from: string;
  reply: string;
  /** What came in the envelope with it, drawn beside the letter. */
  drawing?: { alt: string };
}

const LETTERS: Letter[] = [
  {
    title: 'Slash happy',
    text: 'Octolris is broken. The review on the board said press slash to climb. I pressed slash about four hundred times and my octopus just stood there looking at me.',
    from: 'SLASHER, Altoona, Pa.',
    reply:
      'Nothing is broken. He needs slime first: the game’s own help screen says the vials of slime are what let him climb. Grab a vial, then press slash. Then rest that pinkie.',
  },
  {
    title: 'Seventy-three?!',
    text: 'Your preview gave Glubada Pond a 73. My little brother has played it every night for three weeks and draws the fish on everything, including my homework. That is a 100.',
    from: 'BIG SIS, Keyser, W.Va.',
    reply:
      'FINS stands by 73, which [in our book](go:mag/reviews-4) means a good evening. Your brother has had twenty-one good evenings, which beats any score we print. Please ask him to leave your homework alone.',
  },
  {
    title: 'I have cracked the tin hearts',
    text: 'Every tin heart has a clock face, right? So each one shows a TIME. Set your PC’s clock to that time before you start the game and the heart appears. I have made a chart for every game. I have not found one yet, but I am close.',
    from: 'CLOCKWORK KATE, Wheeling, W.Va.',
    reply:
      'Kate, it is a beautiful chart, and we are sorry. A tin heart does not care what time your PC thinks it is. It is in its game from the moment you start, waiting for you to wander past. Tape the chart to the wall and go look around.',
  },
  {
    title: 'For the art department',
    kicker: '★ Letter of the month',
    text: 'Here is my drawing of Teddy driving THE CHEZ to the moon. The yellow part is cheese. Can you put it in a game?',
    from: 'JOEY, age 8, Cumberland, Md.',
    drawing: {
      alt: 'Joey’s crayon drawing, taped up: Teddy the corgi, orange and white with both big ears standing up, grins out of the door window of THE CHEZ, a little red boxy car with a black roof, two dark stripes and white wheels, as it zooms past the stars to a big yellow cheese moon full of holes. Crayon letters say TEDDY + THE CHEZ GO TO THE MOON, by Joey, age 8.',
    },
    reply:
      'Joey, it is taped up over the art desk, and the whole staff agrees the moon has never looked more delicious. We can’t put it in a game, but you can: Game-Maker’s block editor draws pictures one dot at a time. Start with the cheese.',
  },
  {
    title: 'Busy, busy, busy',
    text: 'I called the Sandbox BBS eleven times Saturday night and got a busy signal eleven times. Is it even real??',
    from: 'DIALTONE, Butler, Pa.',
    reply:
      'It is real, and it has exactly one phone line, so whoever gets in has the whole board for up to an hour. Try early, try late, and when you get in, be quick and be nice. Or dial [The Sofa](go:bbs/sofa): eight lines, though Saturday night fills those too.',
  },
];

const letter = (l: Letter): Block[] => [
  head(l.title, { size: 's', level: 3, kicker: l.kicker }),
  ...(l.drawing ? [art('joey', l.drawing.alt)] : []),
  p(l.text),
  p(`*— ${l.from}*`),
  a('TB', l.reply),
];

export const MAIL_BAG: MagSection = {
  id: 'mailbag',
  title: 'Mail Bag',
  blurb: 'Readers write: a stubborn octopus, a tin heart theory, and the moon in cheese',
  dept: 'MAIL BAG',
  pages: () => [
    {
      kind: 'dept',
      tone: 'white',
      blocks: [
        head('Mail Bag', {
          kicker: 'Letters',
          size: 'l',
          level: 2,
          deck: 'Our free preview issue went around the computer swap meet, and the mailbox has not been empty since. Letters may be edited for length. Drawings are never edited.',
        }),
        cols(2, LETTERS.flatMap(letter)),
        grid([
          [
            side(
              'OOPS!',
              [
                p(
                  `In our preview issue we told you to press F${CORRECTION.said} to check your score. F${CORRECTION.said} turns the sound effects off. (Press it again and they come back.) Your score is on the status screen: press **F${CORRECTION.right}**. Sorry, Kevin.`,
                ),
              ],
              'pink',
            ),
          ],
          [
            card('Write to us', ['Mail Bag, TURBO BUTTON, P.O. Box 000', 'Or leave a message for the SysOp on THE -= S A N D B O X =- BBS.'], {
              go: 'go:bbs/sandbox',
              button: 'Dial the Sandbox BBS',
            }),
          ],
        ]),
        note('Readers, handles and hometowns are part of the story the 1994 desk tells.'),
      ],
    },
  ],
};
