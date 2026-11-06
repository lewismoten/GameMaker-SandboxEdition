// Bounded, canonical challenge text. Parsing is pure: no fetches, game execution or storage.
import { BACKYARD } from './profile';

export interface ChallengeDescriptor {
  v: 1;
  game: string;
  version: string;
  hash: string;
  scene: number;
  start: string;
  rules: string;
  target: string;
}

const PREFIX = 'gm-challenge/1';
const FRAGMENT = '#challenge=';
const MAX_TEXT = 256;
const MAX_FRAGMENT = FRAGMENT.length + MAX_TEXT * 3;
const unavailable = () => new Error('Challenge unavailable or invalid.');

/** Only reviewed, public content is supported, even if other games have been revealed. */
function approved(d: ChallengeDescriptor): boolean {
  return d.v === 1 && Object.entries(BACKYARD).every(([key, value]) => d[key as keyof typeof BACKYARD] === value);
}

/** Fixed fields avoid JSON nesting, duplicate keys, scripts and arbitrary rule expressions. */
export function challengeText(d: ChallengeDescriptor): string {
  if (!approved(d) || Object.keys(d).length !== 8) throw unavailable();
  return [PREFIX, d.game, d.version, d.hash, d.scene, d.start, d.rules, d.target].join('|');
}

export function parseChallengeText(text: unknown): ChallengeDescriptor {
  if (typeof text !== 'string' || text.length > MAX_TEXT || !/^[a-z0-9/|.-]+$/.test(text)) throw unavailable();
  const fields = text.split('|');
  if (fields.length !== 8 || fields[0] !== PREFIX) throw unavailable();
  const [, game, version, hash, scene, start, rules, target] = fields;
  const d: ChallengeDescriptor = { v: 1, game, version, hash, scene: Number(scene), start, rules, target };
  if (!approved(d) || challengeText(d) !== text) throw unavailable();
  return d;
}

export function challengeFragment(d: ChallengeDescriptor): string {
  return FRAGMENT + encodeURIComponent(challengeText(d));
}

/** Accept the fragment alone; never navigate to or fetch an imported URL. */
export function parseChallengeFragment(fragment: unknown): ChallengeDescriptor {
  if (typeof fragment !== 'string' || fragment.length > MAX_FRAGMENT || !fragment.startsWith(FRAGMENT)) throw unavailable();
  try {
    return parseChallengeText(decodeURIComponent(fragment.slice(FRAGMENT.length)));
  } catch {
    throw unavailable();
  }
}
