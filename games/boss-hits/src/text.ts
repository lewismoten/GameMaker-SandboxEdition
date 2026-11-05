// Every word BIG BUG shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|BIG BUG

Some doors are guarded by something large, round and very cheerful.

A small explorer in a teal beanie has a pocketful of gold stars. Two short levels, and Big Bug sits in a narrow way in each.

Read the signs. It takes more than one star. Count them.

Then open this game in Game-Maker and change how many.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|ENTER         throw a star
|F2            lives, score

Walk toward Big Bug, stand a few steps off and press Enter. It takes five hits.

Walking into it only stings a little and does not count as a hit.

Coins add to your score. The door at the end of the level takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|BIG BUG  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|FIVE FOR FIVE!

Two levels, two bugs, ten stars that found their mark.

Big Bug is not one monster but five in a row. A star kills the one in front, and that one becomes the next. The fifth becomes a puff. In level 2 each picture has one light fewer, so the bug itself is the meter.

Open the game in Game-Maker and find the monsters on the Monsters tab. Each one has a Becomes setting. Add a sixth and the bug takes six hits.
`);

export const LOST = wrap(`
|OOPS!

Big Bug stings a little when you walk into it, and ten stings is too many.

Try again: stand back, face it and press Enter.
`);
