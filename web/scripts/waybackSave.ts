// `npm run wayback:save -- <checklist.md> <log.tsv> [--gap 60] [--limit n]`: asks Save Page Now to archive each
// unticked `- [ ] <url>` item of a Markdown checklist, one per gap (seconds), and appends time, url, status and
// snapshot to a TSV log. Pages already logged as saved are skipped. A refusal waits 5 minutes and retries once;
// three refusals in a row stop the run.
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { savePage, uncheckedUrls } from './waybackLib';

const args = process.argv.slice(2);
const opt = (k: string, d: number) => {
  const at = args.indexOf(k);
  return at >= 0 ? Number(args.splice(at, 2)[1]) : d;
};
const gap = opt('--gap', 60) * 1000;
const limit = opt('--limit', Infinity);
const [list, log] = args;
if (!list || !log) {
  console.error('usage: wayback:save <checklist.md> <log.tsv> [--gap seconds] [--limit n]');
  process.exit(2);
}
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
if (!existsSync(log)) appendFileSync(log, 'time\turl\tstatus\tsnapshot\n');
const done = () =>
  new Set(
    readFileSync(log, 'utf8')
      .split('\n')
      .slice(1)
      .filter((l) => /\tsaved\t/.test(l))
      .map((l) => l.split('\t')[1]),
  );
const pending = () => uncheckedUrls(readFileSync(list, 'utf8')).filter((u) => !done().has(u));

let refusals = 0;
let count = 0;
for (;;) {
  const next = pending()[0];
  if (!next || count >= limit) break;
  let res = await savePage(next, fetch);
  if (res.status.startsWith('refused')) {
    console.log(`${next}: ${res.status}, waiting 5 minutes`);
    await sleep(300_000);
    res = await savePage(next, fetch);
  }
  refusals = res.status.startsWith('refused') ? refusals + 1 : 0;
  appendFileSync(log, `${new Date().toISOString()}\t${next}\t${res.status}\t${res.snapshot ?? ''}\n`);
  console.log(`${++count}. ${res.status} ${next}`);
  if (refusals >= 3) {
    console.log('Three refusals in a row: stopping. Run it again later.');
    break;
  }
  await sleep(gap);
}
console.log(`Done: ${count} tried; ${pending().length} still unsaved.`);
