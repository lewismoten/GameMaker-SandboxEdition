// Every word WATCH YOUR STEP shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|WATCH YOUR STEP

Not every patch of ground is friendly.

A small explorer in a teal beanie has three short levels to cross. A spike stings a little. A pool in the ground is worse: fall in and the room starts again.

Read the signs. Look down before you leap, and look for the safe way.

Then open this game in Game-Maker and change a hazard.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

A spike takes a few hit points, and only once. It takes several to lose a life.

A pool takes a whole life. You start the room again where you came in, with all your hit points back.

Planks are safe to stand on, and you can jump up through them.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|WATCH YOUR STEP  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.

Music re-scored with OpenAI Codex from the original tune and B section by Claude.
`),
);

export const WON = wrap(`
|WELL STEPPED!

Three levels, and you know the ground.

A hazard is a block that takes something away when you touch it: hit points for a spike, a whole life for a pool. Let it change when touched and it hurts once. Put it out of the way and there is a safe path.

Open the game in Game-Maker and find them on the Blocks tab. Change how much a block hurts, then play your change.
`);

export const LOST = wrap(`
|OUCH!

Out of lives. The ground here is not all friendly.

Try again: jump over the spikes, mind the pool, and use the planks.
`);
