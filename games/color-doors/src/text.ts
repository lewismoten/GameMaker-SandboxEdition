// Every word COLOR DOORS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|COLOR DOORS

A hall with five doors, and one room behind all of them.

Some people see colors a little differently. Each door shows the same room the way one kind of eyes might see it: red and green close together, blue and yellow mixed up, or no color at all.

Walk in, look at the swatches, then come back for the next door.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|ARROWS        walk
|SPACE         jump

Walk into a door to go through it. Read the name under each swatch: it stays easy to read in every room.

The last door in the hall ends the game.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|COLOR DOORS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

The color-vision views use the Machado, Oliveira and Fernandes matrices (2009).

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|ALL FIVE DOORS

One map, five rooms. Each door's scene lists the same map and blocks and a different palette, and a palette is only 768 bytes.

These views are only a guess at how someone might see. Real eyes vary a lot, and no picture can show how it feels.

To make a game that works for everyone, do not use color alone. Colors That Work shows how, with shape and brightness.
`);

export const LOST = wrap(`
|OOPS!

That was not meant to happen.

Try again: this time, just walk and jump. Nothing here hurts.
`);
