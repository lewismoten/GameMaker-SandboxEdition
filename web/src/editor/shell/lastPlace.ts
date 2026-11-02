// Where the editor was last open (game, file and that editor's address settings such as its
// tab), so coming back to the editor from the Games page picks up there. The same game opens the
// same file as it was; another game opens its file of the same name if it has one, else the
// Overview's Files on that kind of file. Kept in this browser only (never backed up).
import { currentRoute, formatHash } from '../../urlState';
import { kindOf, type Project } from '../core/project';

const KEY = 'gm-last-place';

interface Place {
  id: string;
  /** Empty: the Overview. */
  file: string;
  /** The address settings after the ?, without a play test's. */
  params: Record<string, string>;
}

let watching = false;

/** Notes where the editor is now: a file, or the Overview (path without a file). */
export function noteLastPlace(): void {
  const at = currentRoute();
  if (at.path[0] !== 'p' || !at.path[1]) return;
  const params = { ...at.params };
  delete params.play;
  try {
    localStorage.setItem(KEY, JSON.stringify({ id: at.path[1], file: at.path[2] ?? '', params } satisfies Place));
  } catch {
    // storage off: nothing remembered
  }
}

/**
 * Notes every address that names a file (once per page). The Overview is noted by the
 * workspace when it shows it: an address without a file is also how the Games page opens a
 * game, before the workspace decides where to go.
 */
export function watchLastPlace(): void {
  if (watching) return;
  watching = true;
  const note = () => {
    if (currentRoute().path[2]) noteLastPlace();
  };
  note();
  addEventListener('hashchange', note);
  addEventListener('popstate', note);
}

function stored(): Place | undefined {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Place | null;
    return p && typeof p.id === 'string' && typeof p.file === 'string' ? p : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Opened with no file and no settings in the address: where to go instead. Puts that file and
 * its settings in the address (or the Overview's kind) and returns the file to open, if any.
 */
export function resumeLastPlace(project: Project): string | undefined {
  const at = currentRoute();
  if (at.path[0] !== 'p' || at.path[1] !== project.id || at.path[2] || Object.keys(at.params).length) return undefined;
  const last = stored();
  if (!last) return undefined;
  // the Overview was the last place: stay on it, on the same tab when it is the same game
  if (!last.file) {
    if (last.id === project.id && Object.keys(last.params).length)
      history.replaceState(null, '', `${location.pathname}${location.search}${formatHash(['p', project.id], last.params)}`);
    return undefined;
  }
  const has = project.files.has(last.file);
  const params = has ? last.params : { assets: kindOf(last.file) };
  history.replaceState(null, '', `${location.pathname}${location.search}${formatHash(has ? ['p', project.id, last.file] : ['p', project.id], params)}`);
  return has ? last.file : undefined;
}
