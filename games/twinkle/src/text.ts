// Every word TWINKLE, TWINKLE shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|TWINKLE, TWINKLE

Stars that twinkle by themselves.

A block can turn into another block a few ticks later, and a loop of four of them makes a star blink. But every star drawn with the same block blinks at the same moment.

So a sky that feels random is made of several kinds of star, each with its own times, laid so that no two neighbors blink together.

Read the signs. Then open this game in Game-Maker and make a sky of your own.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump

Walk along the meadow to the door at the end. Look up as you go: the stars are the lesson.

Level 1 shows a sky where every star blinks together, and then one where they do not. Level 2 is a night scene under the second kind of sky.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|TWINKLE, TWINKLE  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Music: the old French tune "Ah! vous dirai-je, maman" (1761), in the public domain, arranged for this game.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|GOOD NIGHT

Two levels, one sky.

The engine keeps one clock for each kind of block, not for each place on the map, so one star block blinks everywhere at once. That is the whole difficulty.

The fix is only more blocks: the same star in six places, each in a loop with its own times, laid so that no two stars near each other are the same. The sky repeats, and still nothing in it blinks in step.

Open the game in Game-Maker and change a star's time.
`);

export const LOST = wrap(`
|OOPS!

Everyone falls down sometimes.

Try again: read the signs, and take your time.
`);
