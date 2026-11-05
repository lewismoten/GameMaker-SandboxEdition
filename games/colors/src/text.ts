// Every word COLORS THAT WORK shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|COLORS THAT WORK

Some players see colors differently. Red and green can look alike to them.

A small explorer in a pink beanie crosses two short levels. The first one tells things apart by color alone. If the plates look the same to you, that is the point of that level, and a sting only costs a little. The second one tells them apart by shape and brightness, so it works in any color.

Each level card has a second picture that shows how that level can look to some players.

Then open this game in Game-Maker and look at the plates.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            your numbers

Plates and spikes in this game can sting a little. A sting takes 5 hit points, once.

Read the signs. The level cards show how the level can look to a player who sees red and green alike.

Nothing here can take a life.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|COLORS THAT WORK  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Color-vision pictures use the matrices of Machado, Oliveira and Fernandes (2009).

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|COLORS THAT WORK

Two levels, and now you know a trick that helps every player.

Game-Maker can't check your colors for you, and it can't switch palettes for a player. You choose each block's colors, so the checking is yours: look at your level with the color taken out. If you can still tell the danger from the safe path, so can everyone.

Give meaning a shape or a brightness as well as a color. Spikes point. A safe path is light and striped.

Open the game in Game-Maker and look at the plates on the Blocks tab. Change one and play it.
`);

export const LOST = wrap(`
|OOPS!

Out of lives.

Try again: the red plates sting, and so do the spikes.
`);
