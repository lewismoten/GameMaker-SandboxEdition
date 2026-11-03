// The spring issue's PC News page: short news items in columns, in the style of a 1993 PC
// magazine's news page. Teddy's hint line (the one the desk phone answers), what Game-Maker 2.0
// is (the pink box, with a real render of its block designer), a few small items and a yellow
// box. It names no game but Snowbound (games.test.ts); prices and numbers are part of the story.
import { pcNews } from '../../blocks';
import type { MagSection } from '../../types';
import { HINT_LINE_NUMBER, HINT_LINE_RATE } from './hintLineFacts';

export const PC_NEWS_1: MagSection = {
  id: 'pc-news',
  title: 'PC News',
  blurb: 'A hint line, a snow game, and Game-Maker in a box',
  dept: 'PC NEWS',
  pages: () => [
    {
      kind: 'article',
      tone: 'news',
      blocks: [
        pcNews('PC NEWS', [
          {
            slot: 'a',
            title: 'New 900 number for hints',
            body: [
              `**Teddy’s Hint Kennel** is open, and the line is up 7 days a week, 24 hours a day. Dial **${HINT_LINE_NUMBER}** and a very serious corgi will talk you through saving your game, reading a map, and sizing up an enemy, and will tell you where the free help lives.`,
              `The call costs ${HINT_LINE_RATE} per minute, and a touch-tone phone is required. Ask before you call: it is the family’s phone, so get a grown-up’s yes first.`,
            ],
          },
          {
            slot: 'b',
            title: 'Snow day for Sandbox',
            body: [
              '**Sandbox Software** of Fort Ashby has finished *Snowbound: The $89 Shovel*, a winter adventure made with Game-Maker, and the whole game rides on the floppy taped to this issue.',
              'Put the disk in the drive, type its name, and the kid with the shovel is ready to work the street. Our Critic’s Corner has the verdict.',
            ],
          },
          {
            slot: 'c',
            title: 'Write to us',
            tone: 'yellow',
            body: [
              'This is a young magazine, and the mailbox is empty. Tell us what you are making with Game-Maker and where you got stuck. We print the best letters, and the best games readers send us, next month.',
              'Send **letters**, **games** on a disk (short and finished beats long and not) and **tricks** you found in any game. We try every one before we print it. TURBO BUTTON, P.O. Box 000, Fort Ashby, W.Va. Part of the story: it is all free here, so nothing to mail.',
            ],
          },
          {
            slot: 'wide',
            title: 'Roll your own',
            tone: 'pink',
            shot: {
              game: 'snowbound',
              view: 'blocks',
              alt: 'Game-Maker’s block designer: a big grid for drawing one picture square, the finished blocks of a snowy street beside it, and a strip of colors above',
              caption: 'Game-Maker’s block designer: a zoomed-in grid to draw on, a view of the blocks as they will look, and a row of colors to paint with.',
            },
            body: [
              '**Recreational Software Designs** has a new program that lets you make your own action or adventure game, no programming needed. *Game-Maker* 2.0 runs on any 286, 386 or 486 PC with 640K of memory, a mouse and 256-color VGA graphics.',
              'You work with the mouse and menus. Draw the blocks that build your world, then the monsters and the hero, lay out the maps, and make the sounds. A sequence of up to twenty frames makes a monster walk, and a scene links one picture or level to the next.',
              'When every piece is in place, you stitch them into a game of as many levels as you like. The box comes with sample games, and you can play every one, change it, and learn how it was built.',
              '*Game-Maker* costs $129 plus shipping. To order, call toll free 1-800-555-0172, or write to Recreational Software Designs, P.O. Box 000, Amherst, N.H.',
            ],
          },
          {
            slot: 'd',
            title: 'Clown Club hits the hall',
            body: [
              'The **Clown Club** brings its spring show to the community hall the first Saturday in May: balloon animals, face painting, a juggler and a very tall hat. Everyone is welcome and it is free.',
              'The clowns have promised one PC next to the cake, loaded with games for anyone who wants a turn. Friendly clowns only; the hall has the paper plates.',
            ],
          },
          {
            slot: 'e',
            title: 'Before you buy a sound card',
            body: [
              'The little speaker inside your PC only beeps. A **sound card** gives games music and voices, and a few checks help before you take one home.',
              'Ask for a spare slot inside the case, a jack for speakers or headphones, and a box that lists the settings DOS wants. Many cards also have a **game port** for a joystick. Ask the store to let you hear it with a real game.',
            ],
          },
        ]),
      ],
    },
  ],
};
