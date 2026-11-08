// `npm run wayback:check -- <urls.json> <out.json> [--gap 1100]`: asks the Wayback availability API whether each
// URL ({ url } items, as wayback:inventory writes) has a snapshot. Read-only; one request per gap (ms).
import { readFileSync, writeFileSync } from 'node:fs';
import { lookup } from './waybackLib';

const args = process.argv.slice(2);
const at = args.indexOf('--gap');
const gap = at >= 0 ? Number(args.splice(at, 2)[1]) : 1100;
const [inFile, outFile] = args;
if (!inFile || !outFile) {
  console.error('usage: wayback:check <urls.json> <out.json> [--gap ms]');
  process.exit(2);
}
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const items = JSON.parse(readFileSync(inFile, 'utf8')) as { url: string }[];
const results: unknown[] = [];
for (const [i, item] of items.entries()) {
  const t = Date.now();
  results.push({ ...item, ...(await lookup(item.url, fetch, sleep)) });
  if (i % 25 === 0) console.log(i, '/', items.length);
  await sleep(Math.max(0, gap - (Date.now() - t)));
}
writeFileSync(outFile, JSON.stringify(results, null, 1));
console.log('done', results.length);
