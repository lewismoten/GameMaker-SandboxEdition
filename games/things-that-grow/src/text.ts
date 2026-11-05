// Every word SEEDS AND NESTS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|SEEDS AND NESTS

Some blocks do not sit still. They hatch things.

A small explorer in a teal beanie crosses two short rooms. A nest on a shelf hatches a bird every few seconds in the first. In the second, a nest on the path can be stopped with a touch.

Read the signs. Watch what comes out.

Then open this game in Game-Maker and change what hatches, and how often.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

A nest is a block that gives birth to a monster again and again. Birds fly about, then go when their lifetime is up.

Walking over a nest on the path makes it an empty nest, and it stops. The nest on the shelf is out of reach and goes on.

Nothing here hurts you. Coins add to your score. The door at the end of the level takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|SEEDS AND NESTS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL WATCHED!

Two levels, and now you know how a block hatches a monster.

A block can have a monster to give birth to and a birth time, counted in ticks (about 18 a second). Every square of that block gives birth at the same moment, again and again, as long as the hero is near. A touch can turn a nest into a block that does not hatch.

Open the game in Game-Maker and find the Birth settings on the Blocks tab. Pick a different monster, or a longer time.
`);

export const LOST = wrap(`
|OOPS!

The birds are waiting.

Try again: watch the nest on the shelf, then step on the nest on the path.
`);
