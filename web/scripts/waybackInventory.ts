// `npm run wayback:inventory -- <out.json> <file-or-folder>... [--skip-hosts regex]`: lists the outside URLs
// cited by text files, with up to three file:line places each. Writes JSON; reads no network.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractUrls } from './waybackLib';

const TEXT = /\.(ts|tsx|js|mjs|json|md|txt|html|css)$/;
const SKIP_DIR = new Set(['node_modules', 'dist', '.git', 'disk']);

function* files(p: string): Generator<string> {
  if (statSync(p).isFile()) {
    yield p;
    return;
  }
  for (const e of readdirSync(p, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIR.has(e.name)) yield* files(join(p, e.name));
    } else if (TEXT.test(e.name)) yield join(p, e.name);
  }
}

const args = process.argv.slice(2);
const at = args.indexOf('--skip-hosts');
const skip = at >= 0 ? new RegExp(args.splice(at, 2)[1], 'i') : undefined;
const [out, ...inputs] = args;
if (!out || !inputs.length) {
  console.error('usage: wayback:inventory <out.json> <file-or-folder>... [--skip-hosts regex]');
  process.exit(2);
}
const found = new Map<string, string[]>();
for (const input of inputs)
  for (const f of files(input)) {
    const text = readFileSync(f, 'utf8');
    for (const u of extractUrls(text, skip)) {
      const line = text.slice(0, text.indexOf(u)).split('\n').length;
      const cites = found.get(u) ?? [];
      if (cites.length < 3) cites.push(`${f}:${line}`);
      found.set(u, cites);
    }
  }
writeFileSync(
  out,
  JSON.stringify(
    [...found].map(([url, cites]) => ({ url, cites })),
    null,
    1,
  ),
);
console.log(found.size, 'urls');
