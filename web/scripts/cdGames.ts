// Serves Sample CD games in development and connects their production build output.
import type { Plugin } from 'vite';
import { createReadStream } from 'node:fs';
import { setImmediate as yieldToServer } from 'node:timers/promises';
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
      let generation = 0;
      let preparationError: Error | undefined;
      let warmTimer: ReturnType<typeof setTimeout>;
      let preparing: Promise<void> | undefined;
      const prepare = async (version: number) => {
        await yieldToServer();
        if (version !== generation) return;
        const { catalog, secret, files } = get();
        const shots = new Map<string, Uint8Array>();
        const listedGames: CdCatalogEntry[] = [];
        const hiddenGames: CdCatalogEntry[] = [];
        for (const [entries, result] of [
          [catalog, listedGames],
          [secret, hiddenGames],
        ] as const) {
          for (const e of entries) {
            await yieldToServer();
            if (version !== generation) return;
            const disk = entryFiles(e, files);
            const box = boxGameOf(e, files);
            const known = { ...e, fileFacts: libraryFacts(disk), health: quickHealth(e, files), ...(box ? { boxGame: box } : {}) };
            if (entries === catalog) {
              const pictures = gameShots(e.id, e.gam, disk, e.original?.box?.shots, heroOf(e.original));
              for (const [name, data] of pictures) shots.set(name, data);
              if (pictures.size) known.shots = true;
              if (pictures.has(builtHeroPath(e.id))) known.heroShot = true;
            }
            result.push(known);
          }
        }
        preview = { catalog: listedGames, secret: hiddenGames, shots };
        if (server.httpServer?.listening) archives.enqueue(listed());
      };
      const warm = () => {
        const version = generation;
        return (preparing ??= prepare(version).finally(() => {
          if (version === generation) preparing = undefined;
        }));
      };
      const served = async () => {
        while (!preview) await warm();
        return preview;
      };
      const startWarm = () => {
        const version = generation;
        void warm().catch((error: Error) => {
          if (version === generation) {
            preparationError = error;
            server.config.logger.error(error.message);
          }
        });
      };
      const scheduleWarm = () => {
        clearTimeout(warmTimer);
        warmTimer = setTimeout(() => {
          if (!preview && !preparing) startWarm();
        }, 100);
      };
      server.httpServer?.once('listening', scheduleWarm);
      server.httpServer?.once('close', () => {
        clearTimeout(warmTimer);
        archives.clear();
        worker.restart();
        generation++;
      });
      const forget = (f: string) => {
        if (!f.startsWith(cdRoot) && !f.startsWith(gamesRoot)) return;
        generation++;
        preparing = undefined;
        preparationError = undefined;
        cache = undefined;
        preview = undefined;
        archives.clear();
        worker.restart();
        // vite-node (checks and game builds) has a watcher but its HTTP server never listens: nothing asks for ZIPs, and a worker started there idled for hours
        if (server.httpServer?.listening) scheduleWarm();
      };
      server.watcher.on('change', forget);
      server.watcher.on('add', forget);
      server.watcher.on('unlink', forget);
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url ?? '').split('?')[0]).replace(/^\/+/, '');
        const extra = /^games\/extra-(\d)\.json$/.exec(url);
        if (url === 'games/index.json' && !preview) {
          if (preparationError) {
            const error = preparationError;
            preparationError = undefined;
            return next(error);
          }
          if (!preparing) startWarm();
          res.writeHead(202, { 'Retry-After': '2', 'Cache-Control': 'no-store' });
          res.end();
          return;
        }
        if (url === 'gm/index.json') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(get().gm));
          return;
        }
        if (url === 'games/catalog-files.json') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(pageFiles(get().catalog)));
          return;
        }
        if (url === 'games/index.json' || url === 'games/catalog.json' || (extra && GATES.includes(Number(extra[1])))) {
          void served()
            .then(({ catalog, secret }) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify(
                  url.endsWith('catalog.json')
                    ? pageCatalog(catalog)
                    : extra
                      ? secret.filter((e) => (get().gates.get(e.id) ?? 1) === Number(extra[1]))
                      : indexCatalog(catalog),
                ),
              );
            })
            .catch(next);
          return;
        }
        const details = /^games\/details\/([a-z0-9_-]+)\.json$/.exec(url);
        const detailed = details && get().catalog.find((e) => e.id === details[1]);
        if (detailed && catalogDetails(detailed)) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(catalogDetails(detailed)));
          return;
        }
        if (url.startsWith('games/shots/')) {
          void served()
            .then(({ shots }) => {
              const picture = shots.get(url);
              if (!picture) return next();
              res.setHeader('Content-Type', 'image/png');
              res.end(picture);
            })
            .catch(next);
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
        if (!/^(gm|dos|games)\//i.test(url)) return next();
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
