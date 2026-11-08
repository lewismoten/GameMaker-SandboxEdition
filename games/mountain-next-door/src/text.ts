// Every word THE MOUNTAIN MOVED NEXT DOOR shows on a text page (30 columns, 16 lines a page) and on its story
// pages (lines of at most 34 letters at 8x8, four to a page). The voice is dry and grown-up: a trail crew lead
// with a deadline, neighbors with opinions, and a very old mountain that is deeply embarrassed.
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|THE MOUNTAIN
|MOVED NEXT DOOR

Tess runs the trail crew on Old Mossback, the mountain outside town. Six years of yellow blazes, painted by hand. She knows every switchback by heart.

The day after Thanksgiving she wakes to fog in the empty lot next door. By breakfast the fog has lifted, and the lot is no longer empty.

The mountain has come to town. It is wearing half the street's garden gates, and it is very, very sorry.

Mr. Hale has already phoned the county. The survey crew comes at sunrise, and a mountain in a residential lot is, legally, a structure without a permit.

Tess has one day to find out why it came, and one night to walk it home.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder
|F2            lives, score

Touch a trail post or a tree to paint a yellow blaze on it.

Touch a garden gate or a lost book to carry it. Touch the gap where it belongs and it goes back.

Anything that sinks, swings or blows does it on a clock. Watch one whole turn before you trust it.

Some levels are scenes: stop and watch them happen.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|THE MOUNTAIN MOVED
|NEXT DOOR  v${about.version}
|(c) 1994 Sandbox Software

Story, pixels, beeps, songs and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

A special for the day after Thanksgiving: it only stops by for a few days.
`),
);

export const WON = wrap(`
|HOME AGAIN

Old Mossback sat down in its hollow with the care of something very large that has been very embarrassed. It settled a little lower than before.

The survey crew arrived at sunrise, found an empty lot and a picnic, and stayed for pie.

Wisp sits on the summit, where a cloud belongs. It has stopped following chimney smoke. Mostly.

Every gate is home. Every turn has a fresh blaze. And at the foot of the mountain there is a new doormat, from the whole street.
`);

export const LOST = wrap(`
|OUT OF LIVES

The mountain waits. It is very good at waiting. The county is not.

Try again: watch one whole turn of anything on a clock, let the wind do the work, and trust paint over arrows.
`);

/** The story pages that open each level. */
export const CARDS: Record<string, string[][]> = {
  next: [
    ['THE DAY AFTER THANKSGIVING.', 'TESS RUNS THE TRAIL CREW', 'ON OLD MOSSBACK. SIX YEARS', 'OF BLAZES, PAINTED BY HAND.'],
    ['THIS MORNING THE EMPTY LOT', 'NEXT DOOR IS FULL OF FOG.', 'FOG, AS A RULE,', 'DOES NOT SNORE.'],
  ],
  gates: [
    ['MR. HALE HAS CALLED THE', 'COUNTY. THE SURVEY CREW', 'COMES AT SUNRISE. A MOUNTAIN', 'IN A LOT IS A "STRUCTURE."'],
    ['FIRST, THE GATES. IT PICKED', 'UP FOUR IN THE NIGHT, LIKE', 'BURRS. THE NEIGHBORS PLUGGED', 'THE GAPS WITH WHEELBARROWS.'],
  ],
  back: [
    ['EVERY GATE IS HOME. THE', 'MOUNTAIN APOLOGIZES TO EACH', 'NEIGHBOR BY NAME, BUT IT', 'WILL NOT SAY WHY IT CAME.'],
    ['SO TESS GOES UP TO LOOK.', 'NOBODY HAS CLIMBED ITS BACK', 'FROM THIS SIDE. NOBODY HAD', 'TO. IT WAS NEVER HERE.'],
  ],
  prints: [
    ['NO CLOUD ON TOP. ONLY A', 'DAMP DENT, AS IF SOMETHING', 'SOFT SAT THERE FOR A', 'THOUSAND YEARS, THEN LEFT.'],
    ['THE FOOTPRINTS LEAD BACK', 'THROUGH THE PARK. BLAZE', 'EVERY POST: TONIGHT THE', 'MOUNTAIN WILL NEED THE WAY.'],
  ],
  books: [
    ['THE PRINTS PASS THE LIBRARY.', 'ONE STEP FLATTENED THE BOOK', 'DROP. OVERDUE BOOKS ARE', 'ON ALL FOUR FLOORS.'],
    ['MRS. LIN DOES NOT PANIC.', 'SHE HAS SURVIVED TWO FLOODS', 'AND A SUMMER READING', 'CHALLENGE. SHE MAKES A LIST.'],
  ],
  stream: [['THE PRINTS WADE THE STREAM', 'FOUR TIMES, IN THE RAIN.', 'THE STEPPING STONES SINK', 'AND RISE ON A SCHEDULE.']],
  signs: [['AT THE CROSSROADS SOMEONE', 'HAS BEEN TURNING SIGNPOSTS.', 'SOMEONE WITH A BUSHY TAIL', 'AND NO REMORSE.']],
  hollow: [
    ['THE PRINTS END AT A HOLE', 'THE SIZE OF THE TOWN SQUARE.', 'OLD MOSSBACK STOOD HERE', 'LONGER THAN THE TOWN HAS.'],
    ['THE SUN IS GOING DOWN.', 'THE CREW COMES AT SUNRISE.', 'AND SOMETHING HERE IS', 'MISSING. NOT JUST A MOUNTAIN.'],
  ],
  tower: [
    ['WISP LEFT, AND THE MOUNTAIN', 'WENT AFTER IT. THAT IS THE', 'WHOLE MYSTERY. THE HARD', 'PART IS WHERE THEY WENT.'],
    ['THE OLD FIRE LOOKOUT SEES', 'THE WHOLE VALLEY. IT IS', 'SEVEN FLIGHTS UP, AND THE', 'LIGHT IS GOING FAST.'],
  ],
  ridge: [
    ['FROM THE TOP, A LINE OF', "TINY SNOWDRIFTS: WISP'S", 'TRAIL, OVER THE RIDGE AND', 'DOWN TOWARD TOWN.'],
    ['THE TRAIL GOES BACK OVER', 'THE RIDGE, TOWARD TOWN.', 'THE WIND IS UP. FOR ONCE', 'IT IS ON YOUR SIDE.'],
  ],
  tunnel: [['THE SNOW GOES INTO THE OLD', 'MILL TUNNEL UNDER THE ROAD.', 'NO LIGHTS. JUST LANTERNS', 'NOBODY HAS LIT IN YEARS.']],
  zigzag: [
    ['WISP FOLLOWED THE CHIMNEY', 'SMOKE TO TOWN. IT THOUGHT', 'IT HAD FOUND OTHER CLOUDS.', 'SMOKE IS POOR COMPANY.'],
    ['NOW WISP WANTS TO GO HOME,', 'AND THE MOUNTAIN FOLLOWS', 'WISP ANYWHERE. MARK THE WAY', 'UP. WISP WILL FOLLOW YOU.'],
  ],
  picnic: [['ALL NIGHT, STEP BY ENORMOUS', 'STEP, OLD MOSSBACK WALKED', 'HOME, SAYING "EXCUSE ME"', 'TO EVERY HOUSE IT PASSED.']],
};
