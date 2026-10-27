// The small ads that share editorial pages, as a 1995 magazine sold its leftover half pages:
// a used-games swap meet, The Sofa BBS, mouse pads, the Clown Club's family fun night, the
// Sandbox hint books and blank disks. The companies, prices and numbers are part of the story
// (phone numbers 555-01xx, mail to P.O. Box 000); every button opens the real thing here, free.
import '../sofaAd.css';
import { art, big, button, card, grid, halfAd, list, p, piece } from '../blocks';
import type { HalfAd } from '../types';
import { SOFA_PHONE } from './bbsListings';
import { readerServiceNo } from './readerService';

/** A swap meet for used games and shareware, at the Mineral County Fairgrounds. */
export const SWAP_MEET: HalfAd = halfAd(
  'Tri-County Game Swap',
  'TRI-COUNTY GAME SWAP',
  [
    grid(
      [
        [
          list([
            'Boxed games, manuals and hint books, bought, sold and traded',
            'Joysticks, sound cards and modems that still work (we test them)',
            'The shareware table: bring blank disks and copy all you like',
          ]),
        ],
        [big('SAT. 9–3', 'at the Mineral County Fairgrounds'), p('**Tables $5** · browsing free · hot dogs by the junior firefighters'), p('Info: 555-0142')],
      ],
      0.3,
    ),
  ],
  {
    burst: 'TRADE, DON’T TOSS!',
    sub: 'Clean out the closet. Fill up the disk box.',
    small: 'Store-bought games trade in their boxes only: no copies, please. Shareware is free to pass on, as its authors ask.',
    tone: 'yellow',
  },
);

/** The Sofa, the Bard of Bizarre's board, its frame a cozy living room with a sofa (sofaAd.css). */
export const SOFA_BBS: HalfAd = halfAd(
  'The Sofa BBS',
  'PULL UP A CUSHION ON THE SOFA',
  [
    big(SOFA_PHONE, '8 lines'),
    list([
      'Teleconference all night with COUCH POTATO and CUSHION KING',
      'Free song-games from The Bard of Bizarre: no ratio, ever',
      'Log on with “new” for a User-ID of your own',
    ]),
    button('go:bbs/sofa', 'Dial The Sofa'),
  ],
  { sub: 'Pittsburgh’s place to kick back.', small: 'All 8 lines busy? Keep trying. Dials from the desk’s TERMINAL only.', tone: 'pink' },
);

/** Mouse pads, one with THE CHEZ on it; its button lays any of them on the desk's own pad. */
export const MOUSE_PADS: HalfAd = halfAd(
  'Square Deal Pad Co.',
  'YOUR MOUSE DESERVES A NICER FLOOR',
  [
    grid(
      [
        [art('chez', 'THE CHEZ, a little tomato-red car with a black roof, as printed on a mouse pad'), big('$6.95', 'each, plus $2 shipping')],
        [
          list(['**THE CHEZ** in tomato red', '**Graph paper**, for mapping levels', '**Night sky**, for space games', '**Plain blue**, for grown-ups']),
          p('Already on your desk? Pick one here.'),
          button('go:mousepad', 'Change your mouse pad'),
        ],
      ],
      0.25,
    ),
    card('RUSH ME A PAD!', ['☐ THE CHEZ ☐ Graph paper ☐ Night sky ☐ Plain blue'], { fields: ['Name'] }),
  ],
  {
    sub: 'Square Deal Pad Co. foam pads: the ball rolls true and the crumbs wipe right off.',
    small: 'Square Deal Pad Co. · P.O. Box 000 · Orders 555-0156. Part of the story: nothing to order.',
    tone: 'cyan',
  },
);

/** The Clown Club's family fun night with Doc Leo. */
export const FUN_NIGHT: HalfAd = halfAd(
  'The Clown Club',
  'FAMILY FUN NIGHT WITH THE CLOWN CLUB',
  [
    grid(
      [
        [
          list([
            'Balloon animals, made to order',
            'Juggling, magic and a rubber chicken parade',
            'Face painting for brave grown-ups too',
            'Doc Leo’s open mic: tell your best joke',
          ]),
        ],
        [big('FREE', 'root beer floats while they last'), p('Friday at 6, at the community hall. Questions? 555-0123')],
      ],
      0.3,
    ),
    button('go:route/cast', 'Meet Doc Leo and the cast'),
  ],
  { burst: 'BRING THE KIDS!', sub: 'Doc Leo and his friends put on a night of laughs for the whole family.', tone: 'white' },
);

/** The Sandbox hint books, standing beside a story. */
export const HINT_BOOKS: HalfAd = halfAd(
  'Sandbox Software hint books',
  'STUCK? DON’T THROW THE JOYSTICK.',
  [
    piece('teddy', 'hintbook', 'The Teddy Hint Book for Teddy’s Little Big Adventure, its cover', { go: 'go:hints/teddy' }),
    p('Every Sandbox game has its own hint book: maps, answers printed upside down, and no peeking required.'),
    big('$5.95', 'FREE with registration'),
    button('go:mag/hint-books', 'See every hint book'),
  ],
  { small: `Sandbox Software · P.O. Box 000 · Reader Service ${readerServiceNo('go:catalog/sandbox')}`, tone: 'yellow' },
);

/** Blank disks by the bushel. */
export const BLANK_DISKS: HalfAd = halfAd(
  'Floppy Barn',
  'BLANK DISKS BY THE BUSHEL',
  [
    grid(
      [
        [
          art(
            'blankdisk',
            'A stack of three unlabeled 3½-inch floppy disks, the front one showing its metal shutter, write-protect hole and high-density hole',
          ),
        ],
        [list(['**3½″ DS/DD 720K**: 25 for $9.95 · 50 for $18.95 · 100 for $34.95', '**3½″ DS/HD 1.44MB**: 25 for $14.95 · 50 for $27.95 · 100 for $49.95'])],
      ],
      0.2,
    ),
    card('BUSHEL ORDER', ['☐ DS/DD 720K ☐ DS/HD 1.44MB · ☐ 25 ☐ 50 ☐ 100'], { fields: ['Name'] }),
  ],
  {
    sub: 'Floppy Barn: baled fresh every morning, ten colors. No labels, no frills: bring your own pen.',
    small: 'Floppy Barn · P.O. Box 000 · Orders 555-0168 · plus $3 shipping. Part of the story: nothing to order.',
    tone: 'white',
  },
);
