// Source-bound DOM fixtures for editor regression tests, without games or the app shell.
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createServer as createPortServer } from 'node:net';
import { resolve, join } from 'node:path';
import { createServer, type InlineConfig } from 'vite';
import { chromium } from 'playwright-core';

async function reservePort() {
  // Vite treats port 0 as its default, so ask the OS for a port before starting Vite.
  const reservation = createPortServer();
  await new Promise<void>((resolve, reject) => {
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', resolve);
  });
  const reserved = reservation.address();
  if (!reserved || typeof reserved === 'string') throw new Error('Fixture port unavailable');
  await new Promise<void>((resolve, reject) => reservation.close((error) => (error ? reject(error) : resolve())));
  return reserved.port;
}

async function listenOnAvailablePort(config: InlineConfig) {
  for (let attempt = 1; ; attempt++) {
    const port = await reservePort();
    const server = await createServer({ ...config, server: { ...config.server, port } });
    try {
      await server.listen();
      return server;
    } catch (error) {
      await server.close();
      if (attempt >= 3 || !(error instanceof Error) || error.message !== `Port ${port} is already in use`) throw error;
    }
  }
}

export async function editorBrowser() {
  const root = resolve(import.meta.dirname, '..');
  const cacheDir = mkdtempSync(join(tmpdir(), 'editor-fixture-'));
  const alias = ['engine', 'tools', 'archives'].flatMap((name) => {
    const dir = resolve(root, 'packages', name);
    const pkg = JSON.parse(readFileSync(resolve(dir, 'package.json'), 'utf8')) as {
      name: string;
      exports: Record<string, { 'gamemaker-source'?: string }>;
    };
    return Object.entries(pkg.exports).flatMap(([key, entry]) =>
      entry['gamemaker-source']
        ? [
            {
              find: new RegExp('^' + (key === '.' ? pkg.name : pkg.name + key.slice(1)) + '$'),
              replacement: resolve(dir, entry['gamemaker-source']),
            },
          ]
        : [],
    );
  });
  let server: Awaited<ReturnType<typeof createServer>> | undefined;
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    server = await listenOnAvailablePort({
      configFile: false,
      root,
      cacheDir,
      resolve: { alias },
      optimizeDeps: { noDiscovery: true, entries: [] },
      server: { host: '127.0.0.1', strictPort: true },
    });
    const address = server.httpServer!.address();
    if (!address || typeof address === 'string') throw new Error('Fixture port unavailable');
    const url = `http://127.0.0.1:${address.port}`;
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.route(url + '/', (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><main id="host"></main>' }));
    await page.goto(url);
    return {
      page,
      close: async () => {
        await browser!.close();
        await server?.close();
        rmSync(cacheDir, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await browser?.close();
    await server?.close();
    rmSync(cacheDir, { recursive: true, force: true });
    throw error;
  }
}
