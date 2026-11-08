// Every word THROW IT shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|THROW IT

Some things are best met from a little way off.

A small explorer in a purple beanie has a pocketful of gold stars. Two short levels, and a gumdrop in the way of each.

Read the signs. Press Enter, and a star flies. Face the right way, stand close enough, and the way opens.

Then open this game in Game-Maker and change the star.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|ENTER         throw a star
|F2            lives, score

A star flies the way you last walked, and only so far. Walk toward what you want to pop, stand close, and press Enter.

A mint green gumdrop pops with a star. A grump in a narrow way will not move until you pop it.

Nothing here hurts you. Coins add to your score. The door at the end of the level takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|THROW IT  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.

Music re-scored with OpenAI Codex from the original tune and B section by Claude.
`),
);

export const WON = wrap(`
|NICE THROWING!

Two levels, three gumdrops, and every star found its mark.

A star is a monster that Mia gives birth to. One frame of their Throw sequence does it, and the star flies off the way they last walked. A star is stronger than a gumdrop, so when they touch, the gumdrop pops.

Open the game in Game-Maker and find the Throw sequence on the Characters tab. Change how far a star flies, how fast, or which key throws it, then play your change.
`);

export const LOST = wrap(`
|OOPS!

A star flies the way you last walked, and only so far.

Try again: face what you want to pop, stand close, and press Enter.
`);
