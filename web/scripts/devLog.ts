// Dev server only: takes the opt-in interaction log the page sends (src/devLog/interactionLog.ts)
// and appends it, one JSON object a line, to the maintainer's git-ignored
// .for-lewis/debug/interaction-log/<local date>.jsonl. Only requests from this machine are taken,
// a batch is at most 256 KB, and a production build never includes it (apply: 'serve').
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

const ROUTE = '/__gm-devlog';
const MAX = 256 * 1024;

export function devLog(folder: string): Plugin {
  return {
    name: 'gamemaker-dev-log',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(ROUTE, (req, res) => {
        const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '');
        if (req.method !== 'POST' || !local) {
          res.statusCode = local ? 405 : 403;
          return res.end();
        }
        let size = 0;
        const parts: Buffer[] = [];
        req.on('data', (c: Buffer) => {
          size += c.length;
          if (size <= MAX) parts.push(c);
        });
        req.on('end', () => {
          try {
            if (size > MAX) throw new Error('too big');
            const batch = JSON.parse(Buffer.concat(parts).toString('utf8')) as unknown;
            if (!Array.isArray(batch)) throw new Error('not a list');
            const d = new Date();
            const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            mkdirSync(folder, { recursive: true });
            appendFileSync(join(folder, `${day}.jsonl`), batch.map((e) => JSON.stringify(e)).join('\n') + (batch.length ? '\n' : ''));
            res.statusCode = 204;
          } catch {
            res.statusCode = 400;
          }
          res.end();
        });
      });
    },
  };
}
