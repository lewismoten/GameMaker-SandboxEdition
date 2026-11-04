// Every word POWER UP shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|POWER UP

Some places are too high, or too wide, for an ordinary hero.

A small explorer in a teal beanie has two short levels. In the first the exit is up on a ledge. In the second a canyon cuts the way.

Look around: there is a power-up for each.

Then open this game in Game-Maker and make a power of your own.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

A star gives you 4 high jumps. Jump as usual and go higher.

Sneakers make you walk, run and leap twice as far, for 50 strides.

A power runs out by how many times you use it. Nothing counts seconds.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|POWER UP  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|POWERED UP!

Two levels, two powers.

A power-up is a block that adds to a counter. Touch it and a counter on one of the hero's moves goes up: a high jump, or a faster walk. Each time you use the move, it counts down by one. At zero the ordinary move comes back.

Open the game in Game-Maker and find them in the Blocks tab and the Character tab. Change how much a star gives, then play your change.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. Nothing in this game hurts, so this one is hard to do!

Try again: find a star, then the sneakers.
`);
