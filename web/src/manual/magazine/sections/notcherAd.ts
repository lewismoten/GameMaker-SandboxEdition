// A full-page ad for a disk notcher in the 1995 magazine's voice: HOLE-Y MOLEY, the Disk Doubler
// from Punchline Products, made-up parody names (NOTICE.md). A little desk press punches the
// second square hole in a 720K double density 3½" disk so the drive takes it for high density
// and FORMAT gives 1.44 MB, the trick the desk zine's DISK TRICKS page tells. The fine print is
// the maker covering itself, as the zine warns: double density disks weren't made for it. Its
// charcoal page with red and blue lettering is notcherAd.css; the drawings are notcherArt.ts.
// The price is part of the story; the button opens the disk box on the desk.
import '../notcherAd.css';
import { adPage, adframe, art, card, grid, list, side } from '../blocks';
import type { MagSection } from '../types';

const notcherAd = () =>
  adPage(
    'notcher-ad',
    'Punchline Products',
    [
      adframe(
        'HOLE\u2011Y MOLEY!',
        [
          art(
            'notcher',
            'The HOLE-Y MOLEY Disk Doubler: a black textured base with a blue 3½ inch disk sitting in its recess, and a white lever arm on a hinge block over the disk’s corner',
          ),
          side(
            'ONE PRESS. TWICE THE DISK.',
            [
              list([
                'A **factory-square hole**, clean as the day the disk was made. No ragged paper-punch job',
                'A **molded guide** lines the disk up the same way, every time',
                '**Leverage!** One easy press a disk, so a whole box goes by in a coffee break',
                'Turn a shoebox of 720K disks into **twice the room**',
                '**Share the savings** with your friends (they bring the disks)',
              ]),
            ],
            'black',
          ),
          grid(
            [
              [
                side(
                  'BEFORE: 720K',
                  [
                    art('notch-before', 'The back of a blue 3½ inch disk with one square hole, in its upper right corner, and its shutter at the bottom'),
                    list(['One hole: write-protect', 'FORMAT A: **720K**']),
                  ],
                  'white',
                ),
              ],
              [
                side(
                  'AFTER: 1.44 MB',
                  [
                    art('notch-after', 'The same disk with a second square hole punched in its upper left corner, circled in red'),
                    list(['Two holes: **high density**', 'FORMAT A: **1.44 MB**']),
                  ],
                  'yellow',
                ),
              ],
            ],
            0.38,
          ),
          card('PUNCH UP YOUR DISK BOX', ['HOLE-Y MOLEY Disk Doubler, with disk guide ..... **$14.95**', 'Fits any 3½" 720K double density disk.'], {
            fields: ['Name', 'City, State, ZIP'],
            go: 'go:desk/diskbox',
            button: 'Open the disk box on the desk',
          }),
        ],
        {
          burst: 'DOUBLE YOUR DISKS!',
          sub: 'The **Disk Doubler** from Punchline Products: *720K in, 1.44 MB out.*',
          small:
            'Prices are part of the story; HOLE-Y MOLEY and Punchline Products are made up. From Punchline Products’ lawyer: results may vary with disk quality. Back up your files.',
          tone: 'black',
        },
      ),
    ],
    'black',
  );

export const NOTCHER_AD: MagSection = {
  id: 'notcher-ad',
  title: 'Punchline Products',
  toc: false,
  pages: () => [notcherAd()],
};
