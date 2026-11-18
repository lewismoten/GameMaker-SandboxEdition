// Shared types for cast groups and their game appearances.
import type { CAST_GAMES } from './castGames';

export type Family = 'sandbox' | 'bizarre' | 'starter';

export type CastGame = keyof typeof CAST_GAMES;

export interface Appearance {
  game: CastGame;
  /** What they do there, a few words. */
  as: string;
}

export interface CastMember {
  id: string;
  name: string;
  /** One line under the name: what they are. */
  role: string;
  /** What they say when they walk on stage (castStage.ts). */
  hi: string;
  /** public/cast/<id>.png, drawn from this game's files (scripts/castArt.ts). */
  art: { game: CastGame; width: number; height: number; alt: string; /** The picture's name when it isn't the id (the chicken in her tiara). */ file?: string };
  bio: string;
  appears: Appearance[];
}
