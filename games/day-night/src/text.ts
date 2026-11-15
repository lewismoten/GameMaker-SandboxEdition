// Every word DAY AND NIGHT shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|DAY AND NIGHT

The same place looks different when the light changes.

A small explorer in a red beanie has two short levels. In the first, a house with a door: go in, and you are back in the very same room, but it is night. In the second, a street with two gates, and the sun sets as you walk.

Watch the sky, the windows and the stars.

Then open this game in Game-Maker and paint a palette of your own.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

In level 1, read the signs and walk into the house's door. You come out in the same room at night, and the door then takes you on.

In level 2, walk through each gate. The day turns to dusk, then to night.

Nothing here hurts you. Coins add to your score.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|DAY AND NIGHT  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Tiled signs: OpenAI Codex.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.

Music re-scored with OpenAI Codex from the original tune and B section by Claude.
`),
);

export const WON = wrap(`
|GOOD NIGHT!

Two levels, three palettes.

Game-Maker keeps colors in a palette file, not in the pictures. Each scene lists a palette, a map and a block file. Here the day scene and the night scene list the very same map and blocks, and different palette files, so the same picture shows new colors. A scene always fades in from black when it starts, which is the fade between.

Open the game in Game-Maker, look at the scenes of level 2, and swap a palette file in one of them.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. Nothing in this game hurts, so this one is hard to do!

Try again: walk through the door, or through the gates.
`);
