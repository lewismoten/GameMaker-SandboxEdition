// What each game's laser wooden nickel (laserNickels.ts) says and shows. The figures come from the game's own built disk:
// pixelTrinketDefs.ts names a hero and a signature figure for most games, and the rest are named here. The words are the
// game's own world (its about.json): `top` and `bottom` are the arcs on the front (micro 3x5 letters, 15 characters at
// most), `good` is the back's "GOOD FOR ONE ..." in up to three lines of 8x8 letters (11 characters at most a line).
// Secret games are not listed here and never get a nickel.
import type { Def } from './pixelTrinketDefs';

export interface NickelDef {
  top: string;
  /** The front's lower arc; the year between stars when left out. */
  bottom?: string;
  good: string[];
  /** A figure for games pixelTrinketDefs.ts has none for: character file, its block file, a palette. */
  hero?: { chr: string; cbl: string; pal: string; seq?: number };
  /** Draw no figure (the game's own thing is drawn by hand, like the Round Tuit). */
  noFigure?: boolean;
}

const h = (chr: string, cbl: string, pal: string, seq?: number) => ({ chr: `${chr}.chr`, cbl: `${cbl}.cbl`, pal: `${pal}.pal`, seq });

export const NICKELS: Record<string, NickelDef> = {
  blaster: { top: 'VIRUS BLASTER', good: ['ONE FREE', 'VIRUS SCAN'], hero: h('ship', 'ship', 's1') },
  brief: { top: 'KEEP IT BRIEF!', bottom: 'TINY POCKETS', good: ['ONE STORY', 'OF EXACTLY', '100 WORDS'] },
  carl: { top: 'A FLY NAMED CARL', good: ['ONE BUZZ', 'IN HIS EAR', 'AT 3:47 AM'] },
  depth: { top: 'DEPTH PERCEPTION', good: ['ONE PULL', 'OF FOCUS'], hero: h('near', 'ray', 'l1') },
  goat: { top: 'THIRD GOAT', bottom: 'FROM THE LEFT', good: ['ONE GOAT', 'SCREAM'] },
  loaf: { top: 'LOAF #13', bottom: 'IN THE BASKET', good: ['ONE HOLY', 'CRUMB'] },
  logic: { top: 'OHM SWEET OHM', good: ['ONE SPARE', 'FUSE'] },
  loofah: { top: 'CLEANSE ME', bottom: 'O LOOFAH', good: ['ONE SCRUB', 'LEAVING', 'MY SOUL'] },
  maximus: { top: 'MAXIMUS', bottom: 'HUNDRED WORLDS', good: ['ONE STAR', 'SHARD'], hero: h('courier', 'courier', 'galaxy') },
  mustard: { top: 'MUSTARD SEED', bottom: 'HUSTLE', good: ['ONE MOVED', 'MOUNTAIN'] },
  needle: { top: 'BROTHER CAMEL', good: ['ONE CAMEL', 'THROUGH', 'THE EYE'] },
  realm: { top: 'A ROUND TUIT', bottom: 'GET AROUND TO IT', good: ['GETTING', 'AROUND', 'TO IT'], noFigure: true },
  reckoning: { top: 'DAIRY RECKONING', bottom: '3:17 A.M.', good: ['ONE SLICE', 'AT 3:17 AM'], hero: h('leo', 'reckon', 'bedroom') },
  remote: { top: 'THE REMOTE?!', good: ['ONE LOOK', 'UNDER THE', 'COUCH'], hero: h('remote', 'remote', 'den') },
  risi: { top: 'VENI VIDI RISI', good: ['ONE LAUGH', 'IN ROME'] },
  sandcast: { top: 'SANDCASTLE', bottom: 'KNIGHT', good: ['ONE TOWER', 'OF SAND'], hero: h('sandcast', 'sandcast', 'dusk') },
  sleuth: { top: 'FINAL CURTAIN', good: ['ONE ALIBI', 'CHECK'], hero: h('ada', 'ada', 'house') },
  smirked: { top: 'I SCREAMED', bottom: 'SHE SMIRKED', good: ['ONE YELL', 'AT THE FOG', 'MACHINE'], hero: h('smirked', 'smirked', 'foyer') },
  snowbound: { top: 'SNOWBOUND', bottom: 'THE $89 SHOVEL', good: ['ONE SCOOP', 'OF SNOW', 'FOR $1'], hero: h('kid', 'kid', 'morning') },
  sweats: { top: 'SHAKESPEARE IN', bottom: 'SWEATPANTS', good: ['ONE OPEN', 'MIC SLOT'] },
  teddy: { top: 'TEDDY', bottom: 'LITTLE BIG', good: ['ONE TRICK', 'ON REQUEST'] },
  teddy2: { top: 'TEDDY', bottom: 'LITTLE BIGGER', good: ['ONE SNIFF', "OF GWINN'S", 'TRAIL'] },
  teddy3: { top: 'TEDDY', bottom: 'LITTLE BIGGEST', good: ['ONE BIG', 'BIRTHDAY', 'SURPRISE'], hero: h('teddy', 'teddy', 'garage') },
  tickle: { top: 'CERTIFIED', bottom: 'RAT TICKLER', good: ['ONE RAT', 'TICKLE'], hero: h('leo', 'tickle', 'course') },
  tuneup: { top: 'TUNE-UP', good: ['ONE FREE', 'TUNE-UP', 'BY EAR'], hero: h('leo', 'leo', 'band1') },
  year2000: { top: 'IN THE YEAR', bottom: '2000!', good: ['ONE FREE', 'TELEPORT'], hero: h('dex', 'dex', 'y2k') },
};

/** A Def (pixelTrinketDefs.ts shape) for a hero named here. */
export const heroDef = (game: string, n: NickelDef): Def | undefined =>
  n.hero ? { id: game, title: game, blurb: '', source: { chr: n.hero.chr, cbl: n.hero.cbl, seq: n.hero.seq }, pal: n.hero.pal } : undefined;
