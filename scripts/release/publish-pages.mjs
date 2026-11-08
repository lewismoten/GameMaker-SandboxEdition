// npm run release:pages -- <pages-vX.Y.Z> [--push] [--keep]
// Builds the site for a release tag and makes the one commit the gh-pages branch serves. The tag must be on
// origin/master. It checks the tag out in a clean, temporary worktree, runs npm ci (which builds the packages),
// builds every game (trinkets, laser nickels and Depth's frames included, from nothing) and the site, holds the
// result to the size budgets (release:sizes), adds .nojekyll, and writes an orphan commit "Site <tag> from <sha>"
// whose tree is web/dist. It never moves a local branch.
//   without --push  prints the commit and the push it would make, and pushes nothing
//   --push          pushes that commit to origin's gh-pages with --force-with-lease, but only when
//                   .for-lewis/release/SUPERVISED exists in this checkout and names the tag: a release under
//                   direct supervision. Agents never create that file.
//   --keep          leaves the temporary worktree (and its build) for a look; otherwise it is removed
// The build takes a long time and every core: run it through `npm run heavy --`.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const tag = args.find((a) => !a.startsWith('--'));
const push = args.includes('--push');
const keep = args.includes('--keep');
const REMOTE = 'origin';
const BRANCH = 'gh-pages';

const git = (gitArgs, opts = {}) => execFileSync('git', gitArgs, { cwd: root, encoding: 'utf8', ...opts }).trim();
const run = (cmd, cmdArgs, cwd, env = {}) => {
  console.log(`$ ${cmd} ${cmdArgs.join(' ')}`);
  execFileSync(cmd, cmdArgs, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });
};

if (!tag || !/^pages-v\d+\.\d+\.\d+$/.test(tag)) {
  console.error('Usage: npm run release:pages -- <pages-vX.Y.Z> [--push] [--keep]');
  process.exit(2);
}

// The guard comes first, so a refused push costs no build.
if (push) {
  const guard = join(root, '.for-lewis/release/SUPERVISED');
  const named = existsSync(guard) && readFileSync(guard, 'utf8').split(/\s+/).includes(tag);
  if (!named) {
    console.error(`Refusing to push: ${guard} must exist and name ${tag} (a supervised release). Nothing was built.`);
    process.exit(1);
  }
}

git(['fetch', '--quiet', REMOTE, 'master', '--tags']);
let sha;
try {
  sha = git(['rev-parse', '--verify', '--quiet', `refs/tags/${tag}^{commit}`]);
} catch {
  console.error(`No tag ${tag} here or on ${REMOTE}.`);
  process.exit(1);
}
try {
  git(['merge-base', '--is-ancestor', sha, `${REMOTE}/master`]);
} catch {
  console.error(`${tag} (${sha.slice(0, 9)}) is not on ${REMOTE}/master.`);
  process.exit(1);
}

const work = join(mkdtempSync(join(tmpdir(), 'gm-pages-')), 'site');
git(['worktree', 'add', '--detach', '--quiet', work, sha]);
let commit;
try {
  // npm ci's prepare step builds the packages; the games are built next on their own, with timing
  run('npm', ['ci', '--no-audit', '--no-fund'], work, { GM_SKIP_GAME_BUILD: '1' });
  run('npm', ['run', 'build:games', '--', '--timing'], work);
  run('npx', ['vite', 'build'], join(work, 'web'));
  run('node', ['scripts/release/sizes.mjs', '--dist', 'web/dist'], work);

  const dist = join(work, 'web/dist');
  writeFileSync(join(dist, '.nojekyll'), '');
  // an orphan commit from web/dist alone, through a private index, so no branch or checkout changes
  const index = join(dirname(work), 'pages.index');
  const env = { ...process.env, GIT_INDEX_FILE: index };
  git(['--work-tree', dist, 'add', '--all', '--force', '.'], { env });
  const tree = git(['write-tree'], { env });
  commit = git(['commit-tree', tree, '-m', `Site ${tag} from ${sha}`]);
  const files = git(['ls-tree', '-r', '--name-only', tree]).split('\n').length;
  console.log(`\n${BRANCH} commit ${commit}: "Site ${tag} from ${sha}", ${files} files.`);
} finally {
  if (!keep) {
    git(['worktree', 'remove', '--force', work]);
    rmSync(dirname(work), { recursive: true, force: true });
  } else console.log(`Kept the build in ${work}`);
}

// the lease: gh-pages on origin must still be what it is now (or still missing)
const remote = git(['ls-remote', REMOTE, `refs/heads/${BRANCH}`]).split(/\s+/)[0] ?? '';
const pushArgs = ['push', `--force-with-lease=refs/heads/${BRANCH}:${remote}`, REMOTE, `${commit}:refs/heads/${BRANCH}`];
if (!push) {
  console.log(`Not pushed. With --push and a supervised release it would run:\n  git ${pushArgs.join(' ')}`);
  console.log(`(${BRANCH} on ${REMOTE} is now ${remote ? remote.slice(0, 9) : 'missing'}.)`);
} else {
  run('git', pushArgs, root);
  console.log(`${BRANCH} is now ${commit.slice(0, 9)} (Site ${tag}).`);
}
