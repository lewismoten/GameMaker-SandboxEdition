// The words: the story, the instructions and the credits as text pages (30 columns, 16 lines
// a page), the level cards' lines (from the song), and the disk's README.TXT. The lyrics are
// from "Mustard Seed Hustle" by The Bard of Bizarre.
import { withCreditPage } from '../../../kit/license';

const page = (lines: string[], pages = 1) => {
  for (const l of lines) if (l.length > 30) throw new Error(`Text line over 30 columns: "${l}"`);
  if (lines.length > 16 * pages) throw new Error(`Text over ${pages} page(s): "${lines[0]}"`);
  while (lines.length % 16) lines.push('');
  return lines.join('\n');
};

export const TITLE = 'MUSTARD SEED HUSTLE';
export const AUTHOR = 'The Bard of Bizarre';

/**
 * Who made the song: the lyrics, the recording the game's music and clips come from, and the
 * animated cover its title cartoon comes from. Used by LICENSE.TXT (the credits page and the
 * README spell it out to fit their columns; about.json says the same in its blurb).
 */
export const SONG_CREDIT =
  "lyrics shaped by ChatGPT from Lewis Moten's prompt; music made with Riffusion (now Google Flow Music); animated cover made with Producer.ai (formerly Riffusion, now Google Flow Music)";

export const STORY = [
  page([
    "They told me 'bout the mustard",
    'seed, so tiny and so small,',
    'The smallest thing in all the',
    'land, but it can grow tall.',
    '',
    "But here I am, just sittin'",
    "still, waitin' for a sign,",
    "While that little seed's been",
    "hustlin', workin' overtime!",
    '',
    '        - The Bard of Bizarre',
  ]),
  page([
    'You are a mustard seed. The',
    'smallest seed in the garden.',
    'No bigger than a crumb, with',
    'the greatest feet there ever',
    'were (and tiny red sneakers).',
    '',
    'Everybody else is busy',
    'looking for a miracle - big',
    'and loud and grand. The',
    'peacock struts, the crows',
    'holler, the mole digs for',
    'treasure. Nobody looks down.',
    '',
    'That suits you fine. You have',
    'some growing to do.',
  ]),
].join('\n');

export const INSTRUCTIONS = [
  page([
    'Hop out of your mound, cross',
    'the garden, push roots deep',
    'down in the dust, climb the',
    'mountain and grow all the way',
    "up to the palm of God's hand.",
    '',
    'LEFT/RIGHT or A D walk: slow',
    'but sure as a seed, quicker',
    'once you have grown. UP or W',
    'hops: hold it longer to hop',
    'higher. Q and E (or keypad 7',
    'and 9) hop up and sideways;',
    'steer as you fall.',
    '',
    'SPACE or H: Hallelujah!',
  ]),
  page([
    'ROOTS: soft dust gives way to',
    'your roots. Land on it, walk',
    'into it, hop up into it, or',
    'push DOWN (or S). In your',
    'roots there is no falling:',
    'UP and DOWN climb.',
    '',
    'WATER: catch the raindrops,',
    'find the groundwater. The',
    'crack in the sidewalk only',
    'opens for five drops.',
    '',
    'FAITH: the golden glimmers.',
    'Each boulder in your way',
    'takes one to move.',
  ]),
  page([
    'Dandelion fluff and the',
    'evening breeze lift you up.',
    'Dew and rain are good for',
    'you; a golden mustard flower',
    'is an extra life.',
    '',
    'High up the great plant the',
    'evening breeze gusts. When',
    'the leaves shiver, a gust is',
    'coming that blows you off',
    'the branch: wait, and cross',
    "while it's calm.",
  ]),
  page([
    "It don't shout, it don't brag:",
    'you have no way to fight. Big',
    'loud things hurt to bump',
    'into. Hop over them.',
    '',
    'F1 help      F2 counters',
    'F3 music     F4 sound',
    'F5 save      F6 load',
    'ESC quit',
  ]),
].join('\n');

/** Each level's card: its name, where, and two lines of the song. */
export const CARDS: { title: string; where: string; lines: [string, string] }[] = [
  { title: '1. THE MOUND', where: 'A garden at dawn', lines: ['So tiny and so small,', 'but it can grow tall.'] },
  { title: '2. THE DUST', where: 'Deep down, where it is quiet', lines: ["Just quietly pushin' roots", 'deep down in the dust.'] },
  { title: '3. THE MOUNTAIN', where: "When you're feelin' beat", lines: ['When life feels like', 'a mountain...'] },
  { title: '4. THE SKY', where: 'Evening, up the great plant', lines: ["That mustard seed's", "growin' strong!"] },
];

const CREDITS_TEXT = page(
  [
    TITLE,
    'by The Bard of Bizarre, 1995',
    'Shareware from The Sofa BBS',
    '',
    'Based on the song "Mustard',
    'Seed Hustle" by The Bard of',
    'Bizarre (Lewis Moten as his',
    'hobo clown, Doc Leo), one of',
    "the Bard's gospel oddities.",
    '',
    "Lyrics: ChatGPT, from Lewis's",
    'prompt. Music: Riffusion (now',
    'Google Flow Music). Animated',
    'cover: the same tool, by then',
    'called Producer.ai.',
    "This game's FM music, its",
    'sung clips and the title',
    'cartoon are made from them.',
    'The Bard of Bizarre logo:',
    'DeepAI. Doc Leo photo: Lewis',
    'Moten.',
    '',
    'Game: blocks, maps, sprites',
    'and the FM arrangement by',
    'Claude, built as Game-Maker',
    '3.0 files. Made with GAME-',
    'MAKER by Recreational',
    'Software Designs.',
    '',
    'Hallelujah - keep the',
    'mustard seed hustle alive!',
  ],
  2,
);

/** The credits, ending with the FREE TO SHARE page (kit/license.ts). */
export const CREDITS = withCreditPage(CREDITS_TEXT, true);

export function readme(price: string): string {
  return `
    MUSTARD SEED HUSTLE
    Version 1.0 - March 1995
    by The Bard of Bizarre

"Oh, it's the mustard seed
 hustle, movin' slow but sure,
 Faith in the smallest things,
 that's the only cure!"

You are a mustard seed: the
smallest thing in all the land,
with the greatest feet. Hop out
of your mound and across the
garden, push your roots deep
down in the dust for water,
move a mountain with tiny faith
and grow all the way up to the
palm of God's hand.

No fighting. It don't shout, it
don't brag, it don't make a
fuss. Just hop.

STARTING THE GAME
  Type MUSTARD and press Enter.
  VGA required. A Sound Blaster
  is recommended for the music
  and the singing.

FILES IN THIS ZIP
  MUSTARD.GAM  the game
  *.MAP        four levels
  MUSTARD.BBL  blocks
  *.CHR        seed, sprout and
               plant
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

  If it made you smile,
  register for ${price}: you get
  a mustard seed sticker and a
  packet of real mustard seeds.
  Send a check (US funds) to:

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
  The song "Mustard Seed
  Hustle": lyrics shaped by
  ChatGPT from Lewis Moten's
  prompt (as The Bard of
  Bizarre); music made with
  Riffusion (now Google Flow
  Music); animated cover made
  with Producer.ai, Riffusion's
  later name.
  The music, sung clips and
  title cartoon here are made
  from them. The logo was made
  with DeepAI; the Doc Leo
  photo is Lewis's own. Built
  by Claude with GAME-MAKER 3.0
  by Recreational Software
  Designs.

Tiny faith can move mountains.
`.replace(/^\n/, '');
}
