// Every page of words: the storyline, the instructions, the credits, the ending, the lost page,
// each conversation and chapter card, and README.TXT. 30 columns, 16 lines a page (page() checks).
import { CREDIT_NOTICE, withCreditPage } from '../../../kit/license';
import { DRUMSTICKS, GEARS, VALENTINES } from '../ids';
import { page } from './pages';

export const TITLE = 'HEART OF TIN';

export const STORY = page([
  `Behind the little red door of The Dog House is the Tiny Pockets Library, and its night librarian is Mystery Robot Joe.

He is a tin box of a robot with a bulb on his antenna, reading glasses he does not need and a red bow tie.`,
  `Where a heart would go, Joe has a little brass tally counter.

It clicks when he counts. Joe counts everything.

It does not do anything else.`,
  `On his nights off, Joe went looking for a real heart. He looked in every world there is.

He never found one. But in every world, somebody was kind to him.`,
  `So every time, he left behind the only heart he had to give: a little riveted tin heart he made himself, ticking.

A thank-you. And a promise to come back.`,
  `Somebody found every one of them, and followed the trail all the way to the library door.

That was you.

Tonight, Joe is going to keep his promises.`,
]);

export const HELP = page([
  `WALKING
Arrows, W A S D or the number pad: one step at a time. Hold to keep going.

Walk into a friend to talk.

SPACE: pick up what you are standing on.`,
  `IN THE CLOCK TOWER
Gravity pulls down in there.

Arrows walk. UP hops; hold it to hop higher. Q and E (or 7 and 9) hop up and to the side.

Wooden floors are solid on top only: hop up through them.`,
  `TICK AND TOCK
The brass bridges and the copper bridges take turns. Each one blinks red before it lets go.

Wait for yours.

Falling only takes you down a floor. Nothing in the tower can hurt you.`,
  `THE ROAD
Gates on the Long Road open for the thank-yous of friends you have helped.

F2 shows Joe's wind and his spare bulbs. F5 saves, F6 loads, ESC stops.`,
]);

export const CREDITS = withCreditPage(
  page([
    `HEART OF TIN

A Sandbox Software game, 1996

Story, levels, art, music, sounds and every block: Claude Opus 5.5

For whoever found every tin heart.`,
    `STARRING
Mystery Robot Joe, night librarian
Doc Leo, PhD (Comedic Science)
Sir Reginald Cluckington III
Teddy, a corgi who knows left from right
Gwinn, as the valentine thief
The Bard of Bizarre, and his rooster
The Clown Club, as the parade

With the pigeons of the town square, who were not asked.`,
    `Thank you for looking behind things.

${CREDIT_NOTICE.join(' ')}`,
  ]),
);

/** The storybook on the reading rug. */
export const TALK_BOOK = page([
  `Joe reshelves a picture book about a tin woodman who walked a long, long road to be given a heart.

He reads the last page twice. He counts the words. 112.`,
  `Then he opens the little hatch on his own tin chest, the way he does every night.

Inside is the brass tally counter. Click.

"Still just a counter," says Joe.`,
]);

/** Joe's workbench, where he made the tin hearts. */
export const TALK_BENCH = page([
  `On the workbench are the last tin hearts Joe made, waiting in a row. Every one of them ticks.

None of them feels like anything.`,
  `"I gave the rest away," says Joe, "one in every world, to whoever was kind to me. That felt like something."

He writes a note and leaves it on the desk:`,
  `"Gone to find a real heart. Back by opening time. I will count the steps. -J."

He puts on his bow tie straight, and goes out the little red door.

Step one.`,
]);

/** Doc Leo in the square, at 6:59. */
export const TALK_LEO = page([
  `"Joe! Just the robot I need," says Doc Leo. "The town clock stopped at 6:59, and the Clown Club's parade starts at seven sharp. When the bell rings."`,
  `"Sir Reginald and I would climb up and fix it, but the tower is full of gears, and gears do not care for rubber chickens."

Reggie says nothing. He is rubber.`,
  `"Three gears are stuck," says Doc Leo. "Turn all ${GEARS}, and the hammer can strike the bell."

"Watch the brass and copper bridges. They tick and they tock."`,
]);

/** Doc Leo at seven: the thank-you. */
export const TALK_LEO7 = page([
  `"Seven o'clock! You did it, Joe!"

The band starts up. The float rolls. A clown somewhere honks a horn on purpose.`,
  `Joe asks Doc Leo what he came to ask: does he know where a robot could find a real heart?

Doc Leo thinks about it.`,
  `"Some folks say a clock is a heart," he says. "Tick, tock, all day long."

Joe listens to the tower: tick, tock.

"That is only counting," says Joe. "I can already count."`,
  `"Then take the spare winding key, at least," says Doc Leo. "It has a heart-shaped bow. Maybe that is what you need."

He hands Joe a gold thank-you heart, too.

Joe counts it. One.`,
  `THE WINDING KEY
Pick it up (SPACE). While Joe carries it, SPACE is a SPRING HOP wherever gravity pulls: one big hop, once a press.`,
]);

/** Chapter 2's card. */
export const CARD2 = page([
  `CHAPTER TWO
VALENTINES IN THE PARK

A windy afternoon, a party for every dog in the neighborhood, and not one valentine where it ought to be.`,
]);

/** Teddy at the park gate. */
export const TALK_TEDDY = page([
  `Teddy is at the gate, ears straight up, both of them, the way they go when something is very wrong.

He tells Joe all about it in corgi, which Joe reads fluently.`,
  `There were ${VALENTINES} valentines for the party. The wind took six of them and blew them all over the lawn.

Gwinn took the other six. In the box. In her mouth. At a run.`,
  `"She is in her yard," Teddy says, "being very fast about it."

Joe counts the lawn: six valentines, all tumbling.

Gwinn runs away from whoever comes near. Walls stop her, though.`,
]);

/** Teddy at his party: the thank-you. */
export const TALK_TEDDY2 = page([
  `The arch is hung with all ${VALENTINES} valentines. Every dog at the party gets one, and Gwinn gets two, because she is sorry, mostly.

Teddy wags so hard he sits down.`,
  `Joe asks Teddy what he came to ask: where could a robot find a real heart?

Teddy brings him a valentine. His own. It says BE MINE, in his best paw-writing.`,
  `"A valentine is a heart," says Teddy. "Everybody says so."

Joe turns it over. It is lovely. It is paper.

"It does not tick at all," says Joe. He keeps it anyway, very carefully.`,
  `Teddy gives him a gold thank-you heart, too.

Joe counts: two.

TEDDY'S VALENTINE
Pick it up (SPACE). It doesn't do anything. It doesn't have to.`,
]);

/** Chapter 3's card. */
export const CARD3 = page([
  `CHAPTER THREE
THE PARADE

Main Street, the parade rolling, the band waiting, and the Bard of Bizarre with nothing to bang his drum with.`,
  `Unicycles, drum carts and balloon carts roll east, each lane at its own pace. They don't stop. Bumping one winds Joe down a little.

The Bard's ${DRUMSTICKS} drumsticks went flying when the parade began.`,
]);

/** The Bard at the bandstand: the thank-you. */
export const TALK_BARD = page([
  `"Hark! My sticks!" cries the Bard of Bizarre. The rooster on his shoulder straightens its spectacles.

BOOM goes the bass drum, and the band strikes up at last.`,
  `Joe asks his question: where could a robot find a real heart?

"Listen!" says the Bard, and he strikes the big drum. BOOM. BOOM.

"There's a heart for you! The heart of the parade!"`,
  `Joe listens carefully. BOOM. Then nothing, until the Bard strikes it again.

"It only beats when somebody hits it," says Joe. "A heart ought to beat by itself. Shouldn't it?"

The Bard has no song about that. Yet.`,
  `He gives Joe his spare drumstick, with a red ribbon on it, and a gold thank-you heart.

Joe counts: three.

THE BARD'S DRUMSTICK
Pick it up (SPACE), for luck.`,
]);

/** Chapter 1's card, on the way into the square. */
export const CARD1 = page([
  `CHAPTER ONE
THE CLOCK TOWER

The town square, at one minute to seven, for quite a while now.`,
]);

/** The bell striking seven. */
export const BELL = page([
  `The hammer swings.

BONG. BONG. BONG. BONG. BONG. BONG. BONG.

Down in the square, everybody cheers.`,
]);

export const WON = page([
  `The field gate swings open, and the Long Road goes on over the hill, to friends Joe has not seen in a long time.

He counts the steps. He has a promise to keep at every one.`,
  `To be continued...

${CREDIT_NOTICE.join(' ')}`,
]);

export const LOST = page([
  `Joe winds down, all the way, and sits on the road for a little rest.

The road will still be there. So will his friends.`,
]);

export function readme(): string {
  return [
    TITLE,
    'Sandbox Software, 1996',
    '',
    'Type LARK and press Enter. You need a VGA display.',
    'A Sound Blaster plays the music; without one the PC',
    'speaker plays the sounds.',
    '',
    'Arrows (or W A S D) walk. Walk into a friend to talk.',
    'Space picks things up. In the clock tower, Up hops.',
    'F1 help, F2 status, F5 save, F6 load, Esc quits.',
    '',
    'This disk is not for sale. It was made for whoever',
    'found every tin heart.',
    '',
  ].join('\n');
}
