// Every word STICK MAN STARS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|STICK MAN STARS

Repo Row is a street of little houses, and each one is somebody's project.

They sit dark until a stranger stops by and leaves a star.

Stick Man has no stars. So he climbs the hill at night and picks them out of the sky, one at a time.

Then he carries them to town, and tosses them at the houses.

Light the street.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|UP            jump
|SPACE         throw a star
|F2            lives, score

On the hill, jump up to pick a bright star out of the sky.

In town, walk toward a house and press Space. A star flies the way you last walked, and only so far.

A lit house throws confetti. A shy one wanders, so wait for it. A shed in a tunnel stays shut until a star lights it. A spam bot bumps: pop it from a distance.
`);

export const CREDITS = withCreditPage(
  wrap(`
|STICK MAN STARS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps, music and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

A Special from Sandbox Software. Every repo house on the street is made up.
`),
);

export const WON = wrap(`
|THE STREET GLOWS

Every house on Repo Row has a gold star on its flag and a light in its window, and the spam bots have rolled off to bother somebody else.

A star costs a stranger a second. It can light up a whole afternoon for the person who made the thing.

If you like a project, tell it so. Leave a star.
`);

export const LOST = wrap(`
|OOF! SPAM!

A spam bot bumped Stick Man over. They do that.

Try again: pop each bot with a star before it rolls close. Walk toward it, stand back a little and press Space.
`);
