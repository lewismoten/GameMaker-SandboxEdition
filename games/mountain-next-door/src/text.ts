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

Story, pixels, beeps, songs and levels by Claude Sonnet 5.5 and Claude Opus 5.5, AI models made by Anthropic.

Old Mossback's voice: Pocket TTS by Kyutai (CC BY 4.0), in a cloned voice.

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
    ['THE CREW MEETS AT EIGHT.', 'COFFEE FIRST. ALWAYS.', 'TODAY, COFFEE WILL HAVE', 'TO WAIT.'],
  ],
  gates: [
    ['MR. HALE HAS CALLED THE', 'COUNTY. THE SURVEY CREW', 'COMES AT SUNRISE. A MOUNTAIN', 'IN A LOT IS A "STRUCTURE."'],
    ['FIRST, THE GATES. IT PICKED', 'UP FOUR IN THE NIGHT, LIKE', 'BURRS. THE NEIGHBORS PLUGGED', 'THE GAPS WITH WHEELBARROWS.'],
  ],
  back: [
    ['EVERY GATE IS HOME. THE', 'MOUNTAIN APOLOGIZES TO EACH', 'NEIGHBOR BY NAME, BUT IT', 'WILL NOT SAY WHY IT CAME.'],
    ['SO TESS GOES UP TO LOOK.', 'NOBODY HAS CLIMBED ITS BACK', 'FROM THIS SIDE. NOBODY HAD', 'TO. IT WAS NEVER HERE.'],
    ['THE LOOSE ROCKS ON ITS BACK', 'SINK AND COME UP ON A CLOCK.', 'WATCH ONE GO ROUND, COUNT,', 'THEN STEP.'],
  ],
  prints: [
    ['NO CLOUD ON TOP. ONLY A', 'DAMP DENT, AS IF SOMETHING', 'SOFT SAT THERE FOR A', 'THOUSAND YEARS, THEN LEFT.'],
    ['THE FOOTPRINTS LEAD BACK', 'THROUGH THE PARK. BLAZE', 'EVERY POST: TONIGHT THE', 'MOUNTAIN WILL NEED THE WAY.'],
  ],
  books: [
    ['THE PRINTS PASS THE LIBRARY.', 'ONE STEP FLATTENED THE BOOK', 'DROP. OVERDUE BOOKS ARE', 'ON ALL FOUR FLOORS.'],
    ['MRS. LIN DOES NOT PANIC.', 'SHE HAS SURVIVED TWO FLOODS', 'AND A SUMMER READING', 'CHALLENGE. SHE MAKES A LIST.'],
    ['ANY GAP ON A SHELF TAKES', 'ANY BOOK. MRS. LIN WILL', 'SORT THEM LATER. SHE', 'IS LOOKING FORWARD TO IT.'],
  ],
  stream: [
    ['THE PRINTS WADE THE STREAM', 'FIVE TIMES, IN THE RAIN.', 'THE STEPPING STONES SINK', 'AND RISE ON A SCHEDULE.'],
    ['WATCH ONE WHOLE LOOP FROM', 'THE BANK FIRST. SOME STONES', 'RISE AS OTHERS SINK.', 'THEN GO.'],
    ['THE LAST STONES RISE ONE AFTER', 'ANOTHER, LIKE A WAVE. WALK', 'WITH IT, AND WAIT ON A STONE', 'IF YOU GET AHEAD OF IT.'],
  ],
  mist: [
    ['BELOW THE STREAM THE MEADOW', 'DIPS INTO THREE LITTLE DELLS.', 'SOMETHING SOFT HAS BEEN HERE,', 'AND IT WAS NOT THE WEATHER.'],
    ['BEADS OF MIST, EVERYWHERE.', 'WISP DRIPS WHEN IT IS', 'NERVOUS. IT HAS BEEN VERY', 'NERVOUS FOR A WHOLE DAY.'],
    ['THE MIST STACKS ITSELF INTO', 'STEPS UP EACH DELL, ONE A', 'LITTLE LATER THAN THE LAST.', 'GO UP BEFORE THEY THIN AWAY.'],
  ],
  signs: [['AT THE CROSSROADS SOMEONE', 'HAS BEEN TURNING SIGNPOSTS.', 'SOMEONE WITH A BUSHY TAIL', 'AND NO REMORSE.']],
  grove: [
    ['THE SURVEY CREW HAS GONE TO', 'LUNCH. MR. HALE, WHO PHONED', 'THE COUNTY, USES THE QUIET', 'TO COUNT HIS APPLES.'],
    ['THE MOUNTAIN SNEEZED, AND THE', 'APPLES FELL. EVERY WINDFALL IS', 'ON HIS LIST. TESS WILL PICK', 'UP WHAT SHE CAN. HE WILL NOTICE.'],
    ['HIS GATES SWING ON A CLOCK,', 'TWO IN A ROW TAKING TURNS.', 'WATCH, THEN GO THROUGH.', 'THE TREES WANT BLAZES TOO.'],
  ],
  hollow: [
    ['THE PRINTS END AT A HOLE', 'THE SIZE OF THE TOWN SQUARE.', 'OLD MOSSBACK STOOD HERE', 'LONGER THAN THE TOWN HAS.'],
    ['THE SUN IS GOING DOWN.', 'THE CREW COMES AT SUNRISE.', 'AND SOMETHING HERE IS', 'MISSING. NOT JUST A MOUNTAIN.'],
    ['WHEN THE LAST STARS ARE OUT,', 'LOOK AROUND. WHATEVER THE', 'MOUNTAIN LEFT BEHIND WILL', 'SHOW IN THEIR LIGHT.'],
  ],
  tower: [
    ['WISP LEFT, AND THE MOUNTAIN', 'WENT AFTER IT. THAT IS THE', 'WHOLE MYSTERY. THE HARD', 'PART IS WHERE THEY WENT.'],
    ['THE OLD FIRE LOOKOUT SEES', 'THE WHOLE VALLEY. IT IS', 'SEVEN FLIGHTS UP, AND THE', 'LIGHT IS GOING FAST.'],
    ['LIGHT EVERY LAMP ON THE', 'WAY UP. LOOSE BOARDS DROP', 'ON A CLOCK: WAIT ON A SOUND', 'BOARD AND WATCH THEM GO.'],
  ],
  ridge: [
    ['FROM THE TOP, A LINE OF', "TINY SNOWDRIFTS: WISP'S", 'TRAIL, OVER THE RIDGE AND', 'DOWN TOWARD TOWN.'],
    ['THE TRAIL GOES BACK OVER', 'THE RIDGE, TOWARD TOWN.', 'THE WIND IS UP. FOR ONCE', 'IT IS ON YOUR SIDE.'],
    ['STEP INTO THE UPDRAFT AND', 'LET IT LIFT YOU. WHEN THE', 'GUST COMES, COMMIT TO IT.', 'THE SNOW SHOWS THE WAY.'],
    ['ON THE CREST THE WIND TURNS.', 'A FLAG SHOWS WHICH WAY. TWO', 'LAMPS SHOW HOW LONG IT HAS.', 'WALK INTO IT ONLY IN A LULL.'],
  ],
  spill: [
    ['WISP FOLLOWED THE WATER DOWN', 'OFF THE RIDGE. IT WAS NEVER', 'A BAD CLOUD, ONLY ONE WITH', 'A DIFFICULT SENSE OF DIRECTION.'],
    ['THE WATER GOES DOWN THE HILL', 'IN FIVE TERRACES. EACH HAS A', 'POOL, AND EACH POOL HAS STONES', 'THAT SINK ON A SCHEDULE.'],
    ['DOWN IS THE WAY. CROSS RIGHT,', 'CLIMB DOWN, CROSS LEFT, AND', 'DO NOT MIND THE SOCKS. THE', 'TOWN IS AT THE BOTTOM.'],
  ],
  lamps: [
    ['SOMEWHERE BEHIND, THE WATER', 'RAN OUT AND THE TOWN BEGAN.', 'THE STREETLAMPS ARE OUT. THE', 'LAMPLIGHTER IS OUT TO LUNCH.'],
    ['THE MOUNTAIN WILL BE WALKING', 'THESE STREETS LATER, AND IT', 'IS NOT USED TO THE DARK. IT IS', 'NOT USED TO STREETS EITHER.'],
    ['FOUR TERRACES OF HOUSES UP THE', 'HILL, A LADDER AT EACH END.', 'FOG FILLS EACH ALLEY, ONE STEP', 'AFTER ANOTHER. THEN IT THINS.'],
  ],
  roofs: [
    ['TOWN, AFTER MIDNIGHT. THE', 'SNOW DOES NOT GO DOWN THE', 'STREETS. IT GOES OVER', 'THE ROOFS, CHIMNEY TO CHIMNEY.'],
    ['WISP WAS LOOKING FOR OTHER', 'CLOUDS. IT FOUND SMOKE.', 'SMOKE IS WARM, AND RISES,', 'AND HAS NOTHING TO SAY.'],
    ['CHIMNEYS PUFF ON A CLOCK.', 'WATCH ONE PUFF FIRST, THEN', 'STEP INTO THE WARM SMOKE', 'AND RISE WITH IT.'],
  ],
  tunnel: [
    ['THE SNOW GOES INTO THE OLD', 'MILL TUNNEL UNDER THE ROAD.', 'SOMETHING IN THERE IS', 'SNIFFLING.'],
    ['LIGHT EVERY LANTERN. THE', 'GLOW-WORMS LIKE THE DARK.', 'THE LADDER AT THE FAR END', 'GOES UP TO THE OLD MILL RACE.'],
  ],
  excuse: [
    ['WISP IS FOUND. NOW THE MOUNTAIN', 'GOES HOME, THE LONG WAY: THE', 'WHOLE LENGTH OF A STREET', 'THAT WAS NEVER MEANT FOR IT.'],
    ['IT FOLLOWS TESS, A BIT BEHIND,', 'ON TIPTOE. IT IS THREE', 'STORIES TALL AND TRYING VERY', 'HARD NOT TO WAKE ANYONE.'],
    ['BINS, SHEETS AND YARD GATES', 'STAND IN ITS WAY. GO AHEAD', 'AND CLEAR THEM, BEFORE IT', 'ARRIVES TO SAY "EXCUSE ME."'],
  ],
  survey: [
    ['NOON. THE COUNTY SURVEY PARTY', 'HAS STRUNG PLANK WALKWAYS', 'ACROSS THE GULLY TO MEASURE', 'A MOUNTAIN THEY CAN SEE.'],
    ['THEN THEY WENT TO LUNCH.', 'THE STAKES ARE STILL IN.', 'EVERY STAKE YOU PULL IS A', 'NUMBER THEY HAVE TO GUESS.'],
    ['THE BOARDS ARE LOOSE AND DROP', 'AWAY ON A CLOCK. WAIT FOR A', 'SOUND ONE. THE CREW IS BACK', 'AT ONE, AND WILL NOTICE.'],
  ],
  clock: [
    ['AFTER MIDNIGHT, THE MOUNTAIN', 'REACHES THE TOWN SQUARE. THE', 'TOWN HALL CLOCK STRIKES', 'THREE AT THREE, EVERY NIGHT.'],
    ['A MOUNTAIN CAN TIPTOE PAST A', 'SLEEPING STREET. IT CANNOT', 'TIPTOE PAST A BELL THE SIZE', 'OF A BATHTUB.'],
    ['WISP SPOTTED THE TOWER. THE', 'ONLY WAY UP IS THE FLUES.', 'RIDE THE WARM SMOKE, AND', 'BRING THE SNOW.'],
  ],
  vault: [
    ['THE SURVEY CREW WILL WANT', 'PAPER. THE TOWN HALL KEEPS ITS', 'RECORDS IN A CELLAR UNDER THE', 'BELL. TESS GOES DOWN TO LOOK.'],
    ['NO WINDOWS DOWN HERE. EVERY BIT', 'OF AIR YOU WALK THROUGH STAYS', 'LIT BEHIND YOU, SO YOU CAN SEE', 'WHERE YOU HAVE BEEN.'],
    ['LADDERS GO UP, DOWN, AND SOME', 'OF THEM NOWHERE. A DEAD END IS', 'ONLY A PLACE TO TURN AROUND.', 'THE DEED IS AT THE BOTTOM.'],
  ],
  ford: [
    ['THE STREET ENDS AT THE RIVER.', 'THE ONLY WAY ACROSS IS THE', 'FORD, WHERE THE WATER IS WIDE', 'AND, BY DAY, QUITE SHALLOW.'],
    ['TONIGHT A MOUNTAIN IS WADING', 'IN BEHIND YOU. EVERY STEP IT', 'TAKES MAKES A WAVE, AND A', 'WAVE WILL CARRY YOU OVER.'],
    ['WATCH WHICH WAY EACH WAVE', 'LEANS. STEP IN AS IT COMES UP,', 'RIDE IT TO THE NEXT BANK, AND', 'WAIT FOR THE NEXT ONE.'],
    ['THE LADDER AT THE FAR BANK', 'GOES UP TO THE UPPER FORD,', 'WHERE THE RIVER SPILLS OVER.', 'ITS WAVES KEEP THEIR OWN TIME.'],
  ],
  zigzag: [
    ['WISP FOLLOWED THE CHIMNEY', 'SMOKE TO TOWN. IT THOUGHT', 'IT HAD FOUND OTHER CLOUDS.', 'SMOKE IS POOR COMPANY.'],
    ['NOW WISP WANTS TO GO HOME,', 'AND THE MOUNTAIN FOLLOWS', 'WISP ANYWHERE. MARK THE WAY', 'UP. WISP WILL FOLLOW YOU.'],
  ],
  tarn: [
    ['THE MOUNTAIN IS HOME, AND WILL', 'NOT SIT DOWN. ITS OLD SEAT IS', 'A HOLLOW WHERE A POND HAS', 'FROZEN OVERNIGHT.'],
    ['IT HAS SEEN WHAT A MOUNTAIN', 'DOES TO ICE. IT WOULD LIKE', 'SOMEONE LIGHTER TO GO FIRST.', 'TESS IS NOT OFFENDED.'],
    ['THE PLATES TIP AND SETTLE ON', 'A CLOCK. SOME COME UP IN RUNS.', 'SOME COME UP ONE AT A TIME, IN', 'A WAVE. WATCH, THEN GO.'],
  ],
  picnic: [['ALL NIGHT, STEP BY ENORMOUS', 'STEP, OLD MOSSBACK WALKED', 'HOME, SAYING "EXCUSE ME"', 'TO EVERY HOUSE IT PASSED.']],
};
