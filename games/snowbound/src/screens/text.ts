// The words: text pages shown over the notepad (31 columns, 16 lines a page) and the
// readme on the disk.
const page = (lines: string[], pages = 1) => {
  for (const l of lines) if (l.length > 30) throw new Error(`Text line over 30 columns: "${l}"`);
  if (lines.length > 16 * pages) throw new Error(`Text over ${pages} page(s): "${lines[0]}"`);
  while (lines.length % 16) lines.push('');
  return lines.join('\n');
};

export const INSTRUCTIONS = [
  page([
    'Shovel out Dowden Additions',
    'in Fort Ashby, earn $89, and',
    'buy GAME-MAKER at LaVale Mall',
    'before the price goes up.',
    '',
    'ARROWS or W A S D walk; Q/E',
    'and the keypad corners go',
    'diagonally. Walk into deep',
    'snow to shovel it: $1 a scoop.',
    '',
    'SPACE throws a snowball the',
    'way you last walked. Scoop the',
    'plow banks along the road to',
    'pack more snowballs.',
    '',
    'F2 counts your coffee can.',
  ]),
  page([
    'HOT COCOA warms you back up.',
    'Plows, cars, shopping carts,',
    'snowballs, Biscuit the dog and',
    'Big Pete wear you down. Only a',
    'snowball stops Big Pete.',
    '',
    'Bonk a snow fort to knock it',
    'flat; shovel the pile for $2.',
    '',
    'ICE slides you the way its',
    'arrows point. The creek by',
    'Bowden Drive runs east!',
    '',
    'Shovel the front walks too:',
    'they pay just like the',
    'driveways do.',
  ]),
  page([
    'THE SLED: LEFT/RIGHT (A/D)',
    'steer, UP (W) digs in your',
    'heels, DOWN (S) pushes off,',
    'Q/E brake and steer at once.',
    '',
    'THE MALL LOT snows back over.',
    'Shovel it again for more. The',
    'register at Bits & Bytes only',
    'opens with $89 in your can.',
    'TIMEOUT, the arcade, eats $1',
    'a push - but warms you up.',
    'F1 help      F2 coffee can',
    'F3 music     F4 sound',
    'F5 save      F6 load',
    'ESC quit',
  ]),
].join('\n');

export const CREDITS = page(
  [
    'SNOWBOUND: THE $89 SHOVEL',
    'Sandbox Software, 1995',
    '',
    'Design, pixels, music, sound',
    'and levels by Claude - every',
    'block, monster and song built',
    'as Game-Maker 3.0 files.',
    '',
    'For the founder and operator',
    'of Moten Snow-to-Software',
    'Operations, Fort Ashby, W.Va.,',
    'winter of 1992, who shoveled',
    'his way to a copy of',
    'Game-Maker. Each driveway was',
    'one pixel.',
    '',
    'Made with GAME-MAKER by',
    'Recreational Software Designs.',
    '',
    'Thanks to everyone who ever',
    'left a kid a five dollar tip',
    'on the porch.',
  ],
  2,
);

export function readme(price: string): string {
  return `
    S N O W B O U N D
    The $89 Shovel
    Version 1.0 - December 1995
    (c) 1995 Sandbox Software

Fort Ashby, West Virginia,
December 1992. A foot and a
half of snow, school is closed,
and GAME-MAKER is $89 at LaVale
Mall - until January, when it
goes up to $129. Grab your
shovel. Every scoop is a
dollar!

Dig out the neighborhood, sled
down Jamie Street, work your
way along Bowden Drive, and get
to the mall before closing.

STARTING THE GAME
  Type SNOWBND and press Enter.
  A VGA display is required. A
  Sound Blaster (or compatible)
  is recommended for the music
  and sampled sound effects;
  the PC speaker works too.

FILES ON THIS DISK
  SNOWBND.GAM  the game
  *.MAP        four levels
  SNOW.BBL     blocks
  SNOW.SND     sound effects
  *.CMF        Sound Blaster
               music
  *.VOC        digitized sounds
  *.GIF        pictures
  README.TXT   this file

THIS IS SHAREWARE
  You may copy SNOWBOUND and
  give it to your friends,
  upload it to your favorite
  BBS, or put it on a shareware
  disk, as long as all of the
  files are included and
  unchanged.

  If you enjoy it, please
  register for ${price} with
  Sandbox Software. Registered
  players receive the next
  adventure, "SNOWBOUND II:
  Spring Thaw", a printed map
  of Dowden Additions, and our
  thanks. Send a check or money
  order (US funds) to:

    Sandbox Software
    Dept. SNOW
    P.O. Box 1992
    Pittsburgh, PA 15213

  (This is a fictional address
  for this game - there is no
  real Sandbox Software to
  mail. Please do not send
  money anywhere.)

  Please tell us where you
  found your copy and which BBS
  you call.

SAYING THANKS
  Built with GAME-MAKER 3.0 by
  Recreational Software
  Designs. For every kid who
  ever shoveled a driveway to
  buy software.

Stay warm!
`.replace(/^\n/, '');
}
