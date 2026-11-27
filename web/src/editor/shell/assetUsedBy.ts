// Scene usage shared by all category cards in one Overview render.
import { normalize } from '../../project/files';
import type { Project } from '../core/project';

export function scenesUsing(files: readonly string[], usesOf: (file: string) => readonly { scene: number }[]): number {
  const scenes = new Set<number>();
  for (const f of files) for (const u of usesOf(f)) scenes.add(u.scene);
  return scenes.size;
}

export function categorySceneCounter(games: readonly Project[]): (files: readonly string[]) => number {
  const byFile = new Map<string, Set<number>>();
  // Assign each scene a distinct index across all GAMs.
  let index = 0;
  for (const project of games) {
    for (const scene of project.game().scenes) {
      for (const file of scene.files) {
        if (!file) continue;
        const name = normalize(file);
        let scenes = byFile.get(name);
        if (!scenes) byFile.set(name, (scenes = new Set()));
        scenes.add(index);
      }
      index++;
    }
  }
  return (files) => {
    const scenes = new Set<number>();
    for (const file of files) for (const scene of byFile.get(normalize(file)) ?? []) scenes.add(scene);
    return scenes.size;
  };
}

/** The card's line ("used by 3 scenes"), or '' when no scene uses the category (it says nothing rather than guess). */
export function usedByText(count: number): string {
  return count ? `used by ${count.toLocaleString()} ${count === 1 ? 'scene' : 'scenes'}` : '';
}

/** The same, short enough for a phone's narrow card ("3 scenes"). */
export function usedByShort(count: number): string {
  return count ? `${count.toLocaleString()} ${count === 1 ? 'scene' : 'scenes'}` : '';
}
