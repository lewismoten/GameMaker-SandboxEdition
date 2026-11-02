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
