// The Color vision warnings a designer dismissed as meant to be ("They're meant to look
// alike"), kept in the project's companion file (editor-only) on the .pal. A pair or ramp of
// colors is the palette's own, so it is dismissed in every level drawn with it; a monster is
// one of a .mon file's, so its key names that file too ("mon:3@forest.mon").
import { normalize } from '../../../project/files';
import type { Project } from '../../core/project';
import type { Warning } from './visionWarnings';

const SECTION = 'visionDismissed';

/** The key a warning is dismissed by: its id, and for a monster the .mon file it is in. */
export const dismissKey = (w: Warning, monFile?: string): string => (w.kind === 'monster' && monFile ? `${w.id}@${normalize(monFile)}` : w.id);

export const dismissed = (project: Project, pal: string): string[] => project.extras<string[]>(pal, SECTION, []);

/** Dismisses (or, with `on` false, flags again) a warning by its key. */
export function setDismissed(project: Project, pal: string, key: string, on = true): void {
  const list = dismissed(project, pal).filter((k) => k !== key);
  if (on) list.push(key);
  project.setExtras(pal, SECTION, list.length ? list.sort() : undefined);
}

/** The warnings still flagged, and those dismissed. */
export function splitDismissed(list: Warning[], keys: Iterable<string>, monFile?: string): { open: Warning[]; dismissed: Warning[] } {
  const set = new Set(keys);
  const out = { open: [] as Warning[], dismissed: [] as Warning[] };
  for (const w of list) (set.has(dismissKey(w, monFile)) ? out.dismissed : out.open).push(w);
  return out;
}
