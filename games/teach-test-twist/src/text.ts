// Every word TEACH, TEST, TWIST shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|TEACH, TEST, TWIST

A small explorer in a red beanie has three tiny rooms to cross.

Each room has the same thing in it: a gap in the ground.

In the first room the gap is taught. In the second it is tested. In the third it is twisted into something new.

Play it. Then use the same three steps in your own levels.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

A gap is a hole in the ground, two blocks deep. Jump over it, or drop in and walk out.

Spikes hurt a little: jump over them.

A key opens a locked door. It is used up.

The door at the end of a level takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|TEACH, TEST, TWIST  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea. This one shows how a level is built: teach it, test it, twist it.
`),
);

export const WON = wrap(`
|YOU DID IT!

Three tiny levels, one idea.

The first taught the gap where nothing could hurt you. The second tested it with spikes. The third twisted it: the gap held the key.

Try it on your own idea. Pick one thing, a spring, a switch, a monster. Make a level that teaches it safely, one that tests it, and one that uses it in a way nobody expects.

Play after each change.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. Spikes hurt a little, but they add up.

Try again: run and jump the gap, and drop into the safe one for the key.
`);
