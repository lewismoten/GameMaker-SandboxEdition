// Serves Sample CD games in development and connects their production build output.
import type { Plugin } from 'vite';
import { createReadStream } from 'node:fs';
import { join } from 'node:path';
import { legacyAlias } from './gameArchive';
import { createArchiveQueue } from './archiveQueue';
import { archiveWorker } from './archiveWorker';
import { libraryFacts } from './libraryFacts';
import { gameShots } from './gameShots';
import { builtHeroPath, heroOf } from '../src/gfx/levelPicture';
import type { CdCatalogEntry } from './cdGamesModel';
import { scan, boxGameOf, entryFiles, quickHealth, type Scan } from './cdGamesScan';
import { catalogDetails, indexCatalog, pageCatalog, pageFiles } from './cdGamesCatalog';
import { emitCdGames } from './cdGamesOutput';

export type { CdCatalogEntry, OriginalExtras, GmInstallEntry } from './cdGamesModel';
export { slimCatalog, pageCatalog, pageFiles, indexCatalog, type LeanEntry } from './cdGamesCatalog';

/** The gates whose files the build writes: every felt egg, every tin heart. */
const GATES = [1, 2];

/** Every playable game on the CD and in ../games but the secret ones (what games/index.json lists, and every page, sitemap and picture the build makes). */
export function cdCatalog(cdRoot: string): CdCatalogEntry[] {
  return scan(cdRoot).catalog;
}

/** The secret games (games/extra-<gate>.json): listed only once what reveals each is found. */
export function cdSecretCatalog(cdRoot: string): CdCatalogEntry[] {
  return scan(cdRoot).secret;
}

/** Sources behind catalog game archives and shared DOS resources, not loose game HTTP endpoints. */
export function cdFiles(cdRoot: string): ReadonlyMap<string, string> {
  return scan(cdRoot).files;
}

export function cdGames(cdRoot: string): Plugin {
  let cache: Scan | undefined;
  const get = () => (cache ??= scan(cdRoot));
  return {
    name: 'gamemaker-cd-games',
    configureServer(server) {
      const gamesRoot = join(cdRoot, '../games');
      server.watcher.add([cdRoot, gamesRoot]);
      let preview: { catalog: CdCatalogEntry[]; secret: CdCatalogEntry[]; shots: Map<string, Uint8Array> } | undefined;
      const worker = archiveWorker(cdRoot);
      // the worker deflates on libuv's threads, so four at once is faster with the same bytes
      const archives = createArchiveQueue(worker, 4);
      const listed = () => [...get().catalog, ...get().secret].map((e) => `${e.path}${e.pack}`);
      // build every archive in the background so most are ready before they are asked for
      server.httpServer?.once('listening', () => setTimeout(() => archives.enqueue(listed()), 500));
      const served = () => {
        if (preview) return preview;
        const { catalog, secret, files } = get();
        const shots = new Map<string, Uint8Array>();
        const known = (e: CdCatalogEntry): CdCatalogEntry => {
          const box = boxGameOf(e, files);
          return { ...e, fileFacts: libraryFacts(entryFiles(e, files)), health: quickHealth(e, files), ...(box ? { boxGame: box } : {}) };
        };
        preview = {
          catalog: catalog.map((e) => {
            const disk = entryFiles(e, files);
            const pictures = gameShots(e.id, e.gam, disk, e.original?.box?.shots, heroOf(e.original));
            for (const [name, data] of pictures) shots.set(name, data);
            return { ...known(e), ...(pictures.size ? { shots: true } : {}), ...(pictures.has(builtHeroPath(e.id)) ? { heroShot: true } : {}) };
          }),
          secret: secret.map(known),
          shots,
        };
        return preview;
      };
      const forget = (f: string) => {
        if (!f.startsWith(cdRoot) && !f.startsWith(gamesRoot)) return;
        cache = undefined;
        preview = undefined;
        archives.clear();
        worker.restart();
        // vite-node (checks and game builds) has a watcher but its HTTP server never listens: nothing asks for ZIPs, and a worker started there idled for hours
        if (server.httpServer?.listening) setTimeout(() => archives.enqueue(listed()), 500);
      };
      server.watcher.on('change', forget);
      server.watcher.on('add', forget);
      server.watcher.on('unlink', forget);
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url ?? '').split('?')[0]).replace(/^\/+/, '');
        const extra = /^games\/extra-(\d)\.json$/.exec(url);
        if (url === 'gm/index.json') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(get().gm));
          return;
        }
        if (url === 'games/catalog-files.json') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(pageFiles(served().catalog)));
          return;
        }
        if (url === 'games/index.json' || url === 'games/catalog.json' || (extra && GATES.includes(Number(extra[1])))) {
          res.setHeader('Content-Type', 'application/json');
          const { catalog, secret } = served();
          res.end(
            JSON.stringify(
              url.endsWith('catalog.json')
                ? pageCatalog(catalog)
                : extra
                  ? secret.filter((e) => (get().gates.get(e.id) ?? 1) === Number(extra[1]))
                  : indexCatalog(catalog),
            ),
          );
          return;
        }
        const details = /^games\/details\/([a-z0-9_-]+)\.json$/.exec(url);
        const detailed = details && get().catalog.find((e) => e.id === details[1]);
        if (detailed && catalogDetails(detailed)) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(catalogDetails(detailed)));
          return;
        }
        const picture = url.startsWith('games/shots/') && served().shots.get(url);
        if (picture) {
          res.setHeader('Content-Type', 'image/png');
          res.end(picture);
          return;
        }
        const packed = /^(games\/[a-z]+\/[a-z0-9_-]+\/)([^/]+\.zip)$/.exec(url);
        const owner = packed && [...get().catalog, ...get().secret].find((e) => e.path === packed[1] && (e.pack === packed[2] || legacyAlias(e) === packed[2]));
        if (owner) {
          // built in a worker process: until it is ready, 202 and ask again (the client retries, client/archiveWait.ts)
          const bytes = archives.request(`${owner.path}${owner.pack}`);
          res.setHeader('Cache-Control', 'no-store');
          if (!bytes) {
            res.statusCode = 202;
            res.setHeader('Retry-After', '2');
            res.setHeader('Content-Type', 'text/plain');
            res.end(req.method === 'HEAD' ? undefined : 'This game archive is being prepared.');
            return;
          }
          res.setHeader('Content-Type', 'application/zip');
          res.setHeader('Content-Length', bytes.length);
          res.end(req.method === 'HEAD' ? undefined : bytes);
          return;
        }
        if (/^games\/(gameware|shareware|originals)\//.test(url) && !url.endsWith('/walkthrough.json')) {
          res.statusCode = 404;
          res.end('Game data is available in its distribution ZIP.');
          return;
        }
        const file = get().files.get(url.toLowerCase());
        if (!file) return next();
        res.setHeader('Content-Type', 'application/octet-stream');
        createReadStream(file).pipe(res);
      });
    },
    async generateBundle() {
      await emitCdGames.call(this, get);
    },
  };
}
