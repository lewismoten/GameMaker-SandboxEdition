// The 13 lucky charms Midnight gathers, cut in the game's woodcut (print.ts): printed in the spot gold, red and bare
// paper, each with a paper cut line so it shines on the night plate. None is money: a horseshoe, a four-leaf clover,
// a ladybug, a wishbone, a lucky acorn, a striped sock, a shooting star, dice that make seven, a feather, a rainbow,
// a little bell, a prize ribbon and a swirled marble.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { T, art, blank, cut, skyTile, type Pal } from './print';

/** The charms in the order the levels give them out. */
export const CHARMS = [
  'horseshoe',
  'clover',
  'ladybug',
  'wishbone',
  'acorn',
  'sock',
  'star',
  'dice',
  'feather',
  'rainbow',
  'bell',
  'ribbon',
  'marble',
] as const;
export type Charm = (typeof CHARMS)[number];

/** 16x16 drawings, placed at (2, 2) of the block. */
const ROWS: Partial<Record<Charm, string[]>> = {
  horseshoe: [
    '................',
    '.GGGG......GGGG.',
    '.GPgG......GPgG.',
    '.GGGG......GGGG.',
    '.GgKG......GKgG.',
    '.GggG......GggG.',
    '.GgKG......GKgG.',
    '.GgggG....GgggG.',
    '..GgKgG..GgKgG..',
    '..GgggGGGGgggG..',
    '...GggKggKggG...',
    '....GGggggGG....',
    '......GGGG......',
    '................',
    '................',
    '................',
  ],
  ladybug: [
    '................',
    '.....K....K.....',
    '......K..K......',
    '......KKKK......',
    '.....KKPKPK.....',
    '....RRRKKRRR....',
    '...RRRRKKRRRR...',
    '..RRKKRRKRRKKR..',
    '..RRKKRRKRRKKR..',
    '..RRRRRRKRRRRR..',
    '..RKKRRRKRRRKR..',
    '..RKKRRRKRRRKR..',
    '...RRRRRKRRRR...',
    '....rRRRKRRRr...',
    '.....rrrKrrr....',
    '................',
  ],
  wishbone: [
    '................',
    '.PP..........PP.',
    '.PPP........PPP.',
    '..PPq......qPP..',
    '...PPq....qPP...',
    '...qPP....PPq...',
    '....PPq..qPP....',
    '....qPP..PPq....',
    '.....PPqqPP.....',
    '.....qPPPPq.....',
    '......PPPP......',
    '.....PPPPPP.....',
    '.....qqqqqq.....',
    '................',
    '................',
    '................',
  ],
  acorn: [
    '................',
    '.......KK.......',
    '........K.......',
    '....KKKKKKKK....',
    '...KkPkkPkkPK...',
    '..KkkkPkkPkkkK..',
    '..KPkkkPkkPkkK..',
    '..KKKKKKKKKKKK..',
    '...GGGGGGGGGy...',
    '...GPGGGGGGgy...',
    '...GPGGGGGGgy...',
    '....GGGGGGgy....',
    '....GGGGGggy....',
    '.....GGGggy.....',
    '.......gy.......',
    '................',
  ],
  sock: [
    '................',
    '....KKKKKKK.....',
    '....PPPPPPP.....',
    '....RRRRRRR.....',
    '....PPPPPPP.....',
    '....RRRRRRR.....',
    '....PPPPPPP.....',
    '....RRRRRRR.....',
    '....PPPPPPPP....',
    '....RRRRRRRRR...',
    '....PPPPPPPPPP..',
    '....RRRRRRRRRRR.',
    '....PPPPPPPPPPP.',
    '.....rrrrrrrrr..',
    '................',
    '................',
  ],
  star: [
    '................',
    '..........G.....',
    '.........GGG....',
    '.........GGG....',
    '.....GGGGGPGGGGG',
    '......GGGPGGGGG.',
    '.PP.....GGGGG...',
    '........GGGGG...',
    '..PPP..GGG.GGG..',
    '.......GG...GG..',
    '.PP....G.....G..',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  dice: [
    '................',
    '................',
    '.KKKKKKKK.......',
    '.KPPPPPPK.......',
    '.KPRPPPPKKKKKKKK',
    '.KPPPPPPKPPPPPPK',
    '.KPPPRPPKPRPPRPK',
    '.KPPPPPPKPPPPPPK',
    '.KPPPPPRKPPPPPPK',
    '.KPPPPPPKPPPPPPK',
    '.KKKKKKKKPRPPRPK',
    '.........KPPPPPK',
    '.........KKKKKKK',
    '................',
    '................',
    '................',
  ],
  feather: [
    '................',
    '............PP..',
    '..........PPPPP.',
    '.........PPPPPP.',
    '........PPPPKPP.',
    '.......PPPPKPPq.',
    '......PPPPKPPq..',
    '.....qPPPKPPq...',
    '.....PPPKPPq....',
    '....qPPKPPq.....',
    '....PPKPPq......',
    '....PKPq........',
    '...KKq..........',
    '..K.............',
    '.K..............',
    '................',
  ],
  rainbow: [
    '................',
    '................',
    '.....RRRRRR.....',
    '...RRRRRRRRRR...',
    '..RRGGGGGGGGRR..',
    '.RRGGGGGGGGGGRR.',
    '.RGGPPPPPPPPGGR.',
    'RRGPPPPPPPPPPGRR',
    'RGGPP......PPGGR',
    'RGPP........PPGR',
    'RGPP........PPGR',
    'PPPPP......PPPPP',
    'PPPPPP....PPPPPP',
    '................',
    '................',
    '................',
  ],
  bell: [
    '................',
    '.......KK.......',
    '......K..K......',
    '......GGGG......',
    '.....GPGGGy.....',
    '....GPGGGGGy....',
    '....GPGGGGGy....',
    '....GGGGGGGy....',
    '...GGGGGGGGGy...',
    '...GGGGGGGGGy...',
    '..GGGGGGGGGGGy..',
    '..gggggggggggg..',
    '.......KK.......',
    '.......KK.......',
    '................',
    '................',
  ],
  ribbon: [
    '................',
    '.....RRRRRR.....',
    '....RRrRRrRR....',
    '...RRRRRRRRRR...',
    '...RrRGGGGRrR...',
    '...RRRGPGGRRR...',
    '...RrRGGGGRrR...',
    '...RRRRRRRRRR...',
    '....RRrRRrRR....',
    '.....RRRRRR.....',
    '.....RR..RR.....',
    '....RRR..RRR....',
    '....RR....RR....',
    '...RRR....RRR...',
    '...R.R....R.R...',
    '................',
  ],
};

/** The four-leaf clover: four lobed leaves on the diagonals, ink veins, a curling stem (no plus shape). */
function clover(pal: Pal): Pixels {
  const s = blank();
  for (const [dx, dy] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    const cx = 9.5 + dx * 3.6;
    const cy = 8.5 + dy * 3.6;
    s.disc(cx + dx * 0.8 - dy * 1.4, cy + dy * 0.8 + dx * 1.4, 2.6, pal.c('gold', 3));
    s.disc(cx + dx * 0.8 + dy * 1.4, cy + dy * 0.8 - dx * 1.4, 2.6, pal.c('gold', 3));
    s.disc(cx, cy, 2.2, pal.c('gold', 3));
    s.line(Math.round(9.5 + dx), Math.round(8.5 + dy), Math.round(cx + dx * 2), Math.round(cy + dy * 2), pal.c('gold', 1));
  }
  s.disc(9.5, 8.5, 1.4, pal.c('gold', 1));
  s.line(10, 10, 12, 16, pal.c('ink', 0)).line(12, 16, 14, 18, pal.c('ink', 0));
  return s;
}

/** The marble: a paper ball with a gold swirl and a gleam. */
function marble(pal: Pal): Pixels {
  const s = blank();
  s.disc(9.5, 9.5, 6.5, pal.c('paper', 3));
  for (let a = 0; a < 9; a += 0.15) {
    const r = 1 + a * 0.6;
    if (r > 6) break;
    s.set(Math.round(9.5 + Math.cos(a) * r), Math.round(9.5 + Math.sin(a) * r), pal.c('gold', 3));
    s.set(Math.round(9.5 + Math.cos(a + 0.1) * r), Math.round(10 + Math.sin(a + 0.1) * r), pal.c('gold', 1));
  }
  s.rect(6, 6, 2, 2, pal.c('paper', 4));
  return s;
}

/** A charm as a transparent sprite (no cut line yet). */
function sprite(pal: Pal, name: Charm): Pixels {
  if (name === 'clover') return clover(pal);
  if (name === 'marble') return marble(pal);
  const s = blank();
  return s.blit(art(pal, ROWS[name]!, {}, 16, 16), 2, 2, T);
}

/** A charm's block: on the night plate, with its cut line. */
export function charmPicture(pal: Pal, name: Charm): Pixels {
  return skyTile(pal).blit(cut(pal, sprite(pal, name), 4), 0, 0, T);
}

/** A charm with a clear background (255), to stand in a picture. */
export function charmSprite(pal: Pal, name: Charm): Pixels {
  return cut(pal, sprite(pal, name), 4);
}
