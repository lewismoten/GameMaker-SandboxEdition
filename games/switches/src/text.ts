// Every word SWITCHES shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|SWITCHES

A river in the way, and a bridge that is not there yet.

A small explorer in a teal beanie has two short levels to cross. A lever stands on the path. Walk into it and it flips, and dotted planks over the water turn solid as you step on them.

Read the signs. A lever fills a counter, and the planks spend it.

Then open this game in Game-Maker and change what a lever gives.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder
|F2            lives, score

Walk into a lever to pull it.

A dotted plank is a plank that is not there yet. Step onto one after the right lever and it turns solid. Step onto one without it and you fall in the pool, which costs a life. You start the room again where you came in.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|SWITCHES  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.

Music re-scored with OpenAI Codex from the original tune and B section by Claude.
`),
);

export const WON = wrap(`
|WELL SWITCHED!

Two levels, and you know what a lever is.

A lever is a block that adds to a counter when touched. A dotted plank is a block that takes one off the same counter and turns into a real plank. Nothing joins them but the counter, which is why a red lever cannot build a blue bridge.

Open the game in Game-Maker and find them on the Blocks tab. Change how much a lever adds, or how many planks stand over the water, then play your change.
`);

export const LOST = wrap(`
|SPLASH!

Out of lives. The planks were not ready.

Try again: pull the lever first, and make sure it is the right color.
`);
