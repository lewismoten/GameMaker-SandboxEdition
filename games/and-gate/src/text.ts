// Every word BOTH TOGETHER shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|BOTH TOGETHER

Two switches. One lamp.

A small explorer in a teal beanie finds a wire in the sky. A spark runs along it every few seconds, and at the end of the wire waits a lamp.

Read the signs. Bump the dials on. See what happens when only one is.

Then open this game in Game-Maker and look at the powers.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb
|F2            lives, score

Jump under a dial to turn it on. A spark runs the wire. If a dial is off, the spark stops there.

When every dial is on, the spark lights the lamp. Touch the light that slides down. The gate takes it.

Nothing in this game hurts.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|BOTH TOGETHER  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|LIGHTS ON!

Two levels, and now you know how monsters make an AND.

When two monsters meet, the stronger one wins and equal ones pass through each other. A dial that is off is stronger than the spark, so the spark stops. A dial that is on is equal to the spark, so it passes. Only a spark that passes every dial reaches the lamp.

Game-Maker has no AND block. It is only powers.

Open the game in Game-Maker and find the Power on the Monsters tab. Make a dial that is on stronger than the spark and see the wire go dead.
`);

export const LOST = wrap(`
|OOPS!

That was not meant to happen.

Try again: this time, just walk and jump. Nothing here hurts.
`);
