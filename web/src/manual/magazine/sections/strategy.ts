// The strategy guide (section S1): TIPS & TRICKS for the Sandbox games straight from their hint
// books (answers upside down), "Stuck? Try this" for The Bard of Bizarre's song-games from
// their HOWTO.TXT screens, random tips from the CD games' own instruction files, an ad for each
// game's hint book, and a back-issue order form for every box's Sandbox Scoop newsletter.
// Hint book questions are looked up in the games' printables.json (ctx.games); the felt egg and
// tin heart sections are never quoted, so nothing here gives away where they hide.
import { scoopIssue } from '../../printables/scoopIssue';
import { adPage, adframe, card, cols, grid, head, hint, list, note, p, piece, rows, shot, side } from '../blocks';
import type { Block, ListingRow, MagContext, MagGame, MagPage, MagSection } from '../types';

const MAIL = 'Sandbox Software · P.O. Box 000 · Pittsburgh, PA 15213';

/** Hint book sections that tell where a secret hides: never quoted here. */
const SECRET = /egg|secret|heart/i;

/** A hint from a game's own hint book, by the start of its question. */
function bookHint(g: MagGame, qStart: string): Block | undefined {
  for (const s of g.hints ?? []) {
    if (SECRET.test(s.head)) continue;
    const h = s.hints.find((x) => x.q.trim().startsWith(qStart));
    if (h) return hint(h.q.trim(), h.a.trim(), g.id);
  }
  return undefined;
}

/** The Sandbox games' hints, each picked by its question, in the hint books' own words. */
const PICKS: [id: string, questions: string[]][] = [
  ['teddy', ['The back fence is way too tall.', 'The turnstile won’t let me in.', "The turnstile won't let me in."]],
  ['teddy2', ['What is that faint wispy thing', 'The wind keeps blowing me back!']],
  ['teddy3', ['A button does nothing.', 'The car won’t climb the hill.', "The car won't climb the hill."]],
  ['sandcast', ['How do I get into Anthill Keep?', 'The ants keep biting me.']],
  ['snowbound', ['I got to the register without $89.', 'Big Pete won’t stop shoving me.', "Big Pete won't stop shoving me."]],
  ['logic', ['The Toaster:', 'The Fridge:']],
  ['realm', ['Where do I go first?', 'My sword bounces off the Kraken.']],
  ['sleuth', ['Where do I start?', 'It’s too dark under the stage.', "It's too dark under the stage."]],
  ['year2000', ['How do I cross fourteen lanes', 'Are the arcade games worth it?']],
  ['maximus', ['I keep running out of lives.', 'My blaster bounces off a creature.']],
  ['blaster', ['How do I shoot?', 'How do I get past a firewall?']],
  ['depth', ['How do I get past a wall of amber blocks?', 'I’m low on light.', "I'm low on light."]],
  ['brief', ['Clown Alley:']],
];

/**
 * Tricks readers sent in, each one a hint book answer told in a reader's words: `q` is the start
 * of the hint book's question and `facts` are words of its answer the trick repeats (the
 * strategy test checks both, and that none comes from a secrets section).
 */
export const READER_TRICKS: { game: string; q: string; facts: string[]; text: string; from: string }[] = [
  {
    game: 'snowbound',
    q: 'What is a snow fort worth?',
    facts: ['100 points', '$2'],
    text: 'Don’t walk around a snow fort. Walk right into it! It falls flat for 100 points, and the pile it leaves shovels up for $2 more toward the shovel.',
    from: 'PLOWBOY, Frostburg, Md.',
  },
  {
    game: 'sleuth',
    q: 'Is the plaque worth reading?',
    facts: ['1,776 points', 'middle'],
    text: 'Read the plaque. Push against its middle and it is worth exactly 1,776 points. My dad says that is a history joke.',
    from: 'STAGEHAND, Erie, Pa.',
  },
  {
    game: 'realm',
    q: 'What does the kazoo do?',
    facts: ['Press Z', 'bosses included', 'Lyra', 'ten notes for ten gold'],
    text: 'Press Z to play the kazoo. The note flies straight ahead and beats nearly anything, bosses included. Lyra sells reeds in Someday Harbor, ten notes for ten gold.',
    from: 'KAZOO KID, Morgantown, W.Va.',
  },
];

/** The reader tricks as a box: each with its game, the trick, and who sent it. */
function trickBox(ctx: MagContext): Block {
  const cells = READER_TRICKS.flatMap((t) => {
    const g = ctx.game(t.game);
    return g ? [[p(`[${g.title}](go:play/${g.id}): ${t.text}`), p(`*— ${t.from}*`)]] : [];
  });
  return side('Reader tricks', [grid(cells, 0.2), note('Send yours to TURBO BUTTON, P.O. Box 000. We try every trick before we print it.')], 'yellow');
}

/** One Sandbox game's corner: its name (to play it), two hints, and its hint book. */
function sandboxCell(ctx: MagContext, id: string, questions: string[], max = 2): Block[] | undefined {
  const g = ctx.game(id);
  if (!g?.hints) return undefined;
  const hints = questions.map((qq) => bookHint(g, qq)).filter((b): b is Block => !!b);
  if (!hints.length) return undefined;
  return [
    head(g.title, { size: 's', level: 3 }),
    ...hints.slice(0, max),
    note(`[Play it](go:play/${g.id}) · more in [${g.hintBook ?? 'the hint book'}](go:hints/${g.id})`),
  ];
}

/** The Bard of Bizarre's song-games: a tip each from the game's own HOWTO.TXT screen. */
const BIZARRE_TIPS: [id: string, tip: string][] = [
  [
    'carl',
    'Flying burns SUGAR (F2 counts it as Money): fresh air costs one, air you’ve flown is free, a cube gives 25. Run dry and you sink: hold Down on the carpet to lick up crumbs. BUZZ (B) wakes a sleeping ear; fly into it while it twitches.',
  ],
  [
    'goat',
    'A SCREAM (Space) costs one breath and makes your fainting cousins keel over stiff for a few seconds. Walk right over them. Camels are not impressed.',
  ],
  ['loaf', 'Warm air over a cooking fire lifts you, the way warm makes dough rise. The fire itself is too hot! A hand makes a fist first: rise over it.'],
  ['loofah', 'Touch a candle to light it. Six burning open the bathroom door upstairs. Rosemary splashes (Space) tame the wild loofahs.'],
  [
    'mustard',
    'When the leaves shiver, a gust is coming that blows you off the branch: wait, and cross while it’s calm. Cornered in a tunnel? Push roots up and let the mole go by.',
  ],
  ['needle', 'The eye of the needle takes four graces, but it blinks: go in while it is wide open. Wait out the sandstorm gusts behind a boulder.'],
  ['reckoning', 'Celery is willpower: it takes all seven to face the cheesecake. And three rolls open the bathroom door. Never go in without three.'],
  ['remote', 'Search by pushing into things: couch cushions, the dog’s bed, the cat’s chair, the laundry. Fake remotes say NOPE.'],
  [
    'risi',
    'Jokes never run out: SPACE tells one to the right, Z to the left. They make stone faces laugh, and as Felix a meow scares a mouse into dropping its cheese.',
  ],
  [
    'smirked',
    'A fog machine’s red light warns before it hisses, and each one gets you only once. Tackle a paper witch, then walk over her to say sorry: five sorries open STAFF ONLY.',
  ],
  ['sweats', 'The curtain only lets you through with a cup in hand: a coffee is five tips. Some things are too tough for words. Hop over them.'],
  ['tickle', 'PIN first (Z), then TICKLE (X). A tickle without a pin goes right over a wary rat. And Mortimer at the top of the tower takes two.'],
];

/** The CD's gameware and shareware: hints from the games' own instruction files. */
const CD_HINTS: [id: string, q: string, a: string][] = [
  [
    'nebula',
    'Why can’t I spit fire?',
    'You don’t have the power at first. Find the yellow orb in the blue world and pick it up with P. A more powerful fireball is hidden too.',
  ],
  [
    'penguin',
    'Which weapon is strongest?',
    'From the lowest: the harpoon, the killing jump (N), snowballs (M), then bombs (B). Turn NumLock on and use the keypad.',
  ],
  ['pipemare', 'How do I finish level one?', 'Find the hidden room of gold. Stop leaks and turn off running water for points, and eat to build strength.'],
  [
    'volume',
    'What should I do first?',
    'The Elder says: drop most of what you carry, buy a knife at the weapon shop, and skip the armor. Can’t find the first cave? Wait at the main menu for the demo.',
  ],
  [
    'heart',
    'What does an idol do?',
    'Touch one and you can rocket jump (Enter) once. Use it wisely. Roll over the pools defeated enemies leave to win back hit points.',
  ],
  [
    'parsec3d',
    'Why can’t I walk through that block?',
    'Blocks drawn behind Parsec can be passed; blocks on his level or above are solid. On gravity levels you can’t shoot down.',
  ],
];

const CD_TIPS: [id: string, tip: string][] = [
  ['bcuda', 'Pick up ANYTHING you can: four items stop the bomb.'],
  ['peach', 'Run and duck to slide under things. Press all the jump keys rapidly to jump high.'],
  ['ajquest', 'You always use your strongest weapon. The slingshot and the flying disc need refills, and the doors want crowns.'],
  ['paperair', 'The YAHs are hit points, plus signs are lives, and a bomb pickup is five more bombs.'],
  ['zoom', 'Zoom’s fist only shoots magic when you have magic dust. Side view: B shoots left, N right.'],
  ['orb', 'Read the Planetary Report: every orb has its HP, from the Orb of Water (25) to the Orb of Antimatter (165).'],
];

/** "by" as the game's own files name its maker. */
const by = (g: MagGame): string => g.author ?? g.company ?? 'its author';

const hintPages = (ctx: MagContext): MagPage[] => {
  const cells = PICKS.map(([id, qs]) => sandboxCell(ctx, id, qs, id === 'brief' ? 1 : 2)).filter((c): c is Block[] => !!c);
  const first = cells.slice(0, 4);
  const second = cells.slice(4, 8);
  const third = cells.slice(8, 12);
  const bonus = cells.slice(12);
  return [
    {
      kind: 'dept',
      tone: 'white',
      blocks: [
        head('TIPS & TRICKS', {
          kicker: 'The Strategy Guide',
          size: 'xl',
          level: 2,
          deck: 'Stuck behind a fence, a gate or a corgi? The answers come straight from the official hint books, printed upside down so you only read the one you need.',
        }),
        grid(first, 0.4),
        ...bonus.map((c) => side('Bonus round', c, 'cyan')),
      ],
    },
    {
      kind: 'dept',
      tone: 'white',
      blocks: [head('More Sandbox Software hints', { kicker: 'Tips & Tricks', size: 'm', level: 2 }), grid(second, 0.4), trickBox(ctx)],
    },
    {
      kind: 'dept',
      tone: 'white',
      blocks: [head('Still more Sandbox hints', { kicker: 'Tips & Tricks', size: 'm', level: 2 }), grid(third, 0.4)],
    },
  ];
};

const bizarrePage = (ctx: MagContext): MagPage => {
  const tips = BIZARRE_TIPS.flatMap(([id, tip]) => {
    const g = ctx.game(id);
    return g ? [p(`[${g.title}](go:play/${g.id}): ${tip}`)] : [];
  });
  return {
    kind: 'dept',
    tone: 'pink',
    blocks: [
      head('Stuck? Try this', {
        kicker: 'The Bard of Bizarre',
        size: 'l',
        level: 2,
        deck: 'One tip for each of the Bard’s song-games, from the HOWTO screen every one of them carries. Press F1 in any of them for the rest.',
      }),
      cols(2, tips),
      grid([[shot('loaf', 'level', 'Loaf #13 (Left in the Basket), a level')], [shot('tickle', 'level', 'Certified Rat Tickler, a level')]], 0.4),
      note('The Bard of Bizarre’s song-games come from The Sofa BBS: [dial the boards](go:bbs), or see [The Bard of Bizarre catalog](go:catalog/bard).'),
    ],
  };
};

const cdPage = (ctx: MagContext): MagPage => {
  const hints = CD_HINTS.flatMap(([id, qq, aa]) => {
    const g = ctx.game(id);
    return g ? [[p(`[${g.title}](go:play/${g.id}) · ${by(g)}`), hint(qq, aa, g.id)]] : [];
  });
  const tips = CD_TIPS.flatMap(([id, tip]) => {
    const g = ctx.game(id);
    return g ? [`[${g.title}](go:play/${g.id}): ${tip}`] : [];
  });
  return {
    kind: 'dept',
    tone: 'news',
    blocks: [
      head('From the readme files', {
        kicker: 'Gameware & Shareware',
        size: 'l',
        level: 2,
        deck: 'The games on the Game-Maker CD tell you a lot, if you read their text screens. We did, so you don’t have to.',
      }),
      grid(hints, 0.4),
      side('Random tips', [list(tips)], 'yellow'),
      note(
        'Want more? Our [game directory](go:mag/directory) lists every game on the disc, and the [shareware catalog](go:catalog/shareware) on the desk has the rest.',
      ),
    ],
  };
};

/** One game's hint book coupon. */
function bookCard(g: MagGame): Block {
  return card((g.hintBook ?? `${g.title} Hint Book`).toUpperCase(), [`For [${g.title}](go:play/${g.id}) · $5.95 · **FREE with registration**`], {
    go: `go:hints/${g.id}`,
    button: 'Open the hint book',
    tone: 'yellow',
  });
}

const bookAds = (ctx: MagContext): MagPage[] => {
  const books = ctx.games.filter((g) => g.kind === 'sandbox' && g.manual && g.hints?.length);
  const half = Math.floor(books.length / 2);
  const page = (some: MagGame[], n: 1 | 2): MagPage =>
    adPage(
      n === 1 ? 'hint-books' : 'hint-books-2',
      n === 1 ? 'Sandbox Software hint books' : 'More Sandbox Software hint books',
      [
        adframe(
          n === 1 ? 'ORDER THE OFFICIAL HINT BOOK!' : 'EVERY SECRET. EVERY SHORTCUT.',
          [
            grid(
              some.map((g) => [
                piece(g.id, 'hintbook', `The cover of ${g.hintBook ?? 'its hint book'}`, { go: `go:hints/${g.id}`, float: 'left' }),
                bookCard(g),
              ]),
              0.3,
            ),
          ],
          {
            burst: n === 1 ? 'STUCK?' : 'RED FILM!',
            sub:
              n === 1
                ? 'Every answer hidden under red noise, so you only see the one you need. From Sandbox Software, the people who made the games.'
                : undefined,
            small:
              n === 1
                ? `Mail to: ${MAIL}. A fictional address: nothing to mail. Every hint book is already in its game’s box, free.`
                : 'Every hint book is already in its game’s box, free. Press a cover to open it.',
            tone: n === 1 ? 'yellow' : 'white',
          },
        ),
      ],
      n === 1 ? 'black' : 'yellow',
    );
  return [page(books.slice(0, half), 1), page(books.slice(half), 2)];
};

const backIssues = (ctx: MagContext): MagPage => {
  const boxed = ctx.games.filter((g) => g.kind === 'sandbox' && g.manual);
  // in issue order (every one is Vol. 1), reading down the first column and then the second
  const issues: ListingRow[] = boxed
    .map((g) => ({ g, no: scoopIssue(g.id, boxed) }))
    .sort((a, b) => a.no - b.no)
    .map(({ g, no }) => ({
      title: `The Scoop from ${g.title}`,
      go: `go:newsletter/${g.id}`,
      by: `Vol. 1, No. ${no}`,
      price: '$1.00',
      blurb: g.news?.length ? `“${g.news[0]}”` : undefined,
    }));
  return {
    id: 'back-issues',
    kind: 'dept',
    tone: 'cyan',
    blocks: [
      head('Back issues of The Sandbox Scoop', {
        kicker: 'Order Form',
        size: 'l',
        level: 2,
        deck: 'Missed one? Every Sandbox Software box comes with its own issue of the newsletter: the next games, letters, a tip of the month and news from the workbench. Collect them all.',
      }),
      cols(2, [rows(issues.slice(0, Math.ceil(issues.length / 2))), rows(issues.slice(Math.ceil(issues.length / 2)))]),
      card('BACK-ISSUE ORDER FORM', ['☐ The issues I circled, **$1.00** each  ☐ The whole set', `Send a money order to: ${MAIL}`], {
        fields: ['Name', 'Address'],
        go: 'go:catalog/sandbox',
        button: 'Open the Sandbox Software catalog',
        tone: 'white',
      }),
      note(
        'Prices are part of the story: every issue is in its game’s box, free to read here. The Bard of Bizarre’s song-games come on a single disk, with no box and no newsletter.',
      ),
    ],
  };
};

export const STRATEGY: MagSection = {
  id: 'strategy',
  title: 'The Strategy Guide',
  blurb: 'Tips & tricks from the hint books, the hint books themselves, and back issues of every box’s newsletter',
  dept: 'STRATEGY GUIDE',
  pages: (ctx) => [...hintPages(ctx), bizarrePage(ctx), cdPage(ctx), ...bookAds(ctx), backIssues(ctx)],
};
