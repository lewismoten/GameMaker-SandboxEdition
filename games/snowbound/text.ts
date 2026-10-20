// The words: text pages shown over the notepad (31 columns, 16 lines a page) and the
// readme on the disk.
const page = (lines: string[]) => {
  for (const l of lines) if (l.length > 31) throw new Error(`Text line over 31 columns: "${l}"`);
  while (lines.length % 16) lines.push('');
  return lines.join('\n');
};

export const INSTRUCTIONS = page([
  'Shovel Fort Ashby out, earn',
  '$89, and buy GAME-MAKER at the',
  'mall before the price goes up.',
  '',
  'ARROW KEYS walk. Walk into a',
  'heap of deep snow to shovel',
  'it: every scoop pays $1.',
  '',
  'SPACE throws a snowball the way',
  'you last walked. Scoop the',
  'plow banks by the road to pack',
  'more snowballs.',
  '',
  'Press F2 any time to count the',
  'money in your coffee can.',
  '',
  'HOT COCOA warms you back up.',
  'Plows, cars, shopping carts,',
  'snowballs, Biscuit the dog and',
  'Big Pete wear you down. Bonk a',
  'snow fort to knock it flat,',
  'then shovel what is left.',
  '',
  'ICE slides you the way its',
  'arrows point. The creek on',
  'Main Street runs east!',
  '',
  'THE SLED: LEFT and RIGHT steer,',
  'UP digs in your heels, DOWN',
  'pushes off. Grab the dollars',
  'blowing down Knobley Hill.',
  '',
  'THE MALL LOT snows back over',
  'every half minute. Shovel it',
  'again for more money. The',
  'register at Bits & Bytes only',
  'opens with $89 in your can.',
  '',
  'F1 help      F2 coffee can',
  'F3 music     F4 sound',
  'F5 save      F6 load',
  'ESC quit',
]);

export const CREDITS = page([
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
  'Operations, Fort Ashby, West',
  'Virginia, winter of 1992, who',
  'shoveled his way to a copy of',
  'Game-Maker. Each driveway was',
  'one pixel of the game.',
  '',
  'Made with GAME-MAKER by',
  'Recreational Software Designs.',
  '',
  'Thanks to everyone who ever',
  'left a kid a five dollar tip',
  'on the porch.',
]);

export function readme(price: string): string {
  return `
                    S N O W B O U N D
                    The $89 Shovel
                    Version 1.0 - December 1995
                    (c) 1995 Sandbox Software

  Fort Ashby, West Virginia, December 1992. A foot and a half of snow,
  school is closed, and GAME-MAKER is $89 at the mall - until January,
  when it goes up to $129. Grab your shovel. Every scoop is a dollar.

  STARTING THE GAME
    Type SNOWBND and press Enter. A VGA display is required. A Sound
    Blaster (or compatible) is recommended for the music and sampled
    sound effects; the PC speaker works too.

  FILES ON THIS DISK
    SNOWBND.GAM   the game        *.MAP      four levels
    SNOW.BBL      blocks          *.CMF      Sound Blaster music
    SNOW.SND      sound effects   *.VOC      digitized sounds
    *.GIF         pictures        README.TXT this file

  THIS IS SHAREWARE
    This is shareware. You may copy SNOWBOUND and give it to your
    friends, upload it to your favorite BBS, or put it on a shareware
    disk, as long as all of the files are included and unchanged.

    If you enjoy it, please register for ${price} with Sandbox Software.
    Registered players receive the next adventure, "SNOWBOUND II:
    Spring Thaw", a printed map of Fort Ashby, and our thanks. Send a
    check or money order (US funds) to:

        Sandbox Software
        Dept. SNOW
        P.O. Box 1992
        Pittsburgh, PA 15213

    Please tell us where you found your copy and which BBS you call.

  SAYING THANKS
    Built with GAME-MAKER 3.0 by Recreational Software Designs.
    For every kid who ever shoveled a driveway to buy software.

  Stay warm!
`.replace(/^\n/, '');
}
