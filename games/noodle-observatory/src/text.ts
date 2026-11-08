// Every word THE NOODLE OBSERVATORY shows on a text page (30 columns, 16 lines a page) and on its story pages (lines
// of at most 34 letters at 8x8, four to a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|THE NOODLE
|OBSERVATORY

Monkey Day. Nell's tin monkey rolls a loose lens into the old kitchen telescope, the giant pasta ring from the noodle fair rolls UP the wall, and in the window, framed perfectly: a second moon. Round. Cheese-colored. Low.

Nell did what any reasonable person would do. She wrote to the paper.

The letter runs Friday. Between now and then, she would like some evidence.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder
|F2            lives, score

Touch a part to take it. Walk into the socket with its shape and the part goes in.

In the pasta ring, LEFT and RIGHT steer. The ring rolls up by itself.

Shelves wobble before they tip: wait on the ladder for level. Sockets in a row take their parts in order, so carry what the row asks for.

Some scenes are stories: watch them happen.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|THE NOODLE OBSERVATORY
|v${about.version}
|(c) 1994 Sandbox Software

Story, pixels, beeps, songs and levels by Claude Sonnet 5.5, an AI model made by Anthropic, from a level plan written with OpenAI Codex.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

A special for Monkey Day: it only stops by for a few days.
`),
);

export const WON = wrap(`
|THE CORRECTION
|RUNS FRIDAY

The second moon was the bakery's round window. The first moon came up at eleven, on schedule, and needed no help.

Nell rewrote her letter: a retraction, with diagrams, and a note that the baker keeps a logbook too.

The paper printed both. People liked the correction better.

The ring is back. So is the cloth.
`);

export const LOST = wrap(`
|TRY AGAIN

Evidence is patient. Every shelf has a ladder, and every fall lands on the floor.
`);

/** The story pages before a level, by its file name: pages of up to four lines. */
export const CARDS: Record<string, string[][]> = {
  lensroll: [['MONKEY DAY. THE TIN MONKEY IS', 'WOUND UP AND HAS OPINIONS', 'ABOUT WHERE LENSES GO.']],
  hinges: [
    ['A SECOND MOON. NELL HAS ALREADY', 'MAILED A LETTER TO THE PAPER.', 'IT RUNS FRIDAY.', 'SHE WOULD LIKE EVIDENCE.'],
    ['EVIDENCE NEEDS A TELESCOPE.', 'A TELESCOPE NEEDS BRACKETS.', 'THE BRACKETS ARE ON THE SHELVES', 'THAT TIP. NATURALLY.'],
  ],
  drawers: [['A KNOB, A FOOT, A STRIPED TUBE.', 'EACH SOCKET TAKES ONE SHAPE.', 'THE CUPBOARDS DO NOT NEGOTIATE.']],
  scope: [['SIX PARTS. SIX SOCKETS.', 'THE DIAGRAM IS IN NELL\'S HAND,', 'WHICH IS NOT THE SAME AS', 'BEING CORRECT.']],
  roundway: [
    ['A TELESCOPE! MOSTLY CUPBOARDS.', 'BUT THE KITCHEN WINDOW SITS', 'TOO LOW. THE TOP OF THE PANTRY', 'HAS THE BETTER ANGLE.'],
    ['THE PASTA RING ROLLS UPHILL.', 'NOBODY KNOWS WHY. NELL HAS', 'DECIDED NOT TO ASK UNTIL', 'AFTER FRIDAY.'],
  ],
  narrow: [['THE MOON HAS NOT MOVED.', 'MOONS MOVE. THIS IS', 'THE KIND OF DETAIL A LETTER', 'TO THE PAPER LEAVES OUT.']],
  uphill: [['ONE MORE SHAFT TO THE TOP', 'SHELF. UPHILL. OF COURSE.']],
  softstep: [
    ['FROM THE TOP SHELF, THE MOON', 'HAS A VERY STRAIGHT EDGE.', 'NELL NOTES IT. NEUTRALLY.'],
    ['BETTER LENSES WILL SETTLE IT.', 'THEY ARE LOOSE IN THE LENS', 'ROOM. ONE AT A TIME. GENTLY.'],
  ],
  lensrise: [['EVERY LENS MAKES THE MOON LOOK', 'A LITTLE LESS LIKE A MOON.', 'NELL KEEPS CARRYING THEM.', 'THAT IS THE JOB.']],
  rimwalk: [['THREE MORE LENSES.', 'THEN THE SCOPE IS SHARP', 'ENOUGH TO BE INCONVENIENT.']],
  lensloop: [['THE LAST TWO LENSES TRAVEL', 'TOGETHER. SO DOES THE DOUBT.']],
  slitone: [['SHARPER. STRANGER. UP IN THE', 'LOFT, NINE SHUTTERS LET THE', 'NIGHT IN. NINE PADS SET THEM.', 'THE STARS WILL BACK HER UP.']],
  slittwo: [['THREE SHUTTERS SET. SIX TO GO.', 'THE STARS ARE BEING SHY.']],
  slitend: [['SIX SET. THE LAST THREE ARE', 'TRIANGLES. THE LOFT ENJOYS', 'A THEME.']],
  starview: [['NINE SHUTTERS OPEN.', 'TIME TO LOOK UP AND', 'BE PROVEN RIGHT.']],
  rattle: [
    ['THE STARS MADE A SPOON, A FORK', 'AND A COLANDER. THE SKY IS', 'EITHER MOCKING HER OR IT IS', 'THE KITCHEN DRAWER.'],
    ['CLANG. THE REAL COLANDER JUMPED', 'ITS HOOK AND ROLLED OUT ONTO', 'THE ROOF. FOLLOW THE RATTLE.'],
  ],
  garden: [['A CLEAR WINTER NIGHT. THE', 'COLANDER IS STILL ROLLING.', 'SO IS NELL. ONE OF THEM HAS', 'A PLAN.']],
  roofrim: [['FROM THE ROOF, THE MOON LOOKS', 'VERY... SQUARE AT THE BOTTOM.', 'NELL DOES NOT WRITE THAT DOWN.']],
  chimneys: [['THE COLANDER TOOK THE SCENIC', 'ROUTE. THROUGH EVERY CHIMNEY', 'POT ON THE BLOCK.']],
  setwest: [
    ['THE COLANDER STOPPED BY THE', 'SUPPER CART. IF THE MOON IS', 'GOING TO BE CROSS-EXAMINED,', 'IT CAN BE DONE OVER SUPPER.'],
  ],
  seteast: [['PLATES: SET. NOW THE CUPS.', 'THE MOON WATCHES. IT HAS', 'A VERY STEADY GAZE.', 'SUSPICIOUSLY STEADY.']],
  moonmeal: [['CUPS: SET. LAST, THE MATS.', 'THEN ONE MORE LOOK. A LONG ONE.']],
  napkins: [['THE LAST PLACE SETTING.', 'THE TABLE HAS RULES.', 'NELL IS STARTING TO RESPECT', 'THINGS THAT HAVE RULES.']],
  bakery: [['SUPPER IS SET. THE SCOPE IS', 'READY. THE LETTER IS AT THE', 'PAPER. ONE LAST LOOK...']],
  porch: [
    ['THE MOON HAS A SILL. THE MOON', 'IS A WINDOW. THE LETTER RUNS', 'FRIDAY ANYWAY.'],
    ['AND THE RING JUST LEFT WITH', 'THE TABLECLOTH. ONE PROBLEM', 'NELL CAN ACTUALLY SOLVE.'],
  ],
  drifts: [['THE TRAIL CROSSES THE YARDS.', 'THE RING KNOCKED DOWN EVERY', 'MONKEY DAY STAR IT PASSED.', 'NELL PUTS THEM BACK. MANNERS.']],
  lane: [['THE TRACKS TURN DOWN THE LANE,', 'TOWARD A WARM DOOR AND', 'A ROUND WINDOW, STILL LIT.']],
  woodpile: [['THE RING WENT OVER THE', 'WOODPILE, NOT AROUND IT.', 'IT IS A RING. IT HAS NO', 'OTHER WAY OF GOING.']],
  pegboard: [
    ['THE BAKERY DOOR IS OPEN.', 'NOBODY IS HOME. THE DOUGH', 'IS RISING. THE TOOLS ARE ALL', 'ON THE FLOOR. THE RING.'],
    ['NELL HANGS THEM BACK. IT IS', 'THE LEAST SHE CAN DO WHILE', 'TRESPASSING POLITELY.'],
  ],
  racks: [['THE PROVING RACKS ROLL WHEN', 'BUMPED. THE RING BUMPED', 'ALL OF THEM.']],
  ovens: [['ONE WALL OF HOOKS LEFT.', 'AFTER THIS THE BAKERY WILL', 'BE TIDIER THAN NELL FOUND IT,', 'WHICH SHOULD COUNT FOR SOMETHING.']],
  chute: [['THE CLOTH IS UP ON THE DRYING', 'RACK. THE RING IS LEANING BY', 'THE FLOUR CHUTE, LOOKING', 'INNOCENT. NELL CLIMBS IN.']],
  drying: [['THE TOP OF THE BAKERY.', 'WARM, DARK, AND SOMEWHERE', 'UP HERE, A TABLECLOTH.']],
  farside: [['THE ROUND WINDOW FROM INSIDE.', 'THERE IS A STOOL HERE, AND A', 'LOGBOOK, AND A VIEW OF', 'NELL\'S HOUSE.']],
  homeward: [
    ['THE BAKER HAD BEEN WATCHING', 'NELL\'S LAMP ALL EVENING AND', 'LOGGED IT AS A NEW STAR.', 'NELL FEELS EXTREMELY SEEN.'],
    ['SHE LEAVES A NOTE IN THE LOG.', 'THEN HOME, WITH THE CLOTH,', 'PUTTING THE STARS BACK UP', 'ON THE WAY.'],
  ],
  loftback: [['THE CLOUDS ARE THINNING.', 'NO MORE WINDOWS. THE SCOPE', 'GOES WHERE THE SKY IS:', 'OUTSIDE. PACK IT UP.']],
  roofset: [['THE ROOF. NO GLASS, NO SILL,', 'NO CUPBOARD. LEGS, TUBE,', 'EYEPIECE. IN THAT ORDER.']],
  parapet: [['TWO PARTS ARE MISSING. THEY', 'ARE UP ON THE CHIMNEYS, WHERE', 'NELL LEFT THEM AN HOUR AGO', 'FOR REASONS.']],
  moonrise: [['ELEVEN O\'CLOCK. SUPPER, TAKE', 'TWO. THE SCOPE POINTS EAST,', 'AT NOTHING YET.']],
};
