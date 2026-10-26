// What a Sandbox Software box says about its game, worked out from the game itself:
// how many floppies it ships on, how long it takes to finish, which selling points are
// true of it (no claiming digitized sound for a PC speaker game), its rating seal, and
// how the back cover's copy, reviews, features and screenshots fit the space they have.
import type { CatalogEntry } from '../../project/files';
import { gameDisks } from '../../project/diskFacts';
import { ADVTYPE, type Game } from '../../formats/game';
import { fnv1a, mulberry32 } from '../../seededRandom';

/** Optional extras an about.json "box" may carry, beside the art and copy. */
export interface BoxExtras {
  /** Hours of play to finish, set from the walkthrough by games/kit/playtime.ts (playtime.ts); estimated from the number of levels when missing. */
  hours?: number;
  /**
   * What the box says in place of "N levels to explore" (the count of level scenes), for a game
   * whose scenes aren't what a player would call levels: "One night in five parts", "23 haywire
   * circuit boards". An empty string leaves the line off.
   */
  levels?: string;
  /** More selling points, printed with the ones worked out from the game's files. */
  claims?: string[];
  /** Quotes from (made-up) 1994-95 magazines. */
  reviews?: { quote: string; source: string }[];
  /** A laurel on the front, e.g. { title: 'Shareware Game of the Month', from: 'Diskette Digest' }. */
  award?: { title: string; from: string };
  /** The store's price sticker ($4.99 at Bits & Bytes by default): what the store asked for the shareware disk, not the author's registration fee (CatalogEntry.price). */
  sticker?: { store?: string; price?: string };
  /** A poster or fold-out map for the wall while the game is played. */
  poster?: { gif?: string; map?: [string, number, number, number, number]; title?: string; caption?: string };
}

export { disksLine } from '../../project/diskFacts';

/** How many 1.44 MB disks an original game ships on (its files plus the DOS player): project/diskFacts.ts gameDisks, from a size alone. */
export function boxDisks(bytes: number | undefined): number {
  return gameDisks({ bytes, original: {} });
}

const NICE_HOURS = [1, 2, 3, 5, 8, 10, 15, 20, 25, 30, 40, 50];

/** Hours to finish: the box's own figure, or about 45 minutes a level, rounded down to a figure a box would print. */
export function playHours(levels: number, stated?: number): number {
  if (stated && stated > 0) return stated;
  const guess = levels * 0.75;
  return [...NICE_HOURS].reverse().find((n) => n <= guess) ?? 1;
}

export function hoursLine(hours: number): string {
  return hours <= 1 ? 'Hours of gameplay!' : `Over ${hours} hours of gameplay!`;
}

const count = (files: string[], ext: string) => files.filter((f) => f.toLowerCase().endsWith(`.${ext}`)).length;

/** Selling points that are true of this game, from its files and sound card. */
export function boxClaims(entry: Pick<CatalogEntry, 'files' | 'original'>, levels: number): string[] {
  const files = entry.files;
  const sb = entry.original?.sound === 'sb';
  const songs = count(files, 'cmf');
  const vocs = count(files, 'voc');
  const out = ['Stunning 256-color VGA graphics'];
  const own = (entry.original?.box as BoxExtras | undefined)?.levels;
  if (own !== undefined) {
    if (own) out.push(own);
  } else if (levels > 1) out.push(`${levels} levels to explore`);
  if (sb && songs) out.push(`${songs} original Sound Blaster FM song${songs === 1 ? '' : 's'}`);
  if (sb && vocs) out.push('Digitized sound effects');
  if (!sb) out.push('PC speaker sound: no sound card needed');
  if (count(files, 'fli')) out.push('Animated cut-scenes');
  if (count(files, 'rec')) out.push('Self-running demo');
  if (files.some((f) => /\.his$/i.test(f)) || files.some((f) => /hiscore|scores/i.test(f))) out.push('High-score table');
  out.push('Save your game at any time');
  // PLAYGAME reads the joystick port (code/GM/JSTICK.H)
  out.push('Keyboard or joystick');
  return [...out, ...((entry.original?.box as BoxExtras | undefined)?.claims ?? [])];
}

/** The rating seal: "Ages 8 and up" -> 8+; anything without an age is for everyone. */
export function ratingMark(rating: string | undefined): { mark: string; label: string } {
  const age = rating?.match(/(\d+)/)?.[1];
  return age ? { mark: `${age}+`, label: `AGES ${age} & UP` } : { mark: 'E', label: 'ALL AGES' };
}

/** A small, stable random number generator, so a box is scuffed the same way every time. */
export function seeded(seed: string): () => number {
  return mulberry32(fnv1a(seed));
}

/** Made-up magazines and quotes, for a box whose about.json has none. */
const MAGAZINES = ['Diskette Digest', 'VGA Voyager', 'Megapixel Monthly', 'The Boot Sector', 'Modem Morning News', 'Joyport Gazette'];
const QUOTES = ['A shareware gem.', 'We could not stop playing!', 'Worth every penny of the registration fee.', 'Two thumbs on the joystick: up!'];

export function boxReviews(id: string, extras: BoxExtras): { quote: string; source: string }[] {
  if (extras.reviews?.length) return extras.reviews;
  const r = seeded(`${id}#reviews`);
  const mag = MAGAZINES[Math.floor(r() * MAGAZINES.length)];
  return [{ quote: QUOTES[Math.floor(r() * QUOTES.length)], source: mag }];
}

export function boxAward(id: string, extras: BoxExtras): { title: string; from: string } {
  if (extras.award) return extras.award;
  const r = seeded(`${id}#award`);
  return { title: 'Shareware Pick of the Month', from: MAGAZINES[Math.floor(r() * MAGAZINES.length)] };
}

interface BackPlan {
  bodyPx: number;
  features: number;
  reviews: number;
  /** Screenshot row scale (1 = full size); 0 drops the screenshots. */
  shots: number;
  height: number;
}

/** How good a back cover plan looks: readable type, the reviews, screenshots and features, in that order. */
export function backScore(p: Omit<BackPlan, 'height'>): number {
  const shots = p.shots >= 1 ? 14 : p.shots >= 0.85 ? 12 : p.shots > 0 ? 10 : 0;
  const reviews = p.reviews ? 6 + (p.reviews - 1) * 2 : 0;
  return (p.bodyPx - 14) * 1.2 + Math.min(p.features, 3) * 3 + Math.max(0, p.features - 3) * 1.5 + reviews + shots;
}

/**
 * Fits the back cover: the story, reviews, feature bullets and a row of screenshots must
 * end above the claims and requirements. Of every mix of type size, features, reviews and
 * screenshot size that fits, picks the best looking (backScore); `heightOf` measures the
 * content laid out with a plan.
 */
export function planBack(available: number, featureCount: number, reviewCount: number, heightOf: (p: Omit<BackPlan, 'height'>) => number): BackPlan {
  let best: BackPlan | undefined;
  let bestScore = -1;
  for (const bodyPx of [19, 18, 17, 16, 15, 14])
    for (const shots of [1, 0.85, 0.7, 0])
      for (let reviews = reviewCount; reviews >= 0; reviews--)
        for (let features = featureCount; features >= 0; features--) {
          const p = { bodyPx, features, reviews, shots };
          const score = backScore(p);
          if (score <= bestScore) continue;
          const height = heightOf(p);
          if (height <= available) {
            best = { ...p, height };
            bestScore = score;
            break; // fewer features would only score less
          }
        }
  if (best) return best;
  // a long story alone: smaller type until it ends above the claims, never under them
  let last = { bodyPx: 13, features: 0, reviews: 0, shots: 0 };
  while (last.bodyPx > 9 && heightOf(last) > available) last = { ...last, bodyPx: last.bodyPx - 1 };
  return { ...last, height: heightOf(last) };
}

/** A screenshot's caption: the name of the level its map belongs to ("1a The Data Bus" -> "Stage 1: The Data Bus"). */
export function shotCaption(game: Game | undefined, map: string): string {
  const desc = game?.scenes.find((s) => s.files.some((f) => f.toLowerCase() === map.toLowerCase()))?.desc.trim() ?? '';
  return desc.replace(/^(\d+)[a-z]\s+/i, 'Stage $1: ');
}

/** What a box reads from the game's .gam: its number of levels and its screenshots' captions (CatalogEntry.boxGame, worked out when the site is built). */
export interface BoxGame {
  levels: number;
  captions: string[];
}

export function boxGame(game: Game | undefined, shots: [string, number, number][] | undefined): BoxGame {
  return {
    levels: game?.scenes.filter((s) => s.gametype === ADVTYPE).length ?? 0,
    captions: (shots ?? []).slice(0, 3).map(([m]) => shotCaption(game, m)),
  };
}
