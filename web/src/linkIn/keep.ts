// Keeping a game sent by another site in this browser: always as a new project of its own,
// named for where it came from and listed under Imported, so no game already here is ever
// overwritten. Playing the very same game from the same site again reuses its copy rather
// than piling up duplicates (a copy changed since is left alone and a new one made).
import { loadProject, newId, saveProject } from '../project/storage';
import { setImported } from '../editor/shell/homeOrigin';
import { LinkError, keptName, type Mode } from './protocol';
import type { UnpackedGame } from './unpack';
import type { GameFiles } from '../project/files';

const KEY = 'gm-received';

interface Received {
  origin: string;
  mode: Mode;
  at: number;
}

function read(): Record<string, Received> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Received>;
  } catch {
    return {};
  }
}

function remember(id: string, r: Received): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...read(), [id]: r }));
  } catch {
    /* not remembered: the next play keeps another copy */
  }
}

/** The project's files are exactly these. */
function sameFiles(a: GameFiles, b: GameFiles): boolean {
  const an = a.names();
  const bn = b.names();
  if (an.length !== bn.length || an.some((n, i) => n !== bn[i])) return false;
  return an.every((n) => {
    const x = a.get(n)!;
    const y = b.get(n)!;
    return x.length === y.length && x.every((v, i) => v === y[i]);
  });
}

/** A copy of this game from this origin, kept for play earlier and unchanged since. */
async function earlierCopy(game: UnpackedGame, origin: string): Promise<string | undefined> {
  for (const [id, r] of Object.entries(read())) {
    if (r.origin !== origin || r.mode !== 'play') continue;
    const p = await loadProject(id).catch(() => undefined);
    if (p && p.record.gam === game.gam && sameFiles(p.files, game.files)) return id;
  }
  return undefined;
}

/** Keeps the game; returns its project id. */
export async function keepGame(game: UnpackedGame, origin: string, mode: Mode): Promise<string> {
  if (mode === 'play') {
    const again = await earlierCopy(game, origin);
    if (again) return again;
  }
  const id = newId();
  try {
    await saveProject(id, keptName(game.title, origin), game.gam, game.files, game.companion);
  } catch {
    throw new LinkError('This browser would not keep the game (its storage may be full or switched off, as in some private windows).', 'storage');
  }
  setImported(id, true);
  remember(id, { origin, mode, at: Date.now() });
  return id;
}
