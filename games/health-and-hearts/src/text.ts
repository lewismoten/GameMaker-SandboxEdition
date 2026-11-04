// Every word HEALTH AND HEARTS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|HEALTH AND HEARTS

Hit points are how much a hit Kit can take. Lives are how many tries he gets.

A small explorer in a teal beanie has three short levels to cross. A spike takes ten hit points. A heart gives them back. At zero, a life is gone and the room starts again.

Read the signs, and press F2 to see your numbers.

Then open this game in Game-Maker and change a hazard.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            your numbers

A spike takes 10 hit points, and only once. A heart gives 10 back. You start with 30.

At zero hit points you lose a life, and the room starts again where you came in with your 30 back. A face adds a life.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|HEALTH AND HEARTS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL MENDED!

Three levels, and now you know the numbers.

Hit points are one counter and lives are another. A spike block takes hit points when you touch it, and a heart block gives them back. At zero hit points the engine takes a life and starts the room over. A face block adds a life.

Open the game in Game-Maker and find them on the Blocks tab. Change how much a heart heals, then play your change.
`);

export const LOST = wrap(`
|OUCH!

Out of lives.

Try again: mind the spikes, take the hearts on the ledge first, and keep an eye on F2.

`);
