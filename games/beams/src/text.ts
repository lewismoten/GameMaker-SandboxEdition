// Every word BEAMS AND FOG shows: the signs on the walls, the cards before each room, and the text pages (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

type Words = Record<string, [string, number, number]>;

/** The signs of each room: name → [words, blocks wide, blocks high]. */
export const SIGNS = {
  beams: {
    start: ['THREE LAMPS, THREE BEAMS.', 4, 2],
    solid: ['SOLID: THE BRICKS ARE GONE.', 4, 2],
    checker: ['CHECKER: BRICKS STAY.', 4, 2],
    soft: ['THREE CHECKERS: SOFT EDGE.', 4, 2],
    next: ['NEXT: FOG.', 4, 2],
  },
  fog: {
    start: ['FOG, TWO WAYS.', 4, 2],
    flat: ['SOLID FOG: NO TREES.', 4, 2],
    dither: ['CHECKER FOG: TREES STAY.', 4, 2],
    thick: ['75, 50, 25 PERCENT.', 4, 2],
    drift: ['A MONSTER OF HOLES.', 4, 2],
    next: ['NEXT: GLOWS.', 4, 2],
  },
  glow: {
    start: ['LANTERNS THAT MOVE.', 4, 2],
    solid: ['SOLID GLOW HIDES BRICKS.', 4, 2],
    checker: ['CHECKER GLOW: BRICKS SHOW.', 4, 2],
    soft: ['RINGS: 75, 50, 25.', 4, 2],
    next: ['THAT IS IT.', 4, 2],
  },
} satisfies Record<string, Words>;

/** The card before each room: its name and a line. */
export const CARDS = {
  beams: ['The Beams', 'A beam of light, painted in dots.'],
  fog: ['The Fog', 'Far things fade. Dots do it.'],
  glow: ['The Glow', 'Lights that move are monsters.'],
} as const;

export const STORY = wrap(`
|BEAMS AND FOG

Lian finds a hall lit by three lamps, and a valley where the hills fade into the distance.

A game has no see-through colors, so light and fog are not drawn as light and fog. They are dots. Paint one pixel in two, and whatever is behind shows through the gaps. Your eye does the rest.

Walk the hall. Walk the valley. Follow the lanterns.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|ARROWS        walk
|SPACE         jump

Walk into a door to go to the next room. Read the signs.

Nothing here can hurt Lian.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|BEAMS AND FOG  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|THAT IS THE LOT

Light and fog are only dots. A beam, a haze or a glow is the color painted on every other pixel (or every fourth), so what is behind it shows.

A background block has no clear pixels, so a beam over a wall is a lit twin of the wall block. A monster has clear pixels, so a glow or a puff of fog that moves is a monster.

Open the game in Game-Maker and look at the frames.
`);

export const LOST = wrap(`
|OOPS!

That was not meant to happen.

Try again: this time, just walk and jump. Nothing here hurts.
`);
