// Every word TRY AGAIN shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|TRY AGAIN

Some mistakes need a way out.

A small explorer in a purple beanie has two short levels. In the first, a pit is too deep to climb out of, and a post at the bottom starts the level over. In the second, three pits each have a way back built in.

A player who can fall in should never be stuck. Give them a way out, or a place to start over.

Then open this game in Game-Maker and look at the post.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder
|F2            lives, score

Jump the pits, or fall in on purpose for the coins at the bottom. Touch the post to start a level over. Walk into the door at the end of each level.

Nothing here can hurt you.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|TRY AGAIN  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.

Music re-scored with OpenAI Codex from the original tune and B section by Claude.

Plank landing revised and checked with OpenAI Codex (GPT-6).
`),
);

export const WON = wrap(`
|WELL DONE!

Two levels, and nobody was ever stuck.

The post is a block like any other. What makes it work is a link in the game's scene list: it starts at the post's square and leads back to the same scene, with the hero put back at the way in. The level is loaded again, so coins and broken blocks come back. Your score stays.

A ladder, steps of planks or steps of solid blocks give a way back out of a pit.

Open the game in Game-Maker and find the link in the Integrator. Put a post in a level of your own.
`);

export const LOST = wrap(`
|OOPS!

Out of lives. That is not meant to happen here.

Try again: it is a good thing to be able to.
`);
