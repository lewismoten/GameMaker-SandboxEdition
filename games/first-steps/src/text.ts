// Every word FIRST STEPS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|FIRST STEPS

Every game starts with a first step.

A small explorer in a teal beanie has two short walks to take. Read the signs along the way: they say how walking, jumping, gravity and ladders work.

Find the door at the end of each level, and walk into it.

Then open this game in Game-Maker and change a sign or a block. It is made to be taken apart.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder

Hold SPACE to rise, let go, then steer with LEFT and RIGHT while you are in the air.

Gravity pulls you down. Walk off a ledge and you fall; nothing hurts.

Coins add to your score. The door at the end of the level takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|FIRST STEPS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.

Music re-scored with OpenAI Codex from the original tune and B section by Claude.
`),
);

export const WON = wrap(`
|YOU DID IT!

Two levels, two doors, and not one wrong turn.

You have walked, jumped, fallen and climbed. That is most of what a platform game is made of.

Open the game in Game-Maker and find the signs in the map. Change one, then play your change.
`);

export const LOST = wrap(`
|OOPS!

Everyone falls down sometimes.

Try again: read the signs, and take your time.
`);
