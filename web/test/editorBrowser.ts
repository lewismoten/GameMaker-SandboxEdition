// Source-bound DOM fixtures for editor regression tests, without games or the app shell.
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

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
  const server = await createServer({
    configFile: false,
    root,
    cacheDir,
    resolve: { alias },
    optimizeDeps: { noDiscovery: true, entries: [] },
    server: { host: '127.0.0.1', port: 0 },
  });
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    await server.listen();
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
        await server.close();
        rmSync(cacheDir, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await browser?.close();
    await server.close();
    rmSync(cacheDir, { recursive: true, force: true });
    throw error;
  }
}
