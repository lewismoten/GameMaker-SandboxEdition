// Every word YOUR FIRST GAME shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|YOUR FIRST GAME

A small explorer in a gold beanie has three rooms to cross.

There is a wall to jump, coins to collect, a friendly gumdrop, some spikes and a locked door with a key hiding nearby.

It is a whole little game: a title, three levels and an ending.

Play it. Then open it in Game-Maker and make it yours.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder
|F2            lives, score

Coins add to your score. Walk into a gumdrop to pop it.

Spikes hurt a little: jump over them.

A key opens a locked door. It is used up.

The door at the end of a level takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|YOUR FIRST GAME  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea. This one shows them all.
`),
);

export const WON = wrap(`
|YOU DID IT!

That is a whole game, and you finished it.

Everything in it is made in Game-Maker, with nothing else: the blocks, the maps, the hero, the monsters, the signs, the sounds and the song.

Now make it yours. Open the game in Game-Maker (Edit a copy keeps this one safe) and read the manual's Make it yours page. Change a sign. Move a wall. Draw a new gumdrop. Add a level.

Play after each change.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. Spikes hurt a little, but they add up.

Try again: jump the spikes, and grab the key before the door.
`);
