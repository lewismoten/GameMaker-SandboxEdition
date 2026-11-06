// Every word AROUND THE ROOM shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { heroOf, titleCase } from '../../kit/starter/heroFor';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

const HERO = titleCase(heroOf('around-the-room'));

export const STORY = wrap(`
|AROUND THE ROOM

A room has four sides, and a hero can walk on every one of them.

${HERO} starts on the floor. Then she walks up the left wall, along the ceiling upside down, and down the right wall.

Every level is a short walk with blocks to jump over and trenches to jump across, the same jumps each time. But each wall is turned, and your hands have to keep up.

The trick is one setting of a block: which way it pulls.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|ARROWS   walk as they point
|SPACE    jump off the wall
|F2       lives, score

The arrows always mean the way they point on the screen. On the left wall, Up walks up the wall. On the ceiling, Right walks right.

Space pushes ${HERO} away from the wall and the pull brings her back.

Nothing here can hurt you. Take the coins and walk into the door at the end of each level.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|AROUND THE ROOM  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|ONE LAP!

Floor, left wall, ceiling, right wall: four levels, and the same jumps in each.

Nothing in the game moved the walls. Each block has a setting for which way it pulls, and ${HERO}'s own pictures were drawn turned. The pull lives in the blocks, and the pictures live in the hero's file.

Game-Maker has no setting for "the room turns". A level that turns is a level whose blocks pull another way.

Open the game in Game-Maker and look at the Gravity box of a block on each wall. Then build a room of your own with a sideways floor.
`);

export const LOST = wrap(`
|OOPS!

Out of lives. That is not meant to happen here.

Try again: on each wall, the arrows still point the way they look.
`);
