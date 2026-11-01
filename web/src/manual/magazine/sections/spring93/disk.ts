// ON YOUR FREE DISK: the spring issue's cover disk and how to run it. The disk is Snowbound on
// one 3½" floppy (disk.test.ts keeps "one disk" true against the built game); its picture is
// the game's own printed label, and the disk plays the game here.
import { grid, head, list, p, side } from '../../blocks';
import type { Block, MagSection } from '../../types';
import { FUN_NIGHT } from '../smallAds';

/** The cover disk as a block, on its page or on the cover (cover.ts has its own). */
const floppy = (caption: string): Block => ({
  t: 'floppy',
  game: 'snowbound',
  go: 'go:play/snowbound',
  alt: 'Snowbound: The $89 Shovel, the free disk (plays the game)',
  caption,
});

export const DISK_1: MagSection = {
  id: 'disk',
  title: 'On Your Free Disk',
  blurb: 'Snowbound: The $89 Shovel, ready to run',
  dept: 'COVER DISK',
  pages: (ctx) => {
    const g = ctx.game('snowbound');
    return [
      {
        kind: 'dept',
        tone: 'white',
        blocks: [
          head('ON YOUR FREE DISK', {
            kicker: 'Cover disk',
            size: 'l',
            level: 1,
            deck: 'One 3½-inch disk taped to the cover, and a whole game on it: Snowbound, a December in Fort Ashby.',
          }),
          grid(
            [
              [floppy('Press the disk to play it right here.')],
              [
                side(
                  'How to use the disk',
                  [
                    list(
                      [
                        'Slip the disk into drive A: and type **A:** at the **C:\\>** prompt.',
                        'Type **SNOWBND** and press Enter. The game starts from the disk.',
                        'No floppy drive handy? [Play it here](go:play/snowbound), no disk needed.',
                      ],
                      true,
                    ),
                  ],
                  'cyan',
                  2,
                ),
              ],
            ],
            0.4,
          ),
          p(
            `**${g?.title ?? 'Snowbound: The $89 Shovel'}** is shareware from Sandbox Software: play all of it, and if you like it the registration is ${g?.price ?? '$12'}. It was made with Game-Maker, the kit in [our interview](go:mag/lewis), and it is Lewis’s own winter, Fort Ashby, December 1992.`,
          ),
          p('Stuck on a street? The [Strategy Guide](go:mag/strategy) has the hint book, and the [Critic’s Corner](go:mag/critics-corner) has an opinion.'),
          FUN_NIGHT,
        ],
      },
    ];
  },
};
