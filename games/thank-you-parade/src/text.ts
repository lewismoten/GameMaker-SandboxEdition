// Every word THE THANK-YOU PARADE shows: the placards in each level ([text, blocks wide, blocks high, ink]; purple
// placards are the Ridgemont band's, teal ones are Marge's) and the text pages (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export type Tone = 'red' | 'purple' | 'teal';
type Defs = Record<string, [string, number, number, Tone?]>;
const EXIT: [string, number, number] = ['EXIT →', 3, 1];

export const CALLTIME_SIGNS: Defs = {
  start: ['STEP OFF AT TEN. THE BAND IS... AROUND.', 6, 2],
  doug: ['DOUG LOST HIS MOUTHPIECE. HE CAN PLAY WITHOUT IT. NOBODY WANTS THAT.', 6, 3],
  tree: ["THE DRUMSTICKS ARE UP A TREE. TREES DON'T DO THAT.", 6, 2],
  geese: ['GEESE. ON PARADE DAY. ODD.', 4, 2],
  pond: ['THE FLUTE IS ON A LILY PAD. SOMEBODY PLANNED THIS.', 6, 2],
  note: ['TAPED TO THE GATE: ENJOY THE BACK OF THE PARADE. -G', 6, 2, 'purple'],
  secret: ['PLAYBOOK P.1: BE UP BEFORE PENNY.', 5, 2, 'purple'],
};

export const GUST_SIGNS: Defs = {
  start: ['SIX LEAF BLOWERS ON MAIN STREET. CATCH CARDS. THE BOX TAKES FOUR.', 6, 3],
  meter: ['THE CARDS GO WHEN THE GUST DOES. MOVE.', 5, 2],
  retry: ['MISSED SOME? THE DOOR BACK THERE STARTS IT OVER.', 6, 2],
  secret: ['PLAYBOOK P.2: BORROW SIX LEAF BLOWERS.', 6, 2, 'purple'],
  exit: EXIT,
};

export const AIRSTRIP_SIGNS: Defs = {
  start: ["MEANWHILE, AT MARGE'S AIRSTRIP. HER BANNER IS IN PIECES.", 6, 3, 'teal'],
  no: ['MARGE: I AM NOT FLYING NO THANK YOU.', 6, 2, 'teal'],
  geese: ['NOT MY GEESE, SAYS MARGE.', 5, 2, 'teal'],
  rack: ['THE RACK WANTS ALL EIGHT LETTERS.', 6, 2, 'teal'],
  secret: ['PLAYBOOK P.3: NOBODY CHECKS A BANNER.', 6, 2, 'purple'],
};

export const FLOAT_SIGNS: Defs = {
  start: ['THE FIRE HALL. THE FLOAT IS HERE. ITS PARTS ARE NOT.', 6, 2],
  crew: ['CAPTAIN RUIZ: SOMEONE LOCKED THEM UP. NICELY, EVEN.', 6, 2],
  gold: ['BRASS KEY, BRASS GATE.', 4, 2],
  silver: ['STEEL KEY, STEEL GATE.', 4, 2],
  climb: ['THE LAST BRASS KEY IS UP IN THE LOFT.', 5, 2],
  parts: ['THE FLOAT NEEDS ALL THREE PARTS.', 6, 2],
  secret: ['PLAYBOOK P.4: NOBODY LOOKS UP IN A FIRE HALL.', 6, 2, 'purple'],
  exit: EXIT,
};

export const DRUMOFF_SIGNS: Defs = {
  start: ['ELM STREET. GIGI WANTS A DRUM-OFF. GIGI BROUGHT CANNONS.', 6, 3],
  gigi: ['GIGI: CONFETTI CANNONS. ON THE BEAT. TRY TO KEEP UP.', 6, 3, 'purple'],
  beat: ['WATCH THE DRUMS. THE RED ONE IS BEAT FOUR.', 5, 2],
  second: ['THESE FIRE ON TWO. OF COURSE.', 5, 2],
  both: ['STEP, STEP, STEP, WAIT. THEN STEP, WAIT.', 5, 2],
  last: ['PENNY: OUR DRUMLINE PRACTICES IN A PARKING LOT. IN JANUARY.', 6, 3],
  exit: EXIT,
};

export const ROUTE_SIGNS: Defs = {
  start: ['THE ROUTE. EVERY VETERAN ON THE CURB GETS A CARD.', 6, 2],
  judges: ['THEY HOLD UP SCORECARDS. THEY ALWAYS HAVE.', 6, 2],
  dog: ['THAT DOG TAKES CARDS. KEEP A SPARE.', 6, 2],
  delgado: ['MR. DELGADO: A 7. THE PLUME IS A LOT.', 6, 2],
  geese: ['MORE GEESE. GIGI KNOWS A GOOSE GUY.', 5, 2],
  pruitt: ["MS. PRUITT: A 10. DON'T TELL DELGADO.", 5, 2],
  exit: EXIT,
};

export const STEPOFF_SIGNS: Defs = {
  start: ['9:58. THE REVIEWING STAND. FOUR MORE CARDS, THEN THE FRONT.', 6, 3],
  llamas: ['THE RIDGEMONT BAND, BEHIND THE LLAMA RESCUE. AT LAST.', 7, 2],
  gigi: ['GIGI: THE LLAMAS ARE NOT ON THE BEAT.', 5, 2, 'purple'],
  stage: ['UP THE STEPS. THE CLOCK SAYS TEN.', 5, 2],
};

export const STORY = wrap(`
|THE THANK-YOU PARADE

Every November the town holds a parade for its veterans, and the band that marches first marches first. There's no trophy. There's only the front, and everyone knows who had it.

The Harlan Falls Hornets have led for eleven years, because Penny runs the band like a railroad.

This year Gigi Larkspur and the Ridgemont Precision Brass want the front. Gigi has a clipboard. Gigi has a plan. Gigi, it turns out, has geese.

Step off is at ten.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   march
|SPACE         jump
|UP, DOWN      climb
|F2            lives, score

Band members, gates, the card box and the float each want something. Bring it and walk into them.

Hand a card to a veteran by walking up with one in hand.

Geese peck. Cannons fire on the beat. A dog takes cards. Watch the drums and the gust meter.

Gigi lost her playbook pages. Nine of them are well hidden, and a few need a ladder.

Donuts give back a hit point.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|THE THANK-YOU PARADE  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, words, marches and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

A Special: it only comes around for a short while. Keep your copy.

For everyone on the curb.
`),
);

export const WON = wrap(`
|STEP OFF

At ten o'clock exactly, the Hornets step off first.

Every card is in a veteran's hands. Mr. Delgado gives the plume a 10, under protest.

Overhead, Marge banks low over Main Street and the banner unrolls: THANK YOU, in letters six feet tall.

Then a second banner unrolls beneath it.

NICE TRY, GIGI.

Ridgemont marches behind the llama rescue. The llamas set the pace. The llamas are not precise.
`);

export const LOST = wrap(`
|BACK OF THE PARADE

Out of lives. Gigi takes the front, and the Hornets march behind the street sweeper.

Try again: wait for the gap, count the beat, and keep a spare card for the dog.
`);

export const BAKERY_SIGNS: Defs = {
  start: ['7:20. BAKERY ROW. THE FRONT DOOR IS LOCKED. THE ROOF IS NOT.', 6, 3],
  clock: ['MR. OKAFOR PULLS THE SHUTTER AT 7:50. HE IS CLEAR ABOUT THIS.', 6, 3],
  ladder: ['LADDERS GO UP. DOWN IS FASTER.', 5, 2],
  donuts: ['TAKE DONUTS. THE BAND RUNS ON THEM.', 5, 2],
  down: ['THE AWNINGS ARE SLOWER AND TASTIER.', 5, 2],
  secret: ['PLAYBOOK P.5: A WATER TOWER IS A LOOKOUT.', 6, 2, 'purple'],
  exit: EXIT,
};

export const CREEK_SIGNS: Defs = {
  start: ['8:05. MILL CREEK. THE BRIDGE IS OUT.', 5, 2],
  bridge: ['THE SIGN SAYS BRIDGE OUT. THE SIGN IS ON THE BRIDGE.', 6, 3],
  bed: ['OR WALK THE BED. A KEY IS DOWN THERE. THE WATER IS FINE.', 6, 3],
  toll: ['TWO TOLLS: BRASS, THEN STEEL. NOBODY COLLECTS. THEY ARE GATES.', 6, 3],
  mill: ["THE MILL HASN'T MILLED SINCE 1952. THE ROOF HAS A VIEW.", 6, 3],
  secret: ['PLAYBOOK P.6: GIGI CHECKED THE ROOF TOO.', 6, 2, 'purple'],
  exit: EXIT,
};

export const HALL_SIGNS: Defs = {
  start: ["RIDGEMONT'S PRACTICE HALL. THE DOOR WAS UNLOCKED. SUSPICIOUS.", 6, 3, 'purple'],
  shelf: ['A BRASS KEY ON A SHELF. GIGI LABELS EVERYTHING.', 5, 2, 'purple'],
  lights: ['STEEL KEY: UP WHERE THE LIGHTS ARE. SO IS THE DUST.', 6, 3, 'purple'],
  geese: ['GOOSE TRAINING, ROOM B. GIGI CALLS THE HOLE THE FILING SYSTEM.', 6, 3, 'purple'],
  secret: ['PLAYBOOK P.7: NOBODY LOOKS UP IN A BIG ROOM.', 6, 2, 'purple'],
  exit: EXIT,
};

export const THAW_SIGNS: Defs = {
  start: ['8:15. FROST LOT. GIGI FLOODED IT LAST NIGHT. THE SUN IS OUT.', 6, 3],
  thaw: ['THE ICE LETS GO FROM THIS END, ONE SECTION AT A TIME. THE METER KNOWS.', 7, 3],
  bed: ['MISS IT? THE POND IS FINE. LADDERS AT BOTH ENDS. WATCH THE CONES.', 7, 3],
  tent: ['WARMING TENT. TUBA, TOWELS AND A SURPRISING NUMBER OF DONUTS.', 6, 3],
  exit: EXIT,
};

export const CLOCK_SIGNS: Defs = {
  start: ['9:20. THE CLOCK TOWER. THE DOOR IS AT THE TOP. THE CLOCK IS TEN MINUTES SLOW.', 7, 3],
  cogs: ['THE COGS BLINK. ONE IS ALWAYS OUT. THE GAP TRAVELS. SO CAN YOU.', 6, 3],
  late: ['THE BELL RINGS WHEN THE CLOCK SAYS 9:30. IT HAS NEVER SAID 9:30.', 6, 3],
  door: ['THE CLOCK FACE IS THE DOOR. ONE MORE BRIDGE.', 6, 2],
};

export const TRUCK_SIGNS: Defs = {
  start: ["9:40. RIDGEMONT'S CONFETTI TRUCK. THREE FUSES KEEP IT PARKED.", 6, 3, 'purple'],
  sweep: ['THE SWEEPER HAS ONE SETTING.', 5, 2, 'purple'],
  high: ['THE LADDERS ARE FOR LOOKING AT CANNONS FROM ABOVE.', 6, 3],
  gigi: ['GIGI: THE TRUCK ONLY STARTS WITH ALL THREE FUSES. WHY DID I SAY THAT OUT LOUD?', 7, 3, 'purple'],
  secret: ['PLAYBOOK P.9: THE TRUCK HAS A SUNROOF.', 6, 2, 'purple'],
  exit: EXIT,
};

export const BLEACHER_SIGNS: Defs = {
  start: ['9:10. THE BLEACHERS. FOUR JUDGES. FOUR CARDS. FIVE ROWS.', 6, 3],
  judges: ['THE JUDGES SIT HIGHER EACH ROW. THAT IS HOW BLEACHERS WORK.', 6, 3],
  cannon: ['GIGI RENTED THE CANNONS BY THE HOUR.', 5, 3, 'purple'],
  secret: ["PLAYBOOK P.8: THE SCOREBOARD IS HONEST. THIS ONE ISN'T.", 6, 3, 'purple'],
  exit: EXIT,
};

/** What each level card says under its title. */
export const CARD_NOTES = [
  '6:40 AM. The band is scattered.',
  'Main Street. Leaf blowers.',
  'Meanwhile, at the airstrip.',
  'The fire hall. A float, no parts.',
  'Elm Street. A drum-off.',
  'The route. Veterans judging.',
  '9:58. The front of the parade.',
];
