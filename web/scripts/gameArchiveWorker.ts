// Child process of the dev server (run by vite-node): builds catalog game archives off its event loop.
// Messages in: { id, key } with key = games/<kind>/<game>/<pack>.zip. Out: { id, bytes } or { id, error }.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { archiveCache, codeStamp } from './archiveCache';
import { cdCatalog, cdFiles, cdSecretCatalog } from './cdGames';
import { gameArchive } from './gameArchive';

const cdRoot = process.argv[2];
const files = cdFiles(cdRoot);
const entries = [...cdCatalog(cdRoot), ...cdSecretCatalog(cdRoot)];
// Finished ZIPs are kept by content hash (archiveCache.ts); GAME_ZIP_CACHE=off builds every one afresh.
const web = join(dirname(fileURLToPath(import.meta.url)), '..');
const cache =
  process.env.GAME_ZIP_CACHE === 'off'
    ? undefined
    : codeStamp('scripts/gameArchive.ts', web).then((stamp) =>
        archiveCache(join(cdRoot, '../node_modules/.cache/game-zips'), stamp, ['dos/xferplay.exe', 'dos/sndblast.drv', 'dos/config.hlp']),
      );

process.on('message', async (msg: { id: number; key: string }) => {
  try {
    const entry = entries.find((e) => `${e.path}${e.pack}` === msg.key);
    if (!entry) throw new Error(`Unknown archive: ${msg.key}`);
    const make = () => gameArchive(entry, files);
    const store = await cache;
    process.send!({ id: msg.id, bytes: store ? await store.get(entry, files, make) : await make() });
  } catch (e) {
    process.send!({ id: msg.id, error: String(e) });
  }
});
// Leave with the parent: a killed or crashed dev server or test runner closes the IPC channel, and without
// this the worker idled for hours at 0% CPU. The parent-pid check covers a channel that stays open.
const parent = process.ppid;
process.on('disconnect', () => process.exit(0));
setInterval(() => {
  try {
    process.kill(parent, 0);
  } catch {
    process.exit(0);
  }
}, 5000).unref();
process.send!({ ready: true });
