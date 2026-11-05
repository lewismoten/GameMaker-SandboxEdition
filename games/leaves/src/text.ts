// Every word LEAVES IN THE WIND shows: the signs, the cards before each room, and the text pages (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

type Words = Record<string, [string, number, number]>;

/** The signs of each room: name → [words, blocks wide, blocks high]. */
export const SIGNS = {
  tumble: {
    start: ['EVERY LEAF IS A MONSTER.', 4, 2],
    stiff: ['1 FRAME, STRAIGHT DOWN: STIFF.', 4, 2],
    spin: ['8 FRAMES TURN IT. STILL STIFF.', 4, 2],
    float: ['A ZIGZAG PATH: NOW IT FLOATS.', 4, 2],
    next: ['NEXT: THE WIND.', 4, 2],
  },
  gust: {
    start: ['BRANCHES DROP LEAVES ON TIMERS.', 4, 2],
    gust: ['ONE CLOCK BENDS ALL 3 TREES.', 4, 2],
    land: ['PATH ENDS: THE LEAF LIES DOWN.', 4, 2],
    model: ['GUST LEAVES FLY FAR AND FAST.', 4, 2],
    next: ['THAT IS THE LOT.', 4, 2],
  },
} satisfies Record<string, Words>;

/** The card before each room: its name and a line. */
export const CARDS = {
  tumble: ['The Tumble', 'Three leaves. Only one floats.'],
  gust: ['The Gust', 'Every tree, all at once.'],
} as const;

export const STORY = wrap(`
|LEAVES IN THE WIND

Mara takes a walk under the autumn trees on a breezy day.

A leaf in a game is a monster: a few pictures that turn it and a path that carries it down. A tree drops one on a timer. A gust is one clock that every tree keeps.

Watch the leaves. Then walk on.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|ARROWS        walk
|SPACE         jump

Walk into a door to go to the next room. Read the signs.

Nothing here can hurt Mara.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|LEAVES IN THE WIND  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Opus 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|THAT IS THE LOT

A leaf is a monster. Its frames turn it over and over, and its path swoops it from side to side, slow at the turns, so it floats down instead of dropping.

A branch is a block that gives birth to a leaf every so many ticks. A gust is one loop of blocks that every tree keeps, so they all bend at once.

Open the game in Game-Maker and change a path.
`);

export const LOST = wrap(`
|OOPS!

That was not meant to happen.

Try again: this time, just walk and jump. Nothing here hurts.
`);
