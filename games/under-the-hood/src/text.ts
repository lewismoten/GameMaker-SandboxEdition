// Every word UNDER THE HOOD shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|UNDER THE HOOD

The player that runs a Game-Maker game is a program, and a program is a long row of bytes.

A small explorer in a blue beanie walks through that row. Some bytes are code. Some are words the menu shows, like Play.

Three short levels: what an EXE is, why a new word must be the same size as the old one, and what to ask before you change anything.

Nothing in these levels changes a real player. They only show the ideas.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder

Touch a bright byte to pick it up. A gate in a wall opens when you carry what it wants.

Walk into a word plate to try it in its slot.

Coins add to your score. Nothing here can hurt you.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|UNDER THE HOOD  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Opus 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|ALL THE WAY THROUGH!

Three levels, three ideas.

A program is bytes, and every byte has an offset. A word lives in a slot of a fixed size: a shorter word is padded with spaces, a longer one spills into the next word.

Copy the program first, change only your own copy, and leave the credits alone.
`);

export const LOST = wrap(`
|OOPS!

Read the signs, then try again.
`);
