// Every word ROLL THE DICE shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|BLOCK BRAINS

Blocks that count to three.

A small explorer in a teal beanie meets gates that open one after another, each when its lamp lights.

Watch the lamps. Walk through each gate in its turn.

Then open this game in Game-Maker and change how long a turn lasts.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

A gate is open while its lamp is lit and shut the rest of the time. Walk through when it is open.

Wait in the space between two gates until the next one opens. A gate can't hurt you: if it shuts while you are in it, just walk on.

Coins add to your score.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|BLOCK BRAINS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|THROUGH!

Every gate in its turn.

A brain here is a ring of blocks. Each block turns into the next one after a number of ticks (18.2 a second), and the last turns back into the first. One block in the ring is open and the others are shut.

The map starts each gate at a different place in its ring, so gate 1 is open first, gate 2 second and gate 3 third. A lamp has a ring of the same length, so its lit turn is its gate's open turn.

A block cannot see Kit. It only follows its own timer, and every cell of a kind changes on the same tick. That is why both sun gates open together.

Open the game in Game-Maker, pick a gate block in the Blocks tab and look at its Next block and its time. Change a number, then play your change.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. Nothing in this game can cost a life, so this one is hard to do!

Try again: watch the lamps, then walk through in order.
`);
