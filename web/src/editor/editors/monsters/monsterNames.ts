// Monster names: what a designer calls each monster ("Scorpion"), kept in the project's
// companion file (editor-only) under the .mon as `names`, an array by monster number. DOS
// Game-Maker has no names, so they are never written into the game's files. The monster
// editor sets them; the Scene maker's Cast (animation/scene/sceneGenerate.ts) reads them.
import type { Project } from '../../core/project';

/** The companion section, under the .mon. */
export const MONSTER_NAMES = 'names';

/** What reads the extras: a project, or a Scene maker source. */
interface ExtrasSource {
  extras?<T>(file: string, section: string, fallback: T): T;
}

/** Monster `i`'s name in `mon`, trimmed; '' when it has none. */
export function monsterName(src: ExtrasSource, mon: string, i: number): string {
  const names = src.extras?.<unknown>(mon, MONSTER_NAMES, undefined);
  return Array.isArray(names) && typeof names[i] === 'string' ? names[i].trim() : '';
}

/** The names array with monster `i` named `name` ('' clears it), trailing blanks dropped; undefined when none is left. */
export function withName(names: unknown, i: number, name: string): string[] | undefined {
  const out = Array.isArray(names) ? names.map((n) => (typeof n === 'string' ? n : '')) : [];
  while (out.length <= i) out.push('');
  out[i] = name.trim();
  while (out.length && !out[out.length - 1]) out.pop();
  return out.length ? out : undefined;
}

export function setMonsterName(project: Project, mon: string, i: number, name: string): void {
  project.setExtras(mon, MONSTER_NAMES, withName(project.extras<unknown>(mon, MONSTER_NAMES, undefined), i, name));
}
