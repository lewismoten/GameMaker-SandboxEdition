// The words: the story, the instructions and the credits as text pages (30 columns, 16 lines a
// page), the level cards' lines (from the song), and the disk's README.TXT. The lyrics are
// "I Screamed, She Smirked" by The Bard of Bizarre as they are sung on the recording (checked
// with a speech recognizer against ChatGPT's last draft, "Bravery Badge & the Exit Sign"),
// wrapped to fit the columns.
import { withCreditPage } from '../../../kit/license';
import { BATTERIES_NEEDED, SORRY_NEEDED, SWORD_PRICE } from '../ids';

const page = (lines: string[], pages = 1) => {
  for (const l of lines) if (l.length > 30) throw new Error(`Text line over 30 columns: "${l}"`);
  if (lines.length > 16 * pages) throw new Error(`Text over ${pages} page(s): "${lines[0]}"`);
  while (lines.length % 16) lines.push('');
  return lines.join('\n');
};

export const TITLE = 'I SCREAMED, SHE SMIRKED';
export const AUTHOR = 'The Bard of Bizarre';

/** Who made the music the game's FM songs and sung clips come from (the lyrics file's header). */
export const MUSIC_CREDIT = 'music made with Riffusion (now Google Flow Music)';

/**
 * Who made the song and the pictures: the lyrics, the recording, and the title and cover art,
 * which no one supplied and Claude drew for the game. Used by LICENSE.TXT (the credits page and
 * the README spell it out to fit their columns; about.json says the same in its blurb).
 */
export const SONG_CREDIT = `lyrics shaped by ChatGPT from Lewis Moten's prompts; ${MUSIC_CREDIT}; title and cover art drawn for this game by Claude Opus 5.5`;

/** The song as sung, word for word (the clean lyrics; long lines broken at a comma or dash). */
export const LYRICS: Record<string, string[]> = {
  verse1: [
    'Okay, in my defense... the',
    '  sign said "mild scares',
    '  for all ages!"',
    'And in my double defense-',
    '  eight is a weird stage.',
    'They believe in unicorns,',
    '  but not in respect,',
    "And they stare like you're",
    '  dumb if you flinch or',
    '  deflect.',
  ],
  verse2: [
    'So I take Lily, my',
    "  girlfriend's kid,",
    'To a haunted house-',
    "  bonding! That's what we did!",
    "She's got a caramel apple",
    '  as big as her head,',
    'I feel heroic... at least',
    '  till I fled.',
  ],
  verse3: [
    'Fog machine hisses-',
    '  I scream like a cat!',
    'She just looks up and says,',
    '  "You okay with that?"',
    "She's got glitter cheeks",
    '  and a unicorn hood,',
    "While I'm sweating like meat",
    '  in a microwave... good.',
  ],
  chorus: [
    "She's eight, and I'm afraid,",
    'Of papier-mache and a',
    '  zombie parade.',
    'I tackle a witch, shout',
    '  "GET DOWN!" on repeat-',
    'Turns out, she was cardboard',
    '  and very petite.',
    "She strolls like it's Target,",
    "  I'm wheezing behind,",
    'I am bonding...',
    '  With the emergency',
    '  exit sign.',
  ],
  verse4: [
    "There's a guy in a werewolf",
    '  mask- he growls, I pivot!',
    "I don't run. No, no.",
    '  I strategically rivet...',
    'Through a wall of fake webs-',
    "  turns out they're not kind.",
    "Now I'm sneezing like Salem's",
    '  last witch left behind!',
  ],
  bridge: [
    'My eyes are all watery,',
    "  my soul's in retreat,",
    'I trip over fog lights',
    '  and fake demon feet.',
    "And Lily? She's chillin'.",
    '  Calm as can be-',
    'Looks at me and says, "You',
    '  know it\'s not real, right?"',
    '...merci.',
  ],
  breakdown: [
    'Then she pats me. Pats me.',
    'Like I need the juice box',
    '  and some therapy.',
    'She gets a Bravery Badge',
    '  from the front desk,',
    'I get a souvenir sword...',
  ],
  final: [
    "She's eight, and I'm ashamed,",
    'Of how many fake ghosts I',
    '  accidentally maimed.',
    'I was supposed to impress,',
    '  but I nearly flatlined-',
    'I bonded...',
    '  With the emergency...',
    '  exit sign!',
  ],
  outro: ['So yeah. The date went well.', 'No trauma. Except mine.', 'Just me...', 'And my sword...', 'And the exit sign.'],
};

export const STORY = [
  page(['"I SCREAMED, SHE SMIRKED"', '', ...LYRICS.verse1, '', '        - The Bard of Bizarre']),
  page([
    'October, 1995. Your',
    "girlfriend's kid, Lily, is",
    'eight. The sign at the',
    'haunted house says MILD',
    'SCARES FOR ALL AGES. Bonding',
    'time. Step-dad tryouts.',
    '',
    'You feel confident. Strong.',
    'Heroic. The man.',
    '',
    'That lasts maybe fourteen',
    'seconds.',
    '',
    'Get through the house. Lily',
    'is not scared. You are.',
  ]),
].join('\n');

export const INSTRUCTIONS = [
  page([
    'Get through the haunted house',
    'with your dignity (some of',
    'it). Lily strolls on ahead.',
    '',
    'ARROWS or W A S D walk. Q, E',
    'and keypad 1 and 3 walk on',
    'the diagonals.',
    '',
    'SPACE: "GET DOWN!" You tackle',
    'what is in front of you.',
    'Zombies and witches go over;',
    'the werewolf guy sits down a',
    'moment. Bats and ghosts: walk',
    'away. B screams. C asks Lily',
    'if it is real.',
  ]),
  page([
    'THE FOG HALL: fog machines',
    'hiss on and off. Find',
    `${BATTERIES_NEEDED} batteries for the`,
    'flashlight: the door to the',
    'dark hallway needs them.',
    '',
    'THE CRYPT: tackle the paper',
    'witches, then walk over each',
    `one to say sorry. ${SORRY_NEEDED} sorries`,
    'open the STAFF ONLY door.',
    '',
    'THE WOODS: fake webs make you',
    'sneeze. Collect dollars: the',
    `souvenir sword is $${SWORD_PRICE}.`,
  ]),
  page([
    'THE LAST HALL: the foam sword',
    "knocks the cardboard knight's",
    'helmet off. He grabs it back',
    'once and comes on quicker:',
    'knock it off again. The exit',
    'only opens for the helmet.',
    'NERVE is your health. Scares',
    'cost nerve, and every scare',
    'makes Lily smirk (F2 counts',
    'her smirks). Juice boxes,',
    "caramel apple and Lily's pat",
    'help.',
    '',
    'F1 help      F2 counters',
    'F3 music     F4 sound',
    'F5 save F6 load  ESC quit',
  ]),
].join('\n');

/** Each level's card: its name, where, and two lines of the song. */
export const CARDS: { title: string; where: string; lines: [string, string] }[] = [
  { title: '1. MILD SCARES', where: 'The fog hall', lines: ['Fog machine hisses-', 'I scream like a cat!'] },
  { title: '2. GET DOWN!', where: 'The zombie parade', lines: ['I tackle a witch, shout', '"GET DOWN!" on repeat-'] },
  { title: '3. THE WEBS', where: 'Strategic repositioning', lines: ["There's a guy in a werewolf", 'mask- he growls, I pivot!'] },
  { title: '4. THE EXIT SIGN', where: 'The last hall', lines: ['I get a souvenir sword...', 'and the exit sign.'] },
];

const SONG_PAGES = [
  page(['THE SONG', '', ...LYRICS.verse2, '', ...LYRICS.verse3.slice(0, 4)]),
  page([...LYRICS.verse3.slice(4), '', ...LYRICS.chorus.slice(0, 7)]),
  page([...LYRICS.chorus.slice(7), '', ...LYRICS.verse4]),
  page([...LYRICS.bridge, '', ...LYRICS.breakdown]),
  page([...LYRICS.final, '', ...LYRICS.outro, '', '        - The Bard of Bizarre']),
];

const CREDITS_TEXT = page(
  [
    'I SCREAMED, SHE SMIRKED',
    'by The Bard of Bizarre, 1995',
    'Shareware from The Sofa BBS',
    '',
    'Based on the song "I',
    'Screamed, She Smirked" by The',
    'Bard of Bizarre (Lewis Moten',
    'as his hobo clown, Doc Leo):',
    "a man, his girlfriend's kid,",
    'and a haunted house.',
    'Lily and her mom are',
    'characters in the song.',
    '',
    "Lyrics: ChatGPT, from Lewis's",
    'prompts. Music: made with',
    'Riffusion (now Google Flow',
    "Music). This game's FM music",
    'and sung clips are made from',
    'the recording.',
    'Title and cover art: drawn',
    'for this game by Claude Opus',
    '5.5 (none came with the',
    'song). The Bard of Bizarre',
    'logo: DeepAI. Doc Leo photo:',
    'Lewis Moten.',
    '',
    'Game: blocks, maps, sprites',
    'and the FM arrangement by',
    'Claude, built as Game-Maker',
    '3.0 files. Made with GAME-',
    'MAKER by Recreational',
    'Software Designs.',
  ],
  2,
);

/** The credits: the whole song (liner notes), the credits, and the FREE TO SHARE page (kit/license.ts). */
export const CREDITS = withCreditPage([...SONG_PAGES, CREDITS_TEXT].join('\n'), true);

export function readme(price: string): string {
  return `
    I SCREAMED, SHE SMIRKED
    Version 1.0 - October 1995
    by The Bard of Bizarre

"She's eight, and I'm afraid,
 Of papier-mache and a
 zombie parade."

You take your girlfriend's kid,
Lily (eight, a unicorn hoodie,
a caramel apple as big as her
head), to a haunted house. The
sign says MILD SCARES FOR ALL
AGES. She is not scared. You
are. Scream at the fog
machines, tackle a cardboard
witch ("GET DOWN!"), say sorry,
strategically reposition away
from the werewolf guy through a
wall of fake spiderwebs, buy
the $12 souvenir sword, duel
an 11-year-old in a cardboard
knight costume, and bond with
the emergency exit sign.

STARTING THE GAME
  Type SMIRKED and press Enter.
  VGA required. A Sound Blaster
  is recommended for the pit
  band and the singing.

FILES IN THIS ZIP
  SMIRKED.GAM  the game
  *.MAP        four levels
  SMIRKED.BBL  blocks
  SMIRKED.CHR  you
  *.SND        sound effects
  *.CMF        Sound Blaster
               music
  *.VOC        sampled sound
  *.GIF *.FLI  pictures and
               cartoons
  README.TXT   this file
  LICENSE.TXT  then and now

THIS IS SHAREWARE
  Copy it, give it to friends,
  upload it to your favorite
  BBS - all the files, please,
  unchanged.

  If it made you laugh at
  yourself, register for ${price}:
  you get a Bravery Badge of
  your own, as a sticker. Send
  a check (US funds) to:

    The Bard of Bizarre
    c/o The Sofa BBS
    Pittsburgh, PA

  (In the story only: there is
  nothing to pay and nowhere to
  mail. The game is free to
  play, share and change (MIT
  license; its voice clips are
  for personal, non-commercial
  use only); see LICENSE.TXT.)

  Leave a message for DOC LEO
  on The Sofa BBS,
  1-412-555-0177.

CREDITS (NOW)
  The song "I Screamed, She
  Smirked": lyrics shaped by
  ChatGPT from Lewis Moten's
  prompts (as The Bard of
  Bizarre); music made with
  Riffusion (now Google Flow
  Music). The FM music and
  sung clips here are made
  from the recording. The
  title and cover art were
  drawn for this game by
  Claude Opus 5.5. The logo was
  made with DeepAI; the Doc Leo
  photo is Lewis's own. Lily
  and her mom are characters
  in the song. Built by Claude
  with GAME-MAKER 3.0 by
  Recreational Software
  Designs.

So yeah. The date went well.
`.replace(/^\n/, '');
}
