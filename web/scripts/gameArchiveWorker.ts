// Child process of the dev server (run by vite-node): builds catalog game archives off its event loop.
// Messages in: { id, key } with key = games/<kind>/<game>/<pack>.zip. Out: { id, bytes } or { id, error }.
import { cdCatalog, cdFiles, cdSecretCatalog } from './cdGames';
import { gameArchive } from './gameArchive';

const cdRoot = process.argv[2];
const files = cdFiles(cdRoot);
const entries = [...cdCatalog(cdRoot), ...cdSecretCatalog(cdRoot)];

process.on('message', async (msg: { id: number; key: string }) => {
  try {
    const entry = entries.find((e) => `${e.path}${e.pack}` === msg.key);
    if (!entry) throw new Error(`Unknown archive: ${msg.key}`);
    process.send!({ id: msg.id, bytes: await gameArchive(entry, files) });
  } catch (e) {
    process.send!({ id: msg.id, error: String(e) });
  }
});
process.send!({ ready: true });
