// "Already done?" before a brief: `npm run already -- <words...>` prints the best 10 matches, with dates, among
//   commits   subjects and bodies on origin/develop (git log -i --grep, one search per word)
//   code      tracked files (git grep -i -c), the most distinct words first
//   notes     .for-lewis/research/**/*.md, by path, title and headings (the folder is git-ignored, so it is
//             looked for here and in the main checkout)
// A hit that matches more of your words ranks higher; ties go to the newer one. No dependencies.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Search words: lowercased, 3+ characters, no repeats. */
export function searchWords(args) {
  return [...new Set(args.flatMap((a) => a.toLowerCase().split(/[^a-z0-9_.-]+/)).filter((w) => w.length >= 3))];
}

/** Commits hit by any word, best first: `hits` maps a word to [{ hash, date, subject }]. */
export function rankCommits(hits) {
  const by = new Map();
  for (const [word, list] of Object.entries(hits)) {
    for (const c of list) {
      const e = by.get(c.hash) ?? { ...c, words: [] };
      e.words.push(word);
      by.set(c.hash, e);
    }
  }
  return [...by.values()].sort((a, b) => b.words.length - a.words.length || (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** Files hit by any word, best first: `counts` maps a word to { file: lines }. */
export function rankFiles(counts) {
  const by = new Map();
  for (const [word, files] of Object.entries(counts)) {
    for (const [file, n] of Object.entries(files)) {
      const e = by.get(file) ?? { file, words: [], lines: 0 };
      e.words.push(word);
      e.lines += n;
      by.set(file, e);
    }
  }
  return [...by.values()].sort((a, b) => b.words.length - a.words.length || b.lines - a.lines || (a.file < b.file ? -1 : 1));
}

/** How well a note matches: a word in its path or title counts 3, in another heading 1, and each distinct word 10. */
export function scoreNote({ path, title, headings }, words) {
  let score = 0;
  let distinct = 0;
  for (const w of words) {
    const top = path.toLowerCase().includes(w) || title.toLowerCase().includes(w);
    const head = headings.some((h) => h.toLowerCase().includes(w));
    if (top || head) distinct++;
    score += (top ? 3 : 0) + (head ? 1 : 0);
  }
  return distinct ? distinct * 10 + score : 0;
}

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function commitHits(words, cwd) {
  const ref = 'origin/develop';
  const hits = {};
  for (const w of words) {
    const out = git(['log', ref, '-i', '-F', `--grep=${w}`, '-n', '300', '--date=short', '--format=%h\t%ad\t%s'], cwd);
    hits[w] = out
      .split('\n')
      .filter(Boolean)
      .map((l) => {
        const [hash, date, ...s] = l.split('\t');
        return { hash, date, subject: s.join('\t') };
      });
  }
  return hits;
}

function fileCounts(words, cwd) {
  const counts = {};
  for (const w of words) {
    counts[w] = {};
    let out = '';
    try {
      out = git(['grep', '-i', '-I', '-F', '-c', '-e', w, '--', '.', ':!package-lock.json', ':!*.json', ':!*.lock', ':!code', ':!cd', ':!runtime'], cwd);
    } catch {
      continue; // no match: git grep exits 1
    }
    for (const l of out.split('\n').filter(Boolean)) {
      const i = l.lastIndexOf(':');
      counts[w][l.slice(0, i)] = Number(l.slice(i + 1));
    }
  }
  return counts;
}

function researchDir(cwd) {
  const top = git(['rev-parse', '--show-toplevel'], cwd).trim();
  const common = resolve(cwd, git(['rev-parse', '--git-common-dir'], cwd).trim());
  for (const root of [top, dirname(common)]) {
    const d = join(root, '.for-lewis', 'research');
    if (existsSync(d)) return d;
  }
  return undefined;
}

function notes(dir) {
  const out = [];
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (n.endsWith('.md')) {
        const lines = readFileSync(p, 'utf8')
          .split('\n')
          .filter((l) => /^#{1,4} /.test(l))
          .map((l) => l.replace(/^#+ /, ''));
        out.push({ path: relative(dir, p), title: lines[0] ?? '', headings: lines.slice(1), date: statSync(p).mtime.toISOString().slice(0, 10) });
      }
    }
  };
  walk(dir);
  return out;
}

function main() {
  const words = searchWords(process.argv.slice(2));
  if (!words.length) {
    console.error('Usage: npm run already -- <words...>   (words of 3+ characters)');
    process.exit(2);
  }
  const cwd = process.cwd();
  console.log(`Searching for: ${words.join(', ')}\n`);

  console.log('Commits on origin/develop:');
  const commits = rankCommits(commitHits(words, cwd)).slice(0, 10);
  for (const c of commits) console.log(`  ${c.date} ${c.hash} [${c.words.length}/${words.length}] ${c.subject.slice(0, 110)}`);
  if (!commits.length) console.log('  none');

  console.log('\nCode (tracked files):');
  const files = rankFiles(fileCounts(words, cwd)).slice(0, 10);
  for (const f of files) {
    const date = git(['log', '-1', '--date=short', '--format=%ad', '--', f.file], cwd).trim();
    console.log(`  ${date} ${f.file} [${f.words.length}/${words.length}, ${f.lines} lines]`);
  }
  if (!files.length) console.log('  none');

  console.log('\nResearch notes (.for-lewis/research):');
  const dir = researchDir(cwd);
  if (!dir) console.log('  folder not found');
  else {
    const ranked = notes(dir)
      .map((n) => ({ ...n, score: scoreNote(n, words) }))
      .filter((n) => n.score)
      .sort((a, b) => b.score - a.score || (a.date < b.date ? 1 : -1))
      .slice(0, 10);
    for (const n of ranked) console.log(`  ${n.date} ${n.path}${n.title ? ` - ${n.title.slice(0, 80)}` : ''}`);
    if (!ranked.length) console.log('  none');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
