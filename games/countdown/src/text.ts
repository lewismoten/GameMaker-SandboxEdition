// Every word COUNTDOWN shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|COUNTDOWN

Some doors wait for a number.

A small explorer in a gold beanie has two short rooms, and a number in each that counts down. In the first the number is 9 and a door waits for it to reach 0. In the second it is 99, and the floor has its own idea about 00.

Watch the numbers. Wait, then go.

Then open this game in Game-Maker and count down from anything you like.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

In level 1 the big number counts down. When it shows 0 the door under it opens. Walk in.

In level 2 two small digits count down from 99. At 00 the floor opens and you drop to a soft mat, which takes you on.

Nothing here hurts you. Coins add to your score.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|COUNTDOWN  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.
Music: OpenAI Codex.

Tiled signs: OpenAI Codex.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|ZERO!

Two rooms, two counts.

Game-Maker has no number readout. A digit is a row of blocks, each one drawn as a number and set to turn into the next after 18 ticks, which is about a second. The door and the floor are blocks set to change at the moment the count reaches zero.

Open the game in Game-Maker, pick a digit block in the Blocks tab and look at its Next block and its time. Change a number, then play your change.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. Nothing in this game hurts, so this one is hard to do!

Try again: wait for the number to reach zero.
`);
