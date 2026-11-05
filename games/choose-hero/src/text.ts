// Every word WHO DO YOU WANT TO BE? shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|WHO DO YOU WANT TO BE?

Two doors, two heroes, one road.

A small explorer in a blue beanie stands in a room with two doors. Behind each door is the same climb: two steps up, a plateau and an exit. The only difference is who goes through.

Fast Feet is quick on the ground. Big Hops is slow, but jumps six blocks and can reach the coins up high.

A door can lead anywhere, and each scene says which character file it loads. Pick a door. After the climb, a short road names no hero at all, and you are still the one you picked.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Walk into a door to choose a hero. Climb to the exit door, then walk the road to the end, taking the coins on the way.

Nothing can hurt you here. Play it with each hero and see how the same levels feel.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|WHO DO YOU WANT TO BE?  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL PICKED!

Three levels done. Now try the other door.

Each scene in the game lists the character file it loads. The room and the first climb use Fast Feet's file. The second climb is the same map, but its scene names Big Hops's file: slower feet, a bigger jump and a purple hoodie.

The road at the end lists no character file at all. When a scene leaves that slot blank, the game keeps whoever the last scene loaded, so you were Fast Feet or Big Hops all the way to the exit.

Open the game in Game-Maker, look at the Scenes tab and change which character file a scene loads.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. That is not meant to happen here.

Try again, and pick a door.
`);
