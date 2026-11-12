// Every word STICK MAN STARS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|STICK MAN STARS

Repo Row is a street of little houses, and each one is somebody's project.

They sit dark until a stranger stops by and leaves a star. A star can say thanks. Some are bookmarks for later.

Stick Man has no stars. So he climbs the hill at night and picks them out of the sky, one at a time. The path to town is dark, and it lights when he leaves five.

Then he walks into town and tosses them at the houses, one thank-you each.

Light the street.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|UP            jump
|SPACE         throw a star
|F2            lives, score

On the hill, jump up to pick bright stars out of the sky. Leave five to light the path to town.

In town, walk toward a house and press Space. A star flies the way you last walked, and only so far.

A lit house throws confetti. A shy one wanders, so wait for it. A sleepy shed in a tunnel wakes when a star says thanks. A spam bot bumps and hands out fake stars: pop it from a distance and its star fades.

Look up: most streets hang a high star out of the way. Jump for it.

In real life, a star on a project you like thanks its maker and saves it for later.
`);

export const CREDITS = withCreditPage(
  wrap(`
|STICK MAN STARS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps, music and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Lighting chime, ending cartoon and quiet garden by Hermes / OpenAI Codex GPT-6.1 Sol, directed by Lewis Moten.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

A Special from Sandbox Software. Every repo house on the street is made up.

Thanks to st1ckman67, the first stargazer.
`),
);

export const WON = wrap(`
|THE STREET GLOWS

Every house on Repo Row has a gold star on its flag and a light in its window, and the spam bots have rolled off with their fading fake stars.

The brightest houses have a sign out front that says what they are. Nobody had to be asked.

Liked a project? Leave it a star: it thanks the maker and saves the project for later. Only if you want to.
`);

export const LOST = wrap(`
|OOF! SPAM!

A spam bot bumped Stick Man over. They do that.

Try again: pop each bot with a star before it rolls close. Walk toward it, stand back a little and press Space.
`);
