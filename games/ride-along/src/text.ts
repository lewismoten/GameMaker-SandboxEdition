// Every word RIDE ALONG shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';
import { heroName } from './heroName';

const HERO = heroName();

export const STORY = wrap(`
|RIDE ALONG

${HERO} finds a little rocket parked at the end of the path.

Climb in, and the rocket takes over: it rises all by itself. Steer it past the rocks, catch the stars and dock at the top.

Then a canoe on a river that flows the same way. Open this game in Game-Maker to see how it is made.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk, steer
|SPACE         jump, paddle
|UP, DOWN      faster, slower

On foot, walk into the rocket.
Once you are in, you keep moving: you steer, you do not drive.

A rock or a log is solid. Steer round it and you are away again.

Stars and lilies are 10 points. Nothing here can hurt you.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|RIDE ALONG  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|ALL ABOARD, ALL DOCKED!

A vehicle is a character file of its own. A level's scene names it, and touching a block links to that scene.

To keep a vehicle moving, give every frame of its idle sequence a little y. Each key's sequence carries the same push, so steering never stops it.
`);

export const LOST = wrap(`
|OOPS!

Read the signs, then try again.
`);
