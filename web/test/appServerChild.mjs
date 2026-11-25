// Own the app server and its archive workers for one Vitest browser project.
import { resolve } from 'node:path';
import { createServer } from 'vite';

const creating = createServer({
  configFile: resolve(import.meta.dirname, '../vite.config.ts'),
  root: resolve(import.meta.dirname, '..'),
  optimizeDeps: { noDiscovery: true },
  server: { host: '127.0.0.1', port: 6183, strictPort: false, watch: null, hmr: false },
  logLevel: 'error',
});
process.once('disconnect', async () => {
  try {
    await (await creating).close();
  } finally {
    process.exit(0);
  }
});

const server = await creating;
await server.listen();
const address = server.httpServer.address();
if (!address || typeof address === 'string') throw new Error('The browser test server has no TCP port.');
const base = `http://127.0.0.1:${address.port}`;
// The first catalog request renders every preview synchronously on the server.
// Finish it before a browser has a navigation or keyboard action in flight.
const catalog = await fetch(`${base}/games/catalog.json`);
if (!catalog.ok || !Array.isArray(await catalog.json())) throw new Error(`Could not prepare the test catalog (HTTP ${catalog.status})`);
process.send(base);
