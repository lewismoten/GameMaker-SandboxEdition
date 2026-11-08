// Every word GRAVITY ON, GRAVITY OFF shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|GRAVITY ON, GRAVITY OFF

The same little place, twice.

First you see it from the side, and gravity pulls Rima down. They jump over the wall and falls off the ledge.

Then you see it from above. Nothing pulls them, so they walk any way they like, and goes around the wall instead.

Read the signs. Then open this game in Game-Maker and change one setting.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      walk (2nd place)

In the first place gravity pulls you down. Jump the wall, and walk off the ledge to see.

In the second there is no gravity. The arrows walk you every way, and Space does nothing.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|GRAVITY ON, GRAVITY OFF  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.

Music re-scored with OpenAI Codex from the original tune and B section by Claude.
`),
);

export const WON = wrap(`
|BOTH WAYS!

Two levels, one place, one setting.

Gravity belongs to a block. Where the block you stand on pulls down, you fall and a jump comes back. Where it pulls nowhere, you stay put, and the arrow keys can walk you up and down.

Open the game in Game-Maker and find Gravity on the Blocks tab. Change it on a block, then play your change.
`);

export const LOST = wrap(`
|BACK TO THE START

Nothing hurts in this game, so this page is only here for the menu.

Press ESC to go back.
`);
