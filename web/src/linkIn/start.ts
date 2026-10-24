// Opening a game from another site, from start to finish (index.html, called by main.ts when
// the address asks for one, see protocol.ts): get the files (fetch the link, or wait for the
// opener's postMessage), check and unpack them, ask the visitor, keep the game in this browser
// and say where to open it. Shareware from the CD is recognized and played from the site's own
// copy, never kept or opened for editing.
import { loadCatalog, type CatalogEntry } from '../project/files';
import { crc32 } from '../project/zip';
import { askToOpen, showLinkError, waitingDialog } from './dialogs';
import { fetchGame, urlFileName } from './fetchGame';
import { keepGame } from './keep';
import { LinkError, cleanName, keptName, originLabel, type LinkRequest, type Mode, type Target } from './protocol';
import { receiveFiles, reply, replyError, type Sender } from './receive';
import { unpackGame, type UnpackedGame } from './unpack';

/** Where to go once the game is kept: a project of this browser's, or a catalog game. */
export interface Destination {
  target: Target;
  mode: Mode;
  project?: string;
  catalog?: string;
}

/** The address that opens a destination, for the DOS page and the play page (the desk and the editor are on this page). */
export function destinationUrl(d: Destination): string | undefined {
  const run = d.mode === 'edit' ? 'design' : 'play';
  const q = d.project ? `project=${encodeURIComponent(d.project)}` : `game=${encodeURIComponent(d.catalog!)}`;
  if (d.target === 'dos') return `./dos.html?${q}&run=${run}&linked=1`;
  if (d.target === 'web' && d.mode === 'play') return `./play.html?${q}`;
  return undefined;
}

/** The hash on this page for the desk or the editor. */
export function destinationHash(d: Destination): string {
  const disk = d.project ? `project:${d.project}` : `cd:${d.catalog}`;
  if (d.target === 'desk') return `#/desk?disk=${encodeURIComponent(disk)}&run=${d.mode === 'edit' ? 'design' : 'play'}`;
  return d.project ? `#/p/${encodeURIComponent(d.project)}` : `#/game/${encodeURIComponent(disk)}`;
}

async function sharewareOf(game: UnpackedGame): Promise<CatalogEntry | undefined> {
  const list = await loadCatalog().catch(() => [] as CatalogEntry[]);
  const crc = crc32(game.files.get(game.gam)!);
  return list.find((g) => g.kind === 'shareware' && !g.original && g.gamCrc === crc);
}

const bytesOf = (g: UnpackedGame) => g.files.entries().reduce((n, [, b]) => n + b.length, 0);

/**
 * Runs the request; resolves with where to open the game, or undefined when the visitor said
 * no or it failed (after saying why). `fallback` is the interface to open when none is named.
 */
export async function runLinkIn(req: LinkRequest, fallback: Target): Promise<Destination | undefined> {
  let sender: Sender | undefined;
  const abort = new AbortController();
  const wait = waitingDialog(req.kind === 'open' ? `Fetching ${urlFileName(req.url)}…` : 'Waiting for the game from the page that opened this one…', () =>
    abort.abort(),
  );
  try {
    let files: [string, Uint8Array][];
    let name: string | undefined;
    let gam: string | undefined;
    let origin: string;
    let target = req.in;
    let mode = req.mode;
    if (req.kind === 'open') {
      origin = new URL(req.url).origin;
      files = await Promise.race([
        fetchGame(req.url, (done, total) => wait.say(`Fetching the game’s files: ${done} of ${total}…`)),
        new Promise<never>((_, reject) => abort.signal.addEventListener('abort', () => reject(new LinkError('Cancelled.', 'declined')))),
      ]);
      name = cleanName(urlFileName(req.url).replace(/\.(zip|gmpak|html?|gam)$/i, ''));
    } else {
      const got = await receiveFiles({ from: req.from, signal: abort.signal });
      sender = got.sender;
      origin = got.sender.origin;
      ({ files, name, gam } = got.game);
      target = got.game.in ?? target;
      mode = got.game.mode ?? mode;
    }
    wait.say('Checking the game…');
    const game = await unpackGame(files, { name: req.kind === 'receive' ? name : undefined, gam });
    if (req.kind === 'open' && /^(game|index)$/i.test(game.title) && name) game.title = name;
    wait.close();
    const where = target ?? fallback;
    const shareware = await sharewareOf(game);
    const ok = await askToOpen({
      from: originLabel(origin),
      via: req.kind === 'open' ? 'link' : 'page',
      name: shareware?.title ?? game.title,
      files: game.files.size,
      bytes: bytesOf(game),
      mode: shareware ? 'play' : mode,
      target: where,
      keptAs: shareware ? undefined : keptName(game.title, origin),
    });
    if (!ok) {
      replyError(sender, new LinkError('The visitor chose not to open the game.', 'declined'));
      return undefined;
    }
    if (shareware) {
      // played as its author released it, from the site's own copy
      if (sender) reply(sender, { type: 'gm-received', name: shareware.title, files: game.files.size, shareware: true });
      return { target: where, mode: 'play', catalog: shareware.id };
    }
    const project = await keepGame(game, origin, mode);
    if (sender) reply(sender, { type: 'gm-received', name: game.title, files: game.files.size });
    return { target: where, mode, project };
  } catch (e) {
    wait.close();
    replyError(sender, e);
    const err = e instanceof LinkError ? e : new LinkError('Something went wrong opening the game.', 'invalid');
    if (err.reason !== 'declined') await showLinkError(err.message, { cors: err.reason === 'cors' });
    return undefined;
  }
}
