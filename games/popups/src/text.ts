// Every word SCORE POPUPS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|SCORE POPUPS

When you score, a number rises and fades. It feels good, and it tells you what you got.

A small explorer in a pink beanie crosses two short rooms full of coins that are really monsters. Walk into one and it becomes a number.

Read the signs. Then open this game in Game-Maker and make your own.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Walk into a spinning prize. It pays its points, then becomes a number that blinks, floats up and is gone.

The number is only a picture of digits, and a number never adds to your score; the prize did that.

Nothing here hurts you. The door at the end of a level takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|SCORE POPUPS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|NICE ONE!

Two levels, and now you know how a number rises.

A prize is a monster whose power is under 100, so touching it destroys it. Its picture block pays the score. Then it becomes another monster in the same place: a picture of digits that blinks, rises along a path and is gone when the path ends.

Game-Maker cannot print a number. Every number is a picture you draw, so 100, 200 and 500 are three pictures. Open the game and draw a 1000.
`);

export const LOST = wrap(`
|OOPS!

The number got away.

Try again: walk into the prizes and watch the numbers rise.
`);
