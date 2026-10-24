// FILE_ID.DIZ: the little description an uploader put in every archive, at most 10 lines of
// 45 plain ASCII characters. BBS software (Renegade among them) read it out of the archive
// for the file listing, and PKUNZIP dropped it beside the files on your disk. Everything the
// -= S A N D B O X =- BBS hands out comes with one: the shareware games (C:\DOWNLOAD\<GAME>),
// the GIF Gallery's pictures (C:\IMAGES keeps the newest picture's, as each unzip wrote over
// the last) and the Warez area's releases, which a courier signs instead.
import { isSandboxGame, type CatalogEntry } from '../../project/files';
import { installedBytes, sizeText } from '../../project/diskFacts';
import type { GalleryFile } from './gallery';
import { words } from '../../keepTogether';

export const DIZ_WIDTH = 45;
export const DIZ_LINES = 10;
export const DIZ_NAME = 'FILE_ID.DIZ';

/** The SysOp's handle (Lewis): short for Vesuvian Doppelganger, a Magic: The Gathering card. */
const SYSOP_HANDLE = 'vesuvian';

const RULE = '-'.repeat(DIZ_WIDTH);
const SIGNOFF = 'Uploaded by %s to THE SANDBOX BBS';

/** The Sofa's own upload: a game from ../games under another publisher (The Bard of Bizarre's). */
const SOFA_UPLOADER = 'DOC LEO';
export const isSofaFile = (g: CatalogEntry) => !!g.original && !isSandboxGame(g);

/** The last line of a Warez release's DIZ: who couriered it to which board (the scene's way). */
export const warezSignoff = (courier = SYSOP_HANDLE): string => `Couriered by ${courier} * SANDBOX BBS WHQ`;

/** Plain 7-bit ASCII, as a DIZ had to be: curly quotes, dashes and the like made plain. */
export function ascii(text: string): string {
  return text
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00bd/g, '1/2')
    .replace(/\u00b7/g, '*')
    .replace(/\u00a0/g, ' ')
    .normalize('NFD')
    .replace(/[^\x20-\x7e\n]/g, '');
}

/** Words into lines of at most `width` (a word longer than that is cut). */
export function wrapWords(text: string, width: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of words(text).filter(Boolean)) {
    const w = word.slice(0, width);
    if (line && line.length + 1 + w.length > width) {
      out.push(line);
      line = w;
    } else line = line ? `${line} ${w}` : w;
  }
  if (line) out.push(line);
  return out;
}

/** At most `n` lines of `text`, the last ending "..." when there was more. */
function clip(text: string, n: number): string[] {
  const lines = wrapWords(text, DIZ_WIDTH);
  if (lines.length <= n) return lines;
  const kept = lines.slice(0, n);
  const last = wrapWords(kept[n - 1], DIZ_WIDTH - 3).join(' ');
  kept[n - 1] = `${last.length > DIZ_WIDTH - 3 ? last.slice(0, DIZ_WIDTH - 3) : last}...`;
  return kept;
}

function hash(s: string): number {
  let x = 2166136261;
  for (const c of s) x = Math.imul(x ^ c.charCodeAt(0), 16777619) >>> 0;
  return x;
}

const pick = <T>(list: T[], key: string): T => list[hash(key) % list.length];

/** "TITLE                [1/1]": the name on the left, the disk count on the right. */
function headline(title: string, tag = '[1/1]'): string {
  const room = DIZ_WIDTH - tag.length - 1;
  const t = ascii(title).toUpperCase();
  return `${(t.length > room ? t.slice(0, room) : t).padEnd(room)} ${tag}`;
}

/** A line centered in the 45 columns. */
const center = (text: string) => `${' '.repeat(Math.max(0, Math.floor((DIZ_WIDTH - text.length) / 2)))}${text}`.slice(0, DIZ_WIDTH);

/** Always within the limits, however long the parts were. */
function fitDiz(lines: string[]): string[] {
  return lines.slice(0, DIZ_LINES).map((l) => ascii(l).slice(0, DIZ_WIDTH).trimEnd());
}

/** The DIZ as a DOS text file: CR LF line ends. */
export function dizBytes(lines: string[]): Uint8Array {
  return new TextEncoder().encode(
    fitDiz(lines)
      .map((l) => `${l}\r\n`)
      .join(''),
  );
}

// ---- shareware games ---------------------------------------------------------------------

/**
 * What the uploader wrote about the games from other authors (their own readme blurbs start
 * with the keys or a story's first lines, which made poor descriptions).
 */
const SUMMARY: Record<string, string> = {
  ajqst2: 'Prince Ostro escaped! A-J Bear, Hedge the hedgehog and three friends set out to stop him for good.',
  ajquest: "A-J Bear's first quest: jump, fight and collect weapons. Use the number pad with Num Lock off.",
  bounerm: "A little green crystal on the sidewalk turns an ordinary guy's life upside down.",
  congress: 'Make PROGRESS, not CONGRESS! A platform romp where the 5 key casts your vote.',
  fluffyr: 'Ralph, a clever chicken-duck, adventures in Noniyan, where life lives in green crystals.',
  gridlin: 'Trapped in a world of grids where one touch turns flesh to stone. Martial arts only!',
  njlnflx: 'The first ship with the flux drive went too far. Survive what waits in deep space.',
  octolrs: 'Octolris, the only gelatinous octopus of his kind, escapes a crazed sushi fishing ship.',
  orb: 'A static-filled call from Chara 4 leads to a derelict planet. Is anyone still there?',
  pac: 'PAC spits power orbs through the dangerous Andims. Good luck, PAC!',
  paperair: 'A tiny radio-controlled plane with a TV camera, and a job only it can do.',
  parsec3d: 'Find the power crystal of XON (say "zon") past a dangerous alien race.',
  signhdg: 'Hedrick H. Hogg must bring one hundred crumpets to tea with the Queen.',
  zoom: "A spell gone wrong makes A-J Bear's cousin Zoom super. As told by A-J himself.",
  goat: 'The holy night, from the goat nobody painted. Eat anything, scream your fainting cousins stiff, find your place.',
  mustard: 'A tiny mustard seed with the greatest feet hops, pushes roots for water and moves a mountain on tiny faith.',
  needle: "The rich man's camel gives his gold to the poor, humps down through the narrow ways and squeezes through the eye of a needle.",
  loaf: 'The loaf nobody picked at the feeding of the 5,000 rolls past hungry hands and flying fish, gathers twelve baskets and goes home.',
  tickle: 'Doc Leo has a rat tickling certificate and no rats yet. Pin first, then tickle, and raise a laughing carpet. MWA-HA-HA!',
  remote: 'The remote is gone. Lift the cushions, the dog and the cat, call Mom, fall into the void between the cushions. Check your hand.',
  carl: 'You are Carl, the fly in the room. Eat his snacks, buzz his ear, barrel-roll past the dish towel, see things. Take the aux cord.',
  reckoning: '3:17 A.M., lactose intolerant, cheesecake in the fridge. Eat it anyway, outrun the gurgle, splash the Devil.',
  loofah: 'You touched the pink one. Now the towel screams. Light the candles, cleanse the demon sponge with brine.',
  smirked: 'Lily is eight and not scared. You are. Tackle a cardboard witch, sneeze through fake webs, bond with the exit sign.',
  sweats: 'Open mic at The Hive: 17 monologues about a pen, a chair, a blanket, a cart. Each one an EPIC. Declaim!',
  risi: "Veni, Vidi, Risi!'s six Latin songs: Rufus farts at the banquet, the brave coward runs, a cat hunts cheese. Make the Emperor laugh.",
};

const TAGLINES = [
  'Runs great on a 386. Even better on a 486!',
  'Turn off your TSRs, turn up the Sound Blaster',
  'Better than third-period study hall.',
  "Tested by the SysOp's corgi: two paws up!",
  'No QEMM tweaking required.',
  'Virus-scanned. Clean as a whistle',
  'Play it before Mom needs the phone line.',
  'Joystick optional. Fun mandatory.',
  'Bring snacks. You will be here a while.',
  'Warning: may cause "one more level" syndrome',
];

/** Who uploaded it: the SysOp his own Sandbox Software games, callers the rest. */
export function uploader(g: CatalogEntry): string {
  if (isSofaFile(g)) return SOFA_UPLOADER;
  return g.original ? SYSOP_HANDLE : pick(['MONSTER MASH', 'SAND CASTLE'], g.id);
}

function priceText(price: string | undefined): string {
  if (!price) return 'Shareware';
  if (/freeware/i.test(price)) return 'Freeware';
  return `Reg. ${price}`;
}

/** Left and right parts on one line, dropping `extra` from the left when they don't fit. */
function spread(left: string, extra: string, right: string): string {
  const l = left.length + extra.length + 1 + right.length <= DIZ_WIDTH ? left + extra : left;
  return `${l.padEnd(DIZ_WIDTH - right.length - 1)} ${right}`;
}

/** The FILE_ID.DIZ in a shareware game's ZIP. */
export function gameDiz(g: CatalogEntry): string[] {
  const by = ascii(g.company ?? g.author ?? 'Unknown author');
  const second = spread(by, g.year ? `, ${g.year}` : '', priceText(ascii(g.price ?? '')));
  const about = SUMMARY[g.id] ?? (g.blurb ?? g.title).replace(/^\([^)]*\)\s*/, '');
  const sound = g.original && g.original.sound !== 'speaker' ? 'VGA * SB music' : 'VGA * PC speaker';
  return fitDiz([
    headline(g.title),
    second,
    RULE,
    ...clip(ascii(about), 3),
    // what the caller has to clear on the hard disk, as uploaders put it
    `Game-Maker 3.0 * ${sound} * ${sizeText(installedBytes(g), false)} HD`,
    // the Bard's games are free to change for real (MIT), whatever the price line says
    center(isSofaFile(g) ? 'Free to play, share & change (MIT)' : pick(TAGLINES, g.id)),
    RULE,
    isSofaFile(g) ? `Uploaded by ${uploader(g)} to THE SOFA BBS` : SIGNOFF.replace('%s', uploader(g)),
  ]);
}

// ---- the GIF Gallery -------------------------------------------------------------------

/** The FILE_ID.DIZ of a picture in the GIF Gallery (the SysOp's own snapshots), or in The Sofa's GIF area (Doc Leo's). */
export function pictureDiz(f: GalleryFile): string[] {
  if (f.board === 'sofa')
    return fitDiz([
      headline(f.name),
      f.format === 'GIF'
        ? `${f.width}x${f.height}, ${f.colors} ${f.gray ? 'grays' : 'colors'}, interlaced GIF`
        : `${f.width}x${f.height}, JPEG${f.gray ? ', gray' : ''}`,
      RULE,
      ...clip(ascii(f.desc), 4),
      center(f.format === 'GIF' ? 'Interlaced: watch it fill in!' : 'JPEG: worth the wait!'),
      RULE,
      `Uploaded by ${SOFA_UPLOADER} to THE SOFA BBS`,
    ]);
  const kind = f.format === 'GIF' ? `${f.colors} ${f.gray ? 'grays' : 'colors'}, GIF` : `JPEG${f.progressive ? ', progressive' : ''}${f.gray ? ', gray' : ''}`;
  const tag = f.format === 'GIF' ? 'Scanned at the copy shop. VPIC it!' : 'JPEG: worth the wait on a fast 486.';
  return fitDiz([headline(f.name), `${f.width}x${f.height}, ${kind}`, RULE, ...clip(ascii(f.desc), 3), center(tag), RULE, SIGNOFF.replace('%s', SYSOP_HANDLE)]);
}

/** The newest of the downloaded pictures: its DIZ is the one left in C:\IMAGES. */
export function newestPicture<T extends { name: string }>(pictures: T[], when: (name: string) => number | undefined): T | undefined {
  let best: T | undefined;
  let at = -Infinity;
  for (const p of pictures) {
    const t = when(p.name);
    if (t !== undefined && t >= at) {
      best = p;
      at = t;
    }
  }
  return best;
}
