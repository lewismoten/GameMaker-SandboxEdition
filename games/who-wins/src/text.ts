// Every word WHO WINS? shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|WHO WINS?

When two monsters meet, the stronger one wins.

A small explorer in a red beanie crosses two short rooms. Two small gumdrops block a tunnel, and a big red one is stronger than they are.

Read the signs: they show each monster's power. Watch who wins, then throw a star and find out how strong it is.

Then open this game in Game-Maker and change a power.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|ENTER         throw a star
|F2            lives, score

Every monster has a power. When two meet, the one with less power is gone. The same power, and they pass through each other.

A star flies the way you last walked, and only so far. It is used up when it hits something, and fizzles gray.

Nothing here hurts you. Coins add to your score. The door at the end of the level takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|WHO WINS?  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|THE STRONG ONE WINS!

Two levels, and now you know who wins.

Every monster has one number, its power. When two touch, the one with less power is destroyed and the other carries on. Your star has power 140: it pops a mint pip (110) and a purple grump (130), but the big one (180) uses it up.

Open the game in Game-Maker and find the Power setting on the Monsters tab. Raise the pip's power above the star's and the star stops popping it.
`);

export const LOST = wrap(`
|OOPS!

Something stronger got in the way.

Try again: let the big one clear the tunnel, then step past it and throw your star.
`);
