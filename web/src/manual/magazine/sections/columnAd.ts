// A tall narrow column ad for Game-Maker, running down the side of an article page the way
// RSD's 1992 magazine ads did: a salmon-pink column of stacked headlines, three real
// screenshots (the game's, the block editor's, the monster editor's), a short pitch, the
// price, a big toll-free number, an order address, small print and the reader service line.
// Its look is columnAd.css. The words are new; the phone number (555-01xx), the P.O. box and
// the prices are part of the story, as in the page-12 order form (ads.ts).
import '../columnAd.css';
import { big, halfAd, head, p, shot } from '../blocks';
import type { HalfAd } from '../types';
import { readerServiceNo } from './readerService';

export const COLUMN_AD: HalfAd = {
  ...halfAd(
    'Game-Maker: Sandbox Edition',
    'Tired of\nbeating other\npeople’s games?\nBuild one nobody\ncan beat.',
    [
      shot('tuneup', 'level', 'A level of Tune-Up, a game made with Game-Maker'),
      head('Your rules.', { size: 'm', level: 3 }),
      head('Build it with\nGAME·MAKER™', { size: 'm', level: 3 }),
      shot('tuneup', 'blocks', 'Game-Maker’s block editor, one block drawn pixel by pixel beside the block set'),
      shot('blaster', 'monsters', 'Game-Maker’s monster editor: Virus Blaster’s monsters, each one’s animation frames in a row'),
      p(
        'Point, click and paint. A mouse, 256-color VGA and no programming: draw the blocks, animate the monsters, lay out the maps and link them into a game your friends can play from a floppy. Only **$89** (plus $4.00 shipping).',
      ),
      p('**ORDER GAME·MAKER TOLL FREE:**'),
      big('1-800-555-0120'),
      p('(credit card orders only)'),
      p('Or write: Sandbox Software, P.O. Box 000, Pittsburgh, PA 15213.'),
    ],
    {
      small: `Requires an IBM compatible 286, 386 or 486 with 640K, a VGA monitor and a mouse. Joystick optional. Game·Maker designed and produced by Recreational Software Designs. [Circle ${readerServiceNo('go:editor')} on Reader Service Card.](go:mag/reader-service) Free here: a mouse click away.`,
      tone: 'pink',
    },
  ),
  look: 'column',
};
