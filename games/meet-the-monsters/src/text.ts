// Every word MEET THE MONSTERS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|MEET THE MONSTERS

Some monsters are only out for a walk.

A small explorer in a teal beanie has two short levels to cross. A purple gumdrop waddles back and forth. A snail creeps along. They are not mean, but they do hurt a little if you bump them.

Read the signs. Jump over what hurts, and drop onto what pops.

Then open this game in Game-Maker and change a monster.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Jump over a monster that hurts. Each touch takes some hit points. With none left you lose a life, and the level starts again.

A mint green gumdrop is harmless. Touch one and it pops into a star.

Coins add to your score. The door at the end of the level takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|MEET THE MONSTERS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|HELLO, MONSTERS!

Two levels, five monsters, and every one said hi.

A monster is a picture, a path and a power. Walk it back and forth, make it hurt a little, or make it pop into a star when you touch it.

Open the game in Game-Maker and find them on the Monsters tab. Change a path, a speed or what a monster becomes, then play your change.
`);

export const LOST = wrap(`
|OOPS!

Monsters are only in the way if you walk straight into them.

Try again: jump over the ones that hurt, and drop onto the mint green ones.
`);
