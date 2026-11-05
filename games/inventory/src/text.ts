// Every word PICK IT UP shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|PICK IT UP

Some things are worth carrying.

A small explorer in a green beanie has two short levels to cross. In the first, a wall is too high to jump, and two crates lie on the ground. In the second, a flame and a star wait on their stands.

Read the signs. A pack holds ten things. What you carry changes what you can do.

Then open this game in Game-Maker and make a thing of your own to pick up.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|P             pick up
|D             put down
|ENTER         throw
|F2            your pack

P takes the thing you are standing in. D shows your pack: arrows choose, Enter puts it down where you stand, Esc keeps it.

Enter throws a flame if you carry one, else a star, else it shrugs. Put the flame down to throw the star.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|PICK IT UP  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL PICKED!

Two levels, and a pack did the work.

A thing you can pick up is a block marked as an object. P puts it in the pack, D puts it down as the same block, and a sequence can be tied to a block, so it works only while the pack holds it. Enter starts the first tied sequence whose block you carry: the flame, then the star, then the shrug.

Open the game in Game-Maker, find the three sequences on the Characters tab and change which block each one needs.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. That is not meant to happen here.

Try again: walk to a crate and press P.
`);
