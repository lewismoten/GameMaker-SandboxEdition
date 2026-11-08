// Every word DROP DOWN shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|DROP DOWN

Some friends sit very still.

A small explorer in a red beanie crosses two short tunnels. In each one a round little friend sits on a crate.

Read the signs. Hit a crate and see what its friend does.

Then open this game in Game-Maker and change how fast a friend falls.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|ENTER         hit
|F2            lives, score

Stand beside a crate and press Enter to hit it. One hit cracks it and a second breaks it. Walking into it does nothing. Plop and Pip sit on crates and hurt nobody. Nothing in this game does.

Plop is solid: you cannot walk through it. Pip is soft: you can.

Coins add to your score. The door at the end of the level takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|DROP DOWN  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL DROPPED!

Two tunnels, and now you know how a friend falls.

Monsters have no gravity in Game-Maker: only Lena does. A monster goes where its Movement sends it. Plop's Movement is a path of one step, one block down, walked again and again. A solid block under it stops every step, so it sits still on a crate. When your second hit turns the crate to rubble, the next step is free and it drops.

Open the game in Game-Maker and find Plop on the Monsters tab: Follows its path, one corner a block below the start, and Stopped by solid blocks. Change the corner's speed to change how fast it falls.
`);

export const LOST = wrap(`
|OOPS!

That was not meant to happen.

Try again: hit a crate with Enter and watch what is on top of it.
`);
