// Every word KIT DUCKS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|KIT DUCKS

What does a key do while you hold it?

A small explorer in a teal beanie has two short levels to cross. In the first, one key hops and another keeps lifting him for as long as it is held. In the second, a key dashes him to the right, once for each press.

Read the signs. Every key in Game-Maker starts a sequence of frames, and two settings say what happens when you keep it down: run again, or wait for the next press.

Then open this game in Game-Maker and change one.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         hop, once
|UP            lift (held)
|ENTER         dash right
|F2            lives, score

Walk to the door in each level. Take the coins on the way.

Nothing can hurt you here. Try each key held down, and then tapped, and see the difference.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|KIT DUCKS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL MOVED!

Two levels, and now you know what a held key can do.

Each sequence in the character file has a setting: one run for each key press, or run again while the key is down. Space hops once. Up keeps lifting. Enter dashes once, and a second dash needs a second press.

Open the game in Game-Maker and find them on the Character tab. Turn off the setting on Space, then hold it.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. That is not meant to happen here.

Try again: tap Space, hold Up and press Enter, and see what each does.
`);
