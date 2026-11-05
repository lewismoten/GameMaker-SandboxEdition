// Every word MANY WEAPONS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|MANY WEAPONS

Which weapon does Enter throw?

A small explorer in a red beanie has two short levels to cross, and a pouch or two to find. A pouch of stars, a pouch of flames, and a frosty grump in a narrow way.

Read the signs. Enter is always the same key. What it throws depends on what you are carrying.

Then open this game in Game-Maker and add a weapon of your own.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|ENTER         throw
|F2            lives, score

Touch a pouch to fill it. Enter throws a flame if you have one, then a star, and shrugs when you have neither.

A mint green gumdrop pops with either. A frosty grump needs a flame.

Nothing here hurts you. A pouch fills up again a moment after you take it.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|MANY WEAPONS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL THROWN!

Two levels, and one key did all the work.

A weapon is a sequence in Lena's character file. Each one counts its own uses, and Enter starts the first of them that has a use left. A flame comes first in the list, then a star, then a shrug that is never used up. A pouch only adds to a count.

Open the game in Game-Maker and find the three sequences on the Characters tab. Move the star above the flame and see what Enter throws.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. That is not meant to happen here.

Try again: touch a pouch, then press Enter.
`);
