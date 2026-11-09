// `npm run agent:usage -- <log-dir> [--since YYYY-MM-DD] [--out file.csv]`: one CSV row per sub-agent from
// session logs laid out as <log-dir>/<session>/subagents/agent-<id>.jsonl, with an optional agent-<id>.meta.json
// ({ agentType, description, finished }). Columns: started, ended, session, agent, title, model, type, task, state, then
// input, cache_write, cache_read, output and total tokens. Cache reads cost a fraction of input, so total overstates cost.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readUsage, usageCsv, usageRow } from './agentUsageLib';

const args = process.argv.slice(2);
const opt = (k: string) => {
  const at = args.indexOf(k);
  return at >= 0 ? args.splice(at, 2)[1] : undefined;
};
const since = opt('--since');
const out = opt('--out');
const root = args[0];
if (!root || !existsSync(root)) {
  console.error('usage: agent:usage <log-dir> [--since YYYY-MM-DD] [--out file.csv]');
  process.exit(2);
}
const rows: (string | number)[][] = [];
for (const session of readdirSync(root)) {
  const dir = join(root, session, 'subagents');
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.jsonl'))) {
    const metaFile = join(dir, f.replace('.jsonl', '.meta.json'));
    const meta = existsSync(metaFile) ? (JSON.parse(readFileSync(metaFile, 'utf8')) as Record<string, string | boolean>) : {};
    const u = readUsage(readFileSync(join(dir, f), 'utf8'));
    if (!u.first || (since && u.first < since)) continue;
    rows.push(usageRow(session, f, meta, u));
  }
}
rows.sort((a, b) => (a[0] < b[0] ? -1 : 1));
const csv = usageCsv(rows);
if (out) writeFileSync(out, csv);
else process.stdout.write(csv);
console.error(`${rows.length} agents`);
