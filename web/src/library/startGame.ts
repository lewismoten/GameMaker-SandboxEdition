// The game the Library starts on (libraryPage.ts) when today's web was just showing one: a game's
// page on the Games list (#/game/cd:<id>), a game looked inside (#/p/look:<id>), or a game of your
// own copied from one (#/p/<project>, its origin in editor/shell/homeOrigin.ts). main.ts notes
// each such view; the Library uses the latest one once, and only if that game has paper on its
// shelves (the Sandbox and Bizarre games do). Otherwise it opens as it was left (prefs.ts).
// Kept in localStorage; with none (a private window), the Library just opens as before.
// No imports, so main.ts can note views without loading anything.

const KEY = 'gm-library-context';
const USED_KEY = 'gm-library-context-used';

interface Context {
  /** A catalog game's id, or a project's (whose origin says the game). */
  game?: string;
  project?: string;
  /** When it was seen (also its name, for "already used"). */
  at: number;
}

function read(key: string): string | undefined {
  try {
    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode: the Library opens as it was left */
  }
}

/** Today's web is showing #/<kind>/<id>: a game's page, a look inside one, or a project. */
export function noteLibraryContext(kind: string | undefined, id: string | undefined, now = Date.now()): void {
  if (!id) return;
  let ctx: Context | undefined;
  if (kind === 'game' && id.startsWith('cd:')) ctx = { game: id.slice(3), at: now };
  else if (kind === 'p' && id.startsWith('look:')) ctx = { game: id.slice(5), at: now };
  else if (kind === 'p') ctx = { project: id, at: now };
  if (ctx) write(KEY, JSON.stringify(ctx));
}

/**
 * The game the Library should start on, if a view since it last started on one names a game
 * with paper (`listed`); `origin` gives a project's original catalog game. Asking uses the view
 * up, so coming back later opens the Library as the visitor left it.
 */
export function libraryStartGame(listed: (game: string) => boolean, origin: (project: string) => string | undefined): string | undefined {
  let ctx: Context;
  try {
    ctx = JSON.parse(read(KEY) ?? 'null') as Context;
  } catch {
    return undefined;
  }
  if (!ctx || typeof ctx.at !== 'number' || read(USED_KEY) === String(ctx.at)) return undefined;
  write(USED_KEY, String(ctx.at));
  const game = ctx.game ?? (ctx.project ? origin(ctx.project) : undefined);
  return game && listed(game) ? game : undefined;
}
