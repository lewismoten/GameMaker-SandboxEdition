// Every word HERE TODAY shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|HERE TODAY

Some things do not last. Others turn into something else.

A small explorer in a teal beanie crosses two short rooms. A bubble blocks a tunnel in the first, and a sleepy blue gumdrop in the second.

Read the signs. Wait, and watch what happens.

Then open this game in Game-Maker and change how long they last.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Some monsters have a lifetime. When the time is up, they are gone, or they become another monster.

Their clock starts when the level does, so there is no need to hurry, and no way to speed it up. Just wait.

Nothing here hurts you. Coins add to your score. The door at the end of the level takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|HERE TODAY  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL WAITED!

Two levels, and now you know how long things last.

A monster can have a lifetime, counted in ticks (about 18 a second) from the moment the level starts. When it is up the monster is gone, or it becomes another monster in the same place, with that monster's own picture, path and lifetime.

Open the game in Game-Maker and find the Lifetime setting on the Monsters tab. Make the bubble's longer or shorter, and pick what the sleeper becomes.
`);

export const LOST = wrap(`
|OOPS!

That took a while.

Try again: this time, just wait for the bubble to go and the sleepy one to wake.
`);
