// Every word FOLLOW ME shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|FOLLOW ME

Some friends tag along.

A small explorer in a red beanie crosses two short rooms with Puff, a little winged pup, who flies after them.

Read the signs. Run ahead, stop, and watch what Puff does. In the second room, see what a wall does to it.

Then open this game in Game-Maker and change how fast Puff flies.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Puff flies straight toward you, a little slower than you walk. It does not hurt, and nothing in this game does.

Puff plans no way around anything. If a wall is between you, it stops at the wall.

Coins add to your score. The door at the end of the level takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|FOLLOW ME  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.

Music re-scored with OpenAI Codex from the original tune and B section by Claude.
`),
);

export const WON = wrap(`
|GOOD DOG!

Two levels, and now you know how a friend follows.

A monster can have its Movement set to chase the character at a speed from 1 to 63. Every tick it aims at where the hero is and moves that way in a straight line. It does not plan a route, so a solid block between you and it simply stops it.

Open the game in Game-Maker and find the Movement setting on the Monsters tab: Chases the character, with a Speed. Make Puff faster than Lena, or pick Runs from the character.
`);

export const LOST = wrap(`
|OOPS!

That was not meant to happen.

Try again: this time, just walk. Puff is friendly and will catch up.
`);
