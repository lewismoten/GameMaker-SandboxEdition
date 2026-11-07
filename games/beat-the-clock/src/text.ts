// Every word BEAT THE CLOCK shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|BEAT THE CLOCK

Some doors do not wait for you.

A small explorer in a teal beanie has two short levels, and a clock in each. In the first a bar of light runs out, and then the gate shuts. In the second the clock starts over by itself.

Watch the bar. Run, or wait.

Then open this game in Game-Maker and set a clock of your own.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

The bar is your time. A green piece goes thin and orange, then dark. When the last is dark, the gate shuts.

Too late? Walk into the teal clock door to start the level and its clock again.

In level 2 the clock starts over by itself: wait, then go.

Nothing here hurts you. Coins add to your score. The door at the end takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|BEAT THE CLOCK  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.
Music: OpenAI Codex.

Unused monster templates removed by OpenAI Codex (GPT-6), directed by Lewis Moten.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|IN TIME!

Two levels, two clocks.

Game-Maker has one kind of clock: a block that turns into another block after a number of ticks, 18 and a bit a second. The bar's pieces, the gate and the lamp are all blocks like that, each set to change at its own moment. A clock that starts over is blocks that change back.

Open the game in Game-Maker, pick a block in the Blocks tab and look at its Next block and its time. Change a number, then play your change.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. Nothing in this game hurts, so this one is hard to do!

Try again: watch the bar, and reach the gate before it is dark.
`);
