// The words around the words: the storyline, the instructions, the credits, each book's
// cover page, the thirty-third book, the endings and README.TXT. Lewis's stories themselves
// are in stories.ts and go on their pages untouched (pages.ts).
import { withCreditPage } from '../../../kit/license';
import type { Story } from '../stories';
import { PAGE, page, wrap } from './pages';

export const STORY = page([
  `Behind the little red door of The Dog House, a little lending library on a post, there is a library much bigger than the box.

Every book on its shelves holds exactly one hundred words.

Not ninety-nine. Not one hundred and one.`,
  `Last night the Word Counter jammed.

It said 99. Then 101. Then STOP.

And every word fell out of every book.`,
  `You are MYSTERY ROBOT JOE, the night librarian: a tin robot with a bow tie, reading glasses he does not need, and a tally counter for a heart.

Step into each book, pick its hundred words up off the floor, and put the story back together before the morning patrons arrive.`,
  `Mind the shushers. They hand out fines.

Mind Gwinn, too. She is not allowed in the library, and she is in the library.

...And, as always, keep it brief!`,
]);

export const HELP = page([
  `KEYS
 Arrows, W A S D or the
 number pad: one step
 (hold to keep walking)
 F1 help
 F2 status: Money is the
    words you carry. Words
    are money.
 P  pocket a small thing
 F5 save  F6 load
 Esc  quit to the menu

Walk into a door, a book or a page to use it.`,
  `THE LIBRARY
 The reading room has a
 door to each of the eight
 wings. Each wing's
 hallway has four tall
 books on its shelves:
 walk into a spine and in
 you go.

 The door marked OUT goes
 back to the reading room.`,
  `IN A BOOK
 The words lie on the
 floor as slips of paper:
 1, 5, 10 and 20 words.
 Every book has exactly
 100.

 THE END is locked until
 you carry 100. It takes
 them, opens, and the
 bookmark behind it puts
 the story back. That is
 the only way out.`,
  `SHUSHERS
 ...and scissors, static,
 clothes pegs and the like
 cannot take your words.
 They fine you instead: a
 point off your score for
 every moment they touch
 you.

 Overdue fines are a
 librarian's love
 language. Stay out of
 their way.`,
  `WORD LOCKS
 Late in the library, a
 brass turnstile marked 20
 guards a corner of a book.
 It turns only for a reader
 carrying 20 words. It
 takes them, and the floor
 behind it hands them
 straight back.

 So pick up what you can
 reach first.`,
  `THE RESERVE STACKS
 The purple STAX door in
 the reading room leads
 to the Reserve Stacks.
 Eight stamp gates stand
 in a row there, each
 inked with its wing's
 stamp. A gate opens once
 its wing has four stories
 stamped SHELVED.

 What is past the gates?
 Exactly one hundred
 words. Ask anyone.`,
]);

const CREDITS_TEXT = page([
  `KEEP IT BRIEF!
The Tiny Pockets Library

Thirty-two 100 Word Stories by Lewis Moten, word for word.

He wrote every one of them for Laurence Simon's weekly 100 Word Stories challenge on the 100 Word Stories Podcast, in 2009-2014 and 2026.`,
  `Thank you, Laurence Simon, for one hundred words a week, every week, for more than a thousand weeks, and the podcast's writers and listeners, whose weekly winners chose the next topic.

Two of these stories first went up under the name Mystery Robot Joe. He has a job now.`,
  `Game design, art, music and every block of the library: Claude Opus 5.5

Starring Mystery Robot Joe, Teddy (a corgi who knows left from right), Gwinn and Doc Leo, PhD (Comedic Science).

THE CHEZ, the CitiCar, is parked out front. It is charging. It is always charging.`,
  `Published by Sandbox Software. Late fees not included.

Made with Game-Maker 3.0 from Recreational Software Designs.

No words were harmed in the making of this game. A few were fined.`,
]);

/** The credits, ending with the FREE TO SHARE page (kit/license.ts). */
export const CREDITS = withCreditPage(CREDITS_TEXT);

export const WON = page([
  `The Word Counter clears its throat.

3,200.

Exactly. It checks twice. It rings its little bell.`,
  `When the morning patrons arrive, every book is back on its shelf with every one of its words, and the reading room smells faintly of corgi.

Joe winds his tally counter back to zero and straightens his bow tie.`,
  `Somewhere out front, a little red door clicks shut on a little library on a post.

THE END
(of exactly that many words)

...And, as always, keep it brief!`,
]);

/**
 * The felt egg's page: shown on the way out of the Lost and Found. Its name, the egg, its
 * credits and its piece of the mystery (web/src/eggs/eggs.ts has the same).
 */
export const EGG = page([
  `THE BOOKWORM EGG

Cream felt ruled with pale lines like a notebook page, blanket-stitched in gold. A green felt bookworm in red reading glasses curls around its middle, and a red ribbon bookmark hangs from the top.

Finders, pocketers. If it is in your pocket (F2), it is yours.`,
  `Tucked under the ribbon: a recipe card, filed under 641.5 (cookbooks), stained brown and still a little fizzy.

"ROOT BEER. Serves a baker's dozen. For ingredient 13, see other side."

The other side is overdue.`,
  `Felted by Lewis "Lewie" Moten III, who felted a Doc Leo clown egg first.

Shelved by Claude Opus 5.5.

Chewed (slightly) by Teddy. Hidden by Gwinn. Guarded by Doc Leo, facing the wrong way.

...And, as always, keep it brief!`,
]);

export const LOST = page([
  `You can't lose in a library.

You can only be overdue.

Your fine is one word a day. The Word Counter is still counting.`,
]);

/** The Word Counter's complaints: one on every book's cover page. */
const COMPLAINTS = [
  '099. 101. STOP.',
  'ONE HUNDRED. I HAVE STANDARDS.',
  'NINETY-NINE IS A DRAFT.',
  'ONE HUNDRED AND ONE IS AN ESSAY.',
  'COUNT TWICE. SHELVE ONCE.',
  'A HYPHEN IS ONE WORD. DO NOT START WITH ME.',
  'NO REFUNDS ON ADVERBS.',
  'I DO NOT GIVE PARTIAL CREDIT.',
  'BREVITY IS THE SOUL OF WIT. I AM THE SOUL OF BREVITY.',
  'WORDS ARE MONEY. SPEND THEM ALL ON ONE BOOK.',
  "IF YOU FIND A WORD UNDER THE RUG, IT IS GWINN'S.",
  'EVERY WORD COUNTS. I SHOULD KNOW.',
  'THE ELLIPSIS IS NOT THREE WORDS...',
  'TITLES ARE FREE. DO NOT GET USED TO IT.',
  'KEEP IT BRIEF. THIS MEANS YOU.',
  'I WAS JAMMED. NOW I AM MERELY GRUMPY.',
  'NO ROUNDING UP. NO ROUNDING DOWN. NO ROUNDING.',
  'A PICTURE IS WORTH A THOUSAND WORDS. TOO MANY.',
  'SILENCE IS GOLDEN. WORDS ARE OVERDUE.',
  'I COUNTED THE STARS ONCE. EXACTLY 100. FOR A WHILE.',
  'PLEASE DO NOT FEED THE BOOKS.',
  'THE SHUSHERS WORK FOR ME. ALLEGEDLY.',
  'YES, "A" IS A WORD. YES, IT COUNTS.',
  'ONE HUNDRED IS A ROUND NUMBER. I ROUNDED IT.',
  'FINES: ONE WORD A DAY. PAYABLE IN NOUNS.',
  'DOC LEO OWES ME FOUR WORDS. HE PAID IN HONKS.',
  'FILL ME UP. NOT OVER. UP.',
  'I DREAM OF NINETY-NINE. IT IS A NIGHTMARE.',
  'WHO WROTE THESE? A HUMAN. HE COUNTED. GOOD.',
  'NO WORD LEFT BEHIND. NO WORD LEFT OVER.',
  'LOST SOMETHING? SO DID THE LOST AND FOUND.',
  'THE END COSTS ONE HUNDRED. IT IS WORTH IT.',
];

const ROMAN = ['I', 'II', 'III', 'IV'];

/** A book's cover page: its title, where it is shelved, Joe's note and the Word Counter's complaint. */
export function coverText(s: Story, wing: string, k: number, note: string, index: number): string {
  const lines = [
    ...wrap(s.title.toUpperCase()),
    ...wrap(`${wing}, book ${ROMAN[k]}`),
    'Words on the floor: 100',
    'Words in the book:    0',
    '',
    ...wrap(`JOE'S NOTE: ${note}`),
    '',
    ...wrap(`THE WORD COUNTER: "${COMPLAINTS[index % COMPLAINTS.length]}"`),
  ];
  if (lines.length > PAGE) throw new Error(`${s.title}: cover page has ${lines.length} lines`);
  return lines.join('\n') + '\n';
}

/** The thirty-third book: a heading, two blank pages, and one line. */
export function book33Text(): string {
  const blankPage = new Array(PAGE).fill('');
  const head = ['2026-12-20', 'OWS 1078', 'Christmas Hotel (WIP)', 'by ______________', ''];
  while (head.length < PAGE) head.push('');
  const last = ['', '', '', '', '', '', ...wrap('Exactly one hundred words.'), '', ...wrap('Your turn.')];
  return [...head, ...blankPage, ...blankPage, ...last].join('\n') + '\n';
}

export function readme(): string {
  const r = wrap(`KEEP IT BRIEF!
The Tiny Pockets Library
Version 1.0
(c) 1995 Sandbox Software

A library game for IBM PC compatibles with VGA. Sound Blaster recommended.

TO PLAY
Type BRIEF at the DOS prompt (it runs PLAYGAME with BRIEF.GAM).

WHAT IS IT?
Every book in the library behind The Dog House's red door holds exactly one hundred words, and last night every word fell out of every book. As Mystery Robot Joe, the night librarian, pick the words up and put thirty-two stories back together.

The stories are Lewis Moten's 100 Word Stories, written for Laurence Simon's weekly 100 Word Stories challenge on the 100 Word Stories Podcast, word for word. Each week's topic was set by Laurence or chosen by the last week's winner.

THIS IS SHAREWARE
Copy this disk for a friend, upload it to your favorite BBS, put it on a shareware disk: all of the files, unchanged. Please return it on time.

If you enjoy it, register for $10 (exactly) with Sandbox Software, Dept. 100, P.O. Box 000. Registered readers get a library card with their own name on it and our thanks, in under one hundred words.

FILES ON THIS DISK
 BRIEF.GAM    the game
 *.MAP *.MON  the library
 *.BBL *.MBL  its blocks
 JOE.CHR      Joe himself
 *.CMF *.VOC  music, sounds
 *.TXT *.LST  the stories
 README.TXT   this file

...And, as always, keep it brief!
`);
  return r.join('\n') + '\n';
}
