// Every conversation in Procrastia. Lines are word-wrapped to Game-Maker's 30-column text
// pages (talk.ts); a blank line starts a new paragraph.
import type { Talk } from './talk';

const t = (id: string, who: string, name: string, theme: Talk['theme'], place: string, text: string, gift?: Talk['gift']): Talk => ({ id, who, name, theme, place, text, gift });

export const TALK = {
  // ---------------------------------------------------------------- Nowish
  gran: t(
    'gran',
    'grandma',
    'Grandma Pim',
    'nowish',
    'Nowish',
    `Pip! The King's crier came by. Last month. He said King Dillydally needs a hero "as soon as possible."

In Procrastia that means "eventually, maybe, if it's not raining." But you, Pip, you do things the DAY you're asked. Your grandfather never forgave you for it.

So off you go: north up the road to Laterburg and the castle.

SPACE swings your wooden sword. T drinks a tonic (you've one in your satchel). F2 shows your gold and your satchel. F5 saves.

And Pip? Mind the slimes. They put things off, too. Including biting you.`,
  ),
  leo1: t(
    'leo1',
    'docleo',
    'Doc Leo',
    'nowish',
    'Nowish',
    `Well, hello! Doc Leo, wandering minstrel, court jester at large, PhD in Comedic Science (honorary).

Have you seen Sir Reginald Cluckington III? Rubber chicken. Red harness. Answers to "Reggie," but only on Tuesdays.

He slipped his leash and went EAST, over the water. Do not ask me how a rubber chicken swims.

A hobo will take a job if it's offered. I'm offering YOU one. Find Reggie and I'll be waiting in my tent in Eventually Falls, with a reward and a kazoo.`,
  ),
  hodge: t(
    'hodge',
    'farmer',
    'Farmer Hodge',
    'nowish',
    'Nowish',
    `Procrastislimes got into the turnips again. They'll attack you later. Later's usually when you least expect it.

Whack 'em with your sword. They drop gems, and gems are as good as gold in any shop in the kingdom.

Bats come out up by the hills. You'll want a better sword than that stick for the bigger trouble. The smith in Laterburg sells steel.`,
  ),
  nowsign: t(
    'nowsign',
    'pip',
    'Signpost',
    'nowish',
    'Nowish',
    `NOWISH

Population: some.
Founded: about now.

LATERBURG: north, follow the road. Castle, King, shops.

SOMEDAY HARBOR: west of Laterburg.

THE SNOOZE BARROWS: north of Laterburg, under the hills. Shh.`,
  ),
  // ---------------------------------------------------------------- Laterburg
  guard: t(
    'guard',
    'guard',
    'Sir Snoozeby',
    'laterburg',
    'Laterburg',
    `Halt! Who goes th... oh. It's open. Go on in. I was going to lock it. I'll get to it.

The market's straight ahead: Brokk sells steel swords, Mother Tansy sells tonics, and the Pony rents a bed by the night for ten gold.

The King holds court in the Garden Court at the top of the street. Under the sky. He's been meaning to have the roof put on for forty years.`,
  ),
  king: t(
    'king',
    'king',
    'King Dillydally IX',
    'laterburg',
    'The Garden Court',
    `A hero! Splendid. We've been meaning to send for one ever since the Tuit went missing.

The Royal Round Tuit, boy! Every King of Procrastia has got around to things by it. Then Lord Deadline stole it and broke it in three, and now nobody gets around to ANYTHING.

The first piece is under the Snooze Barrows, north of here. Take this ROYAL WRIT: the Barrows' door is sealed in my name.

(You may already have one. Have another. They're free.)

Bring the pieces to Deadline Keep, beyond the Dawdle Flats. And do come back and tell me how it went. Whenever.`,
    'writ',
  ),
  kennel: t(
    'kennel',
    'kennel',
    'Kennelmaster Bess',
    'laterburg',
    'Royal Kennel',
    `The Royal Hounds ran off again!

TEDDY is a corgi. Red and white, ears like two sails, and he knows his left from his right. Last seen in the Whistling Woods east of the river.

GWINN is chocolate brown, a pit and lab, pink collar. Two n's in Gwinn. She's particular about that. She likes to dig on the beach south of Someday Harbor.

Find them. They'll come home on their own once they're found. Dogs know the way, they just don't feel like it. Then come to the kennel gate.`,
  ),
  kenrew: t(
    'kenrew',
    'teddy',
    'Teddy and Gwinn',
    'laterburg',
    'Royal Kennel',
    `Teddy spins left, then right, then rings the kennel bell with his nose. Gwinn steals a sausage off Bess's plate.

"They're home! Here's sixty gold, Pip, from the kennel fund."

"They'll be gone again by suppertime, I expect. They always are."`,
    'kennel',
  ),
  librar: t(
    'librar',
    'librarian',
    'Ms. Pagely',
    'laterburg',
    'Royal Library',
    `Shh. The Tome of Tomorrow is three hundred years overdue.

The fine is nine thousand gold. I would settle for the book.

It was last borrowed by a miner from Eventually Falls, and it has not been seen since they closed the Putoff Mines. The mines are as dark as a closed book. Take a lamp.

Bring it to the library gate. We are open Monday through Someday.`,
  ),
  librew: t(
    'librew',
    'librarian',
    'Ms. Pagely',
    'laterburg',
    'Royal Library',
    `The Tome of Tomorrow! Returned!

...It's blank. Of course it's blank. Tomorrow hasn't been written yet.

Here is one hundred gold: the Finder's Fee, which the library has been meaning to abolish since 1302.`,
    'library',
  ),
  smith: t(
    'smith',
    'smith',
    'Brokk the Smith',
    'laterburg',
    'Laterburg Market',
    `Steel sword, eighty gold. Walk into the counter to buy, then walk into it again to take it.

Wood does for slimes and bats. Crabs, eels, golems and anything in a helmet want steel. Anything Lord Deadline built wants steel twice.

I'd make you a shield, but I've been putting it off.`,
  ),
  barkeep: t(
    'barkeep',
    'barkeep',
    'Barnaby, the Pony',
    'laterburg',
    'The Procrastinating Pony',
    `Welcome to the Procrastinating Pony! A bed's ten gold at the counter: sleep it off, wake up whole.

Root beer? Family recipe. A dozen ingredients and a thirteenth nobody will name. Gran swore it's why we won a war once. Nobody talks about it.

And there's a hermit up at Eventually Falls who says the falls hide a garden, the garden hides a nest, and the nest is only full some of the time. Hermits.`,
  ),
  leo2: t(
    'leo2',
    'docleo',
    'Doc Leo',
    'laterburg',
    'Laterburg',
    `Doc Leo again! I stand at the back of every line. You meet more people that way, and they all leave before you.

Still no Reggie. The Flats are the only way east, and only Professor Fiddlesticks in Someday Harbor has anything that can cross them.

Bring Reggie to my tent in Eventually Falls and I'll teach you the Kazoo of Haste. It plays notes that fly. Very sharp notes.`,
  ),
  tuitsign: t(
    'tuitsign',
    'pip',
    'The Tuit Table',
    'laterburg',
    'The Garden Court',
    `THE TUIT TABLE

Here rested the Royal Round Tuit, by which the Kings of Procrastia got around to things.

Three pedestals, one for each piece. Walk into a pedestal: it lights if its piece is home with you.

Placed here by King Dillydally VI, who meant to write more on this sign.`,
  ),
  // ---------------------------------------------------------------- Someday Harbor
  marlow: t(
    'marlow',
    'harbor',
    'Harbor Master Marlow',
    'harbor',
    'Someday Harbor',
    `Fog's been sitting on the Soggy Vaults for years. Old sunken temple at the end of the long pier.

Only my foghorn shifts it, and I lent it to... somebody in the Snooze Barrows. Probably snoring on it.

Find the foghorn, then walk into the fog bank on the pier. One honk and it'll clear right off.

Mind the Tide Crabs in there. Steel, lad. Steel.`,
  ),
  volta: t(
    'volta',
    'tinker',
    'Prof. Fiddlesticks',
    'harbor',
    'The Garage',
    `Behold: THE CHEZ! A horseless carriage from the far-off future of 1976 and a half!

She runs on lightning. Her charge port is on the rear passenger side, for reasons I have never got around to understanding.

She'll cross the Dawdle Flats, forty leagues of tidal mud nobody has ever finished walking. But she's flat. Bring me anything with lightning in it and I'll open the garage door.

They say there's lightning in the Soggy Vaults. Charging takes one mile per hour. Per hour.`,
  ),
  salt: t(
    'salt',
    'fisher',
    'Old Salt',
    'harbor',
    'Someday Harbor',
    `Fish ain't biting. They're putting it off.

Seen a brown dog digging on the beach south of here, by the rocks. Pink collar. Dug up my lunch, my boot and a felt hat I never owned.

East of the Flats there's Eventually Falls, the Putoff Mines and that black castle with the stopped clock. Nobody goes there. Nobody's got round to it.`,
  ),
  leo3: t(
    'leo3',
    'docleo',
    'Doc Leo',
    'harbor',
    'Someday Harbor',
    `They say Lord Deadline hates nothing more than a thing put off. So he stole the one thing that gets things done, and now the whole kingdom waits for him.

A clown's advice? Fail big, then keep going. I fell off the pier this morning. Got a fish.

When you face him, fight like it's due today.`,
  ),
  minstr: t(
    'minstr',
    'minstrel',
    'Lyra the Minstrel',
    'harbor',
    'Someday Harbor',
    `Kazoo reeds! Ten gold a bundle, ten notes a bundle.

No kazoo yet? Doc Leo teaches the Kazoo of Haste, if you do him a favor. Until then you can hum through the reeds and press K. People will stare.

Tonics from Mother Tansy's cousin at the next stall, fifteen gold.

The bald fellow in the ruff and the sweatpants, down the end of the quay? That's Will, a playwright, visiting. Eleven years on one play. He has the title. ALAS, he says. FORSOOTH.

He swears there's a little tin heart in the grass by the lighthouse, ticking away. "Found it! Ticks like it means it," he keeps saying. He hasn't gone to look.`,
  ),
  // ---------------------------------------------------------------- Eventually Falls
  duff: t(
    'duff',
    'foreman',
    'Foreman Duff',
    'falls',
    'Eventually Falls',
    `The Putoff Mines are closed until further notice.

Further notice: you can go in. Up the road north, in the mountain.

It's black as a pocket in there. Buy a lamp at Hattie's stall or you'll get nowhere: the door won't let you past without one.

Something's been ticking down there for weeks. Tick, tock. Tick, tock. Like it's waiting for something.`,
  ),
  hattie: t(
    'hattie',
    'shopkeep',
    'Hattie',
    'falls',
    'Eventually Falls',
    `Hattie's General Store!

Miner's lamp, forty gold. Phoenix feather, a hundred gold: it's an extra life, don't ask me how. Tonics, fifteen.

Walk into the counter to pay, then again to take it.`,
  ),
  hermit: t(
    'hermit',
    'hermit',
    'Ambrose the Hermit',
    'falls',
    'Behind the Falls',
    `You found my garden! Most folk walk right past a waterfall. Never think to walk through one.

The nest? Something made of felt and gold turns up in it now and again, then it's gone. Watch it a while.

When it's there, stand over it and press ENTER. You'll keep it in your satchel. F2 shows you.

And if you have it, the stone by the nest has more to say.`,
  ),
  leo4: t(
    'leo4',
    'docleo',
    'Doc Leo',
    'falls',
    "Doc Leo's Tent",
    `My tent! Mind the rubber chickens. They're all decoys. Reggie is the only real rubber chicken.

Bring him to the tent flap there and I'll teach you the Kazoo of Haste.

He was last seen out in the Gloomwood, south of here, near that black castle. He has no sense of direction. He has no sense of anything. He's rubber.`,
  ),
  leorew: t(
    'leorew',
    'docleo',
    'Doc Leo',
    'falls',
    "Doc Leo's Tent",
    `REGGIE! You found him! Sir Reginald Cluckington III, home at last! Squeak!

As promised: the Kazoo of Haste. Press K to toot. Every toot is a note that flies straight and true, and a sharp note beats anything short of the King.

Twenty-five notes to start. Lyra sells reeds at the harbor, ten notes a bundle.

Now if you'll excuse me, I'm going to stand backward in a line.`,
    'kazoo',
  ),
  // ---------------------------------------------------------------- out in the world
  teddy: t(
    'teddy',
    'teddy',
    'Teddy',
    'wild',
    'Whistling Woods',
    `It's Teddy, the royal corgi!

He spins left, then right, to show you he knows the difference. He balances an acorn on his nose. He rings a bell that isn't there.

Then he trots off home to the kennel in Laterburg, ears up, like it was his idea.`,
    'dog',
  ),
  gwinn: t(
    'gwinn',
    'gwinn',
    'Gwinn',
    'harbor',
    'The Beach',
    `It's Gwinn! Two n's.

She drops what she was digging up at your feet. It's a sock. You did not need a sock.

She grins, gives the sock a sniff, takes it back, and lopes off toward Laterburg and her kennel.`,
    'dog',
  ),
  chick: t(
    'chick',
    'chick',
    'Sir Reginald',
    'dark',
    'The Gloomwood',
    `Squeak.

It's Sir Reginald Cluckington III! Red harness, leash trailing, looking extremely rubber.

Squeak. He'll find his way back to Doc Leo's tent, he says. (Squeak.) Rubber chickens always do.`,
    'chick',
  ),
  // ---------------------------------------------------------------- the pieces of the Tuit
  piece1: t(
    'piece1',
    'pip',
    'The First Piece',
    'nowish',
    'The Snooze Barrows',
    `Sir Snoozalot rolls over, mumbles "five more minutes," and is gone in a puff of dust.

Behind him, on a little stone plinth: a wedge of old oak edged in brass. The first piece of the Royal Round Tuit!

It's warm, and it hums faintly, like something that very much wants to get on with things.

(It glows on the Tuit Table in the Garden Court now. Two to go.)`,
    'piece',
  ),
  piece2: t(
    'piece2',
    'pip',
    'The Second Piece',
    'harbor',
    'The Soggy Vaults',
    `The Kraken of Kinda-Later sinks back into the deep, promising to come back for you eventually.

The second piece of the Round Tuit sits in a scallop shell, crackling with blue sparks. Lightning! It must have soaked it up from the storm-eels.

Professor Fiddlesticks wanted anything with lightning in it. THE CHEZ will drink this right up. (Don't worry. It's a tuit. It recharges.)`,
    'piece',
  ),
  piece3: t(
    'piece3',
    'pip',
    'The Third Piece',
    'falls',
    'The Putoff Mines',
    `Tick-Tock the Unpunctual winds down, chimes thirteen, and stops for good. Fashionably late to its own defeat.

The third piece of the Round Tuit was the key that wound it up.

Three pieces. One Round Tuit. All that's left is to get around to Deadline Keep, south of Eventually Falls, past the Gloomwood.`,
    'piece',
  ),
  // ---------------------------------------------------------------- the felt egg
  eggnote: {
    ...t(
      'eggnote',
      'egg',
      'The Heraldry Egg',
      'falls',
      'Behind the Falls',
      `The stone slides aside. Under it, a note in a tidy hand:

THE HERALDRY EGG. Forest-green felt quartered in gold diamonds like a herald's coat, a silver felt sword laid over a scrap of treasure map, and a road of brown backstitch winding all the way round the shell.

Stitched inside the lining:

Questmaster Gwinn (two n's, three quests, never once asked for directions)

Map inked by Lewis "Lewie" Moten III

Roads curved by Claude Opus 5.5

The royal map ends at the edge of the kingdom with "Here Be Root Beer," and a line the cartographer was far too polite to finish: "Taken from the Redcoats, fair and square, on a Tuesday, by..."`,
      'lore',
    ),
    before: ['eggshow.gif'],
  },
};
