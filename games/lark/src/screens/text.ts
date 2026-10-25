// Every page of words: the storyline, the instructions, the credits, the ending, the lost page,
// each conversation and chapter card, and README.TXT. 30 columns, 16 lines a page (page() checks).
import { CREDIT_NOTICE, withCreditPage } from '../../../kit/license';
import { BREAKERS, DRUMSTICKS, FLOOR_PAGES, GEARS, LEG2_THANKS, LOFT_PAGES, NOTES, ROCKS, VALENTINES, WALKS } from '../ids';
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
  `KEEPSAKES
Some keepsakes teach Joe a move, wherever gravity pulls:

SPACE: spring hop (the winding key)
ENTER: rise (the heart balloon)
X: HELLO (the drumstick)
DOWN: pick up, from the side`,
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
Teenage Lewie`,
    `ALSO STARRING
The third goat from the left
THE CHEZ, a 1976 CitiCar
Carl, a fly
Will, a poet
Loaf #13, a loaf
The mustard seed
Watt, who fixes things
The Clown Club

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

/** Chapter 4's card. */
export const CARD4 = page([
  `CHAPTER FOUR
THE MUSIC BOX

A toy shop by the shore, long after closing. A music box as big as a doghouse. A goat who should not be there.`,
]);

/** The goat in the toy shop. */
export const TALK_GOAT = page([
  `The third goat from the left is standing by the big music box, looking guilty, with a little brass crank sticking out of her mouth.

Then she swallows. Gulp.`,
  `She came in for the rope round a jump rope. She stayed for the crank. Now the music box can't play, and the toy shop's music box is her favorite thing in the world.

She screams about it. Briefly.`,
  `Joe looks in at the keyhole. It is just big enough for a small tin robot.

Inside, ${NOTES} notes have come off the cylinder. Put them back, and the box can turn itself from the inside.`,
]);

/** The goat dancing: the thank-you. */
export const TALK_GOAT2 = page([
  `The music box plays! Its little dancer turns, the toys rattle on their shelves, and the third goat from the left dances on her hind legs, very badly, with all her heart.`,
  `Joe asks her what he came to ask: where could a robot find a real heart?

She looks at the music box. It is playing the song it always plays. It will play it for ever.`,
  `"That is a memory," says Joe, kindly. "Not a heart. A heart would learn a new song."

The goat thinks this over. Then she gives him the little dancer, who came loose, and a gold thank-you heart.

Joe counts: four.`,
  `THE LITTLE DANCER
Pick her up (SPACE). She turns, a little, when Joe walks.`,
]);

/** Chapter 5's card. */
export const CARD5 = page([
  `CHAPTER FIVE
THE CHARGING RUN

A car lot after dark. THE CHEZ, out of charge, nose to the charger. The charger, dark.`,
]);

/** Doc Leo at the lot's entrance. */
export const TALK_LOT = page([
  `"Joe! Twice in one night!" says Doc Leo. "THE CHEZ ran out of charge, so I pushed her the last block to the charger. And it's off."

Sir Reginald looks tired. He did not push.`,
  `"There are ${BREAKERS} breakers, one in every part of the lot. The gates between them open and shut on timers: amber means they're about to shut."

"I'd go myself, but somebody has to keep THE CHEZ company."`,
]);

/** THE CHEZ charging: the thank-you. */
export const TALK_LOT2 = page([
  `The charger hums. A little light by THE CHEZ's back wheel glows. Doc Leo pats her roof like a horse.

"Listen to that motor warm up," he says.`,
  `Joe asks his question: where could a robot find a real heart?

"Right there," says Doc Leo, pointing at the motor. "That's the heart of a car. Every car's got one."`,
  `Joe listens. Hmm-mmm, goes the motor, waiting for the road.

"It's THE CHEZ's heart," says Joe. "It's working very hard. But it's hers."

Doc Leo nods. He gives Joe THE CHEZ's spare fuse, and a gold thank-you heart. Joe counts: five.`,
  `THE SPARE FUSE
Pick it up (SPACE). Every robot should carry one.`,
]);

/** Chapter 6's card. */
export const CARD6 = page([
  `CHAPTER SIX
THE LIGHTHOUSE

The cove at the end of the shore road, and the lighthouse on its point, dark. Somewhere out there, a buzzing.`,
  `With the lamp out, almost nothing in the cove shows. Every few seconds the old lamp sputters, and the rocks flash.

Carl the fly knows the way. Follow his bright eyes.`,
]);

/** Carl in the lit cove: the thank-you. */
export const TALK_CARL = page([
  `The lamp turns, and its beam sweeps the cove, the rocks, the sea, and the boats coming home.

Carl buzzes round and round it, happy as a fly can be. He was lost in the dark for, he says, a very long time. Possibly a week.`,
  `Joe asks his question: where could a robot find a real heart?

"Look up!" says Carl. "That beam! Round and round all night, for everybody out there. That's a heart."`,
  `Joe watches the beam go round, for the boats, for the cove, for everybody else.

"It is kind," says Joe. "It is not mine."

Carl gives him a spare lens from the lamp, and a gold thank-you heart.`,
  `Joe counts: ${LEG2_THANKS === 6 ? 'six' : LEG2_THANKS}. Over the hill, the road goes on.

THE LAMP LENS
Pick it up (SPACE). It holds a little of the light.`,
]);

/** Over the hill: the third leg begins, in snow. */
export const OVER = page([
  `Over the hill the road goes white. It snowed all night, and it is still coming down, a flake at a time.

Joe counts the flakes for a while. Then he stops. There are too many, and every one is different.`,
  `THE WINTER ROAD
Two friends live along it, one stop after the other. The first lane leads to Lewie's street.`,
]);

/** Chapter 7's card. */
export const CARD7 = page([
  `CHAPTER SEVEN
SNOW DAY

No school. Two feet of snow. One teenager with a shovel and a whole street to dig out.`,
]);

/** Teenage Lewie, shoveling: what he needs. */
export const TALK_LEWIE = page([
  `"Hey, Joe!" Teenage Lewie leans on his shovel, red hat, red coat, red nose. "Snow day! I'm digging out the whole street."

"Who is paying you?" asks Joe.

"Nobody. They're my neighbors."`,
  `"I did our walk. There are ${WALKS} more, and both sidewalks are drifted shut. My spare shovel's in the box by the south sidewalk. Grab it?"

Joe counts the drifts. He counts them again. "Yes."`,
  `LEWIE'S SPARE SHOVEL
Walk into the box, then pick the shovel up (SPACE).

While Joe carries it, walk into a drift to shovel it away. Without a shovel, a drift won't budge.`,
  `Clear each neighbor's front walk right up to the doormat, and step on the mat.

Lewie's porch steps come clear when all ${WALKS} mats are swept.

The plow comes along the street now and then. It does not stop. Bumping it winds Joe down a little.`,
]);

/** Lewie at his hearth: the thank-you. */
export const TALK_LEWIE2 = page([
  `Every walk on the street is clear, and every doormat swept. Lewie whoops so loud that snow slides off his roof.

"Come in and get warm, Joe!"`,
  `Inside, the fire is going. There are mittens drying on the hearth and a cat asleep in front of it.

Joe asks his question: where could a robot find a real heart?`,
  `"Right here," says Lewie, and nods at the fire. "Every house has one. The hearth. It's where everybody comes to get warm."

Joe holds his tin hands out to it. They warm up nicely.`,
  `"It is a good heart," says Joe. "It belongs to the house."

"Keep the shovel," says Lewie. "You never know when it'll snow." He gives Joe a gold thank-you heart, too.

Joe counts: seven.`,
]);

/** Chapter 8's card. */
export const CARD8 = page([
  `CHAPTER EIGHT
OPEN MIC AT THE HIVE

A coffee house behind a little castle front. Open mic night. Somebody left the ceiling fans on high.`,
]);

/** Will, before his turn. */
export const TALK_WILL = page([
  `"Joe! Thank heaven, a friend!" Will clutches his bald head with both hands. His ruff is crooked. His slippers are on the wrong feet.

"I am next! And my sonnet is everywhere!"`,
  `The fans caught his pages when he stood up. ${FLOOR_PAGES} are still going round and round under them. The rest went whirling up the turret stair.

"The stair door sticks," says Will. "Bring me the first pages and it will open. It knows."`,
  `UP THE TURRET
Gravity pulls down in there, but warm air from the ovens rises: walk into it and it carries you up.

The fan's draft blows straight across. Hop up into it and let it carry you.`,
  `Walk into a page to take it. There are ${LOFT_PAGES} up the turret. The back stair at the top comes down by the stage.`,
]);

/** Will on stage: the thank-you. */
export const TALK_WILL2 = page([
  `Will reads his sonnet. All fourteen lines. Nobody in the Hive drinks a sip until it is over, and then everybody stands up.

Will bows so low his ruff touches the floor.`,
  `Joe asks his question: where could a robot find a real heart?

Will taps his sleeve. "Here! I wear my heart upon my sleeve, Joe. Everyone can see it. It is very embarrassing."`,
  `Joe looks at Will's sleeve. There is a little red heart stitched on it, crooked.

"You put your whole heart into that sonnet," says Joe. "I heard it. It is yours, though. You wrote it."`,
  `Will gives Joe his umbrella ("A poet is always caught out in the weather") and a gold thank-you heart.

Joe counts: eight.

WILL'S UMBRELLA
Pick it up (SPACE). It keeps the weather off.`,
]);

/** Chapter 9's card. */
export const CARD9 = page([
  `CHAPTER NINE
THE PAINTED ROCKS

Out of the snow at last. A little rock garden on a hill, the morning after the rain, and a small voice from a stone cubby.`,
]);

/** Loaf #13, calling from the cubby. */
export const TALK_LOAF = page([
  `"Hello? Is somebody there?" The voice comes out of a stone cubby with its door shut tight.

It is Loaf #13, the loaf nobody picked, who rolls wherever he likes. He rolled in here out of the rain.`,
  `"Somebody painted a rock for everyone who ever needed cheering up," says Loaf. "Each one lives in its own painted circle."

"The rain set them all rolling. And this door only unlatches when every rock is home."`,
  `THE PAINTED ROCKS
A painted rock rolls away from Joe, along its channel of sand, until a wall stops it.

Come at it from the far side and it rolls into its circle. Then give it a pat (walk into it).`,
  `${ROCKS} rocks, ${ROCKS} circles. One channel turns a corner: to send its rock round, stand where it would roll away from you the right way.`,
]);

/** Loaf, free: the thank-you. */
export const TALK_LOAF2 = page([
  `The cubby door swings open, and out rolls Loaf #13, warm and a little steamy, the way a loaf is when it is happy.

"Every rock home!" he says. "And me with them."`,
  `Joe asks his question: where could a robot find a real heart?

Loaf rolls back into the cubby and comes out with a stone: smooth, gray, heart-shaped, with a little sun painted on it.`,
  `"This one was painted for me," says Loaf. "A heart that lasts for ever. Stones don't break."

Joe holds it. It is cool and smooth and very, very still.

"It does not do anything," says Joe. "But it was made for you. That is something."`,
  `Loaf gives him the stone anyway ("I have the sun") and a gold thank-you heart.

Joe counts: nine.

THE HEART STONE
Pick it up (SPACE). It fits in a tin pocket.`,
]);

/** Chapter 10's card. */
export const CARD10 = page([
  `CHAPTER TEN
THE FAIR

Dusk at the fair. The carousel is turning, the Clown Club is juggling, and somewhere up above, a rubber chicken is floating away.`,
]);

/** Doc Leo at the fair's gate. */
export const TALK_FAIR = page([
  `"Joe! Three times in one night!" Doc Leo is holding an empty leash.

"I bought Sir Reginald a bunch of balloons. That was a mistake. He is rubber. He weighs nothing."`,
  `Up above the carousel, Reggie is floating to and fro under his balloons, looking down at everybody, the way a chicken does.

"He's over the canopy," says Doc Leo. "If only somebody could get up there."`,
  `THE CAROUSEL
The horses go up and down on their poles: the brass ones rise while the white ones fall.

Stand on a horse's saddle and ride it up. Step across to the next one when it is low.`,
  `From the last horse, the canopy. Catch Reggie as he floats by.

Then bring the good news to Doc Leo, at the gate. From the side, DOWN picks things up.`,
]);

/** Doc Leo and Reggie, reunited: the thank-you. */
export const TALK_FAIR2 = page([
  `Reggie is back on his leash, and the balloons are tied to a fence post, all but one: a red heart-shaped balloon.

The Clown Club cheers. One of them honks a horn twice, which means "hooray" in Clown.`,
  `Joe asks his question, for the third time tonight: where could a robot find a real heart?

Doc Leo hands him the heart balloon. "There's a heart, Joe. Light as air. It lifts you right up."`,
  `Joe holds the string. The balloon tugs upward, hopeful.

"It is a very nice heart," says Joe. "But if I let go, it would float away. A heart ought to stay."

"Then don't let go," says Doc Leo, and gives him a gold thank-you heart. Joe counts: ten.`,
  `THE HEART BALLOON
Pick it up (DOWN, from the side). While Joe carries it, wherever gravity pulls, hold ENTER to rise.

It holds only so much air. Run it out and ENTER only gets a "hm?". Little puffs of breeze fill it up again.`,
]);

/** Chapter 11's card. */
export const CARD11 = page([
  `CHAPTER ELEVEN
THE TALL PLANT

Past the fair, in a garden, a plant that started as the smallest seed in all the land and grew right up into the stars.`,
]);

/** The mustard seed at the foot of the plant. */
export const TALK_SEED = page([
  `"Joe!" calls the mustard seed from the top of the plant, a long way up. He is very small and has very great feet.

"I grew this! All of it! And now a star is caught in my top leaves."`,
  `"It fell asleep on the way across the sky and got tangled. I can't reach it. Could you?"

Joe looks up. And up. And up.

He counts the leaves. He runs out of counting before he runs out of plant.`,
  `UP THE PLANT
Gravity pulls down here. Some leaves hold steady. Some fold up and open again on their own: yellow at the tip means about to fold.`,
  `Halfway up there is nothing to stand on. Hold ENTER, and the heart balloon carries Joe up. A dandelion puff fills its air again.

Walk into the star to set it free.`,
]);

/** The seed and the star: the thank-you. */
export const TALK_SEED2 = page([
  `The star shakes out its points and sails up into the sky, back to its place, and the whole plant glows.

The top leaf uncurls, and there is the mustard seed, beaming.`,
  `Joe asks his question: where could a robot find a real heart?

"Up there," says the seed, and points his little arm at the star. "It shines for everybody. That's a heart, I'd say."`,
  `Joe looks at the star a long while. It is very beautiful, and very far away.

"It is the sky's," says Joe. "I would not take it down. Not even for a heart."`,
  `"Then go and see Watt," says the seed. "The robot who fixes things. His workshop is in the house at the end of the road."

He gives Joe a gold thank-you heart. Joe counts: eleven.`,
]);

/** The finale's card. */
export const CARD12 = page([
  `THE SMART HOME

The road ends at the Bitmores' house, the smart one. A storm scrambled it, and it is still in a grump: toasters hopping, the vacuum sulking, the thermostat scowling.`,
  `At the back of the house, by his charging socket, is the workshop of Watt, the little repair robot who can fix anything.

Joe has carried every keepsake all this way.`,
  `HELLO
X, with the Bard's drumstick: a friendly BOOM thrown the way Joe last moved. It cheers a grumpy gadget right up.

Bumping a grumpy one winds Joe down a little.`,
  `The thermostat is the Big Grumble. Each HELLO that reaches it calms it a little, but it lets off steam first, longer every time. Wait, then HELLO again.

Tall boards: the winding key's spring hop (SPACE), or the heart balloon (ENTER).`,
]);

/** Watt, and the gold. */
export const TALK_WATT = page([
  `Watt rolls out of his workshop on his little treads and looks up at Joe. "Beep?"

Joe asks him what he came all this way to ask: could he put in a real heart?`,
  `Watt thinks about it. Then he reaches up and opens the little hatch on Joe's chest, and looks in for a long time.

The light coming out of the hatch is gold.`,
  `"Beep," says Watt. "I fix things, Joe. There's nothing in here to fix."

Joe looks down. The brass tally counter is glowing gold. It has been counting all along: every kindness he gave, and every one he was given.`,
  `The whole house turns gold. And there is a honk outside.

THE CHEZ pulls up, Doc Leo at the wheel and Teddy in the front passenger seat, Gwinn running alongside, and everybody else piling in behind.`,
  `Everybody Joe helped came to see.

Joe looks at them all, and at the gold counter, and says it out loud:

"...Huh. It was in there the whole time."`,
]);

/** Opening time at the library. */
export const EPILOGUE = page([
  `Opening time at the Tiny Pockets Library. The note is gone from the desk, and Joe is back behind it, reading glasses on, bow tie straight.

He reads the tally out loud, to nobody in particular.`,
  `"Steps: 12,816. Valentines returned: ${VALENTINES}. Walks shoveled: ${WALKS}. Pages caught: ${FLOOR_PAGES + LOFT_PAGES}. Rocks rolled home: ${ROCKS}.

Hearts: 1. Gold."`,
  `"I stopped counting after that," says Joe.

"Some things you don't count. You just have them."

Click.`,
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
  `THE END

Every world he passed through, somebody was kind to Joe, and he left a little tin heart to say thank you.

Then he went back, and was kind right back.`,
  `Thank you for finding every one, and for walking the Long Road with him.

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
    'Space picks things up. Where gravity pulls, Up hops,',
    'Q and E hop sideways and Down picks things up.',
    'Keepsakes teach moves: Space (spring hop), Enter',
    '(the heart balloon) and X (HELLO).',
    'F1 help, F2 status, F5 save, F6 load, Esc quits.',
    '',
    'This disk is not for sale. It was made for whoever',
    'found every tin heart.',
    '',
  ].join('\n');
}
