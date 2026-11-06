// Every word LITTLE SHADOWS shows: the signs on the walls, the cards before each room, and the text pages (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export type Look = 'solid' | 'dither';

type Words = Record<string, [string, number, number]>;

/** The signs of each room: name → [words, blocks wide, blocks high]. */
export const SIGNS = {
  yard: {
    solid: {
      start: ['A SOLID SHADOW.', 4, 2],
      sand: ['STRONG ON SAND.', 4, 2],
      grass: ['STRONG ON GRASS.', 4, 2],
      soil: ['DARK ON DARK SOIL.', 4, 2],
      next: ['NEXT: CHECKERS.', 4, 2],
    },
    dither: {
      start: ['A DITHERED SHADOW.', 4, 2],
      sand: ['SOFT ON SAND.', 4, 2],
      grass: ['SOFT ON GRASS.', 4, 2],
      soil: ['GROUND SHOWS THROUGH.', 4, 2],
      next: ['NEXT: A HOP.', 4, 2],
    },
  },
  hop: {
    start: ['WATCH THE HOPS.', 4, 2],
    none: ['NONE. IT FLOATS.', 4, 2],
    same: ['ALWAYS THE SAME.', 4, 2],
    shrink: ['SMALL AT THE TOP.', 4, 2],
    next: ['NEXT: A BEE.', 4, 2],
  },
  hover: {
    start: ['A BEE AND A SHADOW.', 4, 2],
    low: ['BEE OVER SHADOW.', 4, 2],
    high: ['HIGHER: A BIGGER GAP.', 4, 2],
    next: ['THAT IS IT.', 4, 2],
  },
} satisfies { yard: Record<Look, Words>; hop: Words; hover: Words };

/** The card before each room: its name and a line. */
export const CARDS = {
  solid: ['The Yard: Solid', 'One dark color under each foot.'],
  dither: ['The Yard: Dithered', 'Same yard. Half the pixels clear.'],
  hop: ['The Hop', 'A shadow shrinks as things rise.'],
  hover: ['The Hover', 'Two blocks tall: bee and shadow.'],
} as const;

export const STORY = wrap(`
|LITTLE SHADOWS

Mara finds a courtyard where everything has a shadow, and one where nothing does.

A shadow tells you where the ground is, how high something is and how far it is from you. In a game with no see-through colors, a shadow is just more pixels, painted where it will do the most good.

Walk the yard. Watch the hops. Look up.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|ARROWS        walk
|SPACE         jump

Walk into a door to go to the next room. Read the signs on the wall.

Nothing here can hurt Mara. The pips and the bees are friendly.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|LITTLE SHADOWS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|THAT IS THE LOT

A shadow is only pixels. Paint it in the picture, a small one when something is up high; or give it a block of its own under the thing, and let them move together.

Dither it, and the ground shows through the holes, on any color of ground.

Open the game in Game-Maker and look at the frames.
`);

export const LOST = wrap(`
|OOPS!

That was not meant to happen.

Try again: this time, just walk and jump. Nothing here hurts.
`);
