// The designer's "looks the same from every side" list: heroes and monsters the facing check
// (checks/facing.ts) leaves alone, such as a ball, a word bubble or a ship that always flies
// nose first. It is kept in the project's companion file (editor-only) on the .gam, as keys
// like "ship.chr" and "hive.mon#3"; a built game's about.json "sameEverySide" is the same list.
import type { Project } from '../core/project';
import type { Finding } from './findings';
import { sameKey } from './checks/facing';

const SECTION = 'sameEverySide';

export const sameEverySide = (project: Project): string[] => project.extras<string[]>(project.gam, SECTION, []);

/** The key a facing finding's hero or monster goes by, or undefined for another finding. */
export function sameKeyOf(f: Finding): string | undefined {
  if (f.check !== 'facing') return undefined;
  if (f.where.monster) return sameKey(f.where.monster.file, f.where.monster.n);
  return f.where.file ? sameKey(f.where.file) : undefined;
}

export function markSame(project: Project, key: string): void {
  const list = sameEverySide(project);
  if (!list.includes(key)) project.setExtras(project.gam, SECTION, [...list, key].sort());
}
