// Every word BEAMS AND FOG shows: the signs on the walls, the cards before each room, and the text pages (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

/** The complete sign vocabulary, grouped by room; layout is in levels.ts. */
export const SIGNS = {
  beams: {
    start: 'GOAL: SEE HOW EACH BEAM IS MADE.',
    solid: 'SOLID: THE BRICKS ARE GONE.',
    checker: 'CHECKER: BRICKS STAY.',
    soft: 'THREE CHECKERS: SOFT EDGE.',
    next: 'NEXT: FOG.',
  },
  fog: {
    start: 'FOG, TWO WAYS.',
    flat: 'SOLID FOG: NO TREES.',
    dither: 'CHECKER FOG: TREES STAY.',
    thick: 'FAR 75, MID 50, NEAR 25.',
    drift: 'MOVING FOG IS A MONSTER.',
    next: 'NEXT: GLOWS.',
  },
  glow: {
    start: 'LANTERNS THAT MOVE.',
    solid: 'SOLID GLOW HIDES BRICKS.',
    checker: 'CHECKER GLOW: BRICKS SHOW.',
    soft: 'RINGS: 75, 50, 25.',
    next: 'THAT IS IT.',
  },
} satisfies Record<string, Record<string, string>>;

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

Music and tiled signs by OpenAI Codex; original tune and B section by Claude.
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
