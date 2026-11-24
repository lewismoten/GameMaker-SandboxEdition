// How many scenes use the files of one Overview category, from the same references as a file's
// "Used by" chips (project.usesOf), counted once per scene however many of its slots point there.
import type { Project } from '../core/project';

export function scenesUsing(files: readonly string[], usesOf: (file: string) => readonly { scene: number }[]): number {
  const scenes = new Set<number>();
  for (const f of files) for (const u of usesOf(f)) scenes.add(u.scene);
  return scenes.size;
}

/** Scene numbers are local to a GAM, so deduplicate within each game before adding its count. */
export function categoryScenesUsing(files: readonly string[], games: readonly Project[]): number {
  return games.reduce((count, game) => count + scenesUsing(files, (file) => game.usesOf(file)), 0);
}

/** The card's line ("used by 3 scenes"), or '' when no scene uses the category (it says nothing rather than guess). */
export function usedByText(count: number): string {
  return count ? `used by ${count.toLocaleString()} ${count === 1 ? 'scene' : 'scenes'}` : '';
}

/** The same, short enough for a phone's narrow card ("3 scenes"). */
export function usedByShort(count: number): string {
  return count ? `${count.toLocaleString()} ${count === 1 ? 'scene' : 'scenes'}` : '';
}
