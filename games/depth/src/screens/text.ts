// The words: text pages shown over frosted glass (30 columns, 16 lines a page) and the
// readme on the disk.
import { withCreditPage } from '../../../kit/license';

export const page = (lines: string[], pages = 1) => {
  for (const l of lines) if (l.length > 30) throw new Error(`Text line over 30 columns: "${l}"`);
  if (lines.length > 16 * pages) throw new Error(`Text over ${pages} page(s): "${lines[0]}"`);
  const out = [...lines];
  while (out.length % 16) out.push('');
  return out.join('\n');
};

export const INSTRUCTIONS = [
  page([
    'Count Polygon is stealing the',
    'polygons out of the render.',
    'Roll RAY, the chrome sphere,',
    'through six scenes to each',
    "one's VANISHING POINT, the",
    'white light at the end.',
    '',
    'ARROWS or W A S D roll. Q/E',
    'and the keypad corners roll',
    'on the diagonals. SPACE fires',
    'a ray of light the way you',
    'last rolled.',
    '',
    'Every scene has two planes:',
    'NEAR and FAR. Only one is in',
    'focus at a time.',
  ]),
  page([
    'SHARP THINGS ARE SOLID.',
    "A BLUR ISN'T THERE AT ALL.",
    '',
    'Roll onto a FOCUS RING to',
    'pull focus to the other',
    'plane. Its lens glows the',
    'color of where it takes you:',
    'AMBER is near, CYAN is far.',
    "Ray's bands show which plane",
    'is in focus.',
    '',
    'Glass walkways hold you only',
    'in their own plane. Violet',
    'panels come and go: wait for',
    'them. A pink flicker means one',
    'is about to blur out.',
  ]),
  page([
    'Find the RED, GREEN and BLUE',
    'lenses. The RGB gate before',
    'each vanishing point takes',
    'one of each. Pulling focus',
    'brings a scene back the way',
    'it was (you keep your lenses).',
    '',
    'Wireframes, jaggies, bats and',
    'your dark double cost light.',
    'Your ray renders a wireframe',
    'into a crystal: touch it for',
    'points. Light bulbs, Teddy,',
    'Gwinn and Doc Leo give light.',
    'So does THE CHEZ: push on its',
    'charge port.',
    '',
  ]),
  page([
    'Arrows on the ground pull you',
    'their way. Teapots steam at',
    'you. Three rays take faces off',
    'Count Polygon; down to four,',
    'he flees to the far plane.',
    '',
    'F1 help      F2 status',
    'F3 music     F4 sound',
    'F5 save      F6 load',
    'ESC quit',
    '',
    'NO GLASSES REQUIRED.',
  ]),
].join('\n');

const CREDITS_TEXT = page(
  [
    'DEPTH PERCEPTION',
    'Sandbox Software, 1996',
    '',
    'Modeling, rendering, levels,',
    'music and sound by Claude:',
    'every block, sprite, picture',
    'and cartoon ray traced in',
    'software and saved as',
    'Game-Maker 3.0 files.',
    '',
    'Lighting director: Doc Leo,',
    'PhD (Comedic Science), who',
    'insisted on a spotlight.',
    '',
    'Starring Ray as himself.',
    '',
    'Teddy, the corgi with the',
    'big grin, as Teddy.',
    'Gwinn, sitting pretty, as',
    'Gwinn. THE CHEZ, a 1976 1/2',
    'CitiCar, plugged in at the',
    'rear passenger side.',
    '',
    'Count Polygon as the villain',
    '(twenty faces, then fewer).',
    '',
    'For Lewis "Lewie" Moten III,',
    'who drew 3D for BBSes in',
    '1995, one frame at a time.',
    '',
    'Made with GAME-MAKER by',
    'Recreational Software Designs.',
  ],
  2,
);

export const CREDITS = withCreditPage(CREDITS_TEXT);

/** The egg's page: what was behind the two-way mirror (from the egg registry, web/src/eggs/eggs.ts). */
export const EGG_TEXT = [
  page([
    'THE PRISM EGG',
    '',
    'Glossy black felt laid with',
    'a vanishing checkerboard',
    'floor in silver chain stitch,',
    'a faceted felt cube in three',
    'shades of violet so it reads',
    'as solid, and a rainbow of',
    'floss where the light comes',
    'through.',
    '',
    'It is sharp in both planes.',
    'Stand on it and press ENTER',
    'to take it with you.',
  ]),
  page([
    'Rendered by Claude Opus 5.5,',
    'one ray at a time.',
    '',
    'Lit by Doc Leo, who insisted',
    'on a spotlight.',
    '',
    'Left rendering all night at',
    '320x200: a perfect kitchen,',
    'a pot on every burner, a',
    'carton of thirteen eggs. In',
    'the chrome kettle, one',
    'reflection too many. Nobody',
    'can find its egg.',
  ]),
].join('\n');

export function readme(price: string): string {
  return `
    D E P T H
    P E R C E P T I O N
    Version 1.0 - March 1996
    (c) 1996 Sandbox Software

The render of the century was
99% done when Count Polygon
crept in through the modem and
started stealing polygons.
Spheres went octagonal. The
teapot went square.

Only Ray kept every polygon:
the chrome sphere from every
ray tracing demo ever made.
Roll him through six scenes,
pull focus between the near
and the far plane, and finish
the render by morning.

Sharp things are solid. A blur
isn't there. No glasses
required.

STARTING THE GAME
  Type DEPTH and press Enter.
  A VGA display is required. A
  Sound Blaster (or compatible)
  is recommended for the music
  and sampled sound effects;
  the PC speaker works too.
  A 486 is recommended. Every
  picture was rendered ahead of
  time, so a 386 plays fine.

FILES ON THIS DISK
  DEPTH.GAM    the game
  L?NEAR.*     the near planes
  L?FAR.*      the far planes
  *.FLI        cartoons
  *.CMF        Sound Blaster
               music
  *.VOC        digitized sounds
  *.GIF        pictures
  README.TXT   this file

THIS IS SHAREWARE
  You may copy DEPTH PERCEPTION
  and give it to your friends,
  upload it to your favorite
  BBS, or put it on a shareware
  disk, as long as all of the
  files are included and
  unchanged.

  If you enjoy it, please
  register for ${price} with
  Sandbox Software. Registered
  players receive "DEPTH
  PERCEPTION II: Bump Map",
  the hint book, and a pair of
  cardboard glasses you will
  not need. Send a check or
  money order (US funds) to:

    Sandbox Software
    Dept. DEPTH
    P.O. Box 000
    Pittsburgh, PA 15213

  (This is a fictional address
  for this game - there is no
  real Sandbox Software to
  mail. Please do not send
  money anywhere.)

SAYING THANKS
  Built with GAME-MAKER 3.0 by
  Recreational Software
  Designs. Rendered one ray at
  a time.

Stay in focus!
`.replace(/^\n/, '');
}
