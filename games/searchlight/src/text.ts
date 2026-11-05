// Every word DON'T GET SEEN shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|DON'T GET SEEN

Some halls are watched by a friendly lamp that hangs from a rail and walks back and forth, all day.

A small explorer in a teal beanie has two halls to cross. The lamp is not looking for anyone. It only walks its path, and anyone under it is seen.

Dig in, let it pass, then go.

Then open this game in Game-Maker and change how far it walks.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Walk to a trench, step in, and wait until the light has passed over you. Then climb out with Space and go on.

Touching the light costs hit points. It is not a wall: you walk through it.

Coins add to your score. The door at the end of the level takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|DON'T GET SEEN  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|ALL CLEAR

Two halls, three lights, and nobody was seen.

A light is not one monster but five in a column: a lamp and four pieces of cone, each walking the same path at the same speed. A trench is just a place that path never goes. The light cannot look, turn or chase.

Open the game in Game-Maker and find the monsters on the Monsters tab. Give them a longer path and the trench is not enough.
`);

export const LOST = wrap(`
|SPOTTED!

The light takes a few hit points for every moment you stand in it, and they add up.

Try again: wait in a trench until it has gone over, then run.
`);
