// Gwinn as a hero (gwinn.chr): the chocolate pit-lab mix from the first adventure, now with
// tricks of her own. Her side views come from sprites/gwinn.ts; her tricks face the player,
// like Teddy's, so she never seems to turn around by herself. Amber eyes, a liver nose, a
// pink collar, a white chest patch and a tongue that never goes back in.
import type { Pixels } from '../../../kit/pixels';
import { sprite } from '../art/draw';
import { P } from '../art/pal';
import { GWINN } from './gwinn';

const K: Record<string, number> = {
  o: P.c('gwinn', 0),
  d: P.c('gwinn', 1),
  g: P.c('gwinn', 2),
  G: P.c('gwinn', 3),
  h: P.c('gwinn', 4),
  n: P.c('gwinn', 1),
  w: P.c('fur', 2),
  k: P.c('ink', 0),
  p: P.c('tongue', 1),
  P: P.c('tongue', 0),
  r: P.c('pink', 2),
  y: P.c('yellow', 2),
  D: P.c('dirt', 2),
  E: P.c('dirt', 4),
  s: P.c('cloud', 2),
  W: P.c('paint', 3),
};
const S = (rows: string[], dx?: number, dy?: number) => sprite(rows, K, dx, dy);

const FACE = [
  '.....oooooooooo.....',
  '....oGGhhhhhhGGo....',
  '...oGGGGGGGGGGGGo...',
  '..oddGGGGGGGGGGddo..',
  '.odddGykGGGGkyGdddo.',
  '.odddGGGGGGGGGGdddo.',
  '.oddoGGGGddGGGGoddo.',
  '..ooooGGdkkdGGoooo..',
];
const BODY = [
  '......orrrrrro......',
  '.....ogGGwwGGgo.....',
  '....ogGGGwwGGGgo....',
  '....ogGGGwwGGGgo....',
  '....oggGGGGGGggo....',
  '....oggggggggggo....',
  '....ogdo....odgo....',
  '....ogo......ogo....',
  '....ooo......ooo....',
];

export const GWINN_HERO: Record<string, Pixels> = {
  ...GWINN,
  // Standing, facing you, tongue out.
  gFront: S([...FACE, '.....oGGgnngGGo.....', '......oGGppGGo......', ...BODY]),
  gFrontBlink: S([...FACE.slice(0, 4), '.odddGooGGGGooGdddo.', ...FACE.slice(5), '.....oGGgnngGGo.....', '......oGGppGGo......', ...BODY]),
  // BOOF: mouth wide.
  gBoof: S([...FACE, '.....oGkkkkkkGo.....', '.....oGkPppPkGo.....', '......oGkkkkGo......', ...BODY.slice(0, 1), ...BODY.slice(2)]),
  // Chewing: head tilted, something (a rope end) between her teeth.
  gChew1: S([
    '......oooooooooo....',
    '.....oGGhhhhhhGGo...',
    '....oGGGGGGGGGGGGo..',
    '...oddGGGGGGGGGGddo.',
    '..odddGykGGGGkyGdddo',
    '..odddGGGGGGGGGGdddo',
    '..oddoGGGGddGGGGoddo',
    '...ooooGGdkkdGGoooo.',
    '.WWWWWWoGkkkkGoWWW..',
    '......oGGwwwwGo.....',
    '......orrrrrro......',
    '.....ogGGwwGGgo.....',
    '....ogGGGwwGGGgo....',
    '....oggGGGGGGggo....',
    '....oggggggggggo....',
    '....ogdo....odgo....',
    '....ogo......ogo....',
    '....ooo......ooo....',
  ]),
  gChew2: S([
    '....oooooooooo......',
    '...oGGhhhhhhGGo.....',
    '..oGGGGGGGGGGGGo....',
    '.oddGGGGGGGGGGddo...',
    'odddGykGGGGkyGdddo..',
    'odddGGGGGGGGGGdddo..',
    'oddoGGGGddGGGGoddo..',
    '.ooooGGdkkdGGoooo...',
    '..WWWoGkkkkGoWWWWWW.',
    '.....oGwwwwGGo......',
    '......orrrrrro......',
    '.....ogGGwwGGgo.....',
    '....ogGGGwwGGGgo....',
    '....oggGGGGGGggo....',
    '....oggggggggggo....',
    '....ogdo....odgo....',
    '....ogo......ogo....',
    '....ooo......ooo....',
  ]),
  // Starting to sit... (the back end goes down)
  gSitHalf: S([...FACE, '.....oGGgnngGGo.....', '......oGGppGGo......', '......orrrrrro......', '.....ogGGwwGGgo.....', '....ogGGGwwGGGgo....', '...ogGGGGwwGGGGgo...', '...oggGGGGGGGGggo...', '...ogggggggggggoo...', '..ooooo......ooooo..']),
  // ...and sitting! For one tick.
  gSat: S([...FACE, '.....oGGgnngGGo.....', '......oGGppGGo......', '......orrrrrro......', '....ooGGGwwGGGoo....', '...oGGGGGwwGGGGGo...', '..oGGGGGGwwGGGGGGo..', '..ooooooooooooooooo.']),
  // Gone again: up and wiggling, the sit already forgotten.
  gWiggle: S([...FACE.map((r) => r.slice(1) + '.'), '....oGGgnngGGo......', '.....oGGppGGo.......', '.....orrrrrro.......', '....ogGGwwGGgo..o...', '...ogGGGwwGGGgoo....', '...ogGGGwwGGGgo.....', '...oggGGGGGGggo.....', '...oggggggggggo.....', '...ogdo....odgo.....', '...ogo......ogo.....', '...ooo......ooo.....']),
  // Digging big, from behind: a lot of rump, a lot of dirt.
  gDig1: S([
    'E..D..............D.',
    '....D..........E....',
    '..E..oooooooooo...D.',
    '....oGGGGGGGGGGo....',
    '...oddGGGGGGGGddo...',
    '..odddGGGGGGGGdddo..',
    '..oddoGGGGGGGGoddo..',
    '...oogGGGGGGGGgoo...',
    '....ogGGGGGGGGgo....',
    '...ogGGGGGGGGGGgo...',
    '...oggGGGGGGGGggo...',
    '...ogggggggggggo..o.',
    '...oggggggggggggoo..',
    '...ogdo......odgo...',
    'DDDooo......oooDDDD.',
  ]),
  gDig2: S([
    '..D.............E...',
    'E...........D.......',
    '.....oooooooooo..E..',
    '....oGGGGGGGGGGo....',
    '...oddGGGGGGGGddo...',
    '..odddGGGGGGGGdddo..',
    '..oddoGGGGGGGGoddo..',
    '...oogGGGGGGGGgoo...',
    '....ogGGGGGGGGgo....',
    '...ogGGGGGGGGGGgo.o.',
    '...oggGGGGGGGGggoo..',
    '...ogggggggggggo....',
    '...oggggggggggggo...',
    '...ogdo......odgo...',
    'DDDDooo......oooDDD.',
  ]),
  // Bounced back, eyes shut.
  gHurt: S([...FACE.slice(0, 4), '.odddGkkGGGGkkGdddo.', ...FACE.slice(5), '.....oGGgnngGGo.....', '......oGGGGGGo......', ...BODY].map((r) => r.replace(/[gGhd]/g, 'w'))),
  // Tuckered out: a big brown loaf, snoring.
  gSleep: S([
    '.....ooooooooo......',
    '...ooGGGGGGGGGoo....',
    '..oGGGGGGGGGGGGGoo..',
    '.oddoGGGGGGGGGGGGGo.',
    '.oddokkGGGGGGGGGGGo.',
    '.odoGGGGnkGGGGGgggo.',
    '..ooooooooooooooooo.',
  ]),
};
