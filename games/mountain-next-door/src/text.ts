// Every word THE MOUNTAIN MOVED NEXT DOOR shows on a text page (30 columns, 16 lines a page) and on its story
// pages (lines of at most 34 letters at 8x8, four to a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|THE MOUNTAIN
|MOVED NEXT DOOR

The day after Thanksgiving, Tess is up before the sun. She paints the yellow blazes that mark the trails on Old Mossback, the mountain outside town, and the trail crew meets at eight.

But the empty lot next door is full of fog this morning.

And the fog is full of mountain.

Old Mossback has walked into town in the night, wearing half the street's garden gates. Somebody has to find out why, and somebody has to show it the way home.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder
|F2            lives, score

Touch a trail post or a tree to paint a yellow blaze on it.

Touch a garden gate to take it. Touch a gateway with a wheelbarrow in it and the gate goes back.

Hop over the deep footprints. A chalk outline on a tree shows where a blaze goes.

Some levels are stories: watch them happen.

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

Old Mossback sat down where it always stood, a little lower than before, so the summit is the height of a bungalow now.

The whole street came up for a picnic of leftovers. Wisp the cloud floated on top, right where a cloud belongs.

Every gate went home. Every turn of the trail has a fresh yellow blaze.

And at the foot of the mountain there is a new doormat.
`);

export const LOST = wrap(`
|OUT OF LIVES

The mountain waits. It is good at waiting.

Try again: time the stepping stones, let the wind help, and keep to the blazes.
`);

/** The story pages that open each level. */
export const CARDS: Record<string, string[][]> = {
  next: [
    ['THE DAY AFTER THANKSGIVING.', 'TESS IS UP BEFORE THE SUN.', 'TRAIL CREW MEETS AT EIGHT', 'ON OLD MOSSBACK.'],
    ['SHE PAINTS THE YELLOW BLAZES', 'THAT SHOW HIKERS THE WAY.', 'BUT THIS MORNING, THE EMPTY', 'LOT NEXT DOOR IS FULL OF FOG.'],
  ],
  gates: [
    ['OLD MOSSBACK IS NEXT DOOR.', 'IT IS VERY SORRY. IT IS ALSO', 'WEARING FOUR GARDEN GATES', 'IT PICKED UP IN THE NIGHT.'],
    ['UNHOOK EACH GATE AND BRING IT', 'HOME. THE NEIGHBORS PLUGGED', 'THE GAPS WITH WHEELBARROWS', 'TO KEEP THE HENS IN.'],
  ],
  prints: [
    ['"WHY DID YOU COME TO TOWN?"', 'THE MOUNTAIN ONLY SIGHS.', 'SO TESS FOLLOWS ITS FOOTPRINTS', 'BACK THE WAY IT CAME.'],
    ['A TRAIL MARKER MARKS THE WAY.', 'PAINT A BLAZE ON EVERY POST,', 'SO THE MOUNTAIN CAN FIND', 'ITS WAY HOME AGAIN.'],
  ],
  stream: [['THE FOOTPRINTS GO RIGHT', 'THROUGH THE STREAM. IT IS', 'RAINING, AND THE STEPPING', 'STONES WOBBLE. WATCH THEM.']],
  signs: [['AT THE CROSSROADS SOMEBODY', 'KEEPS TURNING THE SIGNPOSTS.', 'SOMEBODY WITH A BUSHY TAIL.', 'TRUST THE YELLOW BLAZES.']],
  hollow: [
    ['THE FOOTPRINTS END AT A HOLE', 'AS BIG AS THE WHOLE TOWN', 'SQUARE. THIS IS WHERE', 'OLD MOSSBACK USED TO STAND.'],
    ['THE SUN IS GOING DOWN.', 'LOOK AROUND. LISTEN.', 'SOMETHING IS MISSING HERE,', 'AND NOT ONLY THE MOUNTAIN.'],
  ],
  ridge: [
    ['A MOUNTAIN HAS A CLOUD THAT', 'SITS ON TOP. OLD MOSSBACK', 'IS MISSING ITS CLOUD.', 'IT DID NOT WANDER OFF.'],
    ['IT WENT LOOKING FOR WISP.', 'A TRAIL OF TINY SNOWDRIFTS', 'LEADS BACK OVER THE WINDY', 'RIDGE, TOWARD TOWN.'],
  ],
  tunnel: [['THE SNOW GOES INTO THE OLD', 'MILL TUNNEL UNDER THE ROAD.', 'IT IS DARK IN THERE.', 'LIGHT THE LANTERNS AS YOU GO.']],
  zigzag: [
    ['WISP FOLLOWED THE CHIMNEY', 'SMOKE TO TOWN ON THANKSGIVING', 'NIGHT. IT THOUGHT THE SMOKE', 'WAS OTHER LITTLE CLOUDS.'],
    ['NOW WISP WANTS TO GO HOME,', 'AND THE MOUNTAIN WILL FOLLOW', 'WISP. MARK A SAFE ZIGZAG', 'TRAIL UP. WISP WILL FOLLOW YOU.'],
  ],
  picnic: [['STEP BY ENORMOUS STEP,', 'OLD MOSSBACK WALKED HOME', 'IN THE NIGHT, SAYING', '"EXCUSE ME" TO EVERY HOUSE.']],
};
