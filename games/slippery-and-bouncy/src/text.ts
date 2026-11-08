// Every word SLIPPERY AND BOUNCY shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|SLIPPERY AND BOUNCY

Some blocks do more than stand there. They pull.

A small explorer in a teal beanie has three short rooms to cross. Ice drags them along and they slide on. A belt carries them. A spring pad bounces them up, and a fan blows them through a shelf.

Read the signs, and keep an eye on the spikes.

Then open this game in Game-Maker and change a pull.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            your numbers

Ice and belts pull you to the right while you stand in them. Wind pulls you up. A ledge lets you jump up through it, then holds you.

A spike takes 10 hit points, and only once. You start with 50.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|SLIPPERY AND BOUNCY  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.

Music re-scored with OpenAI Codex from the original tune and B section by Claude.
`),
);

export const WON = wrap(`
|WHEE!

Three rooms, and now you know how a pull works.

Every block has a gravity setting: which ways it pulls, and the hero is pulled by the block their feet are in. Down is ordinary gravity. Down and right is ice or a belt. Up is wind. A ledge is a block you can only stand on from above.

Open the game in Game-Maker and find them on the Blocks tab. Make the wind pull to the left, then play it.
`);

export const LOST = wrap(`
|OUCH!

Out of lives.

Try again: ice and belts carry you, so jump before the spikes, and keep an eye on F2.

`);
