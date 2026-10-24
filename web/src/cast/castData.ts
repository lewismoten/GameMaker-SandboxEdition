// The cast page (#/cast): the characters and things that turn up in more than one of this
// edition's new games, and the three kinds of games on the home page. Each picture is drawn
// from a game's own files by scripts/castArt.ts into public/cast/<id>.png (a few hundred bytes
// each); a test checks every "Appears in" game is in the catalog under the title given here.
//
// New cameos go in cameos.json: { "<member id>": [{ "game": "<game id>", "as": "what they do" }] }.
// They are added to that member's "Seen in" after the ones below (a game already listed is
// kept once). The Easter egg's and the tin heart's games come from each game's about.json
// (hidden.json, scripts/castHidden.ts), so a new game shows up with no edit here. A cameo in a game not in CAST_GAMES fails the test: add the game there first.
import CAMEOS from './cameos.json';
import HIDDEN from './hidden.json';

export type Family = 'sandbox' | 'bizarre';

/** The new games the cast appears in: their catalog title and who published them. */
export const CAST_GAMES = {
  blaster: ['Virus Blaster', 'sandbox'],
  brief: ['KEEP IT BRIEF! The Tiny Pockets Library', 'sandbox'],
  depth: ['Depth Perception', 'sandbox'],
  logic: ['Ohm Sweet Ohm', 'sandbox'],
  maximus: ['Maximus: The Hundred Worlds', 'sandbox'],
  realm: ['Quest for the Round Tuit', 'sandbox'],
  sandcast: ['Sandcastle Knight', 'sandbox'],
  sleuth: ['Final Curtain', 'sandbox'],
  snowbound: ['Snowbound: The $89 Shovel', 'sandbox'],
  teddy: ['Teddy’s Little Big Adventure', 'sandbox'],
  teddy2: ['Teddy’s Little Bigger Adventure', 'sandbox'],
  teddy3: ['Teddy’s Little Biggest Adventure', 'sandbox'],
  year2000: ['In The Year 2000!', 'sandbox'],
  carl: ['A Fly Named Carl', 'bizarre'],
  goat: ['Third Goat from the Left', 'bizarre'],
  loaf: ['Loaf #13 (Left in the Basket)', 'bizarre'],
  loofah: ['Cleanse Me, O Loofah, But Leave My Soul', 'bizarre'],
  mustard: ['Mustard Seed Hustle', 'bizarre'],
  needle: ['Thread the Needle, Brother Camel', 'bizarre'],
  reckoning: ['The Great Dairy Reckoning of 3:17 A.M.', 'bizarre'],
  remote: ['Where’s the Remote?!', 'bizarre'],
  risi: ['Veni, Vidi, Risi!', 'bizarre'],
  smirked: ['I Screamed, She Smirked', 'bizarre'],
  sweats: ['Shakespeare in Sweatpants', 'bizarre'],
  tickle: ['Certified Rat Tickler', 'bizarre'],
} as const satisfies Record<string, readonly [string, Family]>;

type CastGame = keyof typeof CAST_GAMES;

export interface Appearance {
  game: CastGame;
  /** What they do there, a few words. */
  as: string;
}

export interface CastMember {
  id: string;
  name: string;
  /** One line under the name: what they are. */
  role: string;
  /** What they say when they walk on stage (castStage.ts). */
  hi: string;
  /** public/cast/<id>.png, drawn from this game's files (scripts/castArt.ts). */
  art: { game: CastGame; width: number; height: number; alt: string };
  bio: string;
  appears: Appearance[];
}

const LISTED: CastMember[] = [
  {
    id: 'teddy',
    name: 'Teddy',
    role: 'Pembroke Welsh Corgi, red-gold, knows left from right',
    hi: 'Hi! I know left from right. Snacks go on the left. Or the right. Both. Snacks.',
    art: { game: 'teddy', width: 156, height: 156, alt: 'Teddy the corgi grinning, red-gold with a white blaze, his right ear a little taller than his left' },
    bio: 'A red-gold corgi with a white blaze, a big grin and, in the games, one ear a little shorter than the other (in real life they match; the lopsided ear just reads better in twenty pixels). He knows left from right, rings the bell, balances a treat on his nose, and will happily star in any game that has a snack in it. In his own adventures he fetches Doc Leo’s scattered costume before the Big Show and sniffs his way to the county fair; elsewhere he naps, supervises and follows you round the kitchen in case anything falls.',
    appears: [
      { game: 'teddy', as: 'the hero, fetching Doc Leo’s costume' },
      { game: 'teddy2', as: 'the hero, on Gwinn’s trail to the fair' },
      { game: 'teddy3', as: 'the birthday boy, running errands' },
      { game: 'sandcast', as: 'the corgi knight, rebuilding the castles' },
      { game: 'realm', as: 'a royal hound' },
      { game: 'brief', as: 'napping on a sweater in Lost and Found' },
      { game: 'depth', as: 'ray-traced, in chrome' },
      { game: 'blaster', as: 'a framed photo on the desk' },
      { game: 'carl', as: 'snapping at flies' },
      { game: 'loofah', as: 'asleep in the hall' },
      { game: 'reckoning', as: 'asleep, then pacing' },
      { game: 'remote', as: 'following you round the kitchen' },
      { game: 'risi', as: 'a good Roman dog (CAVE CANEM)' },
      { game: 'sweats', as: 'asleep in the audience, awake for the bow' },
    ],
  },
  {
    id: 'gwinn',
    name: 'Gwinn',
    role: 'Teddy’s big sister and sister-in-mischief',
    hi: 'It wasn’t me. (It was me.) Zoomies!',
    art: { game: 'teddy', width: 146, height: 146, alt: 'Gwinn, a chocolate-brown dog with amber eyes, a big grin and a pink collar' },
    bio: 'Chocolate-brown, amber-eyed, pink collar, adopted, and usually the one causing the trouble: she is the reason most of these games have a plot. She scattered the costume, flattened the sandcastles with her zoomies and ate a recipe card. She knows one trick (zoomies) and a SIT she has not quite learned. She is not allowed in the library, and she is in the library.',
    appears: [
      { game: 'teddy', as: 'the one who ran off with the suitcase' },
      { game: 'teddy2', as: 'the hero of the MEANWHILE… levels' },
      { game: 'teddy3', as: 'keeping a secret (almost) and digging up her best bone' },
      { game: 'sandcast', as: 'on the loose, asleep across doorways' },
      { game: 'realm', as: 'a royal hound' },
      { game: 'brief', as: 'in the library, where she is not allowed' },
      { game: 'depth', as: 'ray-traced, in chrome' },
      { game: 'loofah', as: 'asleep in the hall' },
      { game: 'reckoning', as: 'asleep, until she isn’t' },
      { game: 'risi', as: 'a Roman dog' },
      { game: 'sweats', as: 'in the audience' },
    ],
  },
  {
    id: 'leo',
    name: 'Doc Leo',
    role: 'Hobo clown, PhD in Comedic Science',
    hi: 'Nose on: showtime! Has anyone seen my chicken? He answers to Reggie. On Tuesdays.',
    art: {
      game: 'teddy',
      width: 224,
      height: 147,
      alt: 'Doc Leo, a smiling hobo clown with a fedora, red nose, stubble beard, purple shirt and green tie, holding a yellow rubber chicken on a leash',
    },
    bio: 'Lewis’s friendly hobo clown: a chewed-up fedora, a red nose, a purple shirt, a green tie, a corduroy jacket, blue suspenders, red sneakers and a rubber chicken on a dog leash. Nose on: showtime. A hobo takes a job if one’s offered (a tramp won’t), so he hosts open mics, juggles three rubber chickens (one real), tickles rats with a certificate to prove it, and always orders root beer.',
    appears: [
      { game: 'teddy', as: 'the star of the Big Show, missing his costume' },
      { game: 'teddy2', as: 'beside THE CHEZ at every stop' },
      { game: 'teddy3', as: 'a hero at last: balloon dogs, pratfalls and the party lights' },
      { game: 'realm', as: 'the jester in Eventually Falls' },
      { game: 'brief', as: 'in the library, day and night' },
      { game: 'depth', as: 'ray-traced, chicken and all' },
      { game: 'maximus', as: 'hailing you from Boxcar Flats' },
      { game: 'sandcast', as: 'Co-SysOp of the secret BBS' },
      { game: 'tickle', as: 'the hero, a Certified Rat Tickler' },
      { game: 'loofah', as: 'off duty, in the bath' },
      { game: 'reckoning', as: 'off duty, at 3:17 A.M.' },
      { game: 'smirked', as: 'the haunted house’s friendly portrait' },
      { game: 'sweats', as: 'host of open-mic night' },
      { game: 'risi', as: 'a rooftop philosopher and the theater’s jester' },
    ],
  },
  {
    id: 'chez',
    name: 'THE CHEZ',
    role: 'A tomato-red 1976½ CitiCar. Always charging.',
    hi: 'Ah-OOO-gah! Don’t mind me, I’m charging. I am always charging.',
    art: {
      game: 'teddy',
      width: 120,
      height: 56,
      alt: 'THE CHEZ from the side: a short tomato-red wedge of a car with a black roof, racing stripes along its side and white steel wheels',
    },
    bio: 'Lewis’s own electric car: a tomato-red 1976½ CitiCar, about half the length of anything parked next to it, with a black roof and racing stripes (they make the car go faster). It pulls a parade float at its usual few miles an hour, clears the road with an ah-OOO-gah, and turns up at a curb in nearly every Sandbox game. It is charging. It is always charging.',
    appears: [
      { game: 'teddy', as: 'waiting at the end of every level' },
      { game: 'teddy2', as: 'leading the fair parade' },
      { game: 'teddy3', as: 'yours to drive, minding the charge' },
      { game: 'realm', as: 'yours to drive across the Dawdle Flats' },
      { game: 'brief', as: 'at the curb, on its charger' },
      { game: 'depth', as: 'ray-traced in the Teapot Temple' },
      { game: 'logic', as: 'a circuit board: power lights its headlights' },
      { game: 'snowbound', as: 'buried in the mall parking lot' },
      { game: 'year2000', as: 'Grandpa’s, and flying in the Skyway’s slow lane' },
      { game: 'tickle', as: 'through the classroom window, charging' },
      { game: 'sweats', as: 'at The Hive’s curb' },
      { game: 'risi', as: 'by the gate: QVID EST?' },
    ],
  },
  {
    id: 'chicken',
    name: 'Sir Reginald Cluckington III',
    role: 'A rubber chicken on a dog leash',
    hi: 'SQUAWK. (That counts as an extra life.)',
    art: { game: 'teddy', width: 60, height: 112, alt: 'Sir Reginald Cluckington III, a yellow rubber chicken with a red comb, standing tall' },
    bio: 'Doc Leo’s rubber chicken, walked on a dog leash wherever Doc Leo goes. Answers to “Reggie”, but only on Tuesdays. He has slipped his leash more than once (do not ask how a rubber chicken swims), and when he squawks, it counts as an extra life.',
    appears: [
      { game: 'teddy', as: 'a costume piece to fetch' },
      { game: 'teddy2', as: 'lost, circling the river eddy' },
      { game: 'teddy3', as: 'squawking at pigeons' },
      { game: 'realm', as: 'the lost-chicken quest' },
      { game: 'brief', as: 'a spare in Lost and Found' },
      { game: 'depth', as: 'on Doc Leo’s leash' },
      { game: 'maximus', as: 'in Doc Leo’s hail' },
      { game: 'tickle', as: 'an extra life that honks' },
      { game: 'sweats', as: 'on Doc Leo’s leash' },
      { game: 'risi', as: 'on Doc Leo’s leash' },
    ],
  },
  {
    id: 'doghouse',
    name: 'The Dog House',
    role: 'Lewis’s dog-themed little lending library (and the Tiny Pockets Library inside)',
    hi: 'Take a book, leave a book. Snacks in the drawer. Woof!',
    art: {
      game: 'teddy',
      width: 164,
      height: 182,
      alt: 'The Dog House, a white library box with a dark roof and a red door full of dog books, over a cubby of painted rocks',
    },
    bio: 'Lewis’s little lending library, with a red door, a dog-bone handle, a paw-print knob, dog books inside and painted rocks in the cubby underneath. Take a book, leave a book; there are snacks in the drawer. Behind its red door is a library much bigger than the box.',
    appears: [
      { game: 'teddy', as: 'on Maple Street, with a Teddy-sized room inside' },
      { game: 'teddy2', as: 'in the cast cartoon at dusk' },
      { game: 'brief', as: 'the whole library, behind the red door' },
      { game: 'logic', as: 'a photo on Watt’s board' },
    ],
  },
  {
    id: 'rootbeer',
    name: 'Root beer',
    role: 'The only drink Doc Leo orders',
    hi: 'Twelve ingredients, and a thirteenth nobody will name. Frosty mug?',
    art: { game: 'teddy', width: 40, height: 40, alt: 'A red-and-white root beer stand with a frosty mug of root beer on the counter' },
    bio: 'Doc Leo always orders root beer, and so the games keep pouring it: a stand on the midway, a frosty mug that warms you up after shoveling, crocks in a farmhouse kitchen. The family recipe has twelve ingredients and a thirteenth nobody will name; clues to it are filed, framed, mailed and lost all over the Sandbox games.',
    appears: [
      { game: 'teddy', as: 'the midway stand: a mug worth fetching' },
      { game: 'teddy2', as: 'the stand, the signboard and the crocks' },
      { game: 'snowbound', as: 'the snack bar’s only drink: +35 warmth' },
      { game: 'realm', as: 'the inn’s lore: Here Be Root Beer' },
      { game: 'sleuth', as: 'Case 13, never closed' },
      { game: 'brief', as: 'a recipe card filed under 641.5' },
      { game: 'year2000', as: 'a postcard about the thirteenth ingredient' },
    ],
  },
  {
    id: 'tinHeart',
    name: 'The tin heart',
    role: 'Small, riveted, ticking. Hidden somewhere.',
    hi: 'Tick… tock… Yes, I have a heart. I am a heart. Find me!',
    art: { game: 'teddy', width: 14, height: 12, alt: 'The tin heart: a small grey riveted tin heart with a shine on its corner' },
    bio: 'A little riveted tin heart that ticks, a nod to the Tin Man, who went all the way to Oz to get one. One is hidden in every Sandbox and Bard of Bizarre game, so it is something to look for: listen for the tick-tock.',
    appears: [],
  },
  {
    id: 'easterEgg',
    name: 'The Easter egg',
    role: 'Hand-painted. Hidden. Not a chicken’s.',
    hi: 'Zigzags on this side, stars on the other. Don’t tell anyone where I am.',
    art: { game: 'teddy', width: 20, height: 19, alt: 'A painted Easter egg: a rose shell with blue zigzags, yellow dots and a white glint' },
    bio: 'Somebody dyed it, painted it by hand (bands, zigzags, dots or stars) and tucked it away: one is hidden in every Sandbox and Bard of Bizarre game. Touch it for a few points and the satisfaction of having looked behind the couch. Nobody knows who keeps hiding them. (Not the Easter Bunny. He has an alibi.)',
    appears: [],
  },
  {
    id: 'joe',
    name: 'Mystery Robot Joe',
    role: 'Night librarian, The Dog House',
    hi: 'Exactly one hundred words. I counted. Twice.',
    art: { game: 'brief', width: 20, height: 20, alt: 'Mystery Robot Joe, a tin box robot with a bulb on his antenna, reading glasses and a red bow tie' },
    bio: 'A tin box of a robot with a bulb on his antenna, reading glasses he does not need, a red bow tie and a tally counter for a heart. When every word fell out of every book, he put them back, exactly one hundred at a time. Two of the stories first went up under his name. He has a job now.',
    appears: [{ game: 'brief', as: 'the hero, restoring thirty-two stories' }],
  },
  {
    id: 'watt',
    name: 'Watt',
    role: 'Pocket-sized repair robot (there’s no place like Ohm)',
    hi: 'Beep. Has anyone seen my charging socket? It’s in the fuse box. Probably.',
    art: { game: 'logic', width: 20, height: 16, alt: 'Watt, a little robot with a glass dome head, big eyes and a red antenna light, on treads' },
    bio: 'A pocket-sized repair robot who lives in the Bitmores’ fuse box. Lightning bounced him into the toaster, so he rolls through every appliance’s circuit board, one block per press, to get back to his charging socket. Live current fizzles him in a blink; R reboots him, no hard feelings.',
    appears: [
      { game: 'logic', as: 'the hero, home through twenty-odd boards' },
      { game: 'blaster', as: 'blinking at you on Memory Lane' },
    ],
  },
  {
    id: 'lewis',
    name: 'Lewis “Lewie” Moten III',
    role: 'The person behind all of them',
    hi: 'Hi, I’m Lewis. The dogs are mine, the car is mine, and the clown… is also me.',
    art: {
      game: 'sandcast',
      width: 180,
      height: 180,
      alt: 'A pixel selfie of Lewis in violet sunglasses and a red polo beside Teddy, in front of a white gazebo',
    },
    bio: 'Teddy and Gwinn’s person, THE CHEZ’s driver, the man under Doc Leo’s fedora and the Bard behind the songs. He drew 3D art for BBSes in 1995 and has been making things for screens ever since. In the games he mostly stays behind the camera, except for one selfie with Teddy, waiting on a secret BBS.',
    appears: [
      { game: 'sandcast', as: 'SysOp of the secret BBS, in a selfie with Teddy' },
      { game: 'teddy', as: 'a snapshot at the gazebo with Teddy' },
      { game: 'tickle', as: 'named on the certificate' },
    ],
  },
  {
    id: 'lewie',
    name: 'Teenage Lewie',
    role: 'Snow shoveler, future game maker, December 1992',
    hi: 'Each driveway is one pixel of the game I’m going to make. Eighty-nine to go.',
    art: { game: 'snowbound', width: 20, height: 20, alt: 'Teenage Lewie in a red knit hat and red coat, holding a snow shovel' },
    bio: 'Lewis at fifteen-ish, in a red knit hat, with a shovel and a coffee can. Game-Maker costs $89 at the mall until January, so it’s a dollar a scoop, a paper route at dawn and a lot of dodging (a dog named Biscuit, Big Pete, the plows). The newspaper calls him “our founder”.',
    appears: [{ game: 'snowbound', as: 'the hero, shoveling his way to $89' }],
  },
  {
    id: 'bard',
    name: 'The Bard of Bizarre',
    role: 'Songwriter, game publisher, keeper of the rooster',
    hi: 'Hark! A song about a goat nobody painted. You’ll love it. Carl won’t.',
    art: { game: 'carl', width: 120, height: 112, alt: 'The Bard of Bizarre’s logo: a rooster in spectacles over the words The Bard of Bizarre' },
    bio: 'Big, heartfelt songs about all the wrong things: the goat nobody painted, the loaf nobody picked, a fly named Carl. The Bard is Lewis’s name for his songs, with Doc Leo as his face, and his rooster in spectacles struts out at the start of every one of his games. His slide sums him up: writes songs, makes games, hates Carl.',
    appears: [
      { game: 'carl', as: 'the opening sting' },
      { game: 'goat', as: 'his rooster wanders the caravan and the stable' },
      { game: 'loaf', as: 'the opening sting' },
      { game: 'loofah', as: 'the opening sting' },
      { game: 'mustard', as: 'the opening sting' },
      { game: 'needle', as: 'the opening sting' },
      { game: 'reckoning', as: 'the opening sting' },
      { game: 'remote', as: 'the opening sting' },
      { game: 'risi', as: 'the opening sting' },
      { game: 'smirked', as: 'the opening sting' },
      { game: 'sweats', as: 'the opening sting' },
      { game: 'tickle', as: 'the opening sting' },
    ],
  },
  {
    id: 'carl',
    name: 'Carl',
    role: 'A fly. Just a fly. (He would disagree.)',
    hi: 'Bzzzz. I broke time. Also your sandwich.',
    art: { game: 'carl', width: 20, height: 19, alt: 'Carl the fly: big red eyes, striped body, smug little wings' },
    bio: 'Big red eyes, a smug grin and a barrel roll that makes every swatter miss. Some say flies live twenty-four hours; Carl has broken time, and he keeps buzzing into other people’s songs: the bath, the fridge at 3:17 A.M., a haunted house and an open-mic night, where a hello is a tip.',
    appears: [
      { game: 'carl', as: 'the star, after eight snacks and a lamp of his own' },
      { game: 'loofah', as: 'buzzing round the bath' },
      { game: 'reckoning', as: 'in the fridge' },
      { game: 'smirked', as: 'in the webs, seeing things' },
      { game: 'sweats', as: 'heckling half the monologues' },
    ],
  },
  {
    id: 'goat',
    name: 'The third goat from the left',
    role: 'The least-painted goat in Bethlehem',
    hi: 'AAAAAAH! (Sorry. I scream when I’m happy. Also when I’m not.)',
    art: { game: 'goat', width: 20, height: 20, alt: 'The third goat from the left, facing you with her ears out' },
    bio: 'Nobody put her in the nativity painting, so she put herself in every song since. She screams when her breath is full, faints stiff with her legs in the air, and eats rope, including the gate’s. Look for her grazing on lost socks, haunting a parade under a sheet, or framed on a hallway wall.',
    appears: [
      { game: 'goat', as: 'the star, screaming her way to the manger' },
      { game: 'carl', as: 'on the TV, and in the wild' },
      { game: 'loaf', as: 'on the hill' },
      { game: 'loofah', as: 'a poster on the end cap' },
      { game: 'mustard', as: '“a certain goat” on the mountain' },
      { game: 'needle', as: 'a white goat in the desert' },
      { game: 'reckoning', as: 'a painting in the hall' },
      { game: 'remote', as: 'grazing on lost socks in the void' },
      { game: 'smirked', as: 'a ghost goat under a sheet' },
      { game: 'sweats', as: 'in the crowd, and at the bow' },
      { game: 'tickle', as: 'up the tower' },
    ],
  },
  {
    id: 'seed',
    name: 'The mustard seed',
    role: 'The smallest seed with the biggest dreams',
    hi: 'Small seed, big dreams, red sneakers. Watch me move a mountain.',
    art: { game: 'mustard', width: 20, height: 18, alt: 'The mustard seed: a round yellow seed with a face and tiny red sneakers' },
    bio: 'A round yellow seed in tiny red sneakers, “the greatest feet there are”. It sprouts, grows, and moves a mountain, then goes everywhere on a field trip: the spice rack, the fridge door, between the sofa cushions. Say hello for points.',
    appears: [
      { game: 'mustard', as: 'the star, from seed to sprout to plant' },
      { game: 'carl', as: 'on the walls and in the wild' },
      { game: 'loaf', as: 'among the baskets' },
      { game: 'loofah', as: 'at the spice rack' },
      { game: 'needle', as: 'at the tailor’s' },
      { game: 'reckoning', as: 'on the fridge door, by the mustard' },
      { game: 'remote', as: 'lost between the cushions' },
      { game: 'smirked', as: 'on a field trip' },
      { game: 'tickle', as: 'in the lab' },
    ],
  },
  {
    id: 'loaf',
    name: 'Loaf #13',
    role: 'The bread nobody picked',
    hi: 'Nobody picked me. I’m still bread. That’s the point.',
    art: { game: 'loaf', width: 20, height: 14, alt: 'Loaf #13: a round crusty loaf with a little face' },
    bio: 'Five thousand were fed, twelve baskets were gathered, and one round crusty loaf with three score marks was left in the basket. It rolls, it rises, it gets carried home, and at the end it is still bread. It has since turned up on a coffee table, in a bread box and on a lunch tray.',
    appears: [
      { game: 'loaf', as: 'the star, rolling home' },
      { game: 'carl', as: 'on the coffee table' },
      { game: 'loofah', as: 'in the day-old bin' },
      { game: 'reckoning', as: 'in the bread box' },
      { game: 'smirked', as: 'a souvenir marked 13' },
      { game: 'tickle', as: 'on a lunch tray' },
    ],
  },
  {
    id: 'camel',
    name: 'Brother Camel',
    role: 'Left holding the rich man’s gold',
    hi: 'Lord, I got knees that don’t even bend… but I’m going through that needle.',
    art: { game: 'needle', width: 20, height: 32, alt: 'Brother Camel standing tall, loaded with red saddlebags' },
    bio: 'The rich man walked away; the camel stayed. He gives the gold away, slims down from saddlebags to fancy curled shoes to nothing at all, and kneels hump-down to crawl through the eye of the needle. Even a camel can dream. Off duty he rests in a nature documentary and kneels by a well.',
    appears: [
      { game: 'needle', as: 'the star, through the eye of the needle' },
      { game: 'carl', as: 'resting in the documentary’s desert' },
      { game: 'loaf', as: 'kneeling by the well' },
      { game: 'reckoning', as: 'a photo on the hall wall' },
    ],
  },
  {
    id: 'will',
    name: 'Shakespeare (Will)',
    role: 'A starched ruff, grey sweatpants, fuzzy slippers',
    hi: 'Alas! Forsooth! I have lost a pen, and it was the most tragic night of my life.',
    art: { game: 'sweats', width: 20, height: 20, alt: 'Shakespeare in a white ruff, a purple velvet doublet, grey sweatpants and pink fuzzy slippers' },
    bio: 'The open-mic regular at The Hive: bald dome, pointed beard, gold earring, a starched ruff over a velvet doublet, and grey sweatpants. He holds his coffee up like Yorick’s skull and declaims seventeen monologues about the most dramatic things that ever happened to him, like a ficus named Gerald and the self-checkout. No coffee, no stage.',
    appears: [{ game: 'sweats', as: 'the star of open-mic night' }],
  },
];

/** A hidden thing's place, from its game's about.json (hidden.json): only the level, never where on it. */
const hiddenOn = (map: string) => `hidden somewhere on the ${map.replace(/\.map$/i, '').replace(/[_-]+/g, ' ')} map`;

/**
 * Everyone, with the cameos from cameos.json added to their games, and the hidden things (the
 * Easter egg, the tin heart) in every game whose about.json places one (hidden.json, made by
 * scripts/castHidden.ts), in cameos.json's words where it has some.
 */
export const CAST: CastMember[] = LISTED.map((m) => {
  const said = (CAMEOS as Record<string, Appearance[]>)[m.id] ?? [];
  const placed = ((HIDDEN as unknown as Record<string, [string, string][]>)[m.id] ?? [])
    .filter(([game]) => game in CAST_GAMES)
    .map(([game, map]) => said.find((a) => a.game === game) ?? { game: game as CastGame, as: hiddenOn(map) });
  const more = [...placed, ...said].filter((a, i, all) => !m.appears.some((b) => b.game === a.game) && all.findIndex((b) => b.game === a.game) === i);
  return more.length ? { ...m, appears: [...m.appears, ...more] } : m;
});

/** The families a member belongs to, from the games they appear in. */
export const familiesOf = (m: CastMember): Family[] => [...new Set(m.appears.map((a) => CAST_GAMES[a.game][1]))];
