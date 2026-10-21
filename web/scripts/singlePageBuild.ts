// Builds standalone.html: the template for "Export as one web page". It is the game player
// (src/export/standalonePlayer.ts) compiled into a single classic <script>, with its styles
// in a <style> and the OPL music AudioWorklet bundled into a data: URL,
// so the page needs no other file and runs from file://. The exporter fills in the title, the
// game, and its description tags and text (see src/export/singlePage.ts).
//
// The production build emits it as dist/standalone.html; the dev server builds it on demand
// at /standalone.html (and rebuilds after a source change).
import { build, type Plugin, type Rollup } from 'vite';
import { resolve } from 'node:path';
import { ABOUT_MARK, GAME_MARK, HEAD_MARK, TEMPLATE_ONLY, TITLE_MARK } from '../src/export/singlePage';

const root = resolve(__dirname, '..');
const ENTRY = resolve(root, 'src/export/standalonePlayer.ts');
const WORKER_URL = /\?worker&url$/;
const VIRTUAL = '\0gm-inline-worker:';

async function bundle(input: string, format: 'es' | 'iife', plugins: Plugin[] = []): Promise<Rollup.OutputBundle> {
  const result = await build({
    configFile: false,
    root,
    publicDir: false,
    logLevel: 'warn',
    mode: 'production',
    plugins,
    build: {
      write: false,
      target: 'es2022',
      modulePreload: false,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      cssCodeSplit: false,
      rollupOptions: { input, output: { format, inlineDynamicImports: true, entryFileNames: 'entry.js' } },
    },
  });
  const out = (Array.isArray(result) ? result[0] : result) as Rollup.RollupOutput;
  return Object.fromEntries(out.output.map((o) => [o.fileName, o]));
}

/** `import url from './x.ts?worker&url'` becomes a data: URL of x.ts bundled into one module. */
function inlineWorkers(): Plugin {
  return {
    name: 'gamemaker-inline-workers',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (!WORKER_URL.test(source)) return null;
      const file = await this.resolve(source.replace(WORKER_URL, ''), importer, { skipSelf: true });
      return file ? VIRTUAL + file.id : null;
    },
    async load(id) {
      if (!id.startsWith(VIRTUAL)) return null;
      const out = await bundle(id.slice(VIRTUAL.length), 'es');
      const code = (out['entry.js'] as Rollup.OutputChunk).code;
      // A data: URL, not a Blob URL: a page opened from file:// has an opaque origin, and
      // Chrome refuses blob:null worklet modules as cross-origin, but data: always loads.
      return `export default ${JSON.stringify('data:text/javascript;charset=utf-8,' + encodeURIComponent(code))};`;
    },
  };
}

/** Text that may not appear raw inside <script>/<style> elements. */
const safeScript = (js: string) => js.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
const safeStyle = (css: string) => css.replace(/<\/(style)/gi, '<\\/$1');

export async function buildSinglePageTemplate(): Promise<string> {
  const out = await bundle(ENTRY, 'iife', [inlineWorkers()]);
  const js = (out['entry.js'] as Rollup.OutputChunk).code;
  const css = Object.values(out)
    .filter((o): o is Rollup.OutputAsset => o.type === 'asset' && o.fileName.endsWith('.css'))
    .map((o) => String(o.source))
    .join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#000000" />
${TEMPLATE_ONLY}
<title>${TITLE_MARK}</title>
${HEAD_MARK}
<style>${safeStyle(css)}</style>
</head>
<body class="player-page">
<div id="player">${ABOUT_MARK}</div>
${GAME_MARK}
<script>${safeScript(js)}</script>
</body>
</html>
`;
}

export function singlePagePlayer(): Plugin {
  let cached: Promise<string> | undefined;
  let command: 'build' | 'serve' = 'serve';
  return {
    name: 'gamemaker-single-page',
    configResolved(config) {
      command = config.command;
    },
    // Build: emitted next to the app, where the exporter fetches it (and sw.js precaches it).
    async generateBundle() {
      if (command !== 'build') return;
      this.emitFile({ type: 'asset', fileName: 'standalone.html', source: await buildSinglePageTemplate() });
    },
    // Dev: built on first request, rebuilt after any source change.
    configureServer(server) {
      server.watcher.on('all', (_event, file) => {
        if (file.startsWith(resolve(root, 'src'))) cached = undefined;
      });
      server.middlewares.use('/standalone.html', (_req, res) => {
        cached ??= buildSinglePageTemplate();
        cached.then(
          (html) => {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            res.end(html);
          },
          (e: Error) => {
            cached = undefined;
            res.statusCode = 500;
            res.end(`Could not build the one-page player: ${e.message}`);
          },
        );
      });
    },
  };
}
