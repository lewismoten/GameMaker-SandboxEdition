// Every word SLOW COMPUTERS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|SLOW COMPUTERS

Games in 1994 ran on PCs that were much slower than yours. A game that was smooth on one machine could stutter on another.

A small explorer has three short rooms that show what made a game slow down: a long sound, a crowd of monsters and a sky full of moving blocks.

If your player has a speed setting, turn it to 286 and try each room. Then try the faster ones.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Level 1 has two pads. Step on each one and listen.

Level 2 has a crowd of monsters. They are all friendly.

Level 3 has a sky that moves.

Nothing here can hurt you.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|SLOW COMPUTERS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, sounds and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|ALL DONE!

Three rooms, and what slows a game down on an old PC.

A sound is read from the disk whole before the game goes on, so a long one freezes the game while it loads. Keep sounds short.

Every monster on the screen takes time to move and draw. Keep a screen to a few.

Blocks that move are drawn again each time they change. Keep them to where they count.

The music has its own timer, so it keeps time even when the game freezes.
`);

export const LOST = wrap(`
|OH NO!

Out of hit points. Nothing in this game can hurt you, so this should not be able to happen!

Try again.
`);
